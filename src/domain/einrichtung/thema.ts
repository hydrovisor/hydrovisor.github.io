// Thema für die ganze App (W7, Konzept 6.3, UC0-AK6): einstellung.thema mit Standard «Hell». Rein.

export type Thema = 'hell' | 'dunkel' | 'system';

/** Wert für data-theme auf <html>; ohne gültige Einstellung immer hell, unabhängig vom Systemmodus */
export function themaAttribut(thema: unknown, systemDunkel: boolean): 'light' | 'dark' {
  if (thema === 'dunkel') return 'dark';
  if (thema === 'system') return systemDunkel ? 'dark' : 'light';
  return 'light';
}

/** thema der ersten Zeile von einstellung im Bündel */
export function themaAus(teile: Record<string, readonly unknown[]> | undefined): unknown {
  const zeile = teile?.['einstellung']?.[0] as { thema?: unknown } | undefined;
  return zeile?.thema;
}
