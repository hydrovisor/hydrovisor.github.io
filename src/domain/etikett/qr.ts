// QR-Code für Etiketten (R9.1, Plan 22 A1): die einzige Stelle mit der QR-Bibliothek. Fehlerkorrektur Q, Matrix
// ohne Rand; der SVG-Pfad legt die Ruhezone selbst an. Rein, ohne Browser-API.
import { encode } from 'uqr';

/** QR-Matrix des Textes: matrix[zeile][spalte], true = dunkel, ohne Ruhezone */
export function qrMatrix(text: string): boolean[][] {
  return encode(text, { ecc: 'Q', border: 0 }).data.map((zeile) => [...zeile]);
}

/**
 * SVG-Pfad der dunklen Module (je Zeile zusammenhängende Läufe als Rechteck), Einheit 1 Modul, verschoben um die
 * Ruhezone. `module` ist die Kantenlänge einschliesslich Ruhezone (viewBox 0 0 module module).
 */
export function qrSvgPfad(matrix: boolean[][], ruhezone = 4): { pfad: string; module: number } {
  const teile: string[] = [];
  matrix.forEach((zeile, y) => {
    let x = 0;
    while (x < zeile.length) {
      if (!zeile[x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < zeile.length && zeile[x]) x += 1;
      teile.push(`M${start + ruhezone} ${y + ruhezone}h${x - start}v1h-${x - start}z`);
    }
  });
  return { pfad: teile.join(''), module: matrix.length + 2 * ruhezone };
}
