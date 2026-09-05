import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import { MAPBOX_TOKEN } from "./mapbox.ts";
import type { LatLng } from "./shared/geo.ts";
import { yardsToGreen } from "./shared/geo.ts";
import type { LocationState } from "./useLocation.ts";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = MAPBOX_TOKEN;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function GreenMap({
  green,
  holeLabel,
  location,
  onRequestLocation,
}: {
  green: LatLng;
  holeLabel: string;
  location: LocationState & { request: () => void };
  onRequestLocation: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const greenMark = useRef<mapboxgl.Marker | null>(null);
  const userMark = useRef<mapboxgl.Marker | null>(null);

  const user = location.status === "ready" ? location.coords : null;
  const yards = user ? yardsToGreen(user, green) : null;

  useEffect(() => {
    if (!host.current) return;
    const map = new mapboxgl.Map({
      container: host.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [green.lng, green.lat],
      zoom: 16.2,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      fadeDuration: prefersReducedMotion() ? 0 : 300,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    greenMark.current = new mapboxgl.Marker({ color: "#e8c547" })
      .setLngLat([green.lng, green.lat])
      .addTo(map);
    mapRef.current = map;
    return () => {
      greenMark.current?.remove();
      userMark.current?.remove();
      map.remove();
      mapRef.current = null;
      greenMark.current = null;
      userMark.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    greenMark.current?.setLngLat([green.lng, green.lat]);
    if (user) {
      if (!userMark.current) {
        const el = document.createElement("div");
        el.className = "youdot";
        userMark.current = new mapboxgl.Marker({ element: el }).setLngLat([user.lng, user.lat]).addTo(map);
      } else {
        userMark.current.setLngLat([user.lng, user.lat]);
      }
      const bounds = new mapboxgl.LngLatBounds().extend([green.lng, green.lat]).extend([user.lng, user.lat]);
      map.fitBounds(bounds, {
        padding: 36,
        maxZoom: 17.2,
        duration: prefersReducedMotion() ? 0 : 450,
      });
    } else {
      userMark.current?.remove();
      userMark.current = null;
      map.easeTo({
        center: [green.lng, green.lat],
        zoom: 16.2,
        duration: prefersReducedMotion() ? 0 : 350,
      });
    }
  }, [green.lat, green.lng, user?.lat, user?.lng]);

  return (
    <div className="rangewrap">
      <div className="todistance">
        {yards !== null ? (
          <>
            <strong>{yards}</strong>
            <span>yds to green</span>
          </>
        ) : (
          <>
            <strong className="dim">—</strong>
            <span>
              {location.status === "denied" || location.status === "unavailable"
                ? "enable location for yards"
                : location.status === "pending"
                  ? "locating…"
                  : "yards to green"}
            </span>
          </>
        )}
      </div>
      <div className="holemap">
        <div ref={host} className="holemapbox" aria-label={`${holeLabel} green`} />
        {location.status !== "ready" && location.status !== "pending" ? (
          <button className="locbtn" type="button" onClick={onRequestLocation}>
            Use my location
          </button>
        ) : null}
      </div>
    </div>
  );
}
