# Breck Open

Weekend tournament scorer for Thomas, Dad, Scott, and Noah at **Breckenridge Golf Club** (Bear / Beaver / Elk nines).

One Cloudflare Worker + Vite React SPA. Each room is a SQLite-backed Durable Object. Anonymous name + `localStorage` player id. No accounts.

## Play this weekend

1. Open the app and tap **Create game** (default name is Breck Open).
2. Enter your name. Toggle **Nine** or **Eighteen**. For 18, pick two nines in order (e.g. Bear then Beaver) and a tee.
3. In the lobby, tap **Copy invite link** and send it to the group (up to 4). Same link / same player id is used all weekend.
4. Host taps **Start round** when everyone is in.
5. Score hole-by-hole: strokes, FIR (par 4/5 only), GIR, 3-putt. **Save / Next hole**. 18 is one room — holes 1–9 then 10–18.
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
```

`pnpm dev` serves the SPA and `/api/*` through the Worker + Durable Object.

## Deploy

```bash
CLOUDFLARE_ACCOUNT_ID=29c5317bd80c73f5faa2d9decc341fa3 pnpm deploy
```

Worker name: `breck-open`. workers.dev: `https://breck-open.krux-lab.workers.dev`.

Requires `CLOUDFLARE_API_TOKEN` or `npx wrangler login`.
