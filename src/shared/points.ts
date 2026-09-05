import { COURSE, firApplies, getHole, holeCountOf } from "./course.ts";
import type {
  EventStanding,
  GameState,
  HoleScore,
  LeaderboardRow,
  Nine,
  NineStats,
  PastRound,
  Player,
  PointsBreakdown,
} from "./types.ts";

export const FIR_BONUS_AT = 4;
export const GIR_BONUS_AT = 3;

export function countedFir(par: number, fir: boolean | null): boolean {
  return firApplies(par) && fir === true;
}

export function holeAwards(strokes: number, par: number): { birdies: number; eagles: number } {
  const rel = strokes - par;
  if (rel <= -2) return { birdies: 0, eagles: 3 };
  if (rel === -1) return { birdies: 1, eagles: 0 };
  return { birdies: 0, eagles: 0 };
}

export function holeDelta(score: HoleScore, par: number): number {
  const awards = holeAwards(score.strokes, par);
  return awards.birdies + awards.eagles + (score.threePutt ? -1 : 0);
}

export function holeMark(strokes: number, par: number): string {
  const rel = strokes - par;
  if (rel <= -3) return "albatross";
  if (rel === -2) return "eagle";
  if (rel === -1) return "birdie";
  if (rel === 0) return "par";
  if (rel === 1) return "bogey";
  return `+${rel}`;
}

