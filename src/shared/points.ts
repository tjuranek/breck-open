import { firApplies, getHole } from "./course.ts";
import type {
  GameState,
  HoleScore,
  LeaderboardRow,
  Nine,
  Player,
  PointsBreakdown,
} from "./types.ts";

export function countedFir(par: number, fir: boolean | null): boolean {
  return firApplies(par) && fir === true;
}

export function holeAwards(strokes: number, par: number): { birdies: number; eagles: number } {
  const rel = strokes - par;
  if (rel <= -2) return { birdies: 0, eagles: 3 };
  if (rel === -1) return { birdies: 1, eagles: 0 };
  return { birdies: 0, eagles: 0 };
}

export function bonusFromScores(
  scores: HoleScore[],
  nine: Nine,
): Omit<PointsBreakdown, "placement" | "total"> & { firCount: number; girCount: number } {
  let birdies = 0;
  let eagles = 0;
  let firCount = 0;
  let girCount = 0;
  let threePutts = 0;

  for (const score of scores) {
    const hole = getHole(nine, score.hole);
    const awards = holeAwards(score.strokes, hole.par);
    birdies += awards.birdies;
    eagles += awards.eagles;
    if (countedFir(hole.par, score.fir)) firCount += 1;
    if (score.gir) girCount += 1;
    if (score.threePutt) threePutts += 1;
  }

  return {
    birdies,
    eagles,
    firBonus: firCount >= 4 ? 1 : 0,
    girBonus: girCount >= 3 ? 1 : 0,
    threePutts: -threePutts,
    firCount,
    girCount,
  };
}

export function placementPoints(
  finished: { playerId: string; strokes: number }[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of finished) out[row.playerId] = 0;
  if (finished.length === 0) return out;

  const sorted = [...finished].sort((a, b) => a.strokes - b.strokes);
  const firstStrokes = sorted[0]!.strokes;
  const firsts = sorted.filter((r) => r.strokes === firstStrokes);
  for (const row of firsts) out[row.playerId] = 3;
  if (firsts.length > 1) return out;

  const rest = sorted.filter((r) => r.strokes !== firstStrokes);
  if (rest.length === 0) return out;
  const secondStrokes = rest[0]!.strokes;
  for (const row of rest) {
    if (row.strokes === secondStrokes) out[row.playerId] = 1;
  }
  return out;
}

function totalOf(b: Omit<PointsBreakdown, "total">): number {
  return b.placement + b.birdies + b.eagles + b.firBonus + b.girBonus + b.threePutts;
}

export function buildLeaderboard(
  players: Player[],
  scores: Record<string, HoleScore[]>,
  nine: Nine,
): LeaderboardRow[] {
  const allFinished =
    players.length > 0 && players.every((p) => (scores[p.id]?.length ?? 0) === 9);

  const finished = allFinished
    ? players.map((p) => ({
        playerId: p.id,
        strokes: (scores[p.id] ?? []).reduce((sum, h) => sum + h.strokes, 0),
      }))
    : [];
  const place = placementPoints(finished);

  const rows: LeaderboardRow[] = players.map((p) => {
    const submitted = [...(scores[p.id] ?? [])].sort((a, b) => a.hole - b.hole);
    const strokes = submitted.reduce((sum, h) => sum + h.strokes, 0);
    let toPar: number | null = null;
    if (submitted.length > 0) {
      toPar = submitted.reduce((sum, h) => sum + (h.strokes - getHole(nine, h.hole).par), 0);
    }
    const bonus = bonusFromScores(submitted, nine);
    const points: PointsBreakdown = {
      placement: place[p.id] ?? 0,
      birdies: bonus.birdies,
      eagles: bonus.eagles,
      firBonus: bonus.firBonus,
      girBonus: bonus.girBonus,
      threePutts: bonus.threePutts,
      total: 0,
    };
    points.total = totalOf(points);
    return {
      playerId: p.id,
      name: p.name,
      holesSubmitted: submitted.length,
      strokes,
      toPar,
      complete: submitted.length === 9,
      points,
    };
  });

  rows.sort((a, b) => {
    if (b.points.total !== a.points.total) return b.points.total - a.points.total;
    if (a.holesSubmitted !== b.holesSubmitted) return b.holesSubmitted - a.holesSubmitted;
    if (a.toPar !== b.toPar) {
      if (a.toPar === null) return 1;
      if (b.toPar === null) return -1;
      return a.toPar - b.toPar;
    }
    return a.name.localeCompare(b.name);
  });

  return rows;
}

export function withLeaderboard(
  game: Omit<GameState, "leaderboard"> & { leaderboard?: LeaderboardRow[] },
): GameState {
  return {
    ...game,
    leaderboard: buildLeaderboard(game.players, game.scores, game.nine),
  };
}
