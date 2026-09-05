import { describe, expect, it } from "vitest";
import { NINES } from "../src/shared/types.ts";
import { haversineYards, yardsToGreen } from "../src/shared/geo.ts";
import { GREEN_CENTERS, getGreenCenter } from "../src/shared/green-centers.ts";

describe("haversineYards", () => {
  it("is 0 for the same point", () => {
    const p = { lat: 39.5246, lng: -106.0339 };
    expect(haversineYards(p, p)).toBe(0);
    expect(yardsToGreen(p, p)).toBe(0);
  });

  it("measures 100 yards along a meridian", () => {
    const a = { lat: 39.5246, lng: -106.0339 };
    const b = { lat: 39.5246 + 91.44 / 111_320, lng: -106.0339 };
    expect(haversineYards(a, b)).toBeCloseTo(100, 0);
    expect(yardsToGreen(a, b)).toBe(100);
  });

  it("is symmetric", () => {
    const a = { lat: 39.521611, lng: -106.03456 };
    const b = { lat: 39.5246, lng: -106.0339 };
    expect(haversineYards(a, b)).toBeCloseTo(haversineYards(b, a), 8);
  });
});

describe("getGreenCenter", () => {
  it("returns 27 centers keyed by nine and hole", () => {
    for (const nine of NINES) {
      for (const hole of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        const c = getGreenCenter(nine, hole);
        expect(c).toEqual(GREEN_CENTERS[nine][hole]);
        expect(c.lat).toBeGreaterThan(39.51);
        expect(c.lat).toBeLessThan(39.54);
        expect(c.lng).toBeGreaterThan(-106.05);
        expect(c.lng).toBeLessThan(-106.01);
      }
    }
  });

  it("looks up Bear / Beaver / Elk by hole", () => {
    expect(getGreenCenter("bear", 1)).toEqual({ lat: 39.527827, lng: -106.034043 });
    expect(getGreenCenter("beaver", 9)).toEqual({ lat: 39.523855, lng: -106.030456 });
    expect(getGreenCenter("elk", 7)).toEqual({ lat: 39.523358, lng: -106.019387 });
  });

  it("rejects a missing hole", () => {
    expect(() => getGreenCenter("bear", 10)).toThrow(/bear 10/);
  });
});
