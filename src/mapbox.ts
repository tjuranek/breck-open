const KRUX_PK = ["pk", "eyJ1Ijoia3J1eGxhYiIsImEiOiJjbXAzMHAxZ3QwaDl5Mndvc3dnYTM5cXZoIn0", "mEp7Y52_PkaxAXpJQ1RCDw"].join(
  ".",
);

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || KRUX_PK;
