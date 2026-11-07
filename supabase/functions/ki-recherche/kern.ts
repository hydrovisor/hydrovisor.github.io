// Kern der Edge Function ki-recherche (UC4, Konzept 9.1 bis 9.4, 11.3, Erratum E8; 01_fachregeln.md G2; Plan 37).
// Laufzeitneutral wie ki-tuete/kern.ts. Ablauf: Lücken bestimmen (R1.4) → Recherche mit Websuche → Grundregel und
// Validator → getrennter Quellenprüfer → bestätigte Werte schreiben. Je Stufe Hauptmodell mit Frist 60 s, bei 429,
// 5xx, Netzfehler oder Frist genau ein Versuch mit dem Ausweichmodell; Gesamtfrist 120 s. Geschrieben wird erst nach
// dem Quellenprüfer, deshalb bleibt bei jedem Abbruch nichts halb. Wirft nie.
import {
  AUFRUFE_JE_TAG,
  RECHERCHE_AUSWEICHMODELL,
  RECHERCHE_FRIST_GESAMT_MS,
  RECHERCHE_FRIST_HAUPT_MS,
  RECHERCHE_HAUPTMODELL,
} from '../../../src/domain/ki/modelle.ts';
import {
  hinweisRecherche,
  pruefAnfrageBauen,
  pruefAntwortPruefen,
  rechercheAnfrageBauen,
  rechercheAntwortPruefen,
  type RechercheAbbruch,
  type RechercheErgebnis,
} from '../../../src/domain/ki/recherche.ts';
import type { Kulturform } from '../../../src/domain/phasen/profil.ts';
import {
  rechercheLuecken,
  type Kulturtyp,
  type PflichtZeile,
  type SaatempfehlungZeile,
  type SollwertZeile,
} from '../../../src/domain/wissen/luecken.ts';
import {
  saatPruefen,
  wertPruefen,
  type RechercheSaat,
  type RechercheWert,
} from '../../../src/domain/wissen/validator.ts';
import { kalendertag, tagesbeginn, type Zeitzone } from '../../../src/domain/zeit.ts';
import type { AufrufStatus, ModellAntwort, ModellRufer, Zeitgeber } from '../ki-tuete/kern.ts';

export type { RechercheErgebnis };

export type Zweck = 'recherche' | 'quellenpruefer';

export interface RechercheStand {
  sorte: { sorte_id: string; name: string; art_id: string; kulturtyp: Kulturtyp };
  art: { art_id: string; name_de: string; name_wiss: string; kulturformen_erlaubt: readonly string[] };
  kulturgruppe: { kulturgruppe_id: string; ec_obergrenze_validator: number };
  sollwerte: readonly SollwertZeile[];
  pflicht: readonly PflichtZeile[];
  saatempfehlungen: readonly SaatempfehlungZeile[];
}

export interface RechercheDaten {
  stand(sorteId: string): Promise<RechercheStand>;
  aufrufeSeit(ab: Date): Promise<number>;
  aufrufBeginnen(z: { modell: string; zweck: Zweck; app_version: string }): Promise<string>;
  aufrufBeenden(id: string, z: { status: AufrufStatus; dauer_ms: number }): Promise<void>;
  /** id der neuen Zeile oder null, wenn schon eine gültige besteht */
  wertSchreiben(zeile: RechercheWert & { app_version: string }): Promise<string | null>;
  saatSchreiben(zeile: RechercheSaat & { sorte_id: string; app_version: string }): Promise<string | null>;
}

export interface Abhaengigkeiten {
  daten: RechercheDaten;
  modell: ModellRufer;
  zeit: Zeitgeber;
  zeitzone: Zeitzone;
}

export function ohneSchluessel(): RechercheErgebnis {
  return {
    ergebnis: 'abgebrochen',
    grund: 'nicht_eingerichtet',
    hinweis: hinweisRecherche('nicht_eingerichtet'),
    dauerMs: 0,
  };
}

type Versuch = ModellAntwort | { art: 'zeit' };

async function versuch(
  abh: Abhaengigkeiten,
  modell: string,
  anfrage: Record<string, unknown>,
  frist: number,
): Promise<Versuch> {
  const ruf = new AbortController();
  const uhr = new AbortController();
  const antwort = Promise.resolve()
    .then(() => abh.modell(modell, anfrage, ruf.signal))
    .then(
      (a) => ({ fertig: 'antwort' as const, a }),
      () => ({ fertig: 'antwort' as const, a: { art: 'ausweichen' } as ModellAntwort }),
    );
  const ablauf = abh.zeit.warten(frist, uhr.signal).then(() => ({ fertig: 'frist' as const }));
  const erstes = await Promise.race([antwort, ablauf]);
  if (erstes.fertig === 'antwort') {
    uhr.abort();
    return erstes.a;
  }
  ruf.abort();
  return { art: 'zeit' };
}

