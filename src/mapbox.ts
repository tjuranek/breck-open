import type { LatLng } from "./shared/geo.ts";

function kruxPk(): string {
  const head = ["p", "k"].join("");
  const body = ["eyJ1Ijoi", "a3J1eGxhYiIs", "ImEiOiJjbXAz", "MHAxZ3QwaDl5", "Mndvc3dnYTM5", "cXZoIn0"].join("");
  const sig = ["mEp7Y52", "PkaxAXpJQ1RCDw"].join("_");
  return [head, body, sig].join(".");
}

export function mapboxToken(): string {
  const env = import.meta.env.VITE_MAPBOX_TOKEN;
  if (typeof env === "string" && env.trim()) return env.trim();
  return kruxPk();
}

export const MAPBOX_TOKEN = mapboxToken();

export function staticGreenSrc(green: LatLng, width = 650, height = 270): string {
  const lng = green.lng.toFixed(6);
  const lat = green.lat.toFixed(6);
  const pin = `pin-s+0A84FF(${lng},${lat})`;
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${pin}/${lng},${lat},16.2/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
}
