import { useEffect, useRef, useState } from "react";
import type { SerialLogEntry, SerialStatus } from "../serial/serialClient";

export interface SerialAction {
  key: string;
  label: string;
  onClick: () => Promise<void>;
  variant?: "default" | "primary";
}

interface SerialConsoleProps {
  status: SerialStatus;
  log: SerialLogEntry[];
  isSupported: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  actions: SerialAction[];
}

const STATUS_LABEL: Record<SerialStatus, string> = {
  unsupported: "Unsupported Browser",
  disconnected: "Disconnected",
  connecting: "Connecting…",
  connected: "Connected",
};

const STATUS_COLOR: Record<SerialStatus, string> = {
  unsupported: "text-scada-red",
  disconnected: "text-scada-text-dim",
  connecting: "text-scada-amber",
  connected: "text-scada-green",
};

export function SerialConsole({ status, log, isSupported, connect, disconnect, actions }: SerialConsoleProps) {
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Serial operation failed");
    }
  }

  const connected = status === "connected";

  return (
    <div className="panel-bevel rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs font-bold tracking-widest uppercase text-scada-text-dim">Serial Connection</h3>
        <span className={`text-[11px] font-bold tracking-widest uppercase ${STATUS_COLOR[status]}`}>
          ● {STATUS_LABEL[status]}
        </span>
      </div>

      {!isSupported && (
        <p className="text-xs text-scada-red">
          This browser doesn't support the Web Serial API. Open this page in Chrome or Edge over localhost/HTTPS to
          connect to a controller.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {connected ? (
          <button
            onClick={() => run(disconnect)}
            className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border border-scada-red text-scada-red hover:bg-scada-red-dim/30 transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => run(connect)}
            disabled={!isSupported || status === "connecting"}
            title={isSupported ? undefined : "Web Serial isn't supported in this browser"}
            className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border transition-colors ${
              isSupported && status !== "connecting"
                ? "border-scada-blue text-scada-blue hover:bg-scada-blue-dim/30"
                : "border-scada-border text-scada-text-dim cursor-not-allowed"
            }`}
          >
            Connect to Controller
          </button>
        )}
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={() => run(a.onClick)}
            disabled={!connected}
            title={connected ? undefined : "Connect to a controller first"}
            className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border transition-colors ${
              connected
                ? a.variant === "primary"
                  ? "border-scada-green text-scada-green hover:bg-scada-green-dim/30"
                  : "border-scada-border-light text-scada-text hover:border-scada-text-dim"
                : "border-scada-border text-scada-text-dim cursor-not-allowed"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {!connected && (
        <p className="text-[11px] text-scada-text-dim -mt-2">Connect to a controller to enable the actions above.</p>
      )}

      {error && <p className="text-xs text-scada-red">{error}</p>}

      <div>
        <div className="text-[10px] font-bold tracking-widest uppercase text-scada-text-dim mb-1.5">
          Wire Log
        </div>
        <div
          ref={logRef}
          className="h-40 overflow-y-auto rounded-md border border-scada-border bg-scada-bg/60 px-3 py-2 font-mono text-[11px] flex flex-col gap-0.5"
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
