import { useEffect, useState } from "react";
import {
  dismissIosCoach,
  iosCoachDismissed,
  isIosDevice,
  isStandalone,
  shouldShowAndroidInstall,
  shouldShowIosCoach,
  type BeforeInstallPromptEvent,
} from "./install.ts";

export function useInstall() {
  const [standalone, setStandalone] = useState(() => isStandalone(window));
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => iosCoachDismissed(localStorage));
  const ios = isIosDevice(navigator);

  useEffect(() => {
    const onBip = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setStandalone(true);
    };
    const onMode = () => setStandalone(isStandalone(window));
    const mq = window.matchMedia("(display-mode: standalone)");
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    mq.addEventListener("change", onMode);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener("change", onMode);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === "accepted") setStandalone(true);
  }

  function dismissIos() {
    dismissIosCoach(localStorage);
    setDismissed(true);
  }

  return {
    android: shouldShowAndroidInstall({ standalone, canPrompt: Boolean(promptEvent) }),
    iosCoach: shouldShowIosCoach({ standalone, ios, dismissed }),
    install,
    dismissIos,
  };
}

export function InstallPrompt() {
  const inst = useInstall();

  if (inst.android) {
    return (
      <div className="card install">
        <strong>Install app</strong>
        <p className="sub">Home screen, full screen, no browser chrome.</p>
        <button className="btn" type="button" onClick={() => void inst.install()}>
          Install app
        </button>
      </div>
    );
  }

  if (inst.iosCoach) {
    return (
      <div className="card install">
        <strong>Add to Home Screen</strong>
        <p className="sub">Tap Share, then Add to Home Screen. Opens full screen next time.</p>
        <button className="btn ghost" type="button" onClick={inst.dismissIos}>
          Got it
        </button>
      </div>
    );
  }

  return null;
}
