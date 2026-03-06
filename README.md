# CS07 Monorepo

A mobile-first timetable Tamagotchi app. Import your university timetable via an iCal link and view or add events on your phone. Your Tamagotchi will grow and evolve based on your attendance and assignment performance.

## Structure

- `packages/backend/` —  base backend for the app
- `packages/icalapp/backend/` — iCal prototype REST API (Bun + Elysia + SQLite)
- `apps/icalapp/mobile/` — iCal prototype mobile app (React + Vite + Capacitor)

## Quick start

See [docs/beta/setup.md](docs/beta/setup.md) for full setup instructions.
