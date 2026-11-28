// Passungsmatrix der ersten Runde (Konzept 9.6, R3.2): rechnet aus den freigegebenen W0-Zeilen mit passung() der App.
// Aufruf: node scripts/w0/passungsmatrix.ts > docs/plaene/passungsmatrix_runde1.md
// Annahmen (A): Auflösung der Sollwerte Art vor Kulturgruppe vor Standard (wie v_sollwert; die Ebene Sorte hat in W0
// keine Zeilen und ist nicht nachgebildet); EC-Basis «zuwachs» plus ECWasser 0.5 (W0 hat keine solche Zeile); u_EC 0.10
// (Standard ohne Geräteprüfung); Bereiche mit den Startwerten aus Konzept 5.2 (15 h Licht, nutzbare Höhe 450, 200,
// 150, 150 mm); ein Loch frei, keine gemessene Wassertemperatur. Die Phase wird nicht aus dem Umsetzdatum gerechnet:
// Abschnitt 2 rechnet die Phasen im Zielgefäss ab Wachstum (die App bewertet am Umsetzdatum, Direktsaat im Wachstum).
// Jede Kultur zählt gegen alle übrigen Töpfe ihres Gefässes nach der Topfzahl aus Konzept 5.5, auch der eigenen Art.
import { dateienLesen } from '../seed/dateien.ts';
import { artAuswahl } from '../../src/domain/w0/auswahl.ts';
import { ladeplan, type Zielzeile } from '../../src/domain/w0/abbildung.ts';
import { seedKonstanten } from '../../src/domain/w0/konstanten.ts';
import { inHundertstel, type Band } from '../../src/domain/bewertung/bewertung.ts';
import { dezimal } from '../../src/domain/phasen/sollbereich.ts';
import type { Kulturform, Phase } from '../../src/domain/phasen/profil.ts';
import { bandSchnitt } from '../../src/domain/zielbereich-passung.ts';
import {
  EINSTUFUNG_NAME,
  passung,
  type Passung,
  type PassungKontext,
} from '../../src/domain/passung/passung.ts';

const { dateien } = dateienLesen(process.cwd());
const plan = ladeplan(dateien, artAuswahl(dateien, seedKonstanten.pflichtgroessen), seedKonstanten);
const T = plan.tabellen;
const zahl = (x: unknown): number | undefined =>
  x === null || x === undefined || x === '' || !Number.isFinite(Number(x)) ? undefined : Number(x);
const EC_WASSER = 50;
const U_EC = 10;

const art = (name: string): Zielzeile => {
  const a = T.art.find((z) => z['name_de'] === name);
  if (!a) throw new Error(`Art fehlt: ${name}`);
  return a;
};
const kulturform = (artId: string, kf: string) =>
  T.art_kulturform.find((z) => z['art_id'] === artId && z['kulturform'] === kf);

/** Sollwert einer Art in einer Phase: Art vor Kulturgruppe vor Standard */
function sollwert(a: Zielzeile, phase: string, groesse: string): { z: Zielzeile; ebene: string } | undefined {
  const pw = T.profilwert.filter((z) => z['phase'] === phase && z['groesse'] === groesse);
  const aufArt = pw.find((z) => z['ebene'] === 'art' && z['art_id'] === a['art_id']);
  if (aufArt) return { z: aufArt, ebene: 'Art' };
  const aufGruppe = pw.find(
    (z) => z['ebene'] === 'kulturgruppe' && z['kulturgruppe_id'] === a['kulturgruppe_id'],
  );
  if (aufGruppe) return { z: aufGruppe, ebene: 'Kulturgruppe' };
  const standard = pw.find((z) => z['ebene'] === 'standard');
  return standard ? { z: standard, ebene: 'Standard' } : undefined;
}
function band(a: Zielzeile, phase: string, groesse: string): Band | undefined {
  const s = sollwert(a, phase, groesse);
  const min = zahl(s?.z['wert_min']);
  const max = zahl(s?.z['wert_max']);
  if (!s || min === undefined || max === undefined) return undefined;
  const plus = groesse === 'ec' && s.z['ec_basis_quelle'] === 'zuwachs' ? EC_WASSER : 0;
  return { min: inHundertstel(min) + plus, max: inHundertstel(max) + plus };
}
const ebene = (a: Zielzeile, phase: string, groesse: string) => sollwert(a, phase, groesse)?.ebene ?? '–';
const mit = <K extends string, V>(k: K, v: V | undefined) =>
  v === undefined ? {} : ({ [k]: v } as Record<K, V>);

