import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import {
  COURSE,
  TEE_LABEL,
  firApplies,
  formatLabel,
  formatOf,
  getLayoutHole,
  holeCountOf,
  layoutHoles,
} from "@shared/course.ts";
import { listRounds, type RoundView } from "@shared/points.ts";
import type { GameState, HoleScore } from "@shared/types.ts";
import { getGame, joinGame, saveHole, startGame, startNextRound } from "../api.ts";
import { Board, StickyLive } from "../components/Board.tsx";
import { GreenRange } from "../components/GreenRange.tsx";
import { RoundChrome } from "../components/RoundChrome.tsx";
import { SetupFields, type SetupValue } from "../components/SetupFields.tsx";
import { Button, Card, Chip, Err, Field, Label, Loading, Screen, Sub, Title } from "../components/ui.tsx";
import { inviteUrl } from "../format.ts";
import { useLocation } from "../location.ts";
import { getPlayerId } from "../player.ts";
import { colors, tap } from "../theme.ts";

function savedFor(game: GameState, playerId: string, hole: number): HoleScore | undefined {
  return game.scores[playerId]?.find((h) => h.hole === hole);
}

function setupFrom(game: GameState): SetupValue {
  return {
    format: formatOf(game.nines),
    nines: game.nines,
    tee: game.tee,
  };
}

