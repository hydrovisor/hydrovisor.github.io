// MD5 nach RFC 1321 als Hex-Text, rein (ohne node:crypto), damit die Demo-Regeln im Unit-Test ohne Node-Typen laufen.
// Nur für deterministische Demo-IDs (gleich wie md5(text) in PostgreSQL), nicht für Sicherheit.
const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
  14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21, 6, 10, 15, 21,
];
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

export function md5(text: string): string {
  const daten = new TextEncoder().encode(text);
  const laenge = (((daten.length + 8) >> 6) + 1) * 64;
  const puffer = new Uint8Array(laenge);
  puffer.set(daten);
  puffer[daten.length] = 0x80;
  const bits = daten.length * 8;
  const ansicht = new DataView(puffer.buffer);
  ansicht.setUint32(laenge - 8, bits >>> 0, true);
  ansicht.setUint32(laenge - 4, Math.floor(bits / 2 ** 32), true);
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  for (let block = 0; block < laenge; block += 64) {
    const m = Array.from({ length: 16 }, (_, i) => ansicht.getUint32(block + i * 4, true));
    let [a, b, c, d] = [a0, b0, c0, d0];
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) [f, g] = [(b & c) | (~b & d), i];
      else if (i < 32) [f, g] = [(d & b) | (~d & c), (5 * i + 1) % 16];
      else if (i < 48) [f, g] = [b ^ c ^ d, (3 * i + 5) % 16];
      else [f, g] = [c ^ (b | ~d), (7 * i) % 16];
      const summe = (a + f + (K[i] ?? 0) + (m[g] ?? 0)) >>> 0;
      const s = S[i] ?? 0;
      [a, d, c] = [d, c, b];
      b = (b + ((summe << s) | (summe >>> (32 - s)))) >>> 0;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }
  return [a0, b0, c0, d0]
    .map((w) => [0, 8, 16, 24].map((s) => ((w >>> s) & 0xff).toString(16).padStart(2, '0')).join(''))
    .join('');
}
