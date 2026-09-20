import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Registers the service worker only in real production deployments —
// never in the Lovable preview (id-preview--*) or localhost dev.
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (!import.meta.env.PROD) return;
    const host = window.location.hostname;
    if (host === "localhost" || host.startsWith("id-preview--")) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

export function InstallButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred) return null;

  return (
    <button
      onClick={async () => {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") setDeferred(null);
      }}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-lg border-2 border-input px-4 py-2 text-sm font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      }
    >
      <Download className="size-4" /> Instalar app
    </button>
  );
}