interface Pflanze {
  name: string;
  art: Zielzeile;
  kf: Kulturform;
  /** Töpfe im Gefäss nach Konzept 5.5 */
  toepfe: number;
}
const P = (name: string, artName: string, kf: Kulturform, toepfe: number): Pflanze => ({
  name,
  art: art(artName),
  kf,
  toepfe,
});

function kandidat(p: Pflanze, phase: Phase, ohneSystem = false): PassungKontext['kandidat'] {
  const a = p.art;
  const kf = kulturform(String(a['art_id']), p.kf);
  return {
    sorteId: p.name,
    name: p.name,
    artId: String(a['art_id']),
    kulturgruppeId: String(a['kulturgruppe_id'] ?? ''),
    kulturform: p.kf,
    phase,
    ...(ohneSystem
      ? {}
      : mit('systemeignung', (a['systemeignung'] ?? undefined) as 'dwc' | 'kratky' | 'beide' | undefined)),
    ...mit('ph', band(a, phase, 'ph')),
    ...mit('ec', band(a, phase, 'ec')),
    ...mit('temp', band(a, phase, 'wassertemp')),
    ...mit('lichtMaxH', zahl(sollwert(a, phase, 'licht_h')?.z['wert_max'])),
    ...mit(
      'photoperiode',
      (a['photoperiode'] ?? undefined) as 'langtag' | 'kurztag' | 'tagneutral' | undefined,
    ),
    ...mit('kritischeTageslaengeH', zahl(a['kritische_tageslaenge_h'])),
    ...mit('kulturdauerTypischD', zahl(kf?.['kulturdauer_typisch_d'])),
    entspitzen: kf?.['entspitzen'] === true || kf?.['entspitzen'] === 'true' || kf?.['entspitzen'] === 'ja',
    ...mit('wuchshoeheMm', zahl(a['wuchshoehe_max_mm'])),
    ...mit(
      'wuchsform',
      (a['wuchsform'] ?? undefined) as 'aufrecht' | 'buschig' | 'haengend' | 'rosette' | undefined,
    ),
    ...mit('pythium', (a['pythium'] ?? undefined) as 'hoch' | 'mittel' | 'gering' | undefined),
    ...mit('wasserbedarfL', zahl(a['wasserbedarf_je_pflanze_l'])),
  };
}

