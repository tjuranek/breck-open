import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "breck-player-id";

let cached: string | null = null;

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function initPlayerId(): Promise<string> {
  if (cached) return cached;
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) {
    cached = existing;
    return existing;
  }
  const id = newId();
  cached = id;
  await AsyncStorage.setItem(KEY, id);
  return id;
}

export function getPlayerId(): string {
  if (!cached) throw new Error("Player id is not ready");
  return cached;
}
