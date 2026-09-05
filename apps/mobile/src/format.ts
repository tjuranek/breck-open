import type { PointsBreakdown } from "@shared/types.ts";

export function fmtToPar(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : String(n);
}

export function fmtPts(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

export function breakdown(p: PointsBreakdown): string {
  const bits = [
    p.placement ? `${fmtPts(p.placement)} place` : null,
    p.birdies ? `${fmtPts(p.birdies)} birdie` : null,
    p.eagles ? `${fmtPts(p.eagles)} eagle` : null,
    p.firBonus ? "+1 FIR" : null,
    p.girBonus ? "+1 GIR" : null,
    p.threePutts ? `${p.threePutts} 3-putt` : null,
  ].filter(Boolean);
  return bits.length ? bits.join(" · ") : "no bonus yet";
}

export function parseInvite(value: string): string {
  return value.trim().replace(/^.*\/g\//, "").replace(/\/.*$/, "");
}

export const WEB_ORIGIN = "https://breck-open.krux-lab.workers.dev";

export function inviteUrl(id: string): string {
  return `${WEB_ORIGIN}/g/${id}`;
}