export function nineSlice(scores: HoleScore[], nineIndex: number): HoleScore[] {
  const offset = nineIndex * 9;
  return scores
    .filter((s) => s.hole > offset && s.hole <= offset + 9)
    .map((s) => ({ ...s, hole: s.hole - offset }));
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
    firBonus: firCount >= FIR_BONUS_AT ? 1 : 0,
    girBonus: girCount >= GIR_BONUS_AT ? 1 : 0,
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

function emptyPoints(): PointsBreakdown {
  return {
    placement: 0,
    birdies: 0,
    eagles: 0,
    firBonus: 0,
    girBonus: 0,
    threePutts: 0,
    total: 0,
  };
}

export function totalOf(b: Omit<PointsBreakdown, "total">): number {
  return b.placement + b.birdies + b.eagles + b.firBonus + b.girBonus + b.threePutts;
}

export function addBreakdown(a: PointsBreakdown, b: PointsBreakdown): PointsBreakdown {
  const next: PointsBreakdown = {
    placement: a.placement + b.placement,
    birdies: a.birdies + b.birdies,
    eagles: a.eagles + b.eagles,
    firBonus: a.firBonus + b.firBonus,
    girBonus: a.girBonus + b.girBonus,
    threePutts: a.threePutts + b.threePutts,
    total: 0,
  };
  next.total = totalOf(next);
  return next;
}

function scoringPlayers(players: Player[], scores: Record<string, HoleScore[]>): Player[] {
  return players.filter((p) => Object.hasOwn(scores, p.id));
}

export function buildLeaderboard(
  players: Player[],
  scores: Record<string, HoleScore[]>,
  nines: Nine[],
): LeaderboardRow[] {
  const field = scoringPlayers(players, scores);
  const holeCount = holeCountOf(nines);

  const placeByNine = nines.map((_nine, i) => {
    const allFinished = field.length > 0 && field.every((p) => nineSlice(scores[p.id] ?? [], i).length === 9);
    const finished = allFinished
      ? field.map((p) => ({
          playerId: p.id,
          strokes: nineSlice(scores[p.id] ?? [], i).reduce((sum, h) => sum + h.strokes, 0),
        }))
      : [];
    return { fieldComplete: allFinished, place: placementPoints(finished) };
  });

  const rows: LeaderboardRow[] = field.map((p) => {
    const submitted = [...(scores[p.id] ?? [])].sort((a, b) => a.hole - b.hole);
    const nineStats: NineStats[] = nines.map((nine, i) => {
      const slice = nineSlice(submitted, i);
      const strokes = slice.reduce((sum, h) => sum + h.strokes, 0);
      let toPar: number | null = null;
      if (slice.length > 0) {
        toPar = slice.reduce((sum, h) => sum + (h.strokes - getHole(nine, h.hole).par), 0);
      }
      const bonus = bonusFromScores(slice, nine);
      const points: PointsBreakdown = {
        placement: placeByNine[i]!.place[p.id] ?? 0,
        birdies: bonus.birdies,
        eagles: bonus.eagles,
        firBonus: bonus.firBonus,
        girBonus: bonus.girBonus,
        threePutts: bonus.threePutts,
        total: 0,
      };
      points.total = totalOf(points);
      return {
        nine,
        holesSubmitted: slice.length,
        strokes,
        toPar,
        complete: slice.length === 9,
        fieldComplete: placeByNine[i]!.fieldComplete,
        firCount: bonus.firCount,
        girCount: bonus.girCount,
        threePuttCount: -bonus.threePutts,
        points,
      };
    });

    const points = nineStats.reduce((sum, n) => addBreakdown(sum, n.points), emptyPoints());
    let toPar: number | null = null;
    if (submitted.length > 0) {
      toPar = nineStats.reduce((sum, n) => sum + (n.toPar ?? 0), 0);
    }

    return {
      playerId: p.id,
      name: p.name,
      holesSubmitted: submitted.length,
      strokes: submitted.reduce((sum, h) => sum + h.strokes, 0),
      toPar,
      complete: submitted.length === holeCount,
      points,
      nines: nineStats,
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

export function headerFocus(nines: NineStats[]): NineStats[] {
  const open = nines.filter((n) => !n.fieldComplete);
  if (open.length === 0) return nines;
  const started = open.filter((n) => n.holesSubmitted > 0);
  return started.length > 0 ? started : open.slice(0, 1);
}

export type HeaderStats = {
  thru: number;
  toPar: number | null;
  firCount: number;
  firTarget: number;
  girCount: number;
  girTarget: number;
  threePutts: number;
  labels: string[];
};

export function headerStats(row: LeaderboardRow): HeaderStats {
  const focus = headerFocus(row.nines);
  return {
    thru: row.holesSubmitted,
    toPar: row.toPar,
    firCount: focus.reduce((sum, n) => sum + n.firCount, 0),
    firTarget: FIR_BONUS_AT * Math.max(focus.length, 1),
    girCount: focus.reduce((sum, n) => sum + n.girCount, 0),
    girTarget: GIR_BONUS_AT * Math.max(focus.length, 1),
    threePutts: row.nines.reduce((sum, n) => sum + n.threePuttCount, 0),
    labels: focus.map((n) => COURSE[n.nine].label),
  };
}

export function buildEventStandings(
  players: Player[],
  rounds: { index: number; leaderboard: LeaderboardRow[] }[],
): EventStanding[] {
  const rows = players.map((p) => {
    const parts = rounds.map((r) => ({
      index: r.index,
      points: r.leaderboard.find((x) => x.playerId === p.id)?.points.total ?? 0,
    }));
    return {
      playerId: p.id,
      name: p.name,
      points: parts.reduce((sum, x) => sum + x.points, 0),
      rounds: parts,
    };
  });
  rows.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return rows;
}

export function withLeaderboard(
  game: Omit<GameState, "leaderboard" | "eventStandings"> & {
    leaderboard?: LeaderboardRow[];
    eventStandings?: EventStanding[];
  },
): GameState {
  const leaderboard = buildLeaderboard(game.players, game.scores, game.nines);
  const pastBoards = (game.pastRounds as PastRound[]).map((r) => ({
    index: r.index,
    leaderboard: buildLeaderboard(game.players, r.scores, r.nines),
  }));
  return {
    ...game,
    leaderboard,
    eventStandings: buildEventStandings(game.players, [
      ...pastBoards,
      { index: game.roundIndex, leaderboard },
    ]),
  };
}
