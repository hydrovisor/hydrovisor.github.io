// Tütenfoto im Browser verkleinern (Konzept 11.3): lange Kante höchstens 1568 px, JPEG Qualität 0.8. Der Canvas
// schreibt keine EXIF-Daten, damit ist die Datei ohne Kamera- und Ortsangaben (11.6 Punkt 3, UC4-AK6).
import { BILD_KANTE_MAX } from '../domain/ki/modelle.ts';

export async function tuetenbildVerkleinern(datei: Blob): Promise<Blob> {
  const bild = await createImageBitmap(datei, { imageOrientation: 'from-image' });
  const faktor = Math.min(1, BILD_KANTE_MAX / Math.max(bild.width, bild.height));
  const breite = Math.round(bild.width * faktor);
  const hoehe = Math.round(bild.height * faktor);
  const canvas = document.createElement('canvas');
  canvas.width = breite;
  canvas.height = hoehe;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas nicht verfügbar');
  ctx.drawImage(bild, 0, 0, breite, hoehe);
  bild.close();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('JPEG nicht erzeugt'))), 'image/jpeg', 0.8),
  );
}
