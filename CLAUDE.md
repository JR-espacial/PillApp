# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on port 3000 (0.0.0.0)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # TypeScript type checking (tsc --noEmit)
npm run clean     # Remove dist/
```

No test framework is configured.

## Environment

Copy `.env.example` to `.env` and set:
- `GEMINI_API_KEY` — Google Gemini API key (passed to client via Vite's `loadEnv`)
- `DISABLE_HMR` — Set to any value to disable Vite HMR

## Architecture

**Monolithic single-file UI**: All screens and components live in `src/App.tsx`. There is no routing library — navigation is handled by a `currentScreen` state variable (`'home' | 'meds' | 'history' | 'add'`). Screen transitions use Framer Motion's `AnimatePresence`.

**No backend or real data**: All data comes from mock constants in `src/constants.ts`. The `@google/genai` and `express` packages are present as dependencies for a planned Gemini AI backend, but no server exists yet.

**State**: React `useState` only, lifted to `App`. No global state manager (no Redux, Zustand, or Context).

**Styling**: Tailwind CSS v4 with a custom Material Design 3 theme defined via `@theme` in `src/index.css`. Colors use MD3 naming (`primary`, `secondary`, `tertiary`, `surface`, etc.).

**Key files**:
- `src/types.ts` — `Medication`, `Dose`, `HistoryItem` interfaces
- `src/constants.ts` — Mock data (`INITIAL_MEDICATIONS`, `TODAY_DOSES`, `HISTORY`)
- `src/App.tsx` — All UI: `HomeScreen`, `MedsScreen`, `HistoryScreen`, `AddMedScreen`, `NavButton`
- `vite.config.ts` — Exposes env vars to client and sets dev port to 3000
