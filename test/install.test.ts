import { describe, expect, it } from "vitest";
import {
  dismissIosCoach,
  iosCoachDismissed,
  isIosDevice,
  isStandalone,
  shouldShowAndroidInstall,
  shouldShowIosCoach,
} from "../src/install.ts";

describe("install detection", () => {
  it("treats standalone display-mode as installed", () => {
    expect(
      isStandalone({
        matchMedia: (q) => ({ matches: q.includes("standalone") }),
        navigator: {},
      }),
    ).toBe(true);
    expect(
      isStandalone({
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: true },
      }),
    ).toBe(true);
    expect(
      isStandalone({
        matchMedia: () => ({ matches: false }),
        navigator: {},
      }),
    ).toBe(false);
  });

  it("detects iPhone and iPad-as-Mac", () => {
    expect(isIosDevice({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)" })).toBe(true);
    expect(isIosDevice({ userAgent: "Mozilla/5.0", platform: "MacIntel", maxTouchPoints: 5 })).toBe(
      true,
    );
    expect(isIosDevice({ userAgent: "Mozilla/5.0 (Linux; Android 14)", platform: "Linux" })).toBe(
      false,
    );
  });

  it("shows Android install only when prompt exists and not installed", () => {
    expect(shouldShowAndroidInstall({ standalone: false, canPrompt: true })).toBe(true);
    expect(shouldShowAndroidInstall({ standalone: true, canPrompt: true })).toBe(false);
    expect(shouldShowAndroidInstall({ standalone: false, canPrompt: false })).toBe(false);
  });

  it("shows iOS coach only in Safari before install", () => {
    expect(shouldShowIosCoach({ standalone: false, ios: true, dismissed: false })).toBe(true);
    expect(shouldShowIosCoach({ standalone: true, ios: true, dismissed: false })).toBe(false);
    expect(shouldShowIosCoach({ standalone: false, ios: false, dismissed: false })).toBe(false);
    expect(shouldShowIosCoach({ standalone: false, ios: true, dismissed: true })).toBe(false);
  });

  it("persists iOS coach dismissal", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };
    expect(iosCoachDismissed(storage)).toBe(false);
    dismissIosCoach(storage);
    expect(iosCoachDismissed(storage)).toBe(true);
  });
});
