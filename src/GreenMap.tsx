import type mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { MAPBOX_TOKEN } from "./mapbox.ts";
import type { LatLng } from "./shared/geo.ts";
import { yardsToGreen } from "./shared/geo.ts";
import type { LocationState } from "./useLocation.ts";

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
  const mapboxRef = useRef<typeof mapboxgl | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const user = location.status === "ready" ? location.coords : null;
  const yards = user ? yardsToGreen(user, green) : null;

  useEffect(() => {
    if (!host.current) return;
    let cancelled = false;
    let map: mapboxgl.Map | undefined;

    async function boot() {
      const [{ default: mapbox }] = await Promise.all([
        import("mapbox-gl"),
        import("mapbox-gl/dist/mapbox-gl.css"),
      ]);
      if (cancelled || !host.current) return;
      mapbox.accessToken = MAPBOX_TOKEN;
      mapboxRef.current = mapbox;
      map = new mapbox.Map({
        container: host.current,
        style: "mapbox://styles/mapbox/satellite-v9",
        center: [green.lng, green.lat],
        zoom: 16.2,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        fadeDuration: prefersReducedMotion() ? 0 : 200,
      });
      map.addControl(new mapbox.AttributionControl({ compact: true }));
      greenMark.current = new mapbox.Marker({ color: "#0A84FF" })
        .setLngLat([green.lng, green.lat])
        .addTo(map);
      mapRef.current = map;
      if (cancelled) {
        greenMark.current.remove();
        map.remove();
        mapRef.current = null;
        greenMark.current = null;
        mapboxRef.current = null;
        return;
      }
      setMapReady(true);
    }

    void boot();
    return () => {
      cancelled = true;
      setMapReady(false);
      greenMark.current?.remove();
      userMark.current?.remove();
      map?.remove();
      mapRef.current = null;
      greenMark.current = null;
      userMark.current = null;
      mapboxRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    if (!mapReady || !map || !mapbox) return;
    greenMark.current?.setLngLat([green.lng, green.lat]);
    if (user) {
      if (!userMark.current) {
        const el = document.createElement("div");
        el.className = "youdot";
        userMark.current = new mapbox.Marker({ element: el }).setLngLat([user.lng, user.lat]).addTo(map);
      } else {
        userMark.current.setLngLat([user.lng, user.lat]);
      }
      const bounds = new mapbox.LngLatBounds().extend([green.lng, green.lat]).extend([user.lng, user.lat]);
      map.fitBounds(bounds, {
        padding: 36,
        maxZoom: 17.2,
        duration: prefersReducedMotion() ? 0 : 200,
      });
    } else {
      userMark.current?.remove();
      userMark.current = null;
      map.easeTo({
        center: [green.lng, green.lat],
        zoom: 16.2,
        duration: prefersReducedMotion() ? 0 : 200,
      });
    }
  }, [mapReady, green.lat, green.lng, user?.lat, user?.lng]);

  return (
    <div className="rangewrap card">
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
