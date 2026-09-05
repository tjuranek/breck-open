import type { Nine } from "./types.ts";
import type { LatLng } from "./geo.ts";

export type { LatLng };

export const GREEN_CENTERS: Record<Nine, Record<number, LatLng>> = {
  // Beaver: OSM golf=hole refs 1–9 + golf=green centroids (Overpass 2026-09).
  // Yardages/pars match the Beaver scorecard (finishes par 3). High confidence.
  beaver: {
    1: { lat: 39.521611, lng: -106.03456 },
    2: { lat: 39.526496, lng: -106.035849 },
    3: { lat: 39.525114, lng: -106.036444 },
    4: { lat: 39.521566, lng: -106.03519 },
    5: { lat: 39.524529, lng: -106.032118 },
    6: { lat: 39.520742, lng: -106.029834 },
    7: { lat: 39.517687, lng: -106.027665 },
    8: { lat: 39.522171, lng: -106.029318 },
    9: { lat: 39.523855, lng: -106.030456 },
  },
  // Bear: OSM golf=hole refs 10–18 + green centroids. Lengths match Bear gold
  // 405–473 to the yard. High confidence.
  bear: {
    1: { lat: 39.527827, lng: -106.034043 },
    2: { lat: 39.530449, lng: -106.039882 },
    3: { lat: 39.530234, lng: -106.043515 },
    4: { lat: 39.528418, lng: -106.042612 },
    5: { lat: 39.530287, lng: -106.040529 },
    6: { lat: 39.52849, lng: -106.035458 },
    7: { lat: 39.526523, lng: -106.032734 },
    8: { lat: 39.529287, lng: -106.029639 },
    9: { lat: 39.525765, lng: -106.032127 },
  },
  // Elk: OSM golf=green centroids (no hole ways). Order from clubhouse→east loop
  // using scorecard pars/yardages, USGS elev (hole 7 tee ~9445'), Mapbox sat.
  // Medium-high confidence.
  elk: {
    1: { lat: 39.524927, lng: -106.026268 },
    2: { lat: 39.527644, lng: -106.021593 },
    3: { lat: 39.526485, lng: -106.020126 },
    4: { lat: 39.527768, lng: -106.016065 },
    5: { lat: 39.525777, lng: -106.015188 },
    6: { lat: 39.523326, lng: -106.015248 },
    7: { lat: 39.523358, lng: -106.019387 },
    8: { lat: 39.526897, lng: -106.027819 },
    9: { lat: 39.523844, lng: -106.029624 },
  },
};

export function getGreenCenter(nine: Nine, hole: number): LatLng {
  const found = GREEN_CENTERS[nine][hole];
  if (!found) throw new Error(`No green center for ${nine} ${hole}`);
  return found;
}
