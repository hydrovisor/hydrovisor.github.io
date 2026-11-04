// Name einer Vorlage: Pflicht und unter den aktiven Vorlagen derselben Art eindeutig (Plan 19 A6)

export function nameLeer(name: string): boolean {
  return name.trim() === '';
}

/** ohne Gross-/Kleinschreibung und Leerzeichen am Rand */
export function nameDoppelt(name: string, bestand: readonly { name: string }[]): boolean {
  const gesucht = name.trim().toLocaleLowerCase('de-CH');
  return bestand.some((v) => v.name.trim().toLocaleLowerCase('de-CH') === gesucht);
}
