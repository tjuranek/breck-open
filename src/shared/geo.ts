export type LatLng = {
  lat: number;
  lng: number;
};

const EARTH_M = 6_371_000;
const M_PER_YD = 0.9144;

export function haversineYards(a: LatLng, b: LatLng): number {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return (2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)))) / M_PER_YD;
}

export function yardsToGreen(from: LatLng, green: LatLng): number {
  return Math.round(haversineYards(from, green));
}
