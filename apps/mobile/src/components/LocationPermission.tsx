import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { markLocationPrompted, useLocation } from "../location.ts";
import { colors } from "../theme.ts";
import { Button } from "./ui.tsx";

export function LocationPermission({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  async function finish(ask: boolean) {
    setBusy(true);
    try {
      if (ask) await location.request();
      await markLocationPrompted();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.pin} />
      <View style={styles.stem} />
      <Text style={styles.title}>Breck Open</Text>
      <Text style={styles.copy}>Yards to the green while you score</Text>
      <Text style={styles.sub}>
        We use your phone GPS to show distance to each green. Deny and you can still keep score — yards just stay
        off.
      </Text>
      <View style={styles.actions}>
        <Button disabled={busy} onPress={() => void finish(true)}>
          Continue
        </Button>
        <Button ghost disabled={busy} onPress={() => void finish(false)}>
          Not now
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
  },
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    borderWidth: 3,
    borderColor: colors.fg,
    alignSelf: "center",
  },
  stem: {
    width: 3,
    height: 16,
    backgroundColor: colors.gold,
    alignSelf: "center",
    marginBottom: 28,
  },
  title: {
    color: colors.fg,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  copy: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 26,
  },
  sub: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 14,
  },
  actions: { marginTop: "auto" },
});
