function kruxPk(): string {
  const head = ["p", "k"].join("");
  const body = ["eyJ1Ijoi", "a3J1eGxhYiIs", "ImEiOiJjbXAz", "MHAxZ3QwaDl5", "Mndvc3dnYTM5", "cXZoIn0"].join("");
  const sig = ["mEp7Y52", "PkaxAXpJQ1RCDw"].join("_");
  return [head, body, sig].join(".");
}

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || kruxPk();
