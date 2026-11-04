// HMAC-SHA256 mit WebCrypto (Plan 13, Quittungs-Signatur A11): laufzeitneutral (Deno, Node, Browser).
// Signatur als Base64url ohne Füllzeichen; pruefen() vergleicht in konstanter Zeit über crypto.subtle.verify.
const kodierer = new TextEncoder();

function schluesselAus(schluessel: string, zweck: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    kodierer.encode(schluessel),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [zweck],
  );
}

function base64url(bytes: Uint8Array): string {
  let text = '';
  for (const b of bytes) text += String.fromCharCode(b);
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function ausBase64url(text: string): Uint8Array<ArrayBuffer> {
  const b64 = text
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(text.length / 4) * 4, '=');
  const roh = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(roh.length));
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
  return bytes;
}

export async function signieren(schluessel: string, text: string): Promise<string> {
  const sig = await crypto.subtle.sign(
    'HMAC',
    await schluesselAus(schluessel, 'sign'),
    kodierer.encode(text),
  );
  return base64url(new Uint8Array(sig));
}

/** true nur bei gültiger Signatur; eine nicht dekodierbare Signatur ergibt false, ohne zu werfen */
export async function pruefen(schluessel: string, text: string, signatur: string): Promise<boolean> {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(signatur)) return false;
    return await crypto.subtle.verify(
      'HMAC',
      await schluesselAus(schluessel, 'verify'),
      ausBase64url(signatur),
      kodierer.encode(text),
    );
  } catch {
    return false;
  }
}
