# onboard slice (react + vite + capacitor)

## setup

```bash
bun install
```

## web dev

```bash
bun run dev
```

## iOS

```bash
bun run ios:open
```

This builds the web app, syncs Capacitor, and opens the Xcode project.

## notes

- The flow is intentionally two steps: welcome -> name input.
- Name input drives live deterministic avatar generation via local facehash utilities.
