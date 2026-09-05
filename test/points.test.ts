import { describe, expect, it } from "vitest";
import { COURSE, firApplies, getLayoutHole, layoutHoles, parseNines } from "../src/shared/course.ts";
import {
  bonusFromScores,
  buildEventStandings,
  buildLeaderboard,
  countedFir,
  headerStats,
  holeAwards,
  holeDelta,
  holeMark,
  listRounds,
  nineSlice,
  placementPoints,
  tabLabel,
} from "../src/shared/points.ts";
import type { HoleScore, LeaderboardRow, Player } from "../src/shared/types.ts";

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
    const rows = buildLeaderboard(players, { t: thomas, d: [hole(1, 4)] }, ["bear"]);
    expect(rows.find((r) => r.playerId === "t")?.complete).toBe(true);
    expect(rows.find((r) => r.playerId === "t")?.points.placement).toBe(0);
    expect(rows.find((r) => r.playerId === "d")?.points.placement).toBe(0);
  });

  it("awards placement when the field is in", () => {
    const thomas = COURSE.bear.holes.map((h) => hole(h.hole, h.par - 1));
    const dad = COURSE.bear.holes.map((h) => hole(h.hole, h.par));
    const rows = buildLeaderboard(players, { t: thomas, d: dad }, ["bear"]);
    const t = rows.find((r) => r.playerId === "t")!;
    const d = rows.find((r) => r.playerId === "d")!;
    expect(t.points.placement).toBe(3);
    expect(d.points.placement).toBe(1);
    expect(t.points.birdies).toBe(9);
    expect(t.strokes).toBe(27);
    expect(d.strokes).toBe(36);
  });
});

describe("18-hole composition", () => {
  it("Bear then Beaver is holes 1–18 with each nine’s pars", () => {
    const holes = layoutHoles(["bear", "beaver"]);
    expect(holes).toHaveLength(18);
    expect(holes.slice(0, 9).map((h) => h.par)).toEqual(COURSE.bear.holes.map((h) => h.par));
    expect(holes.slice(9).map((h) => h.par)).toEqual(COURSE.beaver.holes.map((h) => h.par));
    expect(holes[0]).toMatchObject({ hole: 1, nine: "bear", nineHole: 1, par: 4 });
    expect(holes[9]).toMatchObject({ hole: 10, nine: "beaver", nineHole: 1, par: 4 });
    expect(getLayoutHole(["bear", "beaver"], 13)).toMatchObject({
      hole: 13,
      nine: "beaver",
      nineHole: 4,
      par: 4,
    });
  });

  it("slices scores onto the correct nine", () => {
    const scores = [hole(1, 4), hole(9, 5), hole(10, 4), hole(18, 3)];
    expect(nineSlice(scores, 0).map((s) => s.hole)).toEqual([1, 9]);
    expect(nineSlice(scores, 1).map((s) => ({ hole: s.hole, strokes: s.strokes }))).toEqual([
      { hole: 1, strokes: 4 },
      { hole: 9, strokes: 3 },
    ]);
  });

  it("requires two different nines for 18", () => {
    expect(parseNines(["bear"])).toEqual(["bear"]);
    expect(parseNines(["bear", "beaver"])).toEqual(["bear", "beaver"]);
    expect(() => parseNines(["bear", "bear"])).toThrow(/different/);
    expect(() => parseNines([])).toThrow(/9 or 18/);
  });
});