interface Gefaess {
  kennung: string;
  betriebsart: 'dwc' | 'kratky_belueftet';
  loch: 50 | 80;
  liter: number;
  loecher: number;
  ebene: number;
  leitkultur: string;
  pflanzen: Pflanze[];
}
const HOEHE = [450, 200, 150, 150];
const G: Gefaess[] = [
  {
    kennung: '1.1',
    betriebsart: 'dwc',
    loch: 80,
    liter: 20,
    loecher: 4,
    ebene: 1,
    leitkultur: 'Tomate',
    pflanzen: [P('Tomate', 'Tomate', 'dauerkultur_frucht', 4)],
  },
  {
    kennung: '1.2',
    betriebsart: 'dwc',
    loch: 80,
    liter: 20,
    loecher: 4,
    ebene: 1,
    leitkultur: 'Chili',
    pflanzen: [P('Chili', 'Chili', 'dauerkultur_frucht', 4)],
  },
  {
    kennung: '2.1',
    betriebsart: 'dwc',
    loch: 80,
    liter: 9,
    loecher: 6,
    ebene: 2,
    leitkultur: 'Basilikum',
    pflanzen: [P('Basilikum', 'Basilikum', 'dauerkultur_blatt', 3), P('Pak Choi', 'Pak Choi', 'kopf', 3)],
  },
  {
    kennung: '2.2',
    betriebsart: 'dwc',
    loch: 80,
    liter: 4,
    loecher: 2,
    ebene: 2,
    leitkultur: 'Petersilie',
    pflanzen: [
      P('Petersilie', 'Petersilie', 'dauerkultur_blatt', 1),
      P('Schnittlauch', 'Schnittlauch', 'dauerkultur_blatt', 1),
    ],
  },
  {
    kennung: '2.3',
    betriebsart: 'dwc',
    loch: 80,
    liter: 9,
    loecher: 6,
    ebene: 2,
    leitkultur: 'Salat',
    pflanzen: [P('Schnittsalat (Lollo Rossa, Eissalat, Eichblatt)', 'Salat', 'schnitt', 6)],
  },
  {
    kennung: '3.1',
    betriebsart: 'kratky_belueftet',
    loch: 50,
    liter: 7,
    loecher: 8,
    ebene: 3,
    leitkultur: 'Nüsslisalat',
    pflanzen: [P('Nüsslisalat', 'Nüsslisalat', 'kopf', 8)],
  },
  {
    kennung: '3.2',
    betriebsart: 'kratky_belueftet',
    loch: 50,
    liter: 3,
    loecher: 6,
    ebene: 3,
    leitkultur: 'Spinat',
    pflanzen: [P('Spinat Babyleaf', 'Spinat', 'babyleaf', 6)],
  },
  {
    kennung: '3.3',
    betriebsart: 'kratky_belueftet',
    loch: 50,
    liter: 7,
    loecher: 8,
    ebene: 3,
    leitkultur: 'Salat',
    pflanzen: [P('Babyleaf-Mischung', 'Salat', 'babyleaf', 8)],
  },
];

function kontext(
  k: Pflanze,
  phase: Phase,
  g: Gefaess,
  andere: Pflanze[],
  ohneGefaess = false,
): PassungKontext {
  const baender = (gr: string) =>
    andere
      .map((p) => band(p.art, phase, gr))
      .reduce<Band | undefined>((s, b) => (s && b ? bandSchnitt(s, b) : (s ?? b)), undefined);
  const leit = andere.find((p) => p.art['name_de'] === g.leitkultur) ?? andere[0];
  const leitKf = leit ? kulturform(String(leit.art['art_id']), leit.kf) : undefined;
  return {
    kandidat: kandidat(k, phase, ohneGefaess),
    gefaess: {
      platzId: g.kennung,
      kennung: g.kennung,
      betriebsart: g.betriebsart,
      lochGroesseMm: g.loch,
      betriebsvolumenL: g.liter,
      lochzahl: g.loecher,
      freieLoecher: [1],
      randloecher: [1],
      bereich: ohneGefaess
        ? { name: `Ebene ${String(g.ebene)}` }
        : {
            name: `Ebene ${String(g.ebene)}`,
            lichtstundenH: 15,
            nutzbareHoeheMm: HOEHE[g.ebene - 1] as number,
          },
    },
    zielbereich: {
      ...mit('ph', baender('ph')),
      ...mit('ec', baender('ec')),
      ...mit('temp', baender('wassertemp')),
      zaehlende: andere.length,
    },
    ...(leit
      ? {
          leitkultur: {
            artId: String(leit.art['art_id']),
            name: leit.name,
            kulturgruppeId: String(leit.art['kulturgruppe_id'] ?? ''),
            ...mit('kulturdauerTypischD', zahl(leitKf?.['kulturdauer_typisch_d'])),
            ...mit('wuchshoeheMm', zahl(leit.art['wuchshoehe_max_mm'])),
            ...mit('ec', band(leit.art, phase, 'ec')),
          },
        }
      : {}),
    mitbewohnerArten: [...new Map(andere.map((p) => [String(p.art['art_id']), p])).values()].map((p) => ({
      artId: String(p.art['art_id']),
      ...mit('pythium', (p.art['pythium'] ?? undefined) as 'hoch' | 'mittel' | 'gering' | undefined),
    })),
    uEc: U_EC,
  };
}