export function RoomScreen({ board = false }: { board?: boolean }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; round?: string }>();
  const id = params.id ?? "";
  const round = params.round ? Number(params.round) : null;
  const playerId = useMemo(() => getPlayerId(), []);
  const location = useLocation();

  const [game, setGame] = useState<GameState | null>(null);
  const [error, setError] = useState("");
  const [joinName, setJoinName] = useState("");
  const [hole, setHole] = useState(1);
  const [strokes, setStrokes] = useState(4);
  const [fir, setFir] = useState(false);
  const [gir, setGir] = useState(false);
  const [threePutt, setThreePutt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nextSetup, setNextSetup] = useState<SetupValue>({ format: 9, nines: ["bear"], tee: "blue" });
  const hydratedHole = useRef<number | null>(null);
  const setupSynced = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await getGame(id);
        if (!cancelled) {
          setGame(next);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Missing room");
      }
    }
    void load();
    const t = setInterval(() => void load(), 3000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [id]);

  useEffect(() => {
    if (!game) return;
    const key = `${game.roundIndex}:${game.nines.join(",")}:${game.tee}`;
    if (setupSynced.current === key) return;
    setupSynced.current = key;
    setNextSetup(setupFrom(game));
  }, [game]);

  useEffect(() => {
    if (!game) return;
    if (hydratedHole.current === hole) return;
    hydratedHole.current = hole;
    const me = savedFor(game, playerId, hole);
    const def = getLayoutHole(game.nines, hole);
    if (me) {
      setStrokes(me.strokes);
      setFir(me.fir === true);
      setGir(me.gir);
      setThreePutt(me.threePutt);
    } else {
      setStrokes(def.par);
      setFir(false);
      setGir(false);
      setThreePutt(false);
    }
  }, [game, hole, playerId]);

  const me = game?.players.find((p) => p.id === playerId);
  const def = game ? getLayoutHole(game.nines, hole) : null;
  const showFir = def ? firApplies(def.par) : false;
  const holes = game ? holeCountOf(game.nines) : 9;
  const rounds = game ? listRounds(game) : [];
  const selected =
    game && round && rounds.some((r) => r.index === round)
      ? rounds.find((r) => r.index === round)!
      : (rounds.find((r) => r.current) ?? null);
  const viewingPast = Boolean(selected && !selected.current);

  function enterRound(view: RoundView) {
    if (view.current) router.replace(`/g/${id}`);
    else router.replace(`/g/${id}/r/${view.index}`);
  }

  async function onJoin() {
    setBusy(true);
    try {
      setGame(await joinGame(id, { playerId, playerName: joinName }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Join failed");
    } finally {
      setBusy(false);
    }
  }

  async function onStart() {
    setBusy(true);
    try {
      setGame(await startGame(id, playerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Start failed");
    } finally {
      setBusy(false);
    }
  }

  async function onNextRound() {
    setBusy(true);
    try {
      const nines =
        nextSetup.format === 18 ? nextSetup.nines.slice(0, 2) : nextSetup.nines.slice(0, 1);
      setGame(await startNextRound(id, { playerId, nines, tee: nextSetup.tee }));
      setHole(1);
      hydratedHole.current = null;
      router.replace(`/g/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start next round");
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    if (!game) return;
    setBusy(true);
    try {
      const next = await saveHole(id, {
        playerId,
        hole,
        strokes,
        fir: showFir ? fir : null,
        gir,
        threePutt,
      });
      setGame(next);
      if (hole < holes && next.status !== "finished") {
        hydratedHole.current = null;
        setHole(hole + 1);
      } else {
        router.replace(`/g/${id}/board`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function shareInvite() {
    const url = inviteUrl(id);
    await Share.share({
      message: `Breck Open room ${id}\n${url}`,
    });
  }

  function bump(delta: number) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStrokes((n) => Math.min(15, Math.max(1, n + delta)));
  }

  function toggle(kind: "fir" | "gir" | "three") {
    void Haptics.selectionAsync();
    if (kind === "fir") setFir((v) => !v);
    if (kind === "gir") setGir((v) => !v);
    if (kind === "three") setThreePutt((v) => !v);
  }

  if (error && !game) {
    return (
      <Screen>
        <Err>{error}</Err>
        <Button ghost onPress={() => router.replace("/")}>
          Home
        </Button>
      </Screen>
    );
  }

  if (!game || !def || !selected) {
    return <Loading />;
  }

  const title = `${formatLabel(game.nines)} · ${TEE_LABEL[game.tee]} tees`;

  if (!me) {
    if (game.status === "scoring" && !viewingPast) {
      return (
        <Screen>
          <Title small>{game.name}</Title>
          <Sub>This round already started.</Sub>
          <RoundChrome game={game} selected={selected.index} onSelect={enterRound} />
          <Board view={selected} locked={false} />
          <Button ghost onPress={() => router.replace("/")}>
            Home
          </Button>
        </Screen>
      );
    }
    if (!viewingPast) {
      return (
        <Screen>
          <Title small>Join {game.name}</Title>
          <Sub>{title}</Sub>
          <Card>
            <Label>Your name</Label>
            <Field
              value={joinName}
              onChangeText={setJoinName}
              placeholder="Dad"
              maxLength={24}
              autoCapitalize="words"
            />
            <Err>{error}</Err>
            <Button disabled={busy || !joinName.trim()} onPress={() => void onJoin()}>
              Join room
            </Button>
          </Card>
        </Screen>
      );
    }
  }

  const showBoard =
    viewingPast ||
    game.status === "finished" ||
    (board && game.status !== "lobby" && !viewingPast && selected.current);

  if (me && game.status === "lobby" && selected.current && !viewingPast) {
    return (
      <Screen>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Title small>{game.name}</Title>
            <Sub>{title}</Sub>
          </View>
          <Button small ghost onPress={() => router.replace("/")}>
            Home
          </Button>
        </View>
        <RoundChrome game={game} selected={selected.index} onSelect={enterRound} />
        <Card>
          <Text style={styles.strong}>Players</Text>
          {game.players.map((p) => (
            <View key={p.id} style={styles.player}>
              <Text style={styles.playerName}>{p.name}</Text>
              <Text style={styles.meta}>{p.id === game.hostId ? "host" : ""}</Text>
            </View>
          ))}
          <Button ghost onPress={() => void shareInvite()}>
            Share invite · {id}
          </Button>
          {playerId === game.hostId ? (
            <Button disabled={busy} onPress={() => void onStart()}>
              Start round
            </Button>
          ) : (
            <Sub>Waiting for host to start…</Sub>
          )}
        </Card>
        <Err>{error}</Err>
      </Screen>
    );
  }

  if (showBoard) {
    const currentFinished = selected.current && game.status === "finished";
    return (
      <Screen
        bottomBar={
          viewingPast || game.status === "scoring" ? (
            <View style={{ flex: 1 }}>
              <Button onPress={() => router.replace(`/g/${id}`)}>
                {game.status === "lobby" ? "Lobby" : "Play"}
              </Button>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Button onPress={() => router.replace("/")}>Home</Button>
            </View>
          )
        }
      >
        <Text style={styles.holeNum}>{currentFinished ? "Round over" : "Scorecard"}</Text>
        <Text style={styles.holeMeta}>
          {formatLabel(selected.nines)} · {TEE_LABEL[selected.tee]} · {game.name}
        </Text>
        <RoundChrome game={game} selected={selected.index} onSelect={enterRound} />
        <StickyLive view={selected} />
        {currentFinished && me && playerId === game.hostId ? (
          <Card>
            <Text style={styles.strong}>Start next round</Text>
            <Sub>Same invite. Pick 9 or 18, or reuse this setup.</Sub>
            <SetupFields value={nextSetup} onChange={setNextSetup} />
            <Err>{error}</Err>
            <Button disabled={busy} onPress={() => void onNextRound()}>
              {busy ? "Starting…" : "Start next round"}
            </Button>
          </Card>
        ) : null}
        {currentFinished && me && playerId !== game.hostId ? (
          <Sub>Waiting for host to start the next round…</Sub>
        ) : null}
        <Board view={selected} locked={selected.status === "finished"} />
      </Screen>
    );
  }

  const mine = game.scores[playerId] ?? [];
  const groups = game.nines.map((nine, i) => ({
    nine,
    holes: layoutHoles(game.nines).filter((h) => h.nine === nine && Math.floor((h.hole - 1) / 9) === i),
  }));

  return (
    <Screen
      bottomBar={
        <>
          <View style={{ flex: 1 }}>
            <Button ghost onPress={() => router.replace(`/g/${id}/board`)}>
              Leaderboard
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button disabled={busy} onPress={() => void onSave()}>
              Next
            </Button>
          </View>
        </>
      }
    >
      <Text style={styles.holeNum}>
        Hole {def.hole}
        {holes === 18 ? <Text style={styles.nineTag}>  {COURSE[def.nine].label}</Text> : null}
      </Text>
      <Text style={styles.holeMeta}>
        Par {def.par} · {def.yards[game.tee]} yds
      </Text>

      <GreenRange hole={def} location={location} onRequestLocation={() => void location.request()} />

      {groups.map((g) => (
        <View key={`${g.nine}-${g.holes[0]?.hole}`} style={styles.chipgroup}>
          {holes === 18 ? <Text style={styles.chiplabel}>{COURSE[g.nine].label}</Text> : null}
          <View style={styles.chips}>
            {g.holes.map((h) => (
              <View key={h.hole} style={{ width: "18.5%" }}>
                <Chip
                  on={hole === h.hole}
                  done={mine.some((s) => s.hole === h.hole)}
                  onPress={() => {
                    hydratedHole.current = null;
                    setHole(h.hole);
                  }}
                >
                  {h.hole}
                </Chip>
              </View>
            ))}
          </View>
        </View>
      ))}

      <Card>
        <View style={styles.strokes}>
          <Pressable disabled={strokes <= 1} onPress={() => bump(-1)} style={styles.step}>
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.strokeNum}>{strokes}</Text>
          <Pressable disabled={strokes >= 15} onPress={() => bump(1)} style={styles.step}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
        <View style={styles.toggles}>
          {showFir ? (
            <Chip flex on={fir} onPress={() => toggle("fir")}>
              FIR
            </Chip>
          ) : null}
          <Chip flex on={gir} onPress={() => toggle("gir")}>
            GIR
          </Chip>
          <Chip flex on={threePutt} onPress={() => toggle("three")}>
            3-putt
          </Chip>
        </View>
        <Err>{error}</Err>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  strong: { color: colors.fg, fontWeight: "800", fontSize: 17 },
  player: {
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  playerName: { color: colors.fg, fontSize: 17 },
  meta: { color: colors.muted },
  holeNum: { color: colors.fg, fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  nineTag: { color: colors.gold, fontSize: 18, fontWeight: "700" },
  holeMeta: { color: colors.muted, fontSize: 16, marginBottom: 12 },
  chipgroup: { marginBottom: 10 },
  chiplabel: { color: colors.muted, fontWeight: "700", marginBottom: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  strokes: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  step: {
    width: 72,
    height: 72,
    minWidth: tap,
    minHeight: tap,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { color: colors.fg, fontSize: 36, fontWeight: "800" },
  strokeNum: { color: colors.fg, fontSize: 56, fontWeight: "800", letterSpacing: -2 },
  toggles: { flexDirection: "row", gap: 8, marginTop: 14 },
});
