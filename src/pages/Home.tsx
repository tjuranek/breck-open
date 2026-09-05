import { useState, type FormEvent } from "react";
import { createGame } from "../api.ts";
import { go } from "../App.tsx";
import { getPlayerId } from "../player.ts";
import { SetupFields, type SetupValue } from "../SetupFields.tsx";

export function Home() {
  const [playerName, setPlayerName] = useState("");
  const [name, setName] = useState("Breck Open");
  const [setup, setSetup] = useState<SetupValue>({ format: 9, nines: ["bear"], tee: "blue" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const game = await createGame({
        name,
        playerName,
        playerId: getPlayerId(),
        nines: setup.format === 18 ? setup.nines.slice(0, 2) : setup.nines.slice(0, 1),
        tee: setup.tee,
      });
      go(`/g/${game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create");
    } finally {
      setBusy(false);
    }
  }

  function onJoin(e: FormEvent) {
    e.preventDefault();
    const id = code.trim().replace(/^.*\/g\//, "").replace(/\/.*$/, "");
    if (!id) {
      setError("Paste an invite link or room code");
      return;
    }
    go(`/g/${id}`);
  }

  return (
    <div className="wrap">
      <h1>Breck Open</h1>
      <p className="sub">Breckenridge Golf Club · Bear / Beaver / Elk</p>

      <form className="card" onSubmit={onCreate}>
        <strong>Create a room</strong>
        <label htmlFor="player">Your name</label>
        <input
          id="player"
          required
          maxLength={24}
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="next"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Thomas"
        />
        <label htmlFor="game">Game name</label>
        <input id="game" value={name} onChange={(e) => setName(e.target.value)} />
        <SetupFields value={setup} onChange={setSetup} />
        {error ? <p className="err">{error}</p> : null}
        <button className="btn" disabled={busy || !playerName.trim()}>
          {busy ? "Creating…" : "Create game"}
        </button>
      </form>

      <form className="card" onSubmit={onJoin}>
        <strong>Join</strong>
        <label htmlFor="code">Invite link or code</label>
        <input
          id="code"
          value={code}
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="go"
          inputMode="text"
          onChange={(e) => setCode(e.target.value)}
          placeholder="https://…/g/ab12cd34"
        />
        <button className="btn ghost" type="submit">
          Open room
        </button>
      </form>
    </div>
  );
}
