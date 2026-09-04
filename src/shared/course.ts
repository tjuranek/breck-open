import type { Nine, Tee } from "./types.ts";
import { NINES, TEES } from "./types.ts";

export { NINES, TEES };
export type { Nine, Tee };

export type Hole = {
  hole: number;
  par: number;
  hcp: number;
  yards: Record<Tee, number>;
};

function nine(
  pars: number[],
  hcps: number[],
  yards: Record<Tee, number[]>,
): Hole[] {
  return pars.map((par, i) => ({
    hole: i + 1,
    par,
    hcp: hcps[i]!,
    yards: {
      gold: yards.gold[i]!,
      blue: yards.blue[i]!,
      green: yards.green[i]!,
      silver: yards.silver[i]!,
      red: yards.red[i]!,
    },
  }));
}

export const COURSE: Record<Nine, { label: string; holes: Hole[] }> = {
  bear: {
    label: "Bear",
    holes: nine(
      [4, 5, 4, 3, 4, 5, 3, 4, 4],
      [11, 17, 7, 15, 13, 5, 9, 3, 1],
      {
        gold: [405, 560, 403, 204, 413, 556, 225, 463, 473],
        blue: [362, 520, 386, 167, 371, 517, 192, 408, 462],
        green: [346, 491, 347, 157, 334, 509, 174, 396, 425],
        silver: [299, 472, 313, 146, 320, 469, 147, 345, 412],
        red: [251, 445, 291, 109, 268, 443, 95, 307, 343],
      },
    ),
  },
  elk: {
    label: "Elk",
    holes: nine(
      [4, 5, 3, 4, 3, 4, 4, 5, 4],
      [18, 6, 16, 10, 14, 12, 2, 4, 8],
      {
        gold: [386, 576, 203, 441, 239, 283, 436, 572, 420],
        blue: [357, 516, 182, 411, 216, 276, 417, 541, 396],
        green: [345, 508, 161, 403, 195, 254, 405, 528, 386],
        silver: [305, 491, 143, 315, 163, 246, 355, 471, 348],
        red: [283, 442, 97, 295, 95, 215, 309, 420, 244],
      },
    ),
  },
  beaver: {
    label: "Beaver",
    holes: nine(
      [4, 5, 3, 4, 4, 4, 4, 5, 3],
      [7, 11, 17, 9, 5, 15, 3, 1, 13],
      {
        gold: [408, 564, 178, 415, 418, 408, 407, 571, 195],
        blue: [393, 533, 163, 382, 355, 312, 398, 507, 177],
        green: [359, 488, 123, 343, 340, 305, 351, 476, 160],
        silver: [348, 457, 105, 306, 311, 278, 339, 470, 151],
        red: [303, 418, 75, 261, 275, 229, 314, 398, 120],
      },
    ),
  },
};

export const TEE_LABEL: Record<Tee, string> = {
  gold: "Gold",
  blue: "Blue",
  green: "Green",
  silver: "Silver",
  red: "Red",
};

export function getHole(n: Nine, hole: number): Hole {
  const found = COURSE[n].holes[hole - 1];
  if (!found) throw new Error(`Invalid hole ${hole}`);
  return found;
}

export function firApplies(par: number): boolean {
  return par !== 3;
}

export function isNine(value: string): value is Nine {
  return (NINES as readonly string[]).includes(value);
}

export function isTee(value: string): value is Tee {
  return (TEES as readonly string[]).includes(value);
}
