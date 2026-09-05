import { Platform, type TextStyle } from "react-native";

export const colors = {
  bg: "#0E1510",
  fg: "#F3EFE4",
  muted: "#9BB09A",
  card: "#1A2A1E",
  inset: "#101A12",
  line: "#2F4A35",
  gold: "#E8C547",
  accent: "#3F7A4B",
  ink: "#132016",
  danger: "#FFB4A8",
};

export const tap = 48;

export const fonts = {
  title: Platform.select<TextStyle>({
    ios: { fontFamily: "System", fontWeight: "800" },
    default: { fontWeight: "800" },
  }),
  body: Platform.select<TextStyle>({
    ios: { fontFamily: "System" },
    default: {},
  }),
};
