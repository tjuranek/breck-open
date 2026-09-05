import { Pressable, StyleSheet, Text, View } from "react-native";
import { getGreenCenter } from "@shared/green-centers.ts";
import { yardsToGreen } from "@shared/geo.ts";
import type { LayoutHole } from "@shared/course.ts";
import { COURSE } from "@shared/course.ts";
import { colors } from "../theme.ts";
import type { LocationState } from "../location.ts";

export function GreenRange({
  hole,
  location,
  onRequestLocation,
}: {
  hole: LayoutHole;
  location: LocationState;
  onRequestLocation: () => void;
}) {
  const green = getGreenCenter(hole.nine, hole.nineHole);
  const user = location.status === "ready" ? location.coords : null;
  const yards = user ? yardsToGreen(user, green) : null;
  const off = location.status === "denied" || location.status === "unavailable";
  const pending = location.status === "pending";

  return (
    <View style={styles.wrap}>
      <View style={styles.yds}>
        <Text style={[styles.num, yards === null && styles.dim]}>{yards ?? "—"}</Text>
        <Text style={styles.unit}>
          {yards !== null
            ? "yds to green"
            : off
              ? "location off"
              : pending
                ? "locating…"
                : "yds to green"}
        </Text>
      </View>
      <View style={styles.pinbox}>
        <View style={styles.pin} />
        <View style={styles.pinStem} />
        <Text style={styles.pinLabel}>
          {COURSE[hole.nine].label} {hole.nineHole} green
        </Text>
        {off || location.status === "idle" ? (
          <Pressable style={styles.locbtn} onPress={onRequestLocation}>
            <Text style={styles.locbtnText}>{off ? "Location off — tap to retry" : "Use my location"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  yds: { alignItems: "center", marginBottom: 10 },
  num: { color: colors.fg, fontSize: 64, fontWeight: "800", letterSpacing: -2, lineHeight: 68 },
  dim: { color: colors.muted },
  unit: { color: colors.muted, fontSize: 16, fontWeight: "600" },
  pinbox: { alignItems: "center", paddingVertical: 8 },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gold,
    borderWidth: 3,
    borderColor: colors.fg,
  },
  pinStem: {
    width: 3,
    height: 14,
    backgroundColor: colors.gold,
    marginTop: -2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  pinLabel: { color: colors.muted, marginTop: 8, fontSize: 14, fontWeight: "600" },
  locbtn: {
    marginTop: 10,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  locbtnText: { color: colors.fg, fontWeight: "700" },
});