describe("per-nine placement", () => {
  const players: Player[] = [
    { id: "t", name: "Thomas" },
    { id: "d", name: "Dad" },
  ];

  function nineScores(nine: "bear" | "beaver", rel: number, startHole: number): HoleScore[] {
    return COURSE[nine].holes.map((h) => hole(startHole + h.hole - 1, h.par + rel));
  }

  it("awards front placement when everyone has 1–9 even if the back is empty", () => {
    const rows = buildLeaderboard(
      players,
      {
        t: nineScores("bear", -1, 1),
        d: nineScores("bear", 0, 1),
      },
      ["bear", "beaver"],
    );
    const t = rows.find((r) => r.playerId === "t")!;
    const d = rows.find((r) => r.playerId === "d")!;
    expect(t.nines[0]?.fieldComplete).toBe(true);
    expect(t.nines[1]?.fieldComplete).toBe(false);
    expect(t.nines[0]?.points.placement).toBe(3);
    expect(d.nines[0]?.points.placement).toBe(1);
    expect(t.nines[1]?.points.placement).toBe(0);
    expect(t.points.placement).toBe(3);
    expect(t.complete).toBe(false);
  });

  it("adds back-nine placement into the combined total after 10–18", () => {
    const rows = buildLeaderboard(
      players,
      {
        t: [...nineScores("bear", 0, 1), ...nineScores("beaver", 1, 10)],
        d: [...nineScores("bear", 1, 1), ...nineScores("beaver", -1, 10)],
      },
      ["bear", "beaver"],
    );
    const t = rows.find((r) => r.playerId === "t")!;
    const d = rows.find((r) => r.playerId === "d")!;
    expect(t.nines[0]?.points.placement).toBe(3);
    expect(d.nines[0]?.points.placement).toBe(1);
    expect(t.nines[1]?.points.placement).toBe(1);
    expect(d.nines[1]?.points.placement).toBe(3);
    expect(t.points.placement).toBe(4);
    expect(d.points.placement).toBe(4);
    expect(t.complete).toBe(true);
  });
});

describe("live FIR/GIR header math", () => {
  const players: Player[] = [
    { id: "t", name: "Thomas" },
    { id: "d", name: "Dad" },
  ];

  it("fills FIR/GIR toward 4 and 3 before the nine closes", () => {
    const rows = buildLeaderboard(
      players,
      {
        t: [
          hole(1, 4, { fir: true, gir: true }),
          hole(2, 5, { fir: true, gir: true }),
          hole(4, 3, { fir: true, gir: true }),
        ],
        d: [hole(1, 5)],
      },
      ["bear"],
    );
    const live = headerStats(rows.find((r) => r.playerId === "t")!);
    expect(live.thru).toBe(3);
    expect(live.toPar).toBe(0);
    expect(live.firCount).toBe(2);
    expect(live.firTarget).toBe(4);
    expect(live.girCount).toBe(3);
    expect(live.girTarget).toBe(3);
    expect(live.threePutts).toBe(0);
    expect(rows[0]!.points.firBonus).toBe(0);
    expect(rows.find((r) => r.playerId === "t")!.points.girBonus).toBe(1);
    expect(rows.find((r) => r.playerId === "t")!.points.placement).toBe(0);
  });

  it("uses only the open nine’s targets on 18 until the front closes", () => {
    const front = COURSE.bear.holes.map((h, i) =>
      hole(h.hole, h.par, { fir: i !== 3 && i !== 6, gir: i < 3 }),
    );
    const rows = buildLeaderboard(
      players,
      { t: front, d: [hole(1, 4)] },
      ["bear", "beaver"],
    );
    const live = headerStats(rows.find((r) => r.playerId === "t")!);
    expect(live.labels).toEqual(["Bear"]);
    expect(live.firCount).toBe(7);
    expect(live.firTarget).toBe(4);
    expect(live.girCount).toBe(3);
    expect(live.girTarget).toBe(3);
    expect(rows.find((r) => r.playerId === "t")!.nines[0]?.points.firBonus).toBe(1);
    expect(rows.find((r) => r.playerId === "t")!.nines[0]?.points.placement).toBe(0);
  });

  it("after the front closes, header FIR/GIR is the back nine vs 4 and 3", () => {
    const frontT = COURSE.bear.holes.map((h) => hole(h.hole, h.par, { fir: true, gir: true }));
    const frontD = COURSE.bear.holes.map((h) => hole(h.hole, h.par));
    const rows = buildLeaderboard(
      players,
      {
        t: [...frontT, hole(10, 4, { fir: true }), hole(11, 5, { gir: true, threePutt: true })],
        d: frontD,
      },
      ["bear", "beaver"],
    );
    const live = headerStats(rows.find((r) => r.playerId === "t")!);
    expect(live.labels).toEqual(["Beaver"]);
    expect(live.thru).toBe(11);
    expect(live.firCount).toBe(1);
    expect(live.firTarget).toBe(4);
    expect(live.girCount).toBe(1);
    expect(live.girTarget).toBe(3);
    expect(live.threePutts).toBe(1);
    expect(rows.find((r) => r.playerId === "t")!.nines[0]?.points.placement).toBe(3);
  });
});

