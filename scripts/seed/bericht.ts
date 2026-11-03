// Bericht des Seeds (03_import_w0.md 8.7): Konsole, Job-Zusammenfassung und seed-bericht.md (nicht versioniert).

export interface BerichtDatei {
  datei: string;
  tabelle: string;
  geladen: number;
  geaendert: number;
  geschlossen: number;
}

export interface SeedBericht {
  dateien: BerichtDatei[];
  nichtGeladen: { artId: string; grund: string }[];
  fehlendeDateien: string[];
  hinweise?: string[];
  konflikte: { art: string; zeileId: string; text: string }[];
  vollstaendigkeit: {
    sorte?: string;
    fehlendeGroessen?: number;
    pruefauftraege?: number;
    vollstaendig?: boolean;
  }[];
}

export function alsBericht(wert: unknown): SeedBericht {
  return (typeof wert === 'string' ? JSON.parse(wert) : wert) as SeedBericht;
}

export function berichtMarkdown(
  b: SeedBericht,
  kopf: { ziel: string; commit: string; trocken: boolean },
): string {
  const z: string[] = [
    `# Seed-Bericht ${kopf.ziel}${kopf.trocken ? ' (Trockenlauf, nichts geschrieben)' : ''}`,
    '',
    `Commit ${kopf.commit}`,
    '',
    '| Datei | Tabelle | geladen | geändert | geschlossen |',
    '|---|---|---|---|---|',
    ...b.dateien.map(
      (d) => `| ${d.datei} | ${d.tabelle} | ${d.geladen} | ${d.geaendert} | ${d.geschlossen} |`,
    ),
    '',
  ];
  if (b.fehlendeDateien.length > 0) z.push('**Nicht geliefert:** ' + b.fehlendeDateien.join(', '), '');
  for (const h of b.hinweise ?? []) z.push(`**Hinweis:** ${h}`, '');
  if (b.nichtGeladen.length > 0) {
    z.push('**Nicht voll geladene Arten** (nur Artmerkmale, Teilfreigabe):', '');
    for (const a of b.nichtGeladen) z.push(`- ${a.artId}: ${a.grund}`);
    z.push('');
  }
  if (b.konflikte.length > 0) {
    z.push('**Konflikte für Tim:**', '');
    for (const k of b.konflikte) z.push(`- ${k.art} ${k.zeileId}: ${k.text}`);
    z.push('');
  }
  if (b.vollstaendigkeit.length > 0) {
    const voll = b.vollstaendigkeit.filter((v) => v.vollstaendig).length;
    z.push(`**Vollständigkeit:** ${voll} von ${b.vollstaendigkeit.length} Sorten vollständig`, '');
    z.push('| Sorte | fehlende Grössen | Prüfaufträge | vollständig |', '|---|---|---|---|');
    for (const v of b.vollstaendigkeit)
      z.push(
        `| ${v.sorte} | ${v.fehlendeGroessen} | ${v.pruefauftraege} | ${v.vollstaendig ? 'ja' : 'nein'} |`,
      );
    z.push('');
  }
  return z.join('\n');
}
