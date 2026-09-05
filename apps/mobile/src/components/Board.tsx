import { StyleSheet, Text, View } from "react-native";
import { COURSE, firApplies, layoutHoles } from "@shared/course.ts";
import {
  FIR_BONUS_AT,
  GIR_BONUS_AT,
  headerFocus,
  headerStats,
  holeDelta,
  holeMark,
  type RoundView,
} from "@shared/points.ts";
import type { LeaderboardRow, NineStats } from "@shared/types.ts";
import { breakdown, fmtPts, fmtToPar } from "../format.ts";
import { colors } from "../theme.ts";
import { Card } from "./ui.tsx";

export function StickyLive({ view }: { view: RoundView }) {
  return (
    <View style={styles.stick}>
      {view.leaderboard.map((row) => (
        <LiveLine key={row.playerId} row={row} />
      ))}
    </View>
  );
}

function LiveLine({ row }: { row: LeaderboardRow }) {
  const live = headerStats(row);
  const focus = headerFocus(row.nines);
  const split = focus.length > 1;
  const firOn = !split && live.firCount >= live.firTarget;
  const girOn = !split && live.girCount >= live.girTarget;
  const label = live.labels.length > 1 ? live.labels.join("+") : live.labels[0];
  return (
    <View style={styles.live}>
      <View style={styles.livemain}>
        <Text style={styles.name}>{row.name}</Text>
        <Text style={styles.meta}>
          {live.thru} · {fmtToPar(live.toPar)}
        </Text>
        {split ? (
          <Text style={styles.meta}>
            FIR{" "}
            {focus.map((n, i) => (
              <Text key={`f${n.nine}`} style={n.firCount >= FIR_BONUS_AT ? styles.fill : undefined}>
                {i ? " · " : ""}
                {n.firCount}/{FIR_BONUS_AT}
              </Text>
            ))}
          </Text>
        ) : (
          <Text style={firOn ? styles.fill : styles.meta}>
            FIR {live.firCount}/{live.firTarget}
          </Text>
        )}
        {split ? (
          <Text style={styles.meta}>
            GIR{" "}
            {focus.map((n, i) => (
              <Text key={`g${n.nine}`} style={n.girCount >= GIR_BONUS_AT ? styles.fill : undefined}>
                {i ? " · " : ""}
                {n.girCount}/{GIR_BONUS_AT}
              </Text>
            ))}
          </Text>
        ) : (
          <Text style={girOn ? styles.fill : styles.meta}>
            GIR {live.girCount}/{live.girTarget}
          </Text>
        )}
        <Text style={styles.meta}>3P {live.threePutts}</Text>
        {label ? <Text style={styles.meta}>{label}</Text> : null}
      </View>
      <Text style={styles.pts}>{fmtPts(row.points.total)}</Text>
    </View>
  );
}

function NineLine({ stat }: { stat: NineStats }) {
  return (
    <View style={styles.nine}>
      <Text style={styles.meta}>
        {COURSE[stat.nine].label} {stat.holesSubmitted}/9 · {stat.strokes || "—"} · {fmtToPar(stat.toPar)}{" "}
        <Text style={styles.pts}>{fmtPts(stat.points.total)}</Text>
      </Text>
      {stat.fieldComplete || stat.points.total ? (
        <Text style={styles.break}>{breakdown(stat.points)}</Text>
      ) : null}
    </View>
  );
}

function flag(on: boolean | null): string {
  if (on === null) return "—";
  return on ? "yes" : "·";
}

export function Board({ view, locked = false }: { view: RoundView; locked?: boolean }) {
  const holes = layoutHoles(view.nines);
  return (
    <Card>
      {view.leaderboard.map((row, i) => (
        <View key={row.playerId} style={i ? styles.cardscore : undefined}>
          <View style={styles.scorehead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {i + 1}. {row.name}
              </Text>
              <Text style={styles.meta}>
                {row.holesSubmitted}/{holes.length} · {row.strokes || "—"} · {fmtToPar(row.toPar)}
              </Text>
              {row.nines.length > 1
                ? row.nines.map((n) => <NineLine key={n.nine} stat={n} />)
                : locked
                  ? <Text style={styles.break}>{breakdown(row.points)}</Text>
                  : null}
            </View>
            <Text style={styles.pts}>{fmtPts(row.points.total)} pts</Text>
          </View>
          {holes.map((h) => {
            const s = view.scores[row.playerId]?.find((x) => x.hole === h.hole);
            if (!s) {
              return (
                <View key={h.hole} style={styles.audit}>
                  <Text style={styles.hole}>{h.hole}</Text>
                  <Text style={styles.empty}>·</Text>
                </View>
              );
            }
            const mark = holeMark(s.strokes, h.par);
            const birdieEagle =
              mark === "birdie" || mark === "eagle" || mark === "albatross" ? mark : "";
            const fir = firApplies(h.par) ? s.fir : null;
            const delta = holeDelta(s, h.par);
            return (
              <View key={h.hole} style={styles.audit}>
                <View style={styles.auditmain}>
                  <Text style={styles.hole}>{h.hole}</Text>
                  <Text style={styles.strokes}>{s.strokes}</Text>
                  {birdieEagle ? <Text style={styles.mark}>{birdieEagle}</Text> : null}
                  <Text style={styles.delta}>{delta ? fmtPts(delta) : "0"}</Text>
                </View>
                <Text style={styles.flags}>
                  FIR {flag(fir)} · GIR {flag(s.gir)} · 3P {flag(s.threePutt)}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  stick: {
    backgroundColor: colors.bg,
    paddingVertical: 6,
    marginBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  live: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 4 },
  livemain: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6, paddingRight: 8 },
  name: { color: colors.fg, fontWeight: "800", fontSize: 16 },
  meta: { color: colors.muted, fontSize: 13 },
  fill: { color: colors.gold, fontWeight: "800", fontSize: 13 },
  pts: { color: colors.gold, fontWeight: "800", fontSize: 16 },
  nine: { marginTop: 4 },
  break: { color: colors.muted, fontSize: 14, marginTop: 4 },
  cardscore: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  scorehead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, gap: 8 },
  audit: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  auditmain: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  hole: { width: 22, color: colors.muted, fontWeight: "700" },
  strokes: { color: colors.fg, fontSize: 22, fontWeight: "800" },
  mark: { color: colors.gold, fontWeight: "700" },
  delta: { marginLeft: "auto", color: colors.fg, fontWeight: "800" },
  flags: { marginLeft: 30, color: colors.muted, marginTop: 2 },
  empty: { color: colors.line, fontSize: 20, fontWeight: "800" },
});
