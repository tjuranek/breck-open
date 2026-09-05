const IOS_DISMISS_KEY = "breck-ios-install-dismissed";

export type InstallHost = {
  matchMedia?: (query: string) => { matches: boolean };
  navigator: object;
};

export function isStandalone(win: InstallHost): boolean {
  if ((win.navigator as { standalone?: boolean }).standalone === true) return true;
  return (
    win.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    win.matchMedia?.("(display-mode: fullscreen)")?.matches === true
  );
}

export function isIosDevice(nav: {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
}): boolean {
  if (/iPad|iPhone|iPod/i.test(nav.userAgent)) return true;
  return nav.platform === "MacIntel" && (nav.maxTouchPoints ?? 0) > 1;
}

export function shouldShowAndroidInstall(opts: { standalone: boolean; canPrompt: boolean }): boolean {
  return !opts.standalone && opts.canPrompt;
}

export function shouldShowIosCoach(opts: {
  standalone: boolean;
  ios: boolean;
  dismissed: boolean;
}): boolean {
  return opts.ios && !opts.standalone && !opts.dismissed;
}

export function iosCoachDismissed(storage: Pick<Storage, "getItem">): boolean {
  return storage.getItem(IOS_DISMISS_KEY) === "1";
}

export function dismissIosCoach(storage: Pick<Storage, "setItem">): void {
  storage.setItem(IOS_DISMISS_KEY, "1");
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