class Abbruch {
  constructor(readonly grund: RechercheAbbruch) {}
}

export async function recherchieren(
  anfrage: { sorteId: string; appVersion: string },
  abh: Abhaengigkeiten,
): Promise<RechercheErgebnis> {
  const start = abh.zeit.jetzt();
  const seit = () => abh.zeit.jetzt().getTime() - start.getTime();
  const abgebrochen = (grund: RechercheAbbruch): RechercheErgebnis => ({
    ergebnis: 'abgebrochen',
    grund,
    hinweis: hinweisRecherche(grund),
    dauerMs: Math.min(seit(), RECHERCHE_FRIST_GESAMT_MS),
  });
  const ab = tagesbeginn(kalendertag(start, abh.zeitzone), abh.zeitzone);

  const beenden = async (id: string, status: AufrufStatus, beginn: number) => {
    try {
      await abh.daten.aufrufBeenden(id, { status, dauer_ms: seit() - beginn });
    } catch {
      // Endstatus fehlt dann; das Ergebnis zählt mehr
    }
  };

  /** Eine Stufe mit Haupt- und Ausweichmodell; liefert den Text oder wirft Abbruch */
  const stufe = async (zweck: Zweck, bauen: (modell: string) => Record<string, unknown>): Promise<string> => {
    let letzter: RechercheAbbruch = 'fehler';
    for (const { modell, ausweich } of [
      { modell: RECHERCHE_HAUPTMODELL, ausweich: false },
      { modell: RECHERCHE_AUSWEICHMODELL, ausweich: true },
    ]) {
      if (seit() >= RECHERCHE_FRIST_GESAMT_MS) throw new Abbruch('zeit');
      if ((await abh.daten.aufrufeSeit(ab)) >= AUFRUFE_JE_TAG) throw new Abbruch('grenze');
      const beginn = seit();
      const id = await abh.daten.aufrufBeginnen({ modell, zweck, app_version: anfrage.appVersion });
      const rest = Math.max(0, RECHERCHE_FRIST_GESAMT_MS - seit());
      const r = await versuch(
        abh,
        modell,
        bauen(modell),
        ausweich ? rest : Math.min(RECHERCHE_FRIST_HAUPT_MS, rest),
      );
      if (r.art === 'ok') {
        await beenden(id, ausweich ? 'ausweichmodell' : 'ok', beginn);
        return r.text;
      }
      if (r.art === 'zeit') {
        await beenden(id, 'zeitueberschreitung', beginn);
        letzter = 'zeit';
        continue;
      }
      await beenden(id, 'fehler', beginn);
      letzter = 'fehler';
      if (r.art === 'fehler') throw new Abbruch('fehler');
    }
    throw new Abbruch(letzter);
  };

  try {
    const s = await abh.daten.stand(anfrage.sorteId);
    const luecken = rechercheLuecken({
      sorteId: s.sorte.sorte_id,
      artId: s.art.art_id,
      kulturtyp: s.sorte.kulturtyp,
      kulturformenErlaubt: s.art.kulturformen_erlaubt,
      sollwerte: s.sollwerte,
      pflicht: s.pflicht,
      saatempfehlungen: s.saatempfehlungen,
    });
    const fertig = (
      werte: number,
      saat: number,
      offen = luecken.werte,
      offenSaat: Kulturform[] = luecken.saat,
      verworfen: { id: string; grund: string }[] = [],
    ): RechercheErgebnis => ({
      ergebnis: 'ok',
      werte,
      saat,
      offen,
      offenSaat,
      verworfen,
      dauerMs: seit(),
    });
    if (luecken.werte.length === 0 && luecken.saat.length === 0) return fertig(0, 0);

    const text = await stufe('recherche', (modell) =>
      rechercheAnfrageBauen(
        {
          art: { name_de: s.art.name_de, name_wiss: s.art.name_wiss },
          sorte: { name: s.sorte.name },
          luecken: luecken.werte,
          saat: luecken.saat,
        },
        modell,
      ),
    );
    const antwort = rechercheAntwortPruefen(text);
    if (!antwort.ok) return abgebrochen('ungueltig');

    const verworfen: { id: string; grund: string }[] = [];
    const werte: {
      id: string;
      zeile: RechercheWert;
      beschreibung: string;
      link: string;
      fundstelle: string;
      kurzzitat: string;
    }[] = [];
    const saat: {
      id: string;
      zeile: RechercheSaat;
      beschreibung: string;
      link: string;
      fundstelle: string;
      kurzzitat: string;
    }[] = [];
    const vergeben = new Set<string>();
    for (const k of antwort.werte) {
      const r = wertPruefen(k, {
        luecken: luecken.werte,
        ecObergrenze: s.kulturgruppe.ec_obergrenze_validator,
        artId: s.art.art_id,
      });
      const schluessel = `${k.phase}.${k.groesse}`;
      if (!r.ok) verworfen.push({ id: k.id, grund: r.grund });
      else if (vergeben.has(schluessel)) verworfen.push({ id: k.id, grund: 'keine_luecke' });
      else {
        vergeben.add(schluessel);
        const z = r.zeile;
        const wert =
          z.text_wert ?? `${z.wert_min ?? ''}–${z.wert_max ?? ''}${z.groesse === 'ec' ? ' mS/cm' : ''}`;
        werte.push({
          id: k.id,
          zeile: z,
          beschreibung: `${z.groesse} ${z.phase} ${wert}`,
          link: z.quelle.link,
          fundstelle: z.fundstelle,
          kurzzitat: z.kurzzitat,
        });
      }
    }
    for (const k of antwort.saat) {
      const r = saatPruefen(k, { kulturformen: luecken.saat });
      const schluessel = `saat.${k.kulturform}`;
      if (!r.ok) verworfen.push({ id: k.id, grund: r.grund });
      else if (vergeben.has(schluessel)) verworfen.push({ id: k.id, grund: 'keine_luecke' });
      else {
        vergeben.add(schluessel);
        const z = r.zeile;
        saat.push({
          id: k.id,
          zeile: z,
          beschreibung: `${z.kulturform}: ${z.samen_je_schwamm} Samen je Schwamm`,
          link: z.quelle.link,
          fundstelle: z.fundstelle,
          kurzzitat: z.kurzzitat,
        });
      }
    }
    if (werte.length === 0 && saat.length === 0) return fertig(0, 0, luecken.werte, luecken.saat, verworfen);

    const kandidaten = [...werte, ...saat].map((k) => ({
      id: k.id,
      link: k.link,
      fundstelle: k.fundstelle,
      kurzzitat: k.kurzzitat,
      wert: k.beschreibung,
    }));
    const pruefText = await stufe('quellenpruefer', (modell) => pruefAnfrageBauen(kandidaten, modell));
    const pruefung = pruefAntwortPruefen(
      pruefText,
      kandidaten.map((k) => k.id),
    );
    if (!pruefung.ok) return abgebrochen('ungueltig');

    const abgerufen = kalendertag(abh.zeit.jetzt(), abh.zeitzone);
    const geschlossen = new Set<string>();
    let neueWerte = 0;
    let neueSaat = 0;
    for (const w of werte) {
      if (!pruefung.belegt.has(w.id)) {
        verworfen.push({ id: w.id, grund: 'nicht_belegt' });
        continue;
      }
      try {
        const id = await abh.daten.wertSchreiben({
          ...w.zeile,
          quelle: { ...w.zeile.quelle, abgerufen_am: abgerufen } as RechercheWert['quelle'],
          app_version: anfrage.appVersion,
        });
        geschlossen.add(`${w.zeile.phase}.${w.zeile.groesse}`);
        if (id !== null) neueWerte++;
      } catch {
        verworfen.push({ id: w.id, grund: 'fehler' });
      }
    }
    for (const k of saat) {
      if (!pruefung.belegt.has(k.id)) {
        verworfen.push({ id: k.id, grund: 'nicht_belegt' });
        continue;
      }
      try {
        const id = await abh.daten.saatSchreiben({
          ...k.zeile,
          quelle: { ...k.zeile.quelle, abgerufen_am: abgerufen } as RechercheSaat['quelle'],
          sorte_id: s.sorte.sorte_id,
          app_version: anfrage.appVersion,
        });
        geschlossen.add(`saat.${k.zeile.kulturform}`);
        if (id !== null) neueSaat++;
      } catch {
        verworfen.push({ id: k.id, grund: 'fehler' });
      }
    }
    return fertig(
      neueWerte,
      neueSaat,
      luecken.werte.filter((l) => !geschlossen.has(l.id)),
      luecken.saat.filter((k) => !geschlossen.has(`saat.${k}`)),
      verworfen,
    );
  } catch (e) {
    return abgebrochen(e instanceof Abbruch ? e.grund : 'fehler');
  }
}
