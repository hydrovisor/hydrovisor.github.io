// Hinweis «Neue Version, neu laden» in Heute (docs/spec/05_masken.md 3.1 und 5)
import { useState } from 'react';
import { Button } from './bausteine/Button.tsx';
import { Notice } from './bausteine/Notice.tsx';
import { useNeueVersion } from './dienst.tsx';

export function NeueVersionHinweis() {
  const { uebernehmen } = useNeueVersion();
  const [laedt, setLaedt] = useState(false);
  return (
    <Notice
      title="Neue Version, neu laden"
      action={
        <Button
          variant="secondary"
          size="compact"
          disabled={laedt}
          onClick={() => {
            setLaedt(true);
            void uebernehmen();
          }}
        >
          Neu laden
        </Button>
      }
    />
  );
}
