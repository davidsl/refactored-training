import { expect, test } from '@playwright/test'
import { FIELD_NOTE_LOCATION_PACKS, FIELD_NOTE_LOCATIONS } from '../src/MapWidget/missionLogic.ts'

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

  await expect(page.locator('arcgis-layer-list')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'The missing field notes' })).toBeVisible()
  await expect(page.getByText('Mission briefing', { exact: true })).toBeVisible()
  await page.getByRole('radio', { name: 'Relaxed' }).check()
  await expect(page.getByRole('radio', { name: 'Relaxed' })).toBeChecked()
  await page.getByRole('button', { name: 'Start investigation' }).click()
  await expect(page.getByText('Investigation in progress', { exact: true })).toBeVisible()
  await expect(page.getByText(/^Clue 1:/)).toBeVisible()
  await page.addStyleTag({
    content: '[data-testid="map-click-pulse"] { animation-duration: 5s !important; }',
  })

  const mapElement = page.locator('arcgis-map');
  await mapElement.evaluate(async element => {
    await (element as HTMLElement & { viewOnReady: () => Promise<void> }).viewOnReady();
  });
  const mapBounds = await mapElement.boundingBox();
  if (!mapBounds) throw new Error('The map is not visible.');

  await page.mouse.click(mapBounds.x + mapBounds.width * 0.95, mapBounds.y + mapBounds.height * 0.9);
  const clickPulse = page.getByTestId('map-click-pulse')
  await expect(clickPulse).toBeVisible()
  await expect.poll(() => clickPulse.evaluate(element => getComputedStyle(element).animationName)).toContain('clickPulseCore')
  await expect(page.getByText(/No field note here\. The closest remaining field note is (?:\d+ m|\d+(?:\.\d+)? km) away\./)).toBeVisible();
  const hintButton = page.getByRole('button', { name: 'Use hint (-10 points)' })
  await expect(hintButton).toHaveCount(0)
  const offTargetX = mapBounds.x + mapBounds.width * 0.95
  const offTargetY = mapBounds.y + mapBounds.height * 0.9
  await page.mouse.click(offTargetX, offTargetY)
  await expect(hintButton).toBeVisible()
  await hintButton.click()
  await expect(page.getByText(/Hint: the note is about .+ (north|northeast|east|southeast|south|southwest|west|northwest) of the clue area\. 10 points deducted\./)).toBeVisible()

  const firstClue = await page.getByText(/^Clue 1:/).textContent()
  const activeTarget = FIELD_NOTE_LOCATIONS.find(target => firstClue?.includes(target.clue))
  if (!activeTarget) throw new Error('The active clue does not match a mission location.')
  const initialCenter = await mapElement.evaluate(element => {
    const center = (element as HTMLElement & { view: { center: { x: number; y: number } } }).view.center
    return { x: center.x, y: center.y }
  })
  await page.getByRole('button', { name: 'Show clue area' }).click()
  await expect(page.getByText('You are viewing the clue area. The exact note is not marked.')).toBeVisible()
  await expect.poll(async () => mapElement.evaluate((element, original) => {
    const center = (element as HTMLElement & { view: { center: { x: number; y: number } } }).view.center
    return Math.hypot(center.x - original.x, center.y - original.y)
  }, initialCenter)).toBeGreaterThan(1000)

  const targetClickPosition = await mapElement.evaluate(async (element, target) => {
    const view = (element as HTMLElement & {
      view: {
        center: { constructor: new (properties: { x: number; y: number; spatialReference: object }) => object };
        spatialReference: object;
        goTo: (target: object, options: { zoom: number }) => Promise<unknown>;
        toScreen: (point: object) => { x: number; y: number } | null;
      };
    }).view
    const earthRadius = 6_378_137
    const targetPoint = new view.center.constructor({
      x: target.longitude * earthRadius * Math.PI / 180,
      y: earthRadius * Math.log(Math.tan((90 + target.latitude) * Math.PI / 360)),
      spatialReference: view.spatialReference,
    })
    await view.goTo(targetPoint, { zoom: 12 })
    const screenPoint = view.toScreen(targetPoint)
    if (!screenPoint) throw new Error('The selected target is not visible.')
    const bounds = element.getBoundingClientRect()
    return { x: bounds.left + screenPoint.x, y: bounds.top + screenPoint.y }
  }, { longitude: activeTarget.longitude, latitude: activeTarget.latitude })
  await page.mouse.click(targetClickPosition.x, targetClickPosition.y)
  await expect(page.getByText('1 / 3', { exact: true })).toBeVisible();
  await expect(page.getByText('90', { exact: true })).toBeVisible()
  await expect(page.getByText('Field note recovered. 2 clues remaining.')).toBeVisible();

  for (const expectedCount of [2, 3]) {
    const clueText = await page.getByText(/^Clue \d:/).textContent()
    const nextTarget = FIELD_NOTE_LOCATIONS.find(target => clueText?.includes(target.clue))
    if (!nextTarget) throw new Error('The active clue does not match a mission location.')
    const nextTargetClick = await mapElement.evaluate(async (element, target) => {
      const view = (element as HTMLElement & {
        view: {
          center: { constructor: new (properties: { x: number; y: number; spatialReference: object }) => object };
          spatialReference: object;
          goTo: (target: object, options: { zoom: number }) => Promise<unknown>;
          toScreen: (point: object) => { x: number; y: number } | null;
        };
      }).view
      const earthRadius = 6_378_137
      const targetPoint = new view.center.constructor({
        x: target.longitude * earthRadius * Math.PI / 180,
        y: earthRadius * Math.log(Math.tan((90 + target.latitude) * Math.PI / 360)),
        spatialReference: view.spatialReference,
      })
      await view.goTo(targetPoint, { zoom: 12 })
      const screenPoint = view.toScreen(targetPoint)
      if (!screenPoint) throw new Error('The selected target is not visible.')
      const bounds = element.getBoundingClientRect()
      return { x: bounds.left + screenPoint.x, y: bounds.top + screenPoint.y }
    }, { longitude: nextTarget.longitude, latitude: nextTarget.latitude })
    await page.mouse.click(nextTargetClick.x, nextTargetClick.y)
    await expect(page.getByLabel(`Field notes found: ${expectedCount} of 3`)).toBeVisible()
  }

  await expect(page.getByRole('heading', { name: 'Round summary' })).toBeVisible()
  await expect(page.getByTestId('summary-found')).toHaveText('3 / 3')
  await expect(page.getByTestId('summary-base')).toHaveText('300')
  await expect(page.getByTestId('summary-penalties')).toHaveText('-10')
  await expect(page.getByTestId('summary-time-bonus')).toHaveText(/\+\d+/)
  await expect(page.getByTestId('summary-total')).toHaveText(/\d+/)

  await page.getByRole('button', { name: 'Play again' }).click()
  await expect(page.getByText('Investigation in progress', { exact: true })).toBeVisible()
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

