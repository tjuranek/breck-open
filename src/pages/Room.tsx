import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Fade, holeSlide, tap, tapSpring } from "../anim.tsx";
import { getGame, joinGame, saveHole, startGame, startNextRound } from "../api.ts";
import { go } from "../App.tsx";
import { GreenMap } from "../GreenMap.tsx";
import { InstallPrompt } from "../InstallPrompt.tsx";
import { getPlayerId } from "../player.ts";
import { getGreenCenter } from "../shared/green-centers.ts";
import { useLocation } from "../useLocation.ts";
import { SetupFields, type SetupValue } from "../SetupFields.tsx";
import {
  COURSE,
  TEE_LABEL,
  firApplies,
  formatLabel,
  formatOf,
  getLayoutHole,
  holeCountOf,
  layoutHoles,
} from "../shared/course.ts";
import {
  FIR_BONUS_AT,
  GIR_BONUS_AT,
  headerFocus,
  headerStats,
  holeDelta,
  holeMark,
  listRounds,
  tabLabel,
  type RoundView,
} from "../shared/points.ts";
import type { GameState, HoleScore, LeaderboardRow, NineStats, PointsBreakdown } from "../shared/types.ts";

function inviteUrl(id: string): string {
  return `${location.origin}/g/${id}`;
}

function fmtToPar(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : String(n);
}

