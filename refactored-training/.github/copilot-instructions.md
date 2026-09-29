# Project Instructions

## Project
- This is a React 19, TypeScript, and Vite application. Keep changes compatible with the existing TypeScript configuration and React Router setup.
- Application code lives in `src/`. Feature UI is generally grouped into its own directory, with a `.tsx` component and a CSS module. Shared UI belongs under `src/components/`; API helpers belong under `src/api/`.
- Reuse the existing dependencies and local patterns. Check nearby components before introducing a new abstraction or package.

## UI and styling
- Use CSS modules for feature and component styles. Global styles and shared design tokens live in `src/index.css`; app-wide layout styles live in `src/App.css`.
- Preserve the existing light/dark theme behavior and use the established CSS variables for colors, surfaces, spacing, shadows, and motion where applicable.
- Keep layouts responsive and interactive controls accessible, including labels, keyboard behavior, and visible focus states.

## Changes and verification
- Keep changes scoped to the requested behavior and preserve existing public component and route behavior unless the task requires otherwise.
- Use the existing scripts to verify changes: `npm run lint` and `npm run build`.
- Run `npm test` for the Vitest unit suite and `npm run test:e2e` for Playwright browser checks. Focused unit tests live alongside source files as `*.test.ts`.
- Do not add dependencies, generated files, or unrelated refactors unless they are needed for the request.
