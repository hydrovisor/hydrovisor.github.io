import { expect, test } from '@playwright/test';

const erwartet = process.env['ERWARTETER_COMMIT'] ?? '';
const wartenMs = Number(process.env['RAUCHTEST_WARTEN_S'] ?? '300') * 1000;

test('Rauchtest: version.json zeigt den Commit, Heute oder die Anmeldung erscheint', async ({
  page,
  request,
}) => {
  await test.step(`version.json zeigt ${erwartet}`, async () => {
    await expect
      .poll(
        async () => {
          // Cache-Brecher, damit der Pages-Cache nicht den vorigen Stand liefert
          const antwort = await request.get(`version.json?r=${Date.now()}`, {
            headers: { 'cache-control': 'no-cache' },
          });
          if (!antwort.ok()) return `HTTP ${antwort.status()}`;
          return ((await antwort.json()) as { commit?: string }).commit;
        },
        { timeout: wartenMs, intervals: [5_000, 10_000] },
      )
      .toBe(erwartet);
  });

  await test.step('Heute oder die Anmeldung erscheint', async () => {
    await page.goto(`./?r=${Date.now()}#/heute`);
    const heute = page.getByRole('heading', { name: 'Heute', level: 1 });
    const anmeldung = page.getByRole('button', { name: 'Anmelden' });
    await expect(heute.or(anmeldung).first()).toBeVisible();
  });
});
