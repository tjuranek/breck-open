import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { LocationPermission } from "../src/components/LocationPermission.tsx";
import { hasPromptedLocation } from "../src/location.ts";
import { initPlayerId } from "../src/player.ts";
import { colors } from "../src/theme.ts";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [needPrompt, setNeedPrompt] = useState(true);

  useEffect(() => {
    void Promise.all([initPlayerId(), hasPromptedLocation()]).then(([, prompted]) => {
      setNeedPrompt(!prompted);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (needPrompt) {
    return (
      <>
        <StatusBar style="light" />
        <LocationPermission onDone={() => setNeedPrompt(false)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "fade",
        }}
      />
    </>
  );
}
