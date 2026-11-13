// Baustein Kulturform (design-system/components/Kulturform.md, Plan 205): die geltende Form mit Wirkung; eine Wahl erst
// nach «Kulturform ändern», nur bei mehreren erlaubten Formen (Entscheid 0023 Punkt 4)
import { useId, useState } from 'react';
import { Button } from './Button.tsx';
import { Choice } from './Choice.tsx';

export type KulturformHerkunft = 'vorgabe' | 'letztes_mal' | 'geaendert';

const HERKUNFT: Readonly<Record<KulturformHerkunft, string>> = {
  vorgabe: 'Vorgabe',
  letztes_mal: 'Wie letztes Mal',
  geaendert: 'geändert',
};

export function Kulturform({
  form,
  formen,
  vorgabe,
  herkunft,
  name,
  was,
  ernte,
  onWahl,
}: {
  form: string;
  formen: readonly string[];
  vorgabe: string;
  herkunft: KulturformHerkunft;
  /** Anzeigename je Form */
  name: (form: string) => string;
  /** was die Form heisst */
  was: (form: string) => string;
  /** Erntezeile je Form */
  ernte: (form: string) => string;
  onWahl: (form: string) => void;
}) {
  const [offen, setOffen] = useState(false);
  const id = useId();
  return (
    <section className="hv-kulturform" aria-labelledby={id}>
      <p className="hv-kulturform-label" id={id}>
        Kulturform
      </p>
      {offen ? (
        <Choice
          einzeln
          label="Kulturform wählen"
          optionen={formen.map((k) => ({
            wert: k,
            titel: k === vorgabe ? `${name(k)} · Vorgabe` : name(k),
            zusatz: ernte(k),
          }))}
          gewaehlt={[form]}
          onWahl={(k) => {
            onWahl(k);
            setOffen(false);
          }}
        />
      ) : (
        <>
          <p className="hv-kulturform-titel">
            {name(form)} <span className="hv-badge">{HERKUNFT[herkunft]}</span>
          </p>
          <p className="hv-kulturform-wirkung">
            {was(form)}
            <small>{ernte(form)}</small>
          </p>
          {formen.length > 1 ? (
            <Button variant="secondary" size="compact" onClick={() => setOffen(true)}>
              Kulturform ändern
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
