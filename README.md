# DDD Timetable

A mobile-first iCal timetable app. Import your university timetable via an iCal link and view or add events on your phone.

## Structure

- `icalapp/backend/` — REST API (Bun + Elysia + SQLite)
- `icalapp/mobile/` — Mobile app (React + Vite + Capacitor)

## Quick start

See [docs/alpha/setup.md](docs/alpha/setup.md) for full setup instructions.

### Backend

```sh
cd icalapp/backend
cp .env.example .env
bun install
bun run dev
```

### Mobile (web preview)

```sh
cd icalapp/mobile
cp .env.example .env
bun install
bun run dev
```

### Mobile (Android)

```sh
cd icalapp/mobile
bun run android:open
```

Then build and run from Android Studio.

### Mobile (iOS)

```sh
cd icalapp/mobile
bun run ios:open
```

Then build and run from Xcode.
