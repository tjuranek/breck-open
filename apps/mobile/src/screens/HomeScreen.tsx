import { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { createGame } from "../api.ts";
import { SetupFields, type SetupValue } from "../components/SetupFields.tsx";
import { Button, Card, Err, Field, Label, Screen, Sub, Title } from "../components/ui.tsx";
import { parseInvite } from "../format.ts";
import { getPlayerId } from "../player.ts";
import { colors } from "../theme.ts";

export function HomeScreen() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [name, setName] = useState("Breck Open");
  const [setup, setSetup] = useState<SetupValue>({ format: 9, nines: ["bear"], tee: "blue" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onCreate() {
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
      router.push(`/g/${game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create");
    } finally {
      setBusy(false);
    }
  }

  function onJoin() {
    const id = parseInvite(code);
    if (!id) {
      setError("Paste an invite link or room code");
      return;
    }
    router.push(`/g/${id}`);
  }

  return (
    <Screen>
      <Title>Breck Open</Title>
      <Sub>Breckenridge Golf Club · Bear / Beaver / Elk</Sub>

      <Card>
        <Text style={{ color: colors.fg, fontWeight: "800", fontSize: 17 }}>Create a room</Text>
        <Label>Your name</Label>
        <Field
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="Thomas"
          maxLength={24}
          autoCapitalize="words"
          autoComplete="given-name"
          returnKeyType="next"
        />
        <Label>Game name</Label>
        <Field value={name} onChangeText={setName} />
        <SetupFields value={setup} onChange={setSetup} />
        <Err>{error}</Err>
        <Button disabled={busy || !playerName.trim()} onPress={() => void onCreate()}>
          {busy ? "Creating…" : "Create game"}
        </Button>
      </Card>

      <Card>
        <Text style={{ color: colors.fg, fontWeight: "800", fontSize: 17 }}>Join</Text>
        <Label>Invite link or code</Label>
        <Field
          value={code}
          onChangeText={setCode}
          placeholder="ab12cd34"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={onJoin}
        />
        <Button ghost onPress={onJoin}>
          Open room
        </Button>
      </Card>
    </Screen>
  );
}
