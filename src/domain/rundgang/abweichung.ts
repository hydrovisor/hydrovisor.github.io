// Texte und Massnahmen je Punkt der Kurzprüfung mit Abweichung (Plan 30, R10.5): gemeinsam für die Abschlussliste des
// Rundgangs und die Kurzprüfung eines Orts aus Heute (Plan 225).
const BELUEFTUNG =
  'Pumpe, Schlauch und Luftstein prüfen; bei Kratky Pegel senken; Gefässe derselben Luftpumpe mitmarkiert';
export const KURZ_ABWEICHUNG: Readonly<Record<string, { text: string; massnahme: string }>> = {
  pumpe: { text: 'Pumpe sprudelt nicht → Belüftung prüfen', massnahme: BELUEFTUNG },
  luftzone: { text: 'Keine Luftzone → Belüftung prüfen', massnahme: BELUEFTUNG },
  loesung_topfboden: {
    text: 'Lösung berührt Topfboden nicht',
    massnahme: 'Pegel bis an den Topfboden anheben',
  },
  wurzeln: { text: 'Wurzeln nicht weiss', massnahme: 'Wurzeln und Geruch prüfen' },
  wuerfel_feucht: { text: 'Würfel nicht feucht', massnahme: 'Würfel befeuchten' },
  // am Bereich (Sammel-Tipp, Prüfer Runde 1 Befund 2; Massnahmen A)
  licht: { text: 'Licht aus', massnahme: 'AC10-Zeitplan und Stromzufuhr des Lichts prüfen' },
  luefter: { text: 'Lüfter steht', massnahme: 'Lüfter und Stromzufuhr prüfen' },
};
