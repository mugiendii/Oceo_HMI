import { useEffect, useRef, useState } from "react";
import type { LiveLogEntry, LiveStatus } from "../live/liveClient";

interface LiveRelayPanelProps {
  status: LiveStatus;
  log: LiveLogEntry[];
  connect: (url: string) => Promise<void>;
  disconnect: () => void;
}

const STORAGE_KEY = "oceo-hmi-relay-url";
const DEFAULT_URL = "ws://127.0.0.1:8766";

const STATUS_LABEL: Record<LiveStatus, string> = {
  disconnected: "Disconnected",
  connecting: "Connecting…",
  connected: "Live",
};

const STATUS_COLOR: Record<LiveStatus, string> = {
  disconnected: "text-scada-text-dim",
  connecting: "text-scada-amber",
  connected: "text-scada-green",
};

export function LiveRelayPanel({ status, log, connect, disconnect }: LiveRelayPanelProps) {
  const [url, setUrl] = useState(() => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_URL);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const connected = status === "connected";

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, url);
  }, [url]);

  async function handleConnect() {
    setError(null);
    try {
      await connect(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to relay");
    }
  }

  return (
    <div className="panel-bevel rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs font-bold tracking-widest uppercase text-scada-text-dim">Live Relay Connection</h3>
        <span className={`text-[11px] font-bold tracking-widest uppercase ${STATUS_COLOR[status]}`}>
          ● {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={connected}
          placeholder="ws://host:8766"
          className="bg-scada-panel border border-scada-border rounded-md px-2.5 py-1.5 text-xs font-mono text-scada-text focus:outline-none focus:border-scada-blue flex-1 min-w-[220px] disabled:opacity-60"
        />
        {connected ? (
          <button
            onClick={disconnect}
            className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border border-scada-red text-scada-red hover:bg-scada-red-dim/30 transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={status === "connecting"}
            className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border transition-colors ${
              status !== "connecting"
                ? "border-scada-blue text-scada-blue hover:bg-scada-blue-dim/30"
                : "border-scada-border text-scada-text-dim cursor-not-allowed"
            }`}
          >
            Connect
          </button>
        )}
      </div>

      {error && <p className="text-xs text-scada-red">{error}</p>}

      <div>
        <div className="text-[10px] font-bold tracking-widest uppercase text-scada-text-dim mb-1.5">Wire Log</div>
        <div
          ref={logRef}
          className="h-32 overflow-y-auto rounded-md border border-scada-border bg-scada-bg/60 px-3 py-2 font-mono text-[11px] flex flex-col gap-0.5"
        >
          {log.length === 0 && <span className="text-scada-text-dim">No traffic yet.</span>}
          {log.map((entry) => (
            <div key={entry.id} className="flex gap-2">
              <span className="text-scada-text-dim shrink-0">
                {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false })}
              </span>
              <span className={`shrink-0 font-bold ${entry.direction === "tx" ? "text-scada-blue" : "text-scada-green"}`}>
                {entry.direction === "tx" ? "TX →" : "RX ←"}
              </span>
              <span className="text-scada-text break-all">{entry.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
