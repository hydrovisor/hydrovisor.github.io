// Deckelwahl für «Gefäss erfassen» (Schritt 3) und «Gefäss ändern» (Entscheid 0021): je Deckel Name, Vorschau des
// Lochbilds und «6 Löcher · 8 cm · Reihen 3, 3 · für Rako 40 × 30»; nur Deckel, die zur Box passen, die übrigen hinter
// «Alle Deckel zeigen». Der zugängliche Name des Radios bleibt der Deckelname, die Beschreibung ist aria-describedby.
import { useId, useState, type ReactNode } from 'react';
import { deckelAuswahl, deckelGrundflaeche, type DeckelOption } from '../../domain/vorlagen/deckelpassung.ts';
import { Button } from '../bausteine/Button.tsx';
import { DeckelVorschau } from '../bausteine/DeckelVorschau.tsx';
import { Notice } from '../bausteine/Notice.tsx';

export interface DeckelZeile {
  id: string;
  name: string;
  topfdurchmesser_mm: number;
  loecher_je_reihe: readonly number[];
}

interface Box {
  name: string;
  form: string;
  innen_l_mm: number;
  innen_b_mm: number;
}

/** sichtbare Deckel und Hinweis aus deckelAuswahl; «alle» blendet die ausgeblendeten ein */
export function deckelListe<D extends DeckelZeile>(
  deckel: readonly D[],
  box: Box | undefined,
  kennung: string | undefined,
  alle: boolean,
) {
  const auswahl = deckelAuswahl(deckel, box, kennung);
  return {
    auswahl,
    gezeigt: alle ? [...auswahl.sichtbar, ...auswahl.ausgeblendet] : auswahl.sichtbar,
  };
}

function Option<D extends DeckelZeile>({
  option,
  name,
  gewaehlt,
  setzen,
  kennung,
}: {
  option: DeckelOption<D>;
  name: string;
  gewaehlt: boolean;
  setzen: (id: string) => void;
  kennung: string | undefined;
}) {
  const id = useId();
  const d = option.deckel;
  const zusatz = [
    option.beschreibung,
    option.fuer ? `für ${option.fuer}` : 'Grösse nicht hinterlegt',
    option.passung === 'passt_nicht' ? 'passt nicht zur Box' : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <label className="hv-anlage-wahlfeld hv-deckelwahl-option">
      <input
        type="radio"
        name={name}
        checked={gewaehlt}
        aria-labelledby={`${id}-name`}
        aria-describedby={`${id}-zusatz`}
        onChange={() => setzen(d.id)}
      />
      <span className="hv-deckelwahl-bild">
        <DeckelVorschau
          reihen={d.loecher_je_reihe.map(Number)}
          topfdurchmesserMm={Number(d.topfdurchmesser_mm)}
          oval={deckelGrundflaeche(d) === 'leni_flori_36'}
        />
      </span>
      <span className="hv-deckelwahl-text">
        <span id={`${id}-name`} className="hv-deckelwahl-name">
          {d.name}
        </span>
        <span id={`${id}-zusatz`} className="hv-deckelwahl-zusatz">
          {zusatz}
          {option.vorgesehen && kennung ? ` · vorgesehen für ${kennung}` : ''}
        </span>
      </span>
    </label>
  );
}

export function DeckelWahl<D extends DeckelZeile>({
  deckel,
  box,
  kennung,
  wert,
  setzen,
  name = 'deckel',
  kopf,
  nachher,
}: {
  deckel: readonly D[];
  box: Box | undefined;
  kennung: string | undefined;
  wert: string | undefined;
  setzen: (id: string) => void;
  name?: string;
  /** zusätzliche Eigenschaften des fieldset (id, ref in «Gefäss ändern») */
  kopf?: { id?: string; ref?: (el: HTMLFieldSetElement | null) => void };
  /** nach den Optionen im fieldset (Fehlermeldung) */
  nachher?: ReactNode;
}) {
  const [alle, setAlle] = useState(false);
  const { auswahl, gezeigt } = deckelListe(deckel, box, kennung, alle);
  // der gewählte Deckel bleibt sichtbar, auch wenn er nicht zur Box passt (Gefäss ändern: bisheriger Deckel)
  const gewaehltAusgeblendet = !alle && auswahl.ausgeblendet.find((o) => o.deckel.id === wert);
  const liste = gewaehltAusgeblendet ? [...gezeigt, gewaehltAusgeblendet] : gezeigt;
  const verborgen = alle ? 0 : auswahl.ausgeblendet.length - (gewaehltAusgeblendet ? 1 : 0);
  return (
    <>
      {auswahl.hinweis === 'box_unbekannt' && box ? (
        <Notice
          kompakt
          title={`Für «${box.name}» ist keine Grundfläche hinterlegt: alle Deckel stehen zur Wahl`}
        />
      ) : auswahl.hinweis === 'keiner_passt' && box ? (
        <Notice
          kompakt
          tone="warn"
          title={`Kein Deckel passt zu «${box.name}»: alle Deckel stehen zur Wahl`}
        />
      ) : null}
      <fieldset className="hv-anlage-feldgruppe" id={kopf?.id} ref={kopf?.ref}>
        <legend>Deckel oder Platte</legend>
        {box && auswahl.ausgeblendet.length > 0 ? (
          <p className="hv-deckelwahl-info">
            {alle
              ? `Alle Deckel, auch solche, die nicht auf ${box.name} passen`
              : `Passend zu ${box.name}; ${String(verborgen)} weitere ausgeblendet`}
          </p>
        ) : null}
        {liste.map((o) => (
          <Option
            key={o.deckel.id}
            option={o}
            name={name}
            gewaehlt={wert === o.deckel.id}
            setzen={setzen}
            kennung={kennung}
          />
        ))}
        {verborgen > 0 || alle ? (
          <Button variant="ghost" size="compact" onClick={() => setAlle(!alle)}>
            {alle ? 'Nur passende zeigen' : 'Alle Deckel zeigen'}
          </Button>
        ) : null}
        {nachher}
      </fieldset>
    </>
  );
}
