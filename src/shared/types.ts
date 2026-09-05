export const NINES = ["bear", "beaver", "elk"] as const;
export const TEES = ["gold", "blue", "green", "silver", "red"] as const;

export type Nine = (typeof NINES)[number];
export type Tee = (typeof TEES)[number];
export type Format = 9 | 18;
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

export type NineStats = {
  nine: Nine;
  holesSubmitted: number;
  strokes: number;
  toPar: number | null;
  complete: boolean;
  fieldComplete: boolean;
  firCount: number;
  girCount: number;
  threePuttCount: number;
  points: PointsBreakdown;
};

export type LeaderboardRow = {
  playerId: string;
  name: string;
  holesSubmitted: number;
  strokes: number;
  toPar: number | null;
  complete: boolean;
  points: PointsBreakdown;
  nines: NineStats[];
};

export type PastRound = {
  index: number;
  nines: Nine[];
  tee: Tee;
  scores: Record<string, HoleScore[]>;
};

export type EventStanding = {
  playerId: string;
  name: string;
  points: number;
  rounds: { index: number; points: number }[];
};

export type GameState = {
  id: string;
  name: string;
  nines: Nine[];
  tee: Tee;
  hostId: string;
  status: GameStatus;
  players: Player[];
  scores: Record<string, HoleScore[]>;
  leaderboard: LeaderboardRow[];
  roundIndex: number;
  pastRounds: PastRound[];
  eventStandings: EventStanding[];
};

export type RoundSetupInput = {
  nines: Nine[];
  tee: Tee;
};

export type CreateGameInput = {
  name: string;
  playerName: string;
  playerId: string;
  nines: Nine[];
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

export type NextRoundInput = {
  playerId: string;
  nines: Nine[];
  tee: Tee;
};
