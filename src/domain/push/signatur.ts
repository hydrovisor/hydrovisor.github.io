// Text, den die Quittungs-Signatur abdeckt (Plan 13 A11): nur die versand_id, mit Präfix und Version.
export function signaturText(versandId: string): string {
  return `hydrovisor-quittung:v1:${versandId}`;
}