const b = (x: Band | undefined, teiler = 1) =>
  x
    ? x.min > x.max
      ? 'leer'
      : teiler === 100
        ? `${String(x.min / 100)} bis ${String(x.max / 100)}`
        : `${dezimal(x.min)} bis ${dezimal(x.max)}`
    : '–';
const urteil = (p: Passung) => `**${EINSTUFUNG_NAME[p.einstufung]}** · ${p.texte.join(' · ')}`;
const PHASE: Record<string, string> = {
  anzucht: 'Anzucht',
  wachstum: 'Wachstum',
  bluete: 'Blüte',
  fruchtbildung_reife: 'Fruchtbildung und Reife',
};
const out: string[] = [];
const w = (s = '') => out.push(s);

w('# Passungsmatrix der ersten Runde (Konzept 9.6)');
w();
w(
  `Stand 28.11.2026 · Lead · gerechnet mit \`scripts/w0/passungsmatrix.ts\` aus \`data/wissensbasis/freigegeben/\` (${String(T.profilwert.length)} Profilwerte, ${String(T.art.length)} Arten) und der Entscheidungstabelle R3.2 der App (\`passung()\`). Tim bestätigt damit den Mix je Gefäss aus Konzept 5.5 oder passt ihn an.`,
);
w();
const ecZeilen = T.profilwert.filter((z) => z['groesse'] === 'ec');
const ecUnbekannt = ecZeilen.filter((z) => (z['ec_basis_quelle'] ?? 'unbekannt') === 'unbekannt').length;
w(
  `Annahmen (A): Sollwerte der Art, sonst der Kulturgruppe, sonst der Standard (die Ebene Sorte hat in W0 keine Zeilen); EC-Basis «Zuwachs» plus ECWasser 0.5 (W0 hat keine solche Zeile; ${String(ecUnbekannt)} von ${String(ecZeilen.length)} EC-Zeilen tragen die Basis «unbekannt», die App zeigt dazu «EC-Basis unklar»); u_EC 0.10; Bereiche mit den Startwerten aus Konzept 5.2 (15 h Licht, nutzbare Höhe 45, 20, 15, 15 cm); keine gemessene Wassertemperatur. Die Phase wird nicht aus dem Umsetzdatum gerechnet. «nicht geprüft» nennt die Zeilen von R3.2, für die in W0 ein Stammwert fehlt; sie werten nicht ab (Fachregeln R3.4).`,
);
w();
w(
  'Codes: P1 Systemeignung, P2 Restbreite pH oder EC, P3 freies Loch, P4 Licht und Schossen, P5 Höhe, P6 Wassertemperatur, P7 Pythium, P8 Kulturdauer gegen Leitkultur, P9 Beschattung, P10 EC-Mitte, P11 Liter je Pflanze.',
);
w();
w('## 1 Sollbereiche der Arten der ersten Runde');
w();
w('| Art | Phase | pH | EC (mS/cm) | Wasser (°C) | Licht max. (h) | Herkunft pH / EC |');
w('|---|---|---|---|---|---|---|');
const runde = [...new Map(G.flatMap((g) => g.pflanzen).map((p) => [String(p.art['art_id']), p])).values()];
for (const p of runde)
  for (const ph of ['anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife'] as Phase[]) {
    const fr = p.kf === 'dauerkultur_frucht';
    if (!fr && (ph === 'bluete' || ph === 'fruchtbildung_reife')) continue;
    w(
      `| ${String(p.art['name_de'])} | ${PHASE[ph] as string} | ${b(band(p.art, ph, 'ph'))} | ${b(band(p.art, ph, 'ec'))} | ${b(band(p.art, ph, 'wassertemp'), 100)} | ${String(zahl(sollwert(p.art, ph, 'licht_h')?.z['wert_max']) ?? '–')} | ${ebene(p.art, ph, 'ph')} / ${ebene(p.art, ph, 'ec')} |`,
    );
  }
