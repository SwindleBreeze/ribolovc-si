import { expect, test } from '@playwright/test';

test.describe('locale detection', () => {
  test.use({ locale: 'sl-SI' });
  test('root redirects a Slovenian browser to the Slovenian site', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/sl$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'sl');
  });
});

test.describe('locale detection (German)', () => {
  test.use({ locale: 'de-AT' });
  test('root redirects a German browser to the German site', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/de$/);
  });
});

test('map page lists spots and filters them', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('fish in Slovenia');
  const list = page.getByTestId('spot-list');
  const all = await list.locator('li').count();
  expect(all).toBeGreaterThanOrEqual(50);

  await page.getByTestId('filter-species').selectOption('soska-postrv');
  await expect(list.locator('li')).not.toHaveCount(all);
  const names = await list.locator('h3').allTextContents();
  expect(names.some((n) => n.includes('Soča'))).toBe(true);
  expect(names.every((n) => !n.includes('Ptuj'))).toBe(true);
});

test('spot page shows the 4-day conditions, rules and directions', async ({ page }) => {
  await page.goto('/en/spots/soca-tolmin');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Soča & Tolminka (Tolmin)');
  await expect(page.getByText('Fly fishing only').first()).toBeVisible();

  const conditions = page.getByTestId('conditions');
  await expect(conditions.getByTestId('day-card')).toHaveCount(4);
  await expect(conditions.getByTestId('day-card').first()).toContainText('Today');
  await expect(conditions.getByTestId('water')).toContainText('9.8 °C');
  await expect(conditions.getByTestId('score-factors').locator('li').first()).toBeVisible();

  await conditions.getByTestId('day-card').nth(2).click();
  await expect(conditions.getByTestId('score-factors')).toContainText('falling pressure');

  const google = page.getByTestId('directions').getByRole('link', { name: 'Google Maps' });
  await expect(google).toHaveAttribute('href', /destination=46\.18\d*,13\.7/);
  await expect(page.getByRole('link', { name: /Buy a permit/ })).toHaveAttribute('href', 'https://www.ribiskekarte.si');
});

test('sea spot shows waves and no-permit info; reserves are marked', async ({ page }) => {
  await page.goto('/sl/spots/piran-punta');
  await expect(page.getByTestId('conditions').getByTestId('day-card').first()).toContainText('m');
  await expect(page.getByText('Ribolov z obale brez dovolilnice.')).toBeVisible();

  await page.goto('/sl/spots/strunjan-rezervat');
  await expect(page.getByRole('alert').filter({ hasText: 'NI dovoljen' })).toBeVisible();
  await expect(page.getByTestId('conditions')).toHaveCount(0);
});

test('conditions API returns 404 for unknown spots', async ({ request }) => {
  const res = await request.get('/api/conditions?spot=nope');
  expect(res.status()).toBe(404);
  const ok = await request.get('/api/conditions?spot=krka-otocec');
  expect(ok.ok()).toBe(true);
  const body = await ok.json();
  expect(body.days).toHaveLength(4);
});

test('language switcher keeps the current page', async ({ page }) => {
  await page.goto('/sl/species/sulec');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sulec');
  await page.getByTestId('language-switcher').selectOption('de');
  await expect(page).toHaveURL(/\/de\/species\/sulec$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Huchen');
});

test('German guide falls back to English with a notice', async ({ page }) => {
  await page.goto('/de/guides/eging');
  await expect(page.getByText('noch nicht übersetzt')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Squid fishing (eging)');
});

test('lure finder suggests squid jigs for squid', async ({ page }) => {
  await page.goto('/en/lure-finder');
  await page.getByTestId('finder-species').selectOption('lignji');
  await page.getByRole('combobox').nth(2).selectOption('winter');
  await expect(page.getByTestId('finder-results')).toContainText('Squid jig');
});

test('support page offers a donation option', async ({ page }) => {
  await page.goto('/en/podpri');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Support Ribolovc.si');
  await expect(page.getByTestId('donate-link').or(page.getByTestId('donate-missing'))).toBeVisible();
});

test('PWA manifest and sitemap are served', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.icons.length).toBeGreaterThan(0);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/sl/spots/soca-bovec');
});
