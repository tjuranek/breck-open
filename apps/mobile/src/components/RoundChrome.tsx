import { Pressable, StyleSheet, Text, View } from "react-native";
import { listRounds, tabLabel, type RoundView } from "@shared/points.ts";
import type { GameState } from "@shared/types.ts";
import { fmtPts } from "../format.ts";
import { colors } from "../theme.ts";

export function RoundChrome({
  game,
  selected,
  onSelect,
}: {
  game: GameState;
  selected: number;
  onSelect: (view: RoundView) => void;
}) {
  const rounds = listRounds(game);
  if (rounds.length < 2) return null;
  return (
    <View>
      <View style={styles.tabs}>
        {rounds.map((r) => (
          <Pressable
            key={r.index}
            onPress={() => onSelect(r)}
            style={[styles.tab, r.index === selected && styles.tabOn]}
          >
            <Text style={[styles.tabText, r.index === selected && styles.tabTextOn]}>
              {tabLabel(r.index, rounds.length)}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.strip}>
        {game.eventStandings.map((row) => (
          <Text key={row.playerId} style={styles.stripItem}>
            {row.name} <Text style={styles.pts}>{fmtPts(row.points)}</Text>
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: 8, marginBottom: 8 },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.inset,
    alignItems: "center",
    justifyContent: "center",
  },
  tabOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  tabText: { color: colors.fg, fontWeight: "800" },
  tabTextOn: { color: colors.ink },
  strip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  stripItem: { color: colors.muted, fontSize: 14 },
  pts: { color: colors.gold, fontWeight: "800" },
});
