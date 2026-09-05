import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@shared/geo.ts";

const PROMPTED_KEY = "breck-location-prompted";

export type LocationState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "ready"; coords: LatLng; accuracy: number }
  | { status: "denied" }
  | { status: "unavailable" };

export async function hasPromptedLocation(): Promise<boolean> {
  return (await AsyncStorage.getItem(PROMPTED_KEY)) === "1";
}

export async function markLocationPrompted(): Promise<void> {
  await AsyncStorage.setItem(PROMPTED_KEY, "1");
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({ status: "idle" });
  const sub = useRef<Location.LocationSubscription | null>(null);

  async function startWatch() {
    if (sub.current) return;
    setState({ status: "pending" });
    try {
      sub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 3,
          timeInterval: 2000,
        },
        (pos) => {
          setState({
            status: "ready",
            coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            accuracy: pos.coords.accuracy ?? 0,
          });
        },
      );
    } catch {
      setState({ status: "unavailable" });
    }
  }

  async function request() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setState({ status: "denied" });
        return false;
      }
      await startWatch();
      return true;
    } catch {
      setState({ status: "unavailable" });
      return false;
    }
  }

  useEffect(() => {
    let cancelled = false;
    void Location.getForegroundPermissionsAsync()
      .then((perm) => {
        if (cancelled) return;
        if (perm.status === "granted") void startWatch();
        else if (perm.status === "denied") setState({ status: "denied" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unavailable" });
      });
    return () => {
      cancelled = true;
      sub.current?.remove();
      sub.current = null;
    };
  }, []);

  return { ...state, request };
}