test('Bergen region pack selects Bergen clues and recenters the map', async ({ page }) => {
  await page.goto('./')
  const mapElement = page.locator('arcgis-map')
  await mapElement.evaluate(async element => {
    await (element as HTMLElement & { viewOnReady: () => Promise<void> }).viewOnReady()
  })
  const initialCenter = await mapElement.evaluate(element => {
    const center = (element as HTMLElement & { view: { center: { x: number; y: number } } }).view.center
    return { x: center.x, y: center.y }
  })

  await page.getByLabel('Region').selectOption('bergen')
  await expect(page.getByText('Field Investigator / Bergen / Mission 01')).toBeVisible()
  await expect.poll(async () => mapElement.evaluate((element, original) => {
    const center = (element as HTMLElement & { view: { center: { x: number; y: number } } }).view.center
    return Math.hypot(center.x - original.x, center.y - original.y)
  }, initialCenter)).toBeGreaterThan(1000)
  await page.getByRole('button', { name: 'Start investigation' }).click()
  const firstClue = await page.getByText(/^Clue 1:/).textContent()
  expect(FIELD_NOTE_LOCATION_PACKS.bergen.locations.some(target => firstClue?.includes(target.clue))).toBe(true)
})

test('tutorial teaches a miss, distance feedback, and a recovered marker', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Start tutorial' }).click()
  await expect(page.getByText(/Tutorial step 1 of 3:/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start tutorial' })).toHaveCount(0)

  const mapElement = page.locator('arcgis-map')
  await mapElement.evaluate(async element => {
    await (element as HTMLElement & { viewOnReady: () => Promise<void> }).viewOnReady()
  })
  const mapBounds = await mapElement.boundingBox()
  if (!mapBounds) throw new Error('The map is not visible.')
  await page.mouse.click(mapBounds.x + mapBounds.width * 0.95, mapBounds.y + mapBounds.height * 0.9)
  await expect(page.getByText(/Tutorial step 2 of 3: use the distance feedback/)).toBeVisible()
  await expect(page.getByText(/The closest remaining field note is/)).toBeVisible()

  const clueText = await page.getByText(/^Clue 1:/).textContent()
  const activeTarget = FIELD_NOTE_LOCATIONS.find(target => clueText?.includes(target.clue))
  if (!activeTarget) throw new Error('The tutorial clue does not match a location.')
  const targetClickPosition = await mapElement.evaluate(async (element, target) => {
    const view = (element as HTMLElement & {
      view: {
        center: { constructor: new (properties: { x: number; y: number; spatialReference: object }) => object };
        spatialReference: object;
        goTo: (target: object, options: { zoom: number }) => Promise<unknown>;
        toScreen: (point: object) => { x: number; y: number } | null;
      };
    }).view
    const earthRadius = 6_378_137
    const targetPoint = new view.center.constructor({
      x: target.longitude * earthRadius * Math.PI / 180,
      y: earthRadius * Math.log(Math.tan((90 + target.latitude) * Math.PI / 360)),
      spatialReference: view.spatialReference,
    })
    await view.goTo(targetPoint, { zoom: 12 })
    const screenPoint = view.toScreen(targetPoint)
    if (!screenPoint) throw new Error('The tutorial target is not visible.')
    const bounds = element.getBoundingClientRect()
    return { x: bounds.left + screenPoint.x, y: bounds.top + screenPoint.y }
  }, { longitude: activeTarget.longitude, latitude: activeTarget.latitude })
  await page.mouse.click(targetClickPosition.x, targetClickPosition.y)
  await expect(page.getByText('Tutorial complete: you followed a clue, used distance feedback, and recovered the marker.')).toBeVisible()
  await expect(page.getByTestId('summary-found')).toHaveText('1 / 1')
})

test('Give up reveals notes, advances clues, and finishes the round with penalties', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Start investigation' }).click()
  const giveUpButton = page.getByRole('button', { name: 'Give up and show (-50 points)' })
  await expect(giveUpButton).toBeVisible()

  await giveUpButton.click()
  await expect(page.getByText(/^Clue 2:/)).toBeVisible()
  await expect(page.getByLabel('Field notes found: 0 of 3')).toBeVisible()
  await expect(page.getByText('Note revealed. 2 clues remain. 50 points deducted.')).toBeVisible()
  await giveUpButton.click()
  await expect(page.getByText(/^Clue 3:/)).toBeVisible()
  await giveUpButton.click()

  await expect(page.getByRole('heading', { name: 'Round summary' })).toBeVisible()
  await expect(page.getByTestId('summary-found')).toHaveText('0 / 3')
  await expect(page.getByTestId('summary-given-up')).toHaveText('3')
  await expect(page.getByTestId('summary-penalties')).toHaveText('-150')
})

