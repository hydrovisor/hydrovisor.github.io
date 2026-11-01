// Info (Kontext Schreibtisch, docs/spec/05_masken.md 5): Logo mit Claim, App-Version mit Commit, Lizenz der Schrift
import { APP_COMMIT, APP_VERSION } from '../../konstanten.ts';
import { kurzhash } from '../../version.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Logo } from '../bausteine/Logo.tsx';
import { hashZu } from '../router.ts';
import { useSitzung } from '../sitzung.tsx';

// Stand des dauerhaften Speichers; «unbekannt» vor der Anmeldung (angefragt wird erst mit Sitzung)
const SPEICHER_TEXT = {
  erteilt: 'erteilt',
  'nicht-erteilt': 'nicht erteilt',
  'nicht-verfuegbar': 'nicht verfügbar',
  unbekannt: 'nicht angefragt',
} as const;

export function Info() {
  const { speicher, installiert, installieren } = useSitzung();
  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Info</h1>
        <a className="hv-btn hv-btn-ghost" href={hashZu({ name: 'heute' })}>
          Heute öffnen
        </a>
      </header>
      <Logo kind="claim" height={48} />
      <Card title="App">
        <dl className="hv-angaben">
          <dt>Version</dt>
          <dd className="hv-num" data-testid="app-version">
            {APP_VERSION}
          </dd>
          <dt>Commit</dt>
          <dd className="hv-num" data-testid="app-commit" title={APP_COMMIT}>
            {kurzhash(APP_COMMIT)}
          </dd>
        </dl>
      </Card>
      <Card title="Gerät">
        <dl className="hv-angaben">
          <dt>Installiert</dt>
          <dd data-testid="installiert">{installiert ? 'ja' : 'nein'}</dd>
          <dt>Dauerhafter Speicher</dt>
          <dd data-testid="speicher">{SPEICHER_TEXT[speicher ?? 'unbekannt']}</dd>
        </dl>
        {installieren ? (
          <Button variant="secondary" block onClick={() => void installieren()}>
            App installieren
          </Button>
        ) : null}
      </Card>
      <Card title="Schrift">
        <p>Manrope, SIL Open Font License 1.1</p>
      </Card>
    </main>
  );
}
