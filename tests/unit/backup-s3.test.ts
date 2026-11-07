// Backup der Tütenfotos über die S3-Schnittstelle (Issue #69, Entscheid 0013): SigV4 gegen die veröffentlichten
// Testvektoren von AWS (Beispielschlüssel aus der AWS-Dokumentation, keine echten Geheimnisse) und das Lesen der
// Antwort von ListObjectsV2. Hilfstests ohne eigenes AK, Präfix «Backup-Storage».
import { expect, it } from 'vitest';
import { LEER_SHA256, s3ListeLesen, s3Url, sigV4 } from '../../scripts/backup-regeln.mjs';

const BEISPIEL = { zugangId: 'AKIDEXAMPLE', geheimnis: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY' };
const signatur = (h: Record<string, string>) => h['authorization']?.split('Signature=')[1];

it('Backup-Storage SigV4: Testvektoren get-vanilla und get-vanilla-query-order-key-case', () => {
  const jetzt = new Date('2015-08-30T12:36:00Z');
  const basis = { methode: 'GET', region: 'us-east-1', dienst: 'service', jetzt, ...BEISPIEL };
  const a = sigV4({ ...basis, url: 'https://example.amazonaws.com/' });
  expect(signatur(a)).toBe('5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31');
  expect(a['authorization']).toContain(
    'Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, SignedHeaders=host;x-amz-date,',
  );
  expect(a['x-amz-date']).toBe('20150830T123600Z');
  const b = sigV4({ ...basis, url: 'https://example.amazonaws.com/?Param2=value2&Param1=value1' });
  expect(signatur(b)).toBe('b97d918cfa904a5beff61c982a1b6f458b799221646efd99d3219ec94cdf2500');
});

it('Backup-Storage SigV4: Beispiel GetObject aus der S3-Dokumentation (Range, x-amz-content-sha256)', () => {
  // SHA-256 der leeren Zeichenkette (bekannter Wert, beginnt mit e3b0c442 und endet mit 7852b855)
  expect(LEER_SHA256).toMatch(/^e3b0c442[0-9a-f]{48}7852b855$/);
  const h = sigV4({
    methode: 'GET',
    url: 'https://examplebucket.s3.amazonaws.com/test.txt',
    region: 'us-east-1',
    dienst: 's3',
    zugangId: 'AKIAIOSFODNN7EXAMPLE',
    geheimnis: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    jetzt: new Date('2013-05-24T00:00:00Z'),
    header: { range: 'bytes=0-9', 'x-amz-content-sha256': LEER_SHA256 },
  });
  expect(h['authorization']).toBe(
    'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, ' +
      'SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, ' +
      'Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41',
  );
  // das Geheimnis steht nie in den Headern
  expect(JSON.stringify(h)).not.toContain('wJalrXUtnFEMI');
});

const liste = (inhalt: string, rest = '<IsTruncated>false</IsTruncated>') =>
  `<?xml version="1.0" encoding="UTF-8"?><ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>saattueten</Name>${rest}${inhalt}</ListBucketResult>`;
const eintrag = (key: string, size = 10) => `<Contents><Key>${key}</Key><Size>${size}</Size></Contents>`;

it('Backup-Storage S3-Liste: Dateien mit Grösse, Fortsetzung, Platzhalter übersprungen', () => {
  const a = s3ListeLesen(
    liste(
      eintrag('37000000-0000-4000-8000-000000000001/a.jpg', 1200) +
        eintrag('37000000-0000-4000-8000-000000000001/.emptyFolderPlaceholder', 0) +
        eintrag('37000000-0000-4000-8000-000000000002/b&amp;c.jpg', 5),
      '<IsTruncated>true</IsTruncated><NextContinuationToken>abc&amp;1</NextContinuationToken>',
    ),
  );
  expect(a.dateien).toEqual([
    { pfad: '37000000-0000-4000-8000-000000000001/a.jpg', bytes: 1200 },
    { pfad: '37000000-0000-4000-8000-000000000002/b&c.jpg', bytes: 5 },
  ]);
  expect(a.weiter).toBe('abc&1');
  expect(s3ListeLesen(liste('')).dateien).toEqual([]);
  expect(s3ListeLesen(liste('')).weiter).toBeNull();
});

it('Backup-Storage S3-Liste: unsichere Schlüssel, fehlende Fortsetzung und fremde Antworten scheitern', () => {
  for (const key of ['../a.jpg', 'x/../../a.jpg', 'x//a.jpg', 'x\\a.jpg', '/a.jpg', 'x/./a.jpg'])
    expect(() => s3ListeLesen(liste(eintrag(key))), key).toThrow(/Ungültiger Schlüssel/);
  expect(() => s3ListeLesen(liste(eintrag('x/a.jpg').replace('<Size>10</Size>', '')))).toThrow(/Grösse/);
  expect(() => s3ListeLesen(liste('', '<IsTruncated>true</IsTruncated>'))).toThrow(/Fortsetzung/);
  expect(() => s3ListeLesen('<Error><Code>AccessDenied</Code></Error>')).toThrow(/ListBucketResult/);
});

it('Backup-Storage s3Url: Pfad und Query nach RFC 3986, sortiert; gesendete und signierte Form stimmen überein', () => {
  const basis = 'https://projekt.example.invalid/storage/v1/s3/';
  expect(s3Url(basis, ['saattueten', 'ordner (1)', "a!b'c*.jpg"])).toBe(
    'https://projekt.example.invalid/storage/v1/s3/saattueten/ordner%20%281%29/a%21b%27c%2A.jpg',
  );
  const url = s3Url(basis, ['saattueten'], {
    'max-keys': '1000',
    'continuation-token': 'a+b/c= ~',
    'list-type': '2',
  });
  expect(url).toBe(
    'https://projekt.example.invalid/storage/v1/s3/saattueten?continuation-token=a%2Bb%2Fc%3D%20~&list-type=2&max-keys=1000',
  );
  // dieselbe Anfrage mit anderer Schreibweise (%7E, andere Reihenfolge) ergibt dieselbe Signatur: sigV4 kanonisiert
  const signieren = (u: string) =>
    sigV4({
      methode: 'GET',
      url: u,
      region: 'local',
      dienst: 's3',
      jetzt: new Date('2027-01-15T09:30:00Z'),
      ...BEISPIEL,
    });
  const anders =
    'https://projekt.example.invalid/storage/v1/s3/saattueten?max-keys=1000&list-type=2&continuation-token=a%2Bb%2Fc%3D%20%7E';
  expect(signieren(url)['authorization']).toBe(signieren(anders)['authorization']);
});
