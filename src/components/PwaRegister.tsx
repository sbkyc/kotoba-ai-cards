"use client";

import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/site/paths";

export function PwaRegister() {
  const [offline, setOffline] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const updateOnlineStatus = () => setOffline(!navigator.onLine);
    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return undefined;
    let cancelled = false;
    navigator.serviceWorker.register(withBasePath("/sw.js"), { scope: withBasePath("/") }).then((registration) => {
      if (cancelled) return;
      if (registration.waiting) setWaitingWorker(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (!cancelled && worker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(worker);
          }
        });
      });
    }).catch(() => {
      // PWA support is optional; the app should keep working if registration fails.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateApp = () => {
    if (!waitingWorker) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
  };

  if (!offline && !waitingWorker) return null;

  return (
    <div className="pwa-toast" role="status" aria-live="polite">
      <span>{offline ? "当前离线，可继续使用已缓存页面。" : "发现新版本。"}</span>
      {waitingWorker ? <button type="button" onClick={updateApp}>更新</button> : null}
      <style jsx>{`
        .pwa-toast { position:fixed; right:14px; bottom:calc(70px + env(safe-area-inset-bottom)); z-index:80; display:flex; gap:10px; align-items:center; max-width:min(360px,calc(100vw - 28px)); border:1px solid var(--rule); border-radius:6px; background:var(--ink); padding:10px 12px; color:white; box-shadow:0 10px 30px rgba(0,0,0,.18); font-size:12px; }
        button { min-height:30px; border:1px solid rgba(255,255,255,.5); border-radius:6px; background:transparent; color:white; padding:0 10px; font-weight:700; }
      `}</style>
    </div>
  );
}
