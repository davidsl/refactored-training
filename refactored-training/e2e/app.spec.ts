import { expect, test } from '@playwright/test'

test('primary routes render their main content', async ({ page }) => {
  const routes = [
    { path: './', heading: null },
    { path: 'about', heading: 'About This Site' },
    { path: 'game', heading: 'Minesweeper' },
    { path: 'leaderboard', heading: 'Leaderboard' },
    { path: 'styling-examples', heading: 'Styling Examples' },
    { path: 'clicking-game', heading: 'Serotonin Farm' },
    { path: 'table', heading: 'Reusable Table Component' },
    { path: 'spy-game', heading: 'Top Secret Spies' },
  ]

  for (const route of routes) {
    await page.goto(route.path)
    if (route.heading) {
      await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible()
    } else {
      await expect(page.getByRole('searchbox', { name: 'Search map locations' })).toBeVisible()
    }
  }
})

test('Field Investigator mission can be started and reset', async ({ page }) => {
  await page.goto('./')

  await expect(page.getByRole('heading', { name: 'The missing field notes' })).toBeVisible()
  await expect(page.getByText('Mission briefing', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Start investigation' }).click()
  await expect(page.getByText('Investigation in progress', { exact: true })).toBeVisible()
  await expect(page.getByText('Clue 1: Look for the old harbor where the city meets the fjord.')).toBeVisible()

  const mapElement = page.locator('arcgis-map');
  await mapElement.evaluate(async element => {
    await (element as HTMLElement & { viewOnReady: () => Promise<void> }).viewOnReady();
  });
  const mapBounds = await mapElement.boundingBox();
  if (!mapBounds) throw new Error('The map is not visible.');

  await page.mouse.click(mapBounds.x + mapBounds.width * 0.95, mapBounds.y + mapBounds.height * 0.9);
  await expect(page.getByText(/No field note here\. The closest remaining field note is (?:\d+ m|\d+(?:\.\d+)? km) away\./)).toBeVisible();

  await page.mouse.click(mapBounds.x + mapBounds.width / 2, mapBounds.y + mapBounds.height / 2);
  await expect(page.getByText('1 / 3', { exact: true })).toBeVisible();
  await expect(page.getByText('Field note recovered. 2 remaining.')).toBeVisible();

  await page.getByRole('button', { name: 'Reset mission' }).click()
  await expect(page.getByText('Mission briefing', { exact: true })).toBeVisible()
  await expect(page.getByText('0 / 3', { exact: true })).toBeVisible()
})

test('theme toggle updates the document theme', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('refactored-training-theme', 'light'))
  await page.goto('game')

  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('mobile navigation closes on Escape and outside click', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('about')

  const menuButton = page.locator('button[aria-controls="main-nav"]')
  await menuButton.click()
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  await expect(menuButton).toBeFocused()

  await menuButton.click()
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
  await page.locator('body').click({ position: { x: 1, y: 500 } })
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
})

test('Minesweeper reveals its guaranteed-safe opening tile', async ({ page }) => {
  await page.goto('game')

  const startingTile = page.locator('button[aria-label*="Guaranteed-safe starting cell"]')
  await expect(startingTile).toBeVisible()
  const tileIndex = await startingTile.getAttribute('data-tile-index')
  await startingTile.click()
  await expect(page.locator(`[data-tile-index="${tileIndex}"]`)).toHaveAttribute('aria-label', /revealed/)
})

test('leaderboard request failures offer retry instead of an empty state', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 })
  let requestCount = 0
  await page.route('**/GameResults', async route => {
    requestCount++
    await route.abort()
  })
  await page.goto('leaderboard')

  const retryButton = page.getByRole('button', { name: 'Retry' })
  await expect(retryButton).toBeVisible()
  await expect(page.getByText('No wins yet.')).toHaveCount(0)
  const initialRequestCount = requestCount
  await retryButton.click()
  await expect.poll(() => requestCount).toBe(initialRequestCount + 1)
  await expect(retryButton).toBeVisible()
})

test('Minesweeper restores active and custom settings after reload', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('refactored-training-minesweeper-settings', JSON.stringify({
      rows: 16,
      cols: 16,
      mines: 40,
      draftRows: 21,
      draftCols: 15,
      draftMines: 35,
      unknownBombCount: false,
    }))
  })
  await page.goto('game')
  await expect(page.getByRole('grid')).toHaveAttribute('aria-rowcount', '16')
  await expect(page.getByRole('grid')).toHaveAttribute('aria-colcount', '16')
  await page.reload()
  await expect(page.getByRole('grid')).toHaveAttribute('aria-rowcount', '16')

  await page.getByRole('button', { name: 'Custom Game' }).click()
  await expect(page.getByLabel('Rows')).toHaveValue('21')
  await expect(page.getByLabel('Columns')).toHaveValue('15')
  await expect(page.getByRole('spinbutton', { name: 'Bombs' })).toHaveValue('35')
})

test('primary routes fit a narrow mobile viewport without page-level horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 })

  for (const route of ['about', 'game', 'leaderboard', 'styling-examples', 'clicking-game', 'table', 'spy-game']) {
    await page.goto(route)
    await expect(page.locator('main')).toBeVisible()
    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.pageWidth, `${route} page width`).toBeLessThanOrEqual(dimensions.viewportWidth)
  }
})