// Reine Hilfen des Service Workers für Push und Quittung (Plan 13 «Service Worker», Datei `src/sw/push.ts`;
// 11.3, R5.5 Zustellung: Tag heute, renotify false; 04_architektur.md 5: Quittung ohne Sitzung, nur Signatur).
// Nutzlast der Push: { titel, text, versand_id, signatur, tag: 'heute' | 'test', url: '#/heute' }.
// Vorausgesetzt (Plan 13 nennt nur die Namen):
// - benachrichtigungAus(nutzlast: unknown): { titel: string; optionen: { body: string; tag: string;
//   renotify: boolean; data: { versand_id: string; signatur: string; url: string } } } für
//   self.registration.showNotification(titel, optionen).
// - quittungsAnfrage(basisUrl: string, quittung: { versand_id: string; signatur: string;
//   ereignis: 'angezeigt' | 'geoeffnet' }): { url: string; init: RequestInit } für fetch(url, init).
import { describe, expect, it } from 'vitest';
import { benachrichtigungAus, quittungsAnfrage } from '../../src/sw/push.ts';

const NUTZLAST = {
  titel: 'Hydrovisor heute: 3 Routine',
  text: 'Kalibrieren · Messen R-2.3, R-3.1',
  versand_id: '00000000-0000-4000-8000-0000000b0001',
  signatur: 'c2lnbmF0dXItdGVzdA',
  tag: 'heute',
  url: '#/heute',
};

describe('Service Worker Push', () => {
  it('11.3 benachrichtigungAus: tag heute, renotify false, data mit versand_id', () => {
    const b = benachrichtigungAus(NUTZLAST);
    expect(b.titel).toBe('Hydrovisor heute: 3 Routine');
    expect(b.optionen.body).toBe('Kalibrieren · Messen R-2.3, R-3.1');
    expect(b.optionen.tag).toBe('heute');
    expect(b.optionen.renotify).toBe(false);
    expect(b.optionen.data).toMatchObject({
      versand_id: NUTZLAST.versand_id,
      signatur: NUTZLAST.signatur,
      url: '#/heute',
    });
  });

  it('11.3 benachrichtigungAus: Test-Push mit Tag test', () => {
    const b = benachrichtigungAus({ ...NUTZLAST, titel: 'Hydrovisor Test-Push', tag: 'test' });
    expect(b.titel).toBe('Hydrovisor Test-Push');
    expect(b.optionen.tag).toBe('test');
    expect(b.optionen.renotify).toBe(false);
  });

  it('11.3 quittungsAnfrage an /functions/v1/push-quittung mit ereignis angezeigt', () => {
    const { url, init } = quittungsAnfrage('http://127.0.0.1:54321', {
      versand_id: NUTZLAST.versand_id,
      signatur: NUTZLAST.signatur,
      ereignis: 'angezeigt',
    });
    expect(url).toBe('http://127.0.0.1:54321/functions/v1/push-quittung');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      versand_id: NUTZLAST.versand_id,
      signatur: NUTZLAST.signatur,
      ereignis: 'angezeigt',
    });
  });

  it('11.3 quittungsAnfrage mit ereignis geoeffnet', () => {
    const { init } = quittungsAnfrage('http://127.0.0.1:54321', {
      versand_id: NUTZLAST.versand_id,
      signatur: NUTZLAST.signatur,
      ereignis: 'geoeffnet',
    });
    expect(JSON.parse(String(init.body))).toMatchObject({ ereignis: 'geoeffnet' });
  });
});
