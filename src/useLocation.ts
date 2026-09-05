import { useEffect, useRef, useState } from "react";
import type { LatLng } from "./shared/geo.ts";

export type LocationState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "ready"; coords: LatLng; accuracy: number }
  | { status: "denied" }
  | { status: "unavailable" };

function readPermission(cb: (state: PermissionState | null) => void) {
  if (!navigator.permissions?.query) {
    cb(null);
    return;
  }
  void navigator.permissions
    .query({ name: "geolocation" })
    .then((p) => cb(p.state))
    .catch(() => cb(null));
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({ status: "idle" });
  const watch = useRef(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ status: "unavailable" });
      return;
    }
    let cancelled = false;
    readPermission((perm) => {
      if (cancelled || perm !== "granted") return;
      watch.current = startWatch(setState);
    });
    return () => {
      cancelled = true;
      if (watch.current) navigator.geolocation.clearWatch(watch.current);
    };
  }, []);

  function request() {
    if (!navigator.geolocation) {
      setState({ status: "unavailable" });
      return;
    }
    if (watch.current) navigator.geolocation.clearWatch(watch.current);
    watch.current = startWatch(setState);
  }

  return { ...state, request };
}

function startWatch(setState: (s: LocationState) => void): number {
  setState({ status: "pending" });
  return navigator.geolocation.watchPosition(
    (pos) => {
      setState({
        status: "ready",
        coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        accuracy: pos.coords.accuracy,
      });
    },
    (err) => {
      setState({ status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable" });
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 12000 },
  );
}
