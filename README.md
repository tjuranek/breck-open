# Breck Open

Weekend tournament scorer for Thomas, Dad, Scott, and Noah at **Breckenridge Golf Club** (Bear / Beaver / Elk nines).

One Cloudflare Worker + Vite React SPA. Each room is a SQLite-backed Durable Object. Anonymous name + `localStorage` player id. No accounts.

## Play this weekend

1. Open the app and tap **Create game** (default name is Breck Open).
2. Enter your name, pick the **nine** and **tee**.
3. In the lobby, tap **Copy invite link** and send it to the group (up to 4).
4. Host taps **Start round** when everyone is in.
5. Score hole-by-hole: strokes, FIR (par 4/5 only), GIR, 3-putt. **Save / Next hole**. Earlier holes stay editable until everyone has all 9 in.
6. **Board** is available anytime: stroke totals + running points (bonuses on submitted holes; placement points only after the field finishes).
7. When all 9s are in, the end screen shows the final leaderboard and points breakdown.

## Points (per 9)

- Lowest strokes: **+3**. Sole second: **+1**.
- Tie for first: each **+3**, no second. Tie for second: each **+1** only if there is a sole first.
- Birdie **+1**. Eagle or better **+3**.
- 4+ FIR **+1** (FIR does not count on par 3s).
- 3+ GIR **+1**.
- Each 3-putt **−1**.

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
pnpm deploy
```

or `npx wrangler deploy` after `pnpm build`. Worker name: `breck-open`. Uses a `workers.dev` URL.

Requires Cloudflare auth (`npx wrangler login` / `wrangler whoami`).
