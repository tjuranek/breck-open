import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, tap } from "../theme.ts";

export function Screen({
  children,
  padded = true,
  bottomBar,
}: {
  children: ReactNode;
  padded?: boolean;
  bottomBar?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          padded ? styles.pad : undefined,
          bottomBar ? { paddingBottom: 108 + insets.bottom } : { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {children}
      </ScrollView>
      {bottomBar ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>{bottomBar}</View>
      ) : null}
    </View>
  );
}

export function Title({ children, small }: { children: ReactNode; small?: boolean }) {
  return <Text style={[styles.title, small && styles.titleSmall]}>{children}</Text>;
}

export function Sub({ children }: { children: ReactNode }) {
  return <Text style={styles.sub}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      selectionColor={colors.gold}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

export function Button({
  children,
  onPress,
  disabled,
  ghost,
  small,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  ghost?: boolean;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        ghost && styles.btnGhost,
        small && styles.btnSmall,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.btnText, ghost && styles.btnGhostText]}>{children}</Text>
    </Pressable>
  );
}

export function Chip({
  children,
  on,
  done,
  onPress,
  flex,
}: {
  children: ReactNode;
  on?: boolean;
  done?: boolean;
  onPress?: () => void;
  flex?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        flex && styles.chipFlex,
        on && styles.chipOn,
        done && !on && styles.chipDone,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{children}</Text>
    </Pressable>
  );
}

export function Err({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <Text style={styles.err}>{children}</Text>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.gold} />
      <Sub>{label}</Sub>
    </View>
  );
}

export function Row({ children, wrap }: { children: ReactNode; wrap?: boolean }) {
  return <View style={[styles.row, wrap && styles.rowWrap]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: 16, gap: 4 },
  title: {
    color: colors.fg,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  titleSmall: { fontSize: 28, lineHeight: 34 },
  sub: { color: colors.muted, fontSize: 16, lineHeight: 22, marginBottom: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600", marginTop: 10, marginBottom: 6 },
  input: {
    minHeight: tap,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.inset,
    color: colors.fg,
    paddingHorizontal: 14,
    fontSize: 17,
  },
  btn: {
    minHeight: tap,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 16,
  },
  btnSmall: { minHeight: 44, marginTop: 0, paddingHorizontal: 14, alignSelf: "flex-start" },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.line },
  btnText: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  btnGhostText: { color: colors.fg },
  chip: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.inset,
    alignItems: "center",
    justifyContent: "center",
  },
  chipFlex: { flex: 1 },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipDone: { borderColor: colors.accent },
  chipText: { color: colors.fg, fontWeight: "800", fontSize: 16 },
  chipTextOn: { color: colors.ink },
  err: { color: colors.danger, marginTop: 10, fontSize: 15 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.82 },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  row: { flexDirection: "row", gap: 8 },
  rowWrap: { flexWrap: "wrap" },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "rgba(14,21,16,0.92)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
