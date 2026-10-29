import { expect, test, type Page } from '@playwright/test';

/** On phones the extra filters are folded behind a toggle button. */
async function openFilters(page: Page) {
  const toggle = page.locator('button[aria-controls="more-filters"]');
  if (await toggle.isVisible()) await toggle.click();
}

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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Where are they biting today?');
  const list = page.getByTestId('spot-list');
  const all = await list.locator('li').count();
  expect(all).toBeGreaterThanOrEqual(50);

  await openFilters(page);
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
  await expect(page.getByTestId('buy-permit')).toHaveAttribute('href', /^https:\/\/www\.ribiskekarte\.si\/rd-tolmin\//);
  await expect(page.getByTestId('spot-revir')).toHaveAttribute('href', /\/revirji\/rd-tolmin\//);
});

test('sea spot shows waves and no-permit info; reserves are marked', async ({ page }) => {
  await page.goto('/sl/spots/piran-punta');
  await expect(page.getByTestId('conditions')).toContainText('Valovi');
  await expect(page.getByTestId('conditions')).toContainText('Temp. morja');
  await expect(page.getByText(/Ribolov z obale brez dovolilnice/).first()).toBeVisible();

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
  await page.getByTestId('language-switcher').getByRole('link', { name: 'de' }).click();
  await expect(page).toHaveURL(/\/de\/species\/sulec$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Huchen');
});

test('German guide falls back to English with a notice', async ({ page }) => {
  await page.goto('/de/guides/eging');
  await expect(page.getByText('noch nicht übersetzt')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Squid fishing (eging)');
});

test('rig guides show a drawn diagram instead of ASCII art', async ({ page }) => {
  await page.goto('/en/guides/float-rig');
  await expect(page.getByTestId('rig-diagram')).toBeVisible();
  await expect(page.getByTestId('rig-diagram')).toContainText('Tell-tale shot');
  await expect(page.locator('.prose-guide pre')).toHaveCount(0);
});

test('species pages and the lure finder show drawn baits', async ({ page }) => {
  await page.goto('/en/species/krap');
  await expect(page.getByTestId('species-tackle').locator('li')).toHaveCount(4);
  await expect(page.getByTestId('species-tackle')).toContainText('Boilies');
  await page.goto('/en/lure-finder');
  await page.getByTestId('finder-species').selectOption('linj');
  await expect(page.getByTestId('finder-baits')).toContainText('Worms');
});

test('lure finder suggests squid jigs for squid', async ({ page }) => {
  await page.goto('/en/lure-finder');
  await page.getByTestId('finder-species').selectOption('lignji');
  await page.getByTestId('finder-season').getByRole('button', { name: 'Winter' }).click();
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

test('fishing section page shows club data, permits and conditions', async ({ page }) => {
  await page.goto('/en/revirji/rd-tolmin/ucja');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Učja');
  await expect(page.getByTestId('passes').locator('li').first()).toContainText('€');
  await expect(page.getByTestId('buy-permit')).toHaveAttribute('href', 'https://www.ribiskekarte.si/rd-tolmin/ucja');
  await expect(page.getByTestId('conditions').getByTestId('day-card')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'What you can catch' })).toBeVisible();
  await expect(page.getByTestId('add-photo')).toHaveAttribute('href', /template=photo\.yml.*place=.*rd-tolmin%2Fucja/);
  await expect(page.getByText('Nearby spots')).toHaveCount(0);
});

test('setup advisor suggests a rig for the chosen fish and day', async ({ page }) => {
  await page.goto('/en/revirji/rd-tolmin/ucja');
  const advisor = page.getByTestId('advisor');
  await expect(advisor).toContainText('What to use – Today');
  await expect(page.getByTestId('advisor-setup')).not.toBeEmpty();
  await expect(page.getByTestId('advisor-tips').locator('li').first()).toBeVisible();
  await page.getByTestId('day-card').nth(2).click();
  await expect(advisor).not.toContainText('Today');
});

test('sections index lists clubs and the map can filter by club', async ({ page }) => {
  await page.goto('/sl/revirji');
  await expect(page.getByRole('heading', { name: 'Ribiška družina Tolmin' })).toBeVisible();
  await page.goto('/sl');
  await openFilters(page);
  await page.getByTestId('filter-club').selectOption('Ribiška družina Tolmin');
  const names = await page.getByTestId('spot-list').locator('h3').allTextContents();
  expect(names.length).toBeGreaterThan(3);
  expect(names).toContain('Učja');
});

test('section geometry endpoint returns GeoJSON lines', async ({ request }) => {
  const geo = await (await request.get('/api/revirji-geo')).json();
  expect(geo.type).toBe('FeatureCollection');
  expect(geo.features.length).toBeGreaterThan(200);
  expect(geo.features.some((f: { geometry: { type: string } }) => f.geometry.type === 'LineString')).toBe(true);
});