function fmtPts(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function breakdown(p: PointsBreakdown): string {
  const bits = [
    p.placement ? `${fmtPts(p.placement)} place` : null,
    p.birdies ? `${fmtPts(p.birdies)} birdie` : null,
    p.eagles ? `${fmtPts(p.eagles)} eagle` : null,
    p.firBonus ? "+1 FIR" : null,
    p.girBonus ? "+1 GIR" : null,
    p.threePutts ? `${p.threePutts} 3-putt` : null,
  ].filter(Boolean);
  return bits.length ? bits.join(" · ") : "no bonus yet";
}

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

function enterRound(id: string, view: RoundView) {
  if (view.current) go(`/g/${id}`);
  else go(`/g/${id}/r/${view.index}`);
}

export function Room({ id, board, round }: { id: string; board: boolean; round: number | null }) {
  const playerId = useMemo(() => getPlayerId(), []);
  const [game, setGame] = useState<GameState | null>(null);
  const [error, setError] = useState("");
  const [joinName, setJoinName] = useState("");
  const [copied, setCopied] = useState(false);
  const [hole, setHole] = useState(1);
  const [strokes, setStrokes] = useState(4);
  const [fir, setFir] = useState(false);
  const [gir, setGir] = useState(false);
  const [threePutt, setThreePutt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nextSetup, setNextSetup] = useState<SetupValue>({ format: 9, nines: ["bear"], tee: "blue" });
  const hydratedHole = useRef<number | null>(null);
  const setupSynced = useRef<string | null>(null);
  const location = useLocation();

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
      : rounds.find((r) => r.current) ?? null;
  const viewingPast = Boolean(selected && !selected.current);
  const isPlay = Boolean(
    game && me && selected?.current && game.status === "scoring" && !board && !viewingPast,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("playlock", isPlay);
    return () => document.documentElement.classList.remove("playlock");
  }, [isPlay]);

  async function onJoin(e: FormEvent) {
    e.preventDefault();
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
      go(`/g/${id}`);
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
      if (hole < holes && next.status !== "finished") setHole(hole + 1);
      else go(`/g/${id}/board`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    const url = inviteUrl(id);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy invite link", url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error && !game) {
    return (
      <Fade className="wrap">
        <p className="err">{error}</p>
        <button className="btn ghost" onClick={() => go("/")}>
          Home
        </button>
      </Fade>
    );
  }

  if (!game || !def || !selected) {
    return (
      <Fade className="wrap">
        <p className="sub">Loading…</p>
      </Fade>
    );
  }

  const title = `${game.name} · ${formatLabel(game.nines)} · ${TEE_LABEL[game.tee]}`;

  if (!me) {
    if (game.status === "scoring" && !viewingPast) {
      return (
        <Fade className="wrap">
          <h1>{game.name}</h1>
          <p className="sub">This round already started.</p>
          <RoundChrome id={id} game={game} selected={selected.index} />
          <Board view={selected} locked={false} />
          <button className="btn ghost" onClick={() => go("/")}>
            Home
          </button>
        </Fade>
      );
    }
    if (!viewingPast) {
      return (
        <Fade className="wrap">
          <h1>Join {game.name}</h1>
          <p className="sub">{title}</p>
          <form className="card" onSubmit={onJoin}>
            <label htmlFor="join-name">Your name</label>
            <input
              id="join-name"
              required
              maxLength={24}
              autoComplete="given-name"
              autoCapitalize="words"
              enterKeyHint="go"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Dad"
            />
            {error ? <p className="err">{error}</p> : null}
            <button className="btn" disabled={busy || !joinName.trim()}>
              Join room
            </button>
          </form>
          <InstallPrompt />
        </Fade>
      );
    }
  }

  const showBoard =
    viewingPast ||
    game.status === "finished" ||
    (board && game.status !== "lobby" && !viewingPast && selected.current);

  if (me && game.status === "lobby" && selected.current && !viewingPast) {
    return (
      <Fade className="wrap">
        <Header game={game} />
        <RoundChrome id={id} game={game} selected={selected.index} />
        <div className="card">
          <strong>Players</strong>
          <ul className="list">
            {game.players.map((p) => (
              <li key={p.id}>
                <span>{p.name}</span>
                <span className="meta">{p.id === game.hostId ? "host" : ""}</span>
              </li>
            ))}
          </ul>
          <button className="btn ghost" type="button" onClick={() => void copyInvite()}>
            {copied ? "Copied invite link" : "Copy invite link"}
          </button>
          {copied ? <p className="copyok">{inviteUrl(id)}</p> : null}
          {playerId === game.hostId ? (
            <button className="btn" disabled={busy} onClick={() => void onStart()}>
              Start round
            </button>
          ) : (
            <p className="sub">Waiting for host to start…</p>
          )}
        </div>
        <InstallPrompt />
        {error ? <p className="err">{error}</p> : null}
      </Fade>
    );
  }

  if (showBoard) {
    const currentFinished = selected.current && game.status === "finished";
    return (
      <Fade className="wrap hasbar">
        <div className="holehead">
          <div className="num">{currentFinished ? "Round over" : "Scorecard"}</div>
          <div className="meta">
            {formatLabel(selected.nines)} · {TEE_LABEL[selected.tee]} · {game.name}
          </div>
        </div>
        <RoundChrome id={id} game={game} selected={selected.index} />
        <StickyLive view={selected} />
        {currentFinished && me && playerId === game.hostId ? (
          <div className="card">
            <strong>Start next round</strong>
            <p className="sub">Same invite. Pick 9 or 18, or reuse this setup.</p>
            <SetupFields value={nextSetup} onChange={setNextSetup} />
            {error ? <p className="err">{error}</p> : null}
            <button className="btn" disabled={busy} onClick={() => void onNextRound()}>
              {busy ? "Starting…" : "Start next round"}
            </button>
          </div>
        ) : null}
        {currentFinished && me && playerId !== game.hostId ? (
          <p className="sub">Waiting for host to start the next round…</p>
        ) : null}
        <Board view={selected} locked={selected.status === "finished"} />
        <div className="thumbbar">
          {viewingPast || game.status === "scoring" ? (
            <button className="btn" type="button" onClick={() => go(`/g/${id}`)}>
              {game.status === "lobby" ? "Lobby" : "Play"}
            </button>
          ) : (
            <button className="btn" type="button" onClick={() => go("/")}>
              Home
            </button>
          )}
        </div>
      </Fade>
    );
  }

  const mine = game.scores[playerId] ?? [];
  const groups = game.nines.map((nine, i) => ({
    nine,
    holes: layoutHoles(game.nines).filter((h) => h.nine === nine && Math.floor((h.hole - 1) / 9) === i),
  }));

  return (
    <Fade className="wrap play hasbar">
      <AnimatePresence mode="wait">
        <motion.div key={def.hole} className="holehead" {...holeSlide}>
          <div className="num">
            Hole {def.hole}
            {holes === 18 ? <span className="ninetag">{COURSE[def.nine].label}</span> : null}
          </div>
          <div className="meta">
            Par {def.par} · {def.yards[game.tee]} yds
          </div>
        </motion.div>
      </AnimatePresence>

      <GreenMap
        green={getGreenCenter(def.nine, def.nineHole)}
        holeLabel={`${COURSE[def.nine].label} ${def.nineHole}`}
        location={location}
        onRequestLocation={location.request}
      />

      <div className="chipstack">
        {groups.map((g) => (
          <div key={`${g.nine}-${g.holes[0]?.hole}`} className="chipgroup">
            {holes === 18 ? <div className="chiplabel">{COURSE[g.nine].label}</div> : null}
            <div className="chips">
              {g.holes.map((h) => (
                <motion.button
                  key={h.hole}
                  type="button"
                  className={`hole ${hole === h.hole ? "on" : ""} ${mine.some((s) => s.hole === h.hole) ? "done" : ""}`}
                  whileTap={tap}
                  transition={tapSpring}
                  onClick={() => setHole(h.hole)}
                >
                  {h.hole}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={hole} className="card playcard" {...holeSlide}>
          <div className="strokes">
            <motion.button
              type="button"
              disabled={strokes <= 1}
              whileTap={tap}
              transition={tapSpring}
              onClick={() => setStrokes(strokes - 1)}
            >
              −
            </motion.button>
            <strong>{strokes}</strong>
            <motion.button
              type="button"
              disabled={strokes >= 15}
              whileTap={tap}
              transition={tapSpring}
              onClick={() => setStrokes(strokes + 1)}
            >
              +
            </motion.button>
          </div>

          <div className="toggles">
            {showFir ? (
              <motion.button
                type="button"
                className={`toggle ${fir ? "on" : ""}`}
                whileTap={tap}
                transition={tapSpring}
                onClick={() => setFir(!fir)}
              >
                FIR
              </motion.button>
            ) : null}
            <motion.button
              type="button"
              className={`toggle ${gir ? "on" : ""}`}
              whileTap={tap}
              transition={tapSpring}
              onClick={() => setGir(!gir)}
            >
              GIR
            </motion.button>
            <motion.button
              type="button"
              className={`toggle ${threePutt ? "on" : ""}`}
              whileTap={tap}
              transition={tapSpring}
              onClick={() => setThreePutt(!threePutt)}
            >
              3-putt
            </motion.button>
          </div>
          {error ? <p className="err">{error}</p> : null}
        </motion.div>
      </AnimatePresence>

      <div className="thumbbar">
        <motion.button
          className="btn ghost"
          type="button"
          whileTap={tap}
          transition={tapSpring}
          onClick={() => go(`/g/${id}/board`)}
        >
          Leaderboard
        </motion.button>
        <motion.button
          className="btn"
          disabled={busy}
          whileTap={tap}
          transition={tapSpring}
          onClick={() => void onSave()}
        >
          Next
        </motion.button>
      </div>
    </Fade>
  );
}

function Header({ game }: { game: GameState }) {
  return (
    <div className="top">
      <div>
        <h1>{game.name}</h1>
        <p className="sub">
          {formatLabel(game.nines)} · {TEE_LABEL[game.tee]} tees
        </p>
      </div>
      <button className="btn ghost small" type="button" onClick={() => go("/")}>
        Home
      </button>
    </div>
  );
}

function RoundChrome({ id, game, selected }: { id: string; game: GameState; selected: number }) {
  const rounds = listRounds(game);
  if (rounds.length < 2) return null;
  return (
    <>
      <div className="tabs">
        {rounds.map((r) => (
          <motion.button
            key={r.index}
            type="button"
            className={`tab ${r.index === selected ? "on" : ""}`}
            whileTap={tap}
            transition={tapSpring}
            onClick={() => enterRound(id, r)}
          >
            {tabLabel(r.index, rounds.length)}
          </motion.button>
        ))}
      </div>
      <div className="strip">
        {game.eventStandings.map((row) => (
          <span key={row.playerId}>
            {row.name} <span className="pts">{fmtPts(row.points)}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function StickyLive({ view }: { view: RoundView }) {
  return (
    <div className="stick">
      {view.leaderboard.map((row) => (
        <LiveLine key={row.playerId} row={row} />
      ))}
    </div>
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
    <div className="live">
      <div className="livemain">
        <strong>{row.name}</strong>
        <span>
          {live.thru} · {fmtToPar(live.toPar)}
        </span>
        {split ? (
          <span>
            FIR{" "}
            {focus.map((n, i) => (
              <span key={`f${n.nine}`} className={n.firCount >= FIR_BONUS_AT ? "fill" : undefined}>
                {i ? " · " : ""}
                {n.firCount}/{FIR_BONUS_AT}
              </span>
            ))}
          </span>
        ) : (
          <span className={firOn ? "fill" : undefined}>
            FIR {live.firCount}/{live.firTarget}
          </span>
        )}
        {split ? (
          <span>
            GIR{" "}
            {focus.map((n, i) => (
              <span key={`g${n.nine}`} className={n.girCount >= GIR_BONUS_AT ? "fill" : undefined}>
                {i ? " · " : ""}
                {n.girCount}/{GIR_BONUS_AT}
              </span>
            ))}
          </span>
        ) : (
          <span className={girOn ? "fill" : undefined}>
            GIR {live.girCount}/{live.girTarget}
          </span>
        )}
        <span>3P {live.threePutts}</span>
        {label ? <span className="livelabel">{label}</span> : null}
      </div>
      <div className="pts">{fmtPts(row.points.total)}</div>
    </div>
  );
}

function NineLine({ stat }: { stat: NineStats }) {
  return (
    <div className="nineline">
      <span>
        {COURSE[stat.nine].label} {stat.holesSubmitted}/9 · {stat.strokes || "—"} · {fmtToPar(stat.toPar)}{" "}
        <span className="pts">{fmtPts(stat.points.total)}</span>
      </span>
      {stat.fieldComplete || stat.points.total ? (
        <div className="breakdown">{breakdown(stat.points)}</div>
      ) : null}
    </div>
  );
}

function flag(on: boolean | null): string {
  if (on === null) return "—";
  return on ? "yes" : "·";
}

function Board({ view, locked = false }: { view: RoundView; locked?: boolean }) {
  const holes = layoutHoles(view.nines);
  return (
    <div className="card board">
      {view.leaderboard.map((row, i) => (
        <div key={row.playerId} className="cardscore">
          <div className="scorehead">
            <div>
              {i + 1}. {row.name}
              <div className="meta">
                {row.holesSubmitted}/{holes.length} · {row.strokes || "—"} · {fmtToPar(row.toPar)}
              </div>
              {row.nines.length > 1
                ? row.nines.map((n) => <NineLine key={n.nine} stat={n} />)
                : locked
                  ? <div className="breakdown">{breakdown(row.points)}</div>
                  : null}
            </div>
            <div className="pts">{fmtPts(row.points.total)} pts</div>
          </div>
          <ol className="audit">
            {holes.map((h) => {
              const s = view.scores[row.playerId]?.find((x) => x.hole === h.hole);
              if (!s) {
                return (
                  <li key={h.hole} className="auditrow empty">
                    <div className="auditmain">
                      <span className="audithole">{h.hole}</span>
                      <strong>·</strong>
                    </div>
                  </li>
                );
              }
              const mark = holeMark(s.strokes, h.par);
              const birdieEagle =
                mark === "birdie" || mark === "eagle" || mark === "albatross" ? mark : "";
              const fir = firApplies(h.par) ? s.fir : null;
              const delta = holeDelta(s, h.par);
              return (
                <li key={h.hole} className="auditrow">
                  <div className="auditmain">
                    <span className="audithole">{h.hole}</span>
                    <strong>{s.strokes}</strong>
                    {birdieEagle ? <span className="mark">{birdieEagle}</span> : null}
                    <span className="delta">{delta ? fmtPts(delta) : "0"}</span>
                  </div>
                  <div className="auditflags">
                    FIR {flag(fir)} · GIR {flag(s.gir)} · 3P {flag(s.threePutt)}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
