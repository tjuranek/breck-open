import { describe, expect, it } from "vitest";
import { MAPBOX_TOKEN, staticGreenSrc } from "../src/mapbox.ts";
import { accuracyYards, gpsYardsCopy } from "../src/shared/location-copy.ts";

describe("mapbox token", () => {
  it("is a public pk token at runtime", () => {
    expect(MAPBOX_TOKEN.startsWith("pk.")).toBe(true);
    expect(MAPBOX_TOKEN.length).toBeGreaterThan(40);
  });

  it("builds a satellite static URL with the green pin", () => {
    const src = staticGreenSrc({ lat: 39.527827, lng: -106.034043 });
    expect(src).toContain("mapbox/satellite-v9/static/");
    expect(src).toContain("pin-s+0A84FF(-106.034043,39.527827)");
    expect(src).toContain("access_token=" + MAPBOX_TOKEN);
  });
});

describe("gpsYardsCopy", () => {
  it("shows tabular yards and accuracy when ready", () => {
    expect(gpsYardsCopy({ status: "ready", yards: 184, accuracyM: 8 })).toEqual({
      title: "184",
      detail: "yds to green · ±9 yd",
      ready: true,
    });
  });

  it("flags low accuracy", () => {
    expect(gpsYardsCopy({ status: "ready", yards: 90, accuracyM: 50 }).detail).toMatch(/low accuracy/);
  });

  it("names GPS-off and permission states", () => {
    expect(gpsYardsCopy({ status: "idle", yards: null })).toEqual({
      title: "GPS off",
      detail: "enable location for yards",
      ready: false,
    });
    expect(gpsYardsCopy({ status: "denied", yards: null }).detail).toBe("location permission denied");
    expect(gpsYardsCopy({ status: "unavailable", yards: null }).detail).toBe("location unavailable");
    expect(gpsYardsCopy({ status: "pending", yards: null })).toEqual({
      title: "…",
      detail: "locating…",
      ready: false,
    });
  });

  it("converts accuracy meters to yards", () => {
    expect(accuracyYards(0.9144)).toBe(1);
  });
});
