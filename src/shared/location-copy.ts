export type GpsStatus = "idle" | "pending" | "ready" | "denied" | "unavailable";

const M_PER_YD = 0.9144;

export function accuracyYards(meters: number): number {
  return Math.round(meters / M_PER_YD);
}

export function gpsYardsCopy(opts: {
  status: GpsStatus;
  yards: number | null;
  accuracyM?: number;
}): { title: string; detail: string; ready: boolean } {
  if (opts.status === "ready" && opts.yards !== null) {
    const acc = opts.accuracyM != null ? accuracyYards(opts.accuracyM) : null;
    const detail =
      acc == null
        ? "yds to green"
        : acc > 45
          ? `yds to green · low accuracy ±${acc} yd`
          : `yds to green · ±${acc} yd`;
    return { title: String(opts.yards), detail, ready: true };
  }
  if (opts.status === "pending") {
    return { title: "…", detail: "locating…", ready: false };
  }
  if (opts.status === "denied") {
    return { title: "GPS off", detail: "location permission denied", ready: false };
  }
  if (opts.status === "unavailable") {
    return { title: "GPS off", detail: "location unavailable", ready: false };
  }
  return { title: "GPS off", detail: "enable location for yards", ready: false };
}
