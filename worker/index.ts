import type { CreateGameInput, JoinGameInput, SaveHoleInput } from "../src/shared/types.ts";
import { GameRoom } from "./game-room.ts";

export { GameRoom };

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function roomId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function stub(env: Env, id: string) {
  return env.GAME_ROOMS.getByName(id);
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === "POST" && path === "/api/games") {
    const body = (await request.json()) as CreateGameInput;
    const id = roomId();
    const state = await stub(env, id).create({ ...body, id });
    return json(state, 201);
  }

  const match = path.match(/^\/api\/games\/([^/]+)(?:\/(join|start|holes\/(\d+)))?$/);
  if (!match) return json({ error: "Not found" }, 404);

  const id = match[1]!;
  const action = match[2];
  const hole = match[3];
  const room = stub(env, id);

  if (method === "GET" && !action) {
    const state = await room.getState();
    if (!state) return json({ error: "Game not found" }, 404);
    return json(state);
  }

  if (method === "POST" && action === "join") {
    const body = (await request.json()) as JoinGameInput;
    return json(await room.join(body));
  }

  if (method === "POST" && action === "start") {
    const body = (await request.json()) as { playerId: string };
    return json(await room.start(body.playerId));
  }

  if (method === "PUT" && hole) {
    const body = (await request.json()) as Omit<SaveHoleInput, "hole">;
    return json(
      await room.saveHole({
        ...body,
        hole: Number(hole),
      }),
    );
  }

  return json({ error: "Not found" }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleApi(request, env);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      const status = message === "Game not found" ? 404 : 400;
      return json({ error: message }, status);
    }
  },
};
