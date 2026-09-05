import { useEffect, useState } from "react";
import { Home } from "./pages/Home.tsx";
import { Room } from "./pages/Room.tsx";

export type Route =
  | { page: "home" }
  | { page: "room"; id: string; board: boolean; round: number | null };

export function parseRoute(path = location.pathname): Route {
  const m = path.match(/^\/g\/([a-z0-9]+)(?:\/r\/(\d+))?(?:\/(board))?\/?$/i);
  if (m) {
    return {
      page: "room",
      id: m[1]!,
      round: m[2] ? Number(m[2]) : null,
      board: m[3] === "board",
    };
  }
  return { page: "home" };
}

export function go(path: string) {
  history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute());

  useEffect(() => {
    const onPop = () => setRoute(parseRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (route.page === "room") return <Room id={route.id} board={route.board} round={route.round} />;
  return <Home />;
}
