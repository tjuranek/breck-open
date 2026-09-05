# Breck Open (Expo)

Native client for the live Worker at `https://breck-open.krux-lab.workers.dev`. Same rooms, scoring, and points as the web app. **Expo Go only — no App Store / Play Store submit.**

## Share with buddies today

1. Install **Expo Go** from the [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent). It must be the **SDK 54** Expo Go (the store build as of this weekend). SDK 55+ Expo Go is not required and may not be on stores yet.
2. On a laptop on the same weekend wifi — or any network, using tunnel:

```bash
cd apps/mobile
npm install
npx expo start --tunnel
```

3. Scan the QR code with Expo Go (Android) or the Camera app (iOS).
4. First launch asks for location (“Yards to the green while you score”), then the system prompt. Deny still scores; yards stay off.
5. Create a room or paste a room code / web invite. Host starts. Score holes. Leaderboard polls the live Worker.

`EXPO_PUBLIC_API_URL` overrides the Worker (default `https://breck-open.krux-lab.workers.dev`).

```bash
npm run typecheck
```

React Native does not enforce CORS. No Worker deploy is required for Expo Go.
