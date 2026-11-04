// Körper der Messages-API und Auslesen der Antwort (Konzept 11.3, 16.4; 04_architektur.md 6; Plan 14).
// Parameter am 4.11.2026 an der API-Referenz geprüft: Structured Outputs und Denkstufe in output_config
// (format json_schema, effort low), ohne Beta-Header; thinking weggelassen (adaptiv); keine Sampling-Parameter.
import { MAX_TOKENS } from './modelle.ts';
import { TUETEN_SCHEMA } from './schema.ts';

export type KiEingabe =
  { art: 'bilder'; bilder: readonly { base64: string }[] } | { art: 'text'; text: string };

export const ANWEISUNG = [
  'Du liest die Angaben einer Saattüte für ein Hydroponikregal.',
  'Lies nur, was auf der Tüte gedruckt steht; Vorder- und Rückseite gehören zur selben Tüte.',
  'Steht ein Feld nicht auf der Tüte, gib null zurück. Rate nie und ergänze nichts aus eigenem Wissen.',
  'Keimart: licht bei Lichtkeimer, dunkel bei Dunkelkeimer, indifferent nur, wenn die Tüte sagt, dass Licht keine Rolle spielt.',
  'Bereiche als min und max; ein Einzelwert steht in min und max. Dauern in Tagen, Wochen mal 7.',
  'Aussaatfenster als Monatszahlen 1 bis 12 für die Aussaat (nicht die Ernte).',
  'Gib keine pH-, EC- oder Phasenangaben zurück.',
].join('\n');

/** Anfrage an POST /v1/messages; beide Seiten der Tüte in einer Nachricht */
export function anfrageBauen(eingabe: KiEingabe, modell: string): Record<string, unknown> {
  const inhalt =
    eingabe.art === 'bilder'
      ? [
          ...eingabe.bilder.map((b) => ({
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: b.base64 },
          })),
          { type: 'text', text: 'Lies die Felder dieser Saattüte.' },
        ]
      : [{ type: 'text', text: `Lies die Felder dieser Saattüte aus dem Text:\n\n${eingabe.text}` }];
  return {
    model: modell,
    max_tokens: MAX_TOKENS,
    system: ANWEISUNG,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: TUETEN_SCHEMA } },
    messages: [{ role: 'user', content: inhalt }],
  };
}

/** Erster Textblock (Denkblöcke übersprungen) und Token; undefined bei unbekanntem Körper oder ohne Text */
export function antwortAuslesen(
  body: unknown,
): { text: string; eingabeTokens: number; ausgabeTokens: number } | undefined {
  if (body === null || typeof body !== 'object') return undefined;
  const b = body as { content?: unknown; usage?: { input_tokens?: unknown; output_tokens?: unknown } };
  if (!Array.isArray(b.content)) return undefined;
  const block = (b.content as { type?: unknown; text?: unknown }[]).find(
    (x) => x?.type === 'text' && typeof x.text === 'string',
  );
  if (!block) return undefined;
  return {
    text: block.text as string,
    eingabeTokens: Number(b.usage?.input_tokens ?? 0),
    ausgabeTokens: Number(b.usage?.output_tokens ?? 0),
  };
}
