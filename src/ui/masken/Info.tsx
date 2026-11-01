// Info (Kontext Schreibtisch, docs/spec/05_masken.md 5): Logo mit Claim, App-Version mit Commit, Lizenz der Schrift
import { APP_COMMIT, APP_VERSION } from '../../konstanten.ts';
import { kurzhash } from '../../version.ts';
import { Card } from '../bausteine/Card.tsx';
import { Logo } from '../bausteine/Logo.tsx';
import { hashZu } from '../router.ts';

export function Info() {
  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Info</h1>
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
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
      <Card title="Schrift">
        <p>Manrope, SIL Open Font License 1.1</p>
      </Card>
    </main>
  );
}
