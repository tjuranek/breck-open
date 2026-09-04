import { DurableObject } from "cloudflare:workers";
import { firApplies, getHole, isNine, isTee } from "../src/shared/course.ts";
import { withLeaderboard } from "../src/shared/points.ts";
import type {
  CreateGameInput,
  GameState,
  HoleScore,
  JoinGameInput,
  Player,
  SaveHoleInput,
} from "../src/shared/types.ts";

type Stored = Omit<GameState, "leaderboard">;

const MAX_PLAYERS = 4;
const MAX_NAME = 24;

function trimName(name: string): string {
  const n = name.trim().replace(/\s+/g, " ");
  if (!n) throw new Error("Name is required");
  if (n.length > MAX_NAME) throw new Error(`Name must be ${MAX_NAME} characters or fewer`);
  return n;
}

function view(game: Stored): GameState {
  return withLeaderboard(game);
}

export class GameRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS game_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          json TEXT NOT NULL
        )
      `);
    });
  }

  private load(): Stored | null {
    const row = this.ctx.storage.sql
      .exec<{ json: string }>("SELECT json FROM game_state WHERE id = 1")
      .toArray()[0];
    return row ? (JSON.parse(row.json) as Stored) : null;
  }

  private save(game: Stored): GameState {
    this.ctx.storage.sql.exec(
      "INSERT INTO game_state (id, json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json",
      JSON.stringify(game),
    );
    return view(game);
  }

  private require(): Stored {
    const game = this.load();
    if (!game) throw new Error("Game not found");
    return game;
  }

  async getState(): Promise<GameState | null> {
    const game = this.load();
    return game ? view(game) : null;
  }

  async create(input: CreateGameInput & { id: string }): Promise<GameState> {
    if (this.load()) throw new Error("Game already exists");
    if (!isNine(input.nine)) throw new Error("Pick Bear, Beaver, or Elk");
    if (!isTee(input.tee)) throw new Error("Pick a tee");
    const playerId = input.playerId.trim();
    if (!playerId) throw new Error("Player id is required");
    const player: Player = { id: playerId, name: trimName(input.playerName) };
    const name = input.name.trim() || "Breck Open";
    return this.save({
      id: input.id,
      name,
      nine: input.nine,
      tee: input.tee,
      hostId: player.id,
      status: "lobby",
      players: [player],
      scores: { [player.id]: [] },
    });
  }

  async join(input: JoinGameInput): Promise<GameState> {
    const game = this.require();
    const playerId = input.playerId.trim();
    if (!playerId) throw new Error("Player id is required");
    const existing = game.players.find((p) => p.id === playerId);
    if (existing) return view(game);
    if (game.status !== "lobby") throw new Error("Round already started");
    if (game.players.length >= MAX_PLAYERS) throw new Error("Room is full (4)");
    game.players.push({ id: playerId, name: trimName(input.playerName) });
    game.scores[playerId] = [];
    return this.save(game);
  }

  async start(playerId: string): Promise<GameState> {
    const game = this.require();
    if (playerId !== game.hostId) throw new Error("Only the host can start");
    if (game.status !== "lobby") return view(game);
    if (game.players.length < 1) throw new Error("Need at least one player");
    game.status = "scoring";
    return this.save(game);
  }

  async saveHole(input: SaveHoleInput): Promise<GameState> {
    const game = this.require();
    if (game.status === "lobby") throw new Error("Round has not started");
    if (game.status === "finished") throw new Error("Round is locked");
    const player = game.players.find((p) => p.id === input.playerId);
    if (!player) throw new Error("You are not in this room");
    if (input.hole < 1 || input.hole > 9) throw new Error("Hole must be 1–9");
    if (!Number.isInteger(input.strokes) || input.strokes < 1 || input.strokes > 15) {
      throw new Error("Strokes must be 1–15");
    }

    const def = getHole(game.nine, input.hole);
    const next: HoleScore = {
      hole: input.hole,
      strokes: input.strokes,
      fir: firApplies(def.par) ? Boolean(input.fir) : null,
      gir: Boolean(input.gir),
      threePutt: Boolean(input.threePutt),
    };

    const list = (game.scores[player.id] ?? []).filter((h) => h.hole !== input.hole);
    list.push(next);
    list.sort((a, b) => a.hole - b.hole);
    game.scores[player.id] = list;

    const allIn = game.players.every((p) => (game.scores[p.id]?.length ?? 0) === 9);
    if (allIn) game.status = "finished";
    return this.save(game);
  }
}
