// Breite und Höhe aus dem JPEG-Kopf (04_architektur.md 6 «höchstens 2 × 1568 px»; Plan 14). Liest das erste
// SOF-Segment (C0 bis CF ohne DHT C4, JPG C8, DAC CC) und überspringt die übrigen Segmente über ihre Länge.
const OHNE_LAENGE = new Set([0x01, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8]);

export function jpegMasse(bytes: Uint8Array): { breite: number; hoehe: number } | undefined {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined;
  let i = 2;
  while (i + 1 < bytes.length) {
    if (bytes[i] !== 0xff) return undefined;
    // Füllbytes 0xFF überspringen
    while (bytes[i + 1] === 0xff && i + 2 < bytes.length) i++;
    const marker = bytes[i + 1] ?? 0;
    if (OHNE_LAENGE.has(marker)) {
      i += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) return undefined; // Bildende oder Bilddaten vor einem SOF
    if (i + 3 >= bytes.length) return undefined;
    const laenge = ((bytes[i + 2] ?? 0) << 8) | (bytes[i + 3] ?? 0);
    if (laenge < 2) return undefined;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (i + 8 >= bytes.length) return undefined;
      const hoehe = ((bytes[i + 5] ?? 0) << 8) | (bytes[i + 6] ?? 0);
      const breite = ((bytes[i + 7] ?? 0) << 8) | (bytes[i + 8] ?? 0);
      return { breite, hoehe };
    }
    i += 2 + laenge;
  }
  return undefined;
}
