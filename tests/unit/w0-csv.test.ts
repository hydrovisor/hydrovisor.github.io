// W0-CSV ohne eigenes AK (Plan 10 Testliste; 03_import_w0.md Abschnitt 2.1). Namen ohne die Wörter der [SQL]-AK.
//
// Vorausgesetzt aus src/domain/w0/csv.ts:
//   interface CsvTabelle { datei: string; spalten: string[]; zeilen: Record<string, string | null>[] }
//   csvLesen(datei: string, text: string): CsvTabelle | Verstoss[]
//   RFC 4180, UTF-8 ohne BOM, LF, Kopfzeile Pflicht; leeres Feld = null; Fehler als Verstoss mit regel 'V1'
//   und datei = erster Parameter. Ein abschliessendes LF erzeugt keine leere Zeile.
import { describe, expect, it } from 'vitest';
import { csvLesen } from '../../src/domain/w0/csv.ts';

const DATEI = 'data/wissensbasis/freigegeben/quelle.csv';
const BOM = String.fromCharCode(0xfeff);

function tabelle(text: string) {
  const t = csvLesen(DATEI, text);
  if (Array.isArray(t)) throw new Error(`unerwartet Verstösse: ${JSON.stringify(t)}`);
  return t;
}

describe('W0-CSV', () => {
  it('W0-CSV liest Felder mit Komma und Anführungszeichen nach RFC 4180', () => {
    const t = tabelle(
      'zeile_id,titel,link\n' +
        'q1,"Titel, mit Komma",https://example.invalid/1\n' +
        'q2,"Er sagte ""ja""",https://example.invalid/2\n' +
        'q3,"zwei\nZeilen",https://example.invalid/3\n',
    );
    expect(t.datei).toBe(DATEI);
    expect(t.spalten).toEqual(['zeile_id', 'titel', 'link']);
    expect(t.zeilen).toHaveLength(3);
    expect(t.zeilen[0]).toEqual({
      zeile_id: 'q1',
      titel: 'Titel, mit Komma',
      link: 'https://example.invalid/1',
    });
    expect(t.zeilen[1]?.['titel']).toBe('Er sagte "ja"');
    expect(t.zeilen[2]?.['titel']).toBe('zwei\nZeilen');
  });

  it('W0-CSV meldet BOM und CRLF als V1', () => {
    const bom = csvLesen(DATEI, BOM + 'zeile_id,titel\nq1,T\n');
    expect(Array.isArray(bom)).toBe(true);
    expect(bom).toEqual(expect.arrayContaining([expect.objectContaining({ datei: DATEI, regel: 'V1' })]));

    const crlf = csvLesen(DATEI, 'zeile_id,titel\r\nq1,T\r\n');
    expect(Array.isArray(crlf)).toBe(true);
    expect(crlf).toEqual(expect.arrayContaining([expect.objectContaining({ datei: DATEI, regel: 'V1' })]));
  });

  it('W0-CSV leeres Feld ist null, nie 0', () => {
    const t = tabelle('zeile_id,wert_min,wert_max\na,,1\nb,0,\n');
    expect(t.zeilen[0]).toEqual({ zeile_id: 'a', wert_min: null, wert_max: '1' });
    expect(t.zeilen[1]).toEqual({ zeile_id: 'b', wert_min: '0', wert_max: null });
  });

  it('W0-CSV ohne Kopfzeile oder mit falscher Feldzahl meldet V1', () => {
    expect(Array.isArray(csvLesen(DATEI, ''))).toBe(true);
    const feldzahl = csvLesen(DATEI, 'zeile_id,titel\nq1,T,zuviel\n');
    expect(feldzahl).toEqual(expect.arrayContaining([expect.objectContaining({ regel: 'V1' })]));
  });
});
