// Name einer Vorlage: Pflicht und unter den aktiven Vorlagen derselben Art eindeutig (Plan 19 A6)

export function nameLeer(name: string): boolean {
  return name.trim() === '';
}

export function nameDoppelt(
  name: string,
  bestand: readonly { name: string; client_id: string | null }[],
  ersetzt?: string,
): boolean {
  const gesucht = name.trim().toLocaleLowerCase('de-CH');
  return bestand.some(
    (v) =>
      (ersetzt === undefined || v.client_id !== ersetzt) &&
      v.name.trim().toLocaleLowerCase('de-CH') === gesucht,
  );
}
