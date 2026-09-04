const KEY = "breck-player-id";

export function getPlayerId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  document.cookie = `breck_player=${id};path=/;max-age=31536000;samesite=lax`;
  return id;
}
