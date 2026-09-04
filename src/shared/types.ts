export const NINES = ["bear", "beaver", "elk"] as const;
export const TEES = ["gold", "blue", "green", "silver", "red"] as const;

export type Nine = (typeof NINES)[number];
export type Tee = (typeof TEES)[number];
export type GameStatus = "lobby" | "scoring" | "finished";

export type HoleScore = {
  hole: number;
  strokes: number;
  fir: boolean | null;
  gir: boolean;
  threePutt: boolean;
};

export type Player = {
  id: string;
  name: string;
};

export type PointsBreakdown = {
  placement: number;
  birdies: number;
  eagles: number;
  firBonus: number;
  girBonus: number;
  threePutts: number;
  total: number;
};

export type LeaderboardRow = {
  playerId: string;
  name: string;
  holesSubmitted: number;
  strokes: number;
  toPar: number | null;
  complete: boolean;
  points: PointsBreakdown;
};

export type GameState = {
  id: string;
  name: string;
  nine: Nine;
  tee: Tee;
  hostId: string;
  status: GameStatus;
  players: Player[];
  scores: Record<string, HoleScore[]>;
  leaderboard: LeaderboardRow[];
};

export type CreateGameInput = {
  name: string;
  playerName: string;
  playerId: string;
  nine: Nine;
  tee: Tee;
};

export type JoinGameInput = {
  playerName: string;
  playerId: string;
};

export type SaveHoleInput = {
  playerId: string;
  hole: number;
  strokes: number;
  fir: boolean | null;
  gir: boolean;
  threePutt: boolean;
};