w();
w('## 2 Mix je Gefäss nach Konzept 5.5');
w();
w(
  'Jede Kultur wird gegen alle übrigen Töpfe ihres Gefässes gerechnet, nach der Topfzahl aus Konzept 5.5 und auch gegen die der eigenen Art. Gerechnet sind die Phasen im Zielgefäss: Die App bewertet am Umsetzdatum, die Anzucht läuft auf den Stationen 4.2 bis 4.4, Direktsaat (3.1 bis 3.3) zählt im Wachstum.',
);
w();
w(
  '| Gefäss | Kultur (Töpfe) | Phase | Urteil | Gemeinsamer Bereich pH | Gemeinsamer Bereich EC | nicht geprüft |',
);
w('|---|---|---|---|---|---|---|');
for (const g of G)
  for (const k of g.pflanzen) {
    const andere = g.pflanzen.flatMap((p) => Array<Pflanze>(p === k ? p.toepfe - 1 : p.toepfe).fill(p));
    const phasen: Phase[] =
      k.kf === 'dauerkultur_frucht' ? ['wachstum', 'bluete', 'fruchtbildung_reife'] : ['wachstum'];
    for (const ph of phasen) {
      const kx = kontext(k, ph, g, andere);
      const p = passung(kx);
      const phS = bandSchnitt(kx.kandidat.ph, kx.zielbereich.ph) ?? kx.kandidat.ph;
      const ecS = bandSchnitt(kx.kandidat.ec, kx.zielbereich.ec) ?? kx.kandidat.ec;
      w(
        `| ${g.kennung} | ${k.name} (${String(k.toepfe)}) | ${PHASE[ph] as string} | ${urteil(p)} | ${b(phS)} | ${b(ecS)} | ${p.nichtGeprueft.join(', ') || '–'} |`,
      );
    }
  }
