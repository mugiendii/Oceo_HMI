import { useEffect } from "react";
import type { NetConfig, NetMode, NetPriority } from "../types/network";
import type { SerialLogEntry, SerialStatus } from "../serial/serialClient";
import type { NetStatusResponse } from "../serial/protocol";
import { SerialConsole } from "./SerialConsole";

interface NetworkConfigPageProps {
  config: NetConfig;
  onSetField: <K extends keyof NetConfig>(key: K, value: NetConfig[K]) => void;
  onLoadFromDevice: (net: NetConfig) => void;
  onReset: () => void;
  serial: {
    status: SerialStatus;
    log: SerialLogEntry[];
    isSupported: boolean;
    netStatus: NetStatusResponse | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    requestNetConfig: () => Promise<void>;
    sendNetConfig: (cfg: NetConfig) => Promise<void>;
    saveConfig: () => Promise<void>;
  };
}

const MODE_OPTIONS: { value: NetMode; label: string }[] = [
  { value: "00", label: "Offline" },
  { value: "01", label: "4G Only" },
  { value: "10", label: "LoRaWAN Only" },
  { value: "11", label: "Both (Failover)" },
];

function ModeToggle({ value, onChange }: { value: NetMode; onChange: (v: NetMode) => void }) {
  return (
    <div className="inline-flex rounded-md border border-scada-border overflow-hidden flex-wrap">
      {MODE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${
            value === opt.value
              ? "bg-scada-blue-dim text-scada-blue"
              : "bg-scada-panel text-scada-text-dim hover:text-scada-text"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PriorityToggle({ value, onChange }: { value: NetPriority; onChange: (v: NetPriority) => void }) {
  return (
    <div className="inline-flex rounded-md border border-scada-border overflow-hidden">
      {(["4g", "lora"] as const).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${
            value === opt
              ? "bg-scada-blue-dim text-scada-blue"
              : "bg-scada-panel text-scada-text-dim hover:text-scada-text"
          }`}
        >
          {opt === "4g" ? "4G Primary" : "LoRaWAN Primary"}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  monospace,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  monospace?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold tracking-widest uppercase text-scada-text-dim">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-scada-panel border border-scada-border rounded-md px-2.5 py-1.5 text-xs text-scada-text focus:outline-none focus:border-scada-blue ${
          monospace ? "font-mono" : ""
        }`}
      />
    </label>
  );
}

function StatusPill({ label, online, shown }: { label: string; online: boolean; shown: boolean }) {
  if (!shown) return null;
  return (
    <span
      className={`text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${
        online ? "text-scada-green" : "text-scada-amber"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${online ? "bg-scada-green" : "bg-scada-amber"}`} />
      {label} {online ? "Online" : "Offline"}
    </span>
  );
}

export function NetworkConfigPage({ config, onSetField, onLoadFromDevice, onReset, serial }: NetworkConfigPageProps) {
  // Device is the source of truth once it answers -- same idea as
  // availablePins replacing the I/O page's default pin dropdown.
  useEffect(() => {
    const net = serial.netStatus;
    if (!net) return;
    onLoadFromDevice({
      mode: net.mode,
      apn: net.apn,
      devEui: net.devEui,
      joinEui: net.joinEui,
      appKey: net.appKey,
      region: net.region,
      adr: net.adr,
      priority: net.priority,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serial.netStatus]);

  const needs4G = config.mode === "01" || config.mode === "11";
  const needsLoRaWAN = config.mode === "10" || config.mode === "11";
  const needsPriority = config.mode === "11";

  return (
    <div className="flex flex-col gap-5">
      <div className="panel-bevel rounded-lg px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-xs text-scada-text-dim">
          Choose which network stack(s) are active and their credentials. Mode "Both" is failover, not concurrent
          publishing -- both stacks stay connected, but only the priority one publishes while it's up.
        </span>
        <button
          onClick={onReset}
          className="text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded border border-scada-border-light text-scada-text-dim hover:text-scada-text hover:border-scada-text-dim transition-colors shrink-0"
        >
          Reset to Defaults
        </button>
      </div>

      <SerialConsole
        status={serial.status}
        log={serial.log}
        isSupported={serial.isSupported}
        connect={serial.connect}
        disconnect={serial.disconnect}
        actions={[
          { key: "get", label: "Request Current Config", onClick: serial.requestNetConfig },
          { key: "send", label: "Send Configuration", onClick: () => serial.sendNetConfig(config), variant: "primary" },
          { key: "save", label: "Save to Flash", onClick: serial.saveConfig },
        ]}
      />

      <div className="panel-bevel rounded-lg p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xs font-bold tracking-widest uppercase text-scada-text-dim">Network Mode</h3>
          <div className="flex items-center gap-4">
            <StatusPill label="4G" online={!!serial.netStatus?.status.a7672} shown={needs4G} />
            <StatusPill label="LoRaWAN" online={!!serial.netStatus?.status.lorawan} shown={needsLoRaWAN} />
          </div>
        </div>

        <ModeToggle value={config.mode} onChange={(v) => onSetField("mode", v)} />

        {needsPriority && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-widest uppercase text-scada-text-dim">
              Priority (publishes while up; the other is the fallback)
            </span>
            <PriorityToggle value={config.priority} onChange={(v) => onSetField("priority", v)} />
          </div>
        )}

        {needs4G && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <Field label="APN" value={config.apn} onChange={(v) => onSetField("apn", v)} placeholder="e.g. safaricom" />
          </div>
        )}

        {needsLoRaWAN && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Dev EUI (16 hex)"
                value={config.devEui}
                onChange={(v) => onSetField("devEui", v)}
                monospace
              />
              <Field
                label="Join EUI / App EUI (16 hex)"
                value={config.joinEui}
                onChange={(v) => onSetField("joinEui", v)}
                monospace
              />
              <Field
                label="App Key (32 hex)"
                value={config.appKey}
                onChange={(v) => onSetField("appKey", v)}
                monospace
              />
              <Field label="Region" value={config.region} onChange={(v) => onSetField("region", v)} placeholder="EU868" />
            </div>
            <label className="flex items-center gap-2 text-xs text-scada-text">
              <input
                type="checkbox"
                checked={config.adr === 1}
                onChange={(e) => onSetField("adr", e.target.checked ? 1 : 0)}
              />
              ADR (adaptive data rate) enabled
            </label>
          </div>
        )}

        {config.mode === "00" && (
          <p className="text-xs text-scada-text-dim">Offline -- no network fields required.</p>
        )}
      </div>
    </div>
  );
}
