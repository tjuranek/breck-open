# Breck Open

Weekend tournament scorer for Thomas, Dad, Scott, and Noah at **Breckenridge Golf Club** (Bear / Beaver / Elk nines).

Cloudflare Worker + Durable Object rooms, plus two clients that share the same API:

- **Expo app (primary for today)** — `apps/mobile`, SDK 54, open in Expo Go. No App Store / Play Store publish.
- **Web PWA** — still at `https://breck-open.krux-lab.workers.dev` if someone prefers the browser.

Anonymous name + local player id. No accounts.

## Play on iPhone / Android today (Expo Go)

Same-day buddy testing. No UDID list, no TestFlight, no store submit.

1. Install **Expo Go** from the [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent). Use the store Expo Go that speaks **SDK 54** (do not bump this app to SDK 55+ until Expo Go on the stores catches up).
2. On a laptop:

```bash
cd apps/mobile
npm install
npx expo start --tunnel
```

`pnpm mobile` from the repo root is the same (`npm --prefix apps/mobile start`).

3. Share the terminal QR. **iPhone:** Camera → Open in Expo Go. **Android:** Expo Go → Scan QR.
4. First launch is one screen: *Yards to the green while you score* → **Continue** shows the system location prompt. **Not now** (or deny) still plays; the hole screen shows a green pin and “location off.”
5. Create a room or paste a web invite / room code. Host taps **Start round**. Score strokes + FIR / GIR / 3-putt. Big **yds** is device GPS → haversine to the hardcoded green centers. **Next** / **Leaderboard** stay sticky.

The Expo client talks to `https://breck-open.krux-lab.workers.dev`. Override with `EXPO_PUBLIC_API_URL` if you point at a local Worker.

React Native fetch does not use browser CORS, so **no Worker CORS change or redeploy is required** for Expo Go. If you later open this client on web, the Worker would need `Access-Control-Allow-Origin` for that origin.

```bash
npm --prefix apps/mobile run typecheck
```

## Web PWA (optional)

Android Chrome: tap **Install app** on the home or lobby screen when the browser offers it.

iOS Safari: tap Share → **Add to Home Screen**. The app opens standalone (no Safari chrome) with the dark status bar.

Offline, the shell reopens. Live scores still need a network — the app will not invent numbers.

## Play this weekend

1. Open the app and tap **Create game** (default name is Breck Open).
2. Enter your name. Toggle **Nine** or **Eighteen**. For 18, pick two nines in order (e.g. Bear then Beaver) and a tee.
3. In the lobby, tap **Copy invite link** and send it to the group (up to 4). Same link / same player id is used all weekend.
4. Host taps **Start round** when everyone is in.
5. Score hole-by-hole: strokes, FIR (par 4/5 only), GIR, 3-putt. **Save / Next hole**. 18 is one room — holes 1–9 then 10–18. The hole screen shows **yards to green** from device GPS (green pin if location is off). The web PWA still has the satellite map; Expo Go v1 skips Mapbox to stay light.
6. **Board** anytime: sticky live thru / to-par / FIR / GIR / 3-putts (bonus targets fill live). Audit stack under that. Placement locks per nine when that nine is in.
7. When the round is in, the end screen shows per-nine and combined points. Host can **Start next round** on the same invite (reuse setup or pick again). Lobby tabs are **Today / Tomorrow** (or Round 1 / 2). Tap a tab to open that nine/18. A thin weekend points strip sits under the tabs. Each scorecard stays on its own screen.

## Points (per 9)

- Lowest strokes: **+3**. Sole second: **+1**.
- Tie for first: each **+3**, no second. Tie for second: each **+1** only if there is a sole first.
- Birdie **+1**. Eagle or better **+3**.
- 4+ FIR **+1** (FIR does not count on par 3s).
- 3+ GIR **+1**.
- Each 3-putt **−1**.

An 18 is two nines: placement and FIR/GIR bonuses are scored on each nine, then added.

Course yardages are BlueGolf numbers, hardcoded per nine and tee. Each nine is par 36.

## Dev

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm dev
cd apps/mobile && npm install && npm run typecheck
```

`pnpm dev` serves the SPA and `/api/*` through the Worker + Durable Object.

The Expo app is a separate npm package (`apps/mobile`) so its React 19.1 / RN 0.81 pins do not collide with the Vite app. It imports `src/shared` (course, points, green centers) through Metro.

## Deploy

```bash
CLOUDFLARE_ACCOUNT_ID=29c5317bd80c73f5faa2d9decc341fa3 pnpm deploy
```

Worker name: `breck-open`. workers.dev: `https://breck-open.krux-lab.workers.dev`.

Requires `CLOUDFLARE_API_TOKEN` or `npx wrangler login`.
