import { describe, expect, it } from "vitest";
import { COURSE, firApplies } from "../src/shared/course.ts";
import {
  bonusFromScores,
  buildLeaderboard,
  countedFir,
  holeAwards,
  holeDelta,
  holeMark,
  placementPoints,
} from "../src/shared/points.ts";
import type { HoleScore, Player } from "../src/shared/types.ts";

function hole(
  n: number,
  strokes: number,
  extra: Partial<HoleScore> = {},
): HoleScore {
  return {
    hole: n,
    strokes,
    fir: extra.fir ?? false,
    gir: extra.gir ?? false,
    threePutt: extra.threePutt ?? false,
  };
}

describe("course", () => {
  it("each nine is par 36 with 9 holes", () => {
    for (const nine of Object.values(COURSE)) {
      expect(nine.holes).toHaveLength(9);
      expect(nine.holes.reduce((sum, h) => sum + h.par, 0)).toBe(36);
    }
  });
});

describe("FIR on par 3", () => {
  it("does not apply on par 3", () => {
    expect(firApplies(3)).toBe(false);
    expect(firApplies(4)).toBe(true);
    expect(firApplies(5)).toBe(true);
  });

  it("never counts even if the score says FIR", () => {
    expect(countedFir(3, true)).toBe(false);
    expect(countedFir(3, false)).toBe(false);
    expect(countedFir(3, null)).toBe(false);
    expect(countedFir(4, true)).toBe(true);
    expect(countedFir(5, true)).toBe(true);
    expect(countedFir(4, false)).toBe(false);
  });

  it("par 3 FIR is excluded from the 4-FIR bonus", () => {
    const bearPars = COURSE.bear.holes.map((h) => h.par);
    expect(bearPars[3]).toBe(3);
    expect(bearPars[6]).toBe(3);
    const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) =>
      hole(n, COURSE.bear.holes[n - 1]!.par, { fir: true }),
    );
    const bonus = bonusFromScores(scores, "bear");
    expect(bonus.firCount).toBe(7);
    expect(bonus.firBonus).toBe(1);
  });

  it("three FIR plus two par-3 flags still misses the bonus", () => {
    const scores = [
      hole(1, 4, { fir: true }),
      hole(2, 5, { fir: true }),
      hole(3, 4, { fir: true }),
      hole(4, 3, { fir: true }),
      hole(7, 3, { fir: true }),
    ];
    const bonus = bonusFromScores(scores, "bear");
    expect(bonus.firCount).toBe(3);
    expect(bonus.firBonus).toBe(0);
  });
});

describe("hole delta", () => {
  it("birdie +1, eagle +3, 3-putt −1, FIR/GIR do not change the hole", () => {
    expect(holeDelta(hole(1, 3), 4)).toBe(1);
    expect(holeDelta(hole(2, 3), 5)).toBe(3);
    expect(holeDelta(hole(3, 4, { threePutt: true }), 4)).toBe(-1);
    expect(holeDelta(hole(1, 3, { fir: true, gir: true }), 4)).toBe(1);
    expect(holeMark(3, 5)).toBe("eagle");
    expect(holeMark(3, 4)).toBe("birdie");
  });
});

describe("hole awards", () => {
  it("birdie +1, eagle-or-better +3, par/bogey 0", () => {
    expect(holeAwards(3, 4)).toEqual({ birdies: 1, eagles: 0 });
    expect(holeAwards(3, 5)).toEqual({ birdies: 0, eagles: 3 });
    expect(holeAwards(2, 5)).toEqual({ birdies: 0, eagles: 3 });
    expect(holeAwards(4, 4)).toEqual({ birdies: 0, eagles: 0 });
    expect(holeAwards(5, 4)).toEqual({ birdies: 0, eagles: 0 });
  });
});

describe("bonus points", () => {
  it("sums birdies, eagles, 3-putts, FIR and GIR bonuses", () => {
    const scores = [
      hole(1, 3, { fir: true, gir: true }),
      hole(2, 3, { fir: true, gir: true }),
      hole(3, 4, { fir: true, gir: true }),
      hole(5, 4, { fir: true }),
      hole(8, 5, { threePutt: true }),
      hole(9, 4, { threePutt: true }),
    ];
    const bonus = bonusFromScores(scores, "bear");
    expect(bonus.birdies).toBe(1);
    expect(bonus.eagles).toBe(3);
    expect(bonus.firCount).toBe(4);
    expect(bonus.firBonus).toBe(1);
    expect(bonus.girCount).toBe(3);
    expect(bonus.girBonus).toBe(1);
    expect(bonus.threePutts).toBe(-2);
  });

  it("uses submitted holes only", () => {
    const bonus = bonusFromScores([hole(1, 3, { gir: true })], "bear");
    expect(bonus.birdies).toBe(1);
    expect(bonus.girBonus).toBe(0);
    expect(bonus.firBonus).toBe(0);
  });
});

describe("placement points", () => {
  it("sole first +3, sole second +1", () => {
    const pts = placementPoints([
      { playerId: "a", strokes: 36 },
      { playerId: "b", strokes: 37 },
      { playerId: "c", strokes: 40 },
    ]);
    expect(pts).toEqual({ a: 3, b: 1, c: 0 });
  });

  it("multi-way first each +3 and no second", () => {
    const pts = placementPoints([
      { playerId: "a", strokes: 36 },
      { playerId: "b", strokes: 36 },
      { playerId: "c", strokes: 38 },
    ]);
    expect(pts).toEqual({ a: 3, b: 3, c: 0 });
  });

  it("tied second each +1 when there is a sole first", () => {
    const pts = placementPoints([
      { playerId: "a", strokes: 36 },
      { playerId: "b", strokes: 38 },
      { playerId: "c", strokes: 38 },
    ]);
    expect(pts).toEqual({ a: 3, b: 1, c: 1 });
  });

  it("three-way first each +3", () => {
    const pts = placementPoints([
      { playerId: "a", strokes: 36 },
      { playerId: "b", strokes: 36 },
      { playerId: "c", strokes: 36 },
    ]);
    expect(pts).toEqual({ a: 3, b: 3, c: 3 });
  });

  it("single player is first", () => {
    expect(placementPoints([{ playerId: "a", strokes: 40 }])).toEqual({ a: 3 });
  });
});

describe("leaderboard", () => {
  const players: Player[] = [
    { id: "t", name: "Thomas" },
    { id: "d", name: "Dad" },
  ];

  it("holds placement until every player has all 9", () => {
    const thomas = COURSE.bear.holes.map((h) => hole(h.hole, h.par));
    const rows = buildLeaderboard(players, { t: thomas, d: [hole(1, 4)] }, "bear");
    expect(rows.find((r) => r.playerId === "t")?.complete).toBe(true);
    expect(rows.find((r) => r.playerId === "t")?.points.placement).toBe(0);
    expect(rows.find((r) => r.playerId === "d")?.points.placement).toBe(0);
  });

  it("awards placement when the field is in", () => {
    const thomas = COURSE.bear.holes.map((h) => hole(h.hole, h.par - 1));
    const dad = COURSE.bear.holes.map((h) => hole(h.hole, h.par));
    const rows = buildLeaderboard(players, { t: thomas, d: dad }, "bear");
    const t = rows.find((r) => r.playerId === "t")!;
    const d = rows.find((r) => r.playerId === "d")!;
    expect(t.points.placement).toBe(3);
    expect(d.points.placement).toBe(1);
    expect(t.points.birdies).toBe(9);
    expect(t.strokes).toBe(27);
    expect(d.strokes).toBe(36);
  });
});