test('replaying selects a different set of three locations', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Start investigation' }).click()
  const giveUpButton = page.getByRole('button', { name: 'Give up and show (-50 points)' })
  const firstRoundIds: string[] = []

  for (let index = 0; index < 3; index++) {
    const clueText = await page.getByText(/^Clue \d:/).textContent()
    const target = FIELD_NOTE_LOCATIONS.find(location => clueText?.includes(location.clue))
    if (!target) throw new Error('The clue does not match a location.')
    firstRoundIds.push(target.id)
    await giveUpButton.click()
    if (index < 2) await expect(page.getByText(new RegExp(`^Clue ${index + 2}:`))).toBeVisible()
  }

  await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible()
  await page.getByRole('button', { name: 'Play again' }).click()
  const secondRoundIds: string[] = []

  for (let index = 0; index < 3; index++) {
    const clueText = await page.getByText(/^Clue \d:/).textContent()
    const target = FIELD_NOTE_LOCATIONS.find(location => clueText?.includes(location.clue))
    if (!target) throw new Error('The replay clue does not match a location.')
    secondRoundIds.push(target.id)
    await giveUpButton.click()
    if (index < 2) await expect(page.getByText(new RegExp(`^Clue ${index + 2}:`))).toBeVisible()
  }

  expect([...secondRoundIds].sort()).not.toEqual([...firstRoundIds].sort())
})