w();
w('## 3 Matrix Art gegen Art');
w();
w(
  'Zeile: Kultur, die dazukommt. Spalte: Kultur, die schon im Gefäss steht (Leitkultur). Gerechnet in einem DWC-Gefäss ohne Angaben zu Bereich und Systemeignung, also nur die Zeilen, die vom Paar abhängen (P2, P6, P7, P8, P10). E = Empfohlen, M = Möglich, N = Nicht empfohlen, mit den Codes der Gründe.',
);
const alle: Pflanze[] = T.art.map((a) => {
  const kf = String(a['kulturform_vorgabe'] ?? 'kopf') as Kulturform;
  return (
    runde.find((p) => p.art === a && p.kf === kf) ?? { name: String(a['name_de']), art: a, kf, toepfe: 1 }
  );
});
const neutral: Gefaess = {
  kennung: 'X',
  betriebsart: 'dwc',
  loch: 80,
  liter: 9,
  loecher: 6,
  ebene: 2,
  leitkultur: '',
  pflanzen: [],
};
const KURZ = { empfohlen: 'E', moeglich: 'M', nicht_empfohlen: 'N' } as const;
for (const ph of ['anzucht', 'wachstum'] as Phase[]) {
  w();
  w(
    `### Phase ${PHASE[ph] as string}${ph === 'anzucht' ? ' (nur zum Vergleich; im Zielgefäss bewertet die App ab Wachstum)' : ''}`,
  );
  w();
  w(`| dazu ↓ / steht → | ${alle.map((p) => String(p.art['name_de'])).join(' | ')} |`);
  w(`|---|${alle.map(() => '---').join('|')}|`);
  for (const k of alle) {
    const zellen = alle.map((s) => {
      if (s === k) return '·';
      const p = passung(kontext(k, ph, { ...neutral, leitkultur: String(s.art['name_de']) }, [s], true));
      return `${KURZ[p.einstufung]}${p.gruende.length > 0 ? ` ${p.gruende.join(' ')}` : ''}`;
    });
    w(`| ${String(k.art['name_de'])} (${k.kf}) | ${zellen.join(' | ')} |`);
  }
}
w();
w('## 4 Befunde (Lead, 28.11.2026)');
w();
w(
  '1. **2.1 Basilikum mit Pak Choi: «Nicht empfohlen».** Im Wachstum bleibt als gemeinsame EC nur 1.5 bis 1.6 (Basilikum 1.0 bis 1.6, Pak Choi 1.5 bis 2.0), schmaler als die Mindestbreite 0.3; beide EC-Bänder tragen in W0 die Basis «unbekannt». Die App zeigt die Einstufung beim Säen an. In der Anzucht hätten die beiden keine gemeinsame EC (0.4 bis 0.8 gegen 1.0 bis 1.4); das bleibt ohne Folge für 2.1, weil die Anzucht auf den Stationen läuft. Tim entscheidet den Mix: (a) lassen; beim Ansatz verlangt die App dann den Mischentscheid nach R2.4, entweder Leitkultur Basilikum (EC 1.0 bis 1.6, Pak Choi höchstens «Knapp daneben») oder Kompromiss (Mittel der Bandmitten 1.3 und 1.75 ± 0.15, rund 1.38 bis 1.68); (b) Pak Choi tauschen: im Wachstum ist er zu Randen «Empfohlen», zu Spinat (P8) und Chili (P10) «Möglich»; (c) Basilikum behalten und einen Partner wählen, der passt: zu Basilikum sind im Wachstum Salat, Nüsslisalat, Chili, Petersilie, Schnittlauch und Mangold «Empfohlen».',
);
w(
  '2. **Systemeignung in W0 widerspricht der Startbelegung.** Tomate trägt nur «kratky» (Quelle zu Kratky-Tomaten), die App meldet in 1.1 «nicht für DWC». Nüsslisalat und Spinat tragen nur «dwc» (Quellen mit Floating-System), die App meldet in 3.1 und 3.2 «nicht für Kratky». Für Chili und Schnittlauch fehlt der Wert (nicht geprüft). Folge: W0-Nachrecherche der Systemeignung durch den Lead (Entscheid 0018) vor der Gesamtfreigabe. Findet sie für Nüsslisalat und Spinat keine Kratky-Quelle, entscheidet Tim, ob «Kratky belüftet» fachlich wie DWC gilt (Konzept 8.1 Regel 8 ordnet es Kratky zu).',
);
w(
  '3. **Tomate: zwei Bänder schmaler als die Mindestbreite.** Im Wachstum ist die EC 1.2 bis 1.4 nur 0.2 breit; ab dem zweiten Topf meldet die App in 1.1 deshalb zusätzlich «EC bleibt 1.2 bis 1.4, schmaler als 0.3», und der Ansatz verlangt den Mischentscheid nach R2.4. Der Lead prüft das Band in der W0-Nachrecherche (Entscheid 0018). In der Anzucht ist der pH 5.6 bis 5.8 ebenfalls nur 0.2 breit (Abschnitt 1); das bleibt ohne Folge, weil die Anzucht auf den Stationen 4.2 und 4.3 läuft und die App in 1.1 am Umsetzdatum im Wachstum mit pH 5.8 bis 6.2 rechnet.',
);
w(
  '4. **1.2, 2.2, 2.3 und 3.3 sind «Empfohlen».** Petersilie und Schnittlauch teilen pH 5.5 bis 6.0 und EC 1.0 bis 1.3. Die Restbreite EC ist genau die Mindestbreite 0.3 ohne Reserve; liegt u_EC aus der Geräteprüfung über 0.15, wird 2.2 zum Konfliktfall (Konzept, Risiko u_EC). Dasselbe gilt für Salat in 2.3 und 3.3 (EC 1.2 bis 1.5).',
);
w(
  '5. **Fehlende Stammwerte:** Die Wuchshöhe (P5, P9) fehlt bei allen Arten und Sorten, die Wuchsform «hängend» bei Tumbling Tom und Ampelo Gelb; Pythium (P7), «Kulturdauer typisch» (P8) und der Wasserbedarf je Pflanze (P11) fehlen bei mehreren Arten. Diese Zeilen werten nicht ab; sie gehören zur Vollständigkeit der Gesamtfreigabe (Konzept 9.5 Schritt 5).',
);
w();
console.log(out.join('\n'));
