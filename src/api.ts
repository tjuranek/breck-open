import type {
  CreateGameInput,
  GameState,
  JoinGameInput,
  SaveHoleInput,
} from "./shared/types.ts";

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

export function createGame(input: CreateGameInput): Promise<GameState> {
  return fetch("/api/games", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => parse<GameState>(r));
}

export function getGame(id: string): Promise<GameState> {
  return fetch(`/api/games/${id}`).then((r) => parse<GameState>(r));
}

export function joinGame(id: string, input: JoinGameInput): Promise<GameState> {
  return fetch(`/api/games/${id}/join`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => parse<GameState>(r));
}

export function startGame(id: string, playerId: string): Promise<GameState> {
  return fetch(`/api/games/${id}/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ playerId }),
  }).then((r) => parse<GameState>(r));
}

export function saveHole(id: string, input: SaveHoleInput): Promise<GameState> {
  return fetch(`/api/games/${id}/holes/${input.hole}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => parse<GameState>(r));
}