test('click pulse respects reduced-motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await page.addStyleTag({
    content: '[data-testid="map-click-pulse"], [data-testid="map-click-pulse"]::before, [data-testid="map-click-pulse"]::after { animation-play-state: paused !important; }',
  })
  await page.getByRole('button', { name: 'Start investigation' }).click()
  const mapElement = page.locator('arcgis-map')
  await mapElement.evaluate(async element => {
    await (element as HTMLElement & { viewOnReady: () => Promise<void> }).viewOnReady()
  })
  const mapBounds = await mapElement.boundingBox()
  if (!mapBounds) throw new Error('The map is not visible.')
  await page.mouse.click(mapBounds.x + mapBounds.width * 0.95, mapBounds.y + mapBounds.height * 0.9)

  const clickPulse = page.getByTestId('map-click-pulse')
  await expect(clickPulse).toBeVisible()
  const durationSeconds = await clickPulse.evaluate(element =>
    Number.parseFloat(getComputedStyle(element).animationDuration)
  )
  expect(durationSeconds).toBeLessThanOrEqual(0.001)
})

test('keyboard map controls pan and submit a map-center guess', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Start investigation' }).click()
  const mapElement = page.locator('arcgis-map')
  await mapElement.evaluate(async element => {
    await (element as HTMLElement & { viewOnReady: () => Promise<void> }).viewOnReady()
  })
  const originalCenter = await mapElement.evaluate(element => {
    const center = (element as HTMLElement & { view: { center: { x: number; y: number } } }).view.center
    return { x: center.x, y: center.y }
  })

  const panNorthButton = page.getByRole('button', { name: 'Pan map north' })
  await panNorthButton.focus()
  await page.keyboard.press('Enter')
  await expect.poll(async () => mapElement.evaluate((element, original) => {
    const center = (element as HTMLElement & { view: { center: { x: number; y: number } } }).view.center
    return Math.hypot(center.x - original.x, center.y - original.y)
  }, originalCenter)).toBeGreaterThan(1000)

  const clueText = await page.getByText(/^Clue 1:/).textContent()
  const target = FIELD_NOTE_LOCATIONS.find(item => clueText?.includes(item.clue))
  if (!target) throw new Error('The active clue does not match a location.')
  await mapElement.evaluate(async (element, location) => {
    const view = (element as HTMLElement & {
      view: {
        center: { constructor: new (properties: { x: number; y: number; spatialReference: object }) => object };
        spatialReference: object;
        goTo: (target: object, options: { zoom: number }) => Promise<unknown>;
      };
    }).view
    const earthRadius = 6_378_137
    const targetPoint = new view.center.constructor({
      x: location.longitude * earthRadius * Math.PI / 180,
      y: earthRadius * Math.log(Math.tan((90 + location.latitude) * Math.PI / 360)),
      spatialReference: view.spatialReference,
    })
    await view.goTo(targetPoint, { zoom: 12 })
  }, { longitude: target.longitude, latitude: target.latitude })

  const checkCenterButton = page.getByRole('button', { name: 'Check map center' })
  await checkCenterButton.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Field notes found: 1 of 3')).toBeVisible()
})

test('mission controls remain reachable on a short narrow viewport at high zoom', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 600 })
  await page.goto('./')
  const mapElement = page.locator('arcgis-map')
  await mapElement.evaluate(async element => {
    await (element as HTMLElement & { viewOnReady: () => Promise<void> }).viewOnReady()
    await (element as HTMLElement & { view: { goTo: (target: object) => Promise<unknown> } }).view.goTo({ zoom: 18 })
  })

  const missionPanel = page.getByRole('region', { name: 'The missing field notes' })
  const bounds = await missionPanel.boundingBox()
  if (!bounds) throw new Error('The mission panel is not visible.')
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(600)

  const overflowY = await missionPanel.evaluate(element => getComputedStyle(element).overflowY)
  expect(overflowY).toBe('auto')
  await missionPanel.evaluate(element => { element.scrollTop = element.scrollHeight })
  await expect(page.getByRole('button', { name: 'Start investigation' })).toBeInViewport()
})