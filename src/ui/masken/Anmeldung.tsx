// Anmeldung (Kontext Schreibtisch, docs/spec/05_masken.md 4): Logo mit Claim, E-Mail, Passwort, «Anmelden»;
// keine Registrierung, kein Magic Link (Use Cases F4 UC0). Tims Konto ist von Hand angelegt.
import { useState, type FormEvent } from 'react';
import { anmeldeFehlerText } from '../../anmeldung/sitzung.ts';
import { supabase } from '../../daten/supabase.ts';
import { Button } from '../bausteine/Button.tsx';
import { Logo } from '../bausteine/Logo.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { TextField } from '../bausteine/TextField.tsx';
import { hashZu } from '../router.ts';

export function Anmeldung() {
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string>();

  async function anmelden(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sendet) return;
    setSendet(true);
    setFehler(undefined);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: passwort });
    setSendet(false);
    if (error) {
      setFehler(anmeldeFehlerText(error));
      return;
    }
    // die Sitzung meldet SIGNED_IN; aus #/anmelden geht es nach Heute
    if (window.location.hash.startsWith(hashZu({ name: 'anmelden' })))
      window.location.replace(hashZu({ name: 'heute' }));
  }

  return (
    <main className="hv-seite">
      <Logo kind="claim" height={48} />
      <h1 className="hv-seite-titel">Anmeldung</h1>
      <form className="hv-formular" onSubmit={(e) => void anmelden(e)} noValidate>
        <TextField
          label="E-Mail"
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Passwort"
          type="password"
          name="passwort"
          autoComplete="current-password"
          required
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
        />
        {fehler ? <Notice tone="danger">{fehler}</Notice> : null}
        <Button type="submit" block disabled={sendet || !email.trim() || !passwort} aria-busy={sendet}>
          Anmelden
        </Button>
      </form>
      <a className="hv-btn hv-btn-ghost" href={hashZu({ name: 'info' })}>
        Info öffnen
      </a>
    </main>
  );
}
