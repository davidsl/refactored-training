# Refactored Training

A React, TypeScript, and Vite application with an ArcGIS map, Minesweeper, a leaderboard, and several interactive demos and games.

## Requirements

- Node.js 22.19 or newer (required by the local HTTPS certificate plugin)
- npm

## Start locally

```sh
npm ci
npm run dev
```

Open the HTTPS URL printed by Vite. The development server uses `vite-plugin-mkcert` to create a locally trusted certificate. On first start, allow the plugin to install its local certificate authority. If the browser still reports a certificate warning, check the Vite output and confirm the local CA is trusted by the current user.

## API configuration

The leaderboard and Minesweeper results use the `GameResults` API. By default, requests go to the same origin. To use a separate backend, create `.env.local` in the project root:

```dotenv
VITE_API_BASE_URL=https://localhost:7164
```

The backend must be running and its HTTPS certificate trusted by the browser. If it is unavailable, the leaderboard shows a retry action and game-result requests surface an error alert.

## Routes

- `/` - ArcGIS map with address/place search, location, and layer controls
- `/about` - About page
- `/game` - Minesweeper and custom board settings
- `/leaderboard` - Wins, statistics, and board categories
- `/clicking-game` - Serotonin Farm
- `/spy-game` - Top Secret Spies
- `/table` - Reusable table demo
- `/styling-examples` - Component and motion examples

## Checks

```sh
npm test
npm run test:e2e
npm run lint
npm run build
```

The unit suite uses Vitest. End-to-end checks use Playwright and start their own Vite server on port `5180`. Install Chromium once if needed:

```sh
npx playwright install chromium
```

## Build and deployment

```sh
npm run build
npm run preview
```

The build is configured for deployment under `/refactored-training/`. If deploying at a different path, update `base` in `vite.config.ts` and ensure the host serves the app's fallback page for client-side routes.