describe("multi-round points sum", () => {
  const players: Player[] = [
    { id: "t", name: "Thomas" },
    { id: "d", name: "Dad" },
    { id: "s", name: "Scott" },
  ];

  function row(id: string, name: string, total: number): LeaderboardRow {
    return {
      playerId: id,
      name,
      holesSubmitted: 9,
      strokes: 36,
      toPar: 0,
      complete: true,
      points: {
        placement: total,
        birdies: 0,
        eagles: 0,
        firBonus: 0,
        girBonus: 0,
        threePutts: 0,
        total,
      },
      nines: [],
    };
  }

  it("sums placement + bonus across rounds, missing round is 0", () => {
    const standings = buildEventStandings(players, [
      {
        index: 1,
        leaderboard: [row("t", "Thomas", 8), row("d", "Dad", 3)],
      },
      {
        index: 2,
        leaderboard: [row("t", "Thomas", 5), row("d", "Dad", 6), row("s", "Scott", 4)],
      },
    ]);
    expect(standings.map((r) => ({ id: r.playerId, pts: r.points, rounds: r.rounds }))).toEqual([
      {
        id: "t",
        pts: 13,
        rounds: [
          { index: 1, points: 8 },
          { index: 2, points: 5 },
        ],
      },
      {
        id: "d",
        pts: 9,
        rounds: [
          { index: 1, points: 3 },
          { index: 2, points: 6 },
        ],
      },
      {
        id: "s",
        pts: 4,
        rounds: [
          { index: 1, points: 0 },
          { index: 2, points: 4 },
        ],
      },
    ]);
  });

  it("tabs are Today/Tomorrow for two rounds, Round N after that", () => {
    expect(tabLabel(1, 1)).toBe("Today");
    expect(tabLabel(1, 2)).toBe("Today");
    expect(tabLabel(2, 2)).toBe("Tomorrow");
    expect(tabLabel(3, 3)).toBe("Round 3");
  });

  it("lists each round separately so scorecards are not stacked", () => {
    const rounds = listRounds({
      id: "x",
      name: "Breck Open",
      nines: ["elk"],
      tee: "blue",
      hostId: "t",
      status: "lobby",
      players,
      scores: { t: [], d: [], s: [] },
      leaderboard: [
        { ...row("t", "Thomas", 0), holesSubmitted: 0, complete: false },
        { ...row("d", "Dad", 0), holesSubmitted: 0, complete: false },
        { ...row("s", "Scott", 0), holesSubmitted: 0, complete: false },
      ],
      roundIndex: 2,
      pastRounds: [{ index: 1, nines: ["bear"], tee: "blue", scores: { t: [hole(1, 3)], d: [hole(1, 4)] } }],
      eventStandings: [],
    });
    expect(rounds).toHaveLength(2);
    expect(rounds[0]).toMatchObject({ index: 1, nines: ["bear"], current: false });
    expect(rounds[1]).toMatchObject({ index: 2, nines: ["elk"], current: true, status: "lobby" });
    expect(rounds[0]!.leaderboard.find((r) => r.playerId === "t")?.holesSubmitted).toBe(1);
    expect(rounds[1]!.leaderboard.find((r) => r.playerId === "t")?.holesSubmitted).toBe(0);
  });
});
