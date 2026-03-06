# onboard slice (react + vite + capacitor)

## setup

```bash
bun install
cd backend && bun install
```

## backend dev

```bash
cd backend
cp .env.example .env
bun run auth:migrate
bun run dev
```

## web dev

```bash
cp .env.example .env
bun run dev
```

## iOS

```bash
bun run ios:open
```

This builds the web app, syncs Capacitor, and opens the Xcode project.

## notes

- The onboarding flow is four steps: welcome -> name -> timetable import -> account details.
- Name input drives deterministic avatar generation via local facehash utilities.
- Timetable import endpoints and Better Auth run from `onboard/backend`.
