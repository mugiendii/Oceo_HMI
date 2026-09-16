import type { IOPointConfig, SignalType } from "../types/io";
import type { SerialLogEntry, SerialStatus } from "../serial/serialClient";
import { AVAILABLE_PINS } from "../config/ioDefaults";
import { SerialConsole } from "./SerialConsole";

interface IOConfigPageProps {
  points: IOPointConfig[];
  onSetSignalType: (id: string, signalType: SignalType) => void;
  onSetPin: (id: string, pin: string) => void;
  onReset: () => void;
  serial: {
    status: SerialStatus;
    log: SerialLogEntry[];
    isSupported: boolean;
    availablePins: string[] | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    requestPins: () => Promise<void>;
    sendConfig: (points: IOPointConfig[]) => Promise<void>;
    saveConfig: () => Promise<void>;
  };
}

function SignalTypeToggle({ value, onChange }: { value: SignalType; onChange: (v: SignalType) => void }) {
  return (
    <div className="inline-flex rounded-md border border-scada-border overflow-hidden">
      {(["digital", "analog"] as const).map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase transition-colors ${
            value === option
              ? "bg-scada-blue-dim text-scada-blue"
              : "bg-scada-panel text-scada-text-dim hover:text-scada-text"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function IOTable({
  title,
  points,
  pinCounts,
  pinOptions,
  onSetSignalType,
  onSetPin,
}: {
  title: string;
  points: IOPointConfig[];
  pinCounts: Map<string, number>;
  pinOptions: string[];
  onSetSignalType: (id: string, signalType: SignalType) => void;
  onSetPin: (id: string, pin: string) => void;
}) {
  return (
    <div className="panel-bevel rounded-lg p-5">
      <h3 className="text-xs font-bold tracking-widest uppercase text-scada-text-dim mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[10px] font-bold tracking-widest uppercase text-scada-text-dim border-b border-scada-border">
              <th className="text-left py-2 pr-3">Point</th>
              <th className="text-left py-2 pr-3">Description</th>
              <th className="text-left py-2 pr-3">Signal Type</th>
              <th className="text-left py-2">Connection Pin</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => {
              const conflict = (pinCounts.get(point.pin) ?? 0) > 1;
              return (
                <tr key={point.id} className="border-b border-scada-border/60">
                  <td className="py-2.5 pr-3 font-mono font-bold text-scada-text">{point.name}</td>
                  <td className="py-2.5 pr-3 text-scada-text-dim">{point.description}</td>
                  <td className="py-2.5 pr-3">
                    <SignalTypeToggle value={point.signalType} onChange={(v) => onSetSignalType(point.id, v)} />
                  </td>
                  <td className="py-2.5">
                    <select
                      value={point.pin}
                      onChange={(e) => onSetPin(point.id, e.target.value)}
                      className={`bg-scada-panel border rounded-md px-2 py-1 text-xs font-mono focus:outline-none ${
                        conflict ? "border-scada-red text-scada-red" : "border-scada-border text-scada-text"
                      }`}
                    >
                      {pinOptions.map((pin) => (
                        <option key={pin} value={pin}>
                          {pin}
                        </option>
                      ))}
                    </select>
                    {conflict && (
                      <div className="text-[10px] text-scada-red mt-1 font-semibold tracking-wide uppercase">
                        Pin already assigned
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function IOConfigPage({ points, onSetSignalType, onSetPin, onReset, serial }: IOConfigPageProps) {
  const pinCounts = new Map<string, number>();
  for (const p of points) pinCounts.set(p.pin, (pinCounts.get(p.pin) ?? 0) + 1);

  const pinOptions = serial.availablePins ?? AVAILABLE_PINS;
  const inputs = points.filter((p) => p.direction === "input");
  const outputs = points.filter((p) => p.direction === "output");

  return (
    <div className="flex flex-col gap-5">
      <div className="panel-bevel rounded-lg px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-xs text-scada-text-dim">
          Map each field I/O point to a signal type and controller pin
          {serial.availablePins
            ? " — pin list below was reported live by the connected controller."
            : ". This assignment is stored locally and is ready to hand off once the PLC/controller is wired up."}
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
          { key: "pins", label: "Request Available Pins", onClick: serial.requestPins },
          { key: "send", label: "Send Configuration", onClick: () => serial.sendConfig(points), variant: "primary" },
          { key: "save", label: "Save to Flash", onClick: serial.saveConfig },
        ]}
      />

      <IOTable
        title={`Inputs (${inputs.length})`}
        points={inputs}
        pinCounts={pinCounts}
        pinOptions={pinOptions}
        onSetSignalType={onSetSignalType}
        onSetPin={onSetPin}
      />
      <IOTable
        title={`Outputs (${outputs.length})`}
        points={outputs}
        pinCounts={pinCounts}
        pinOptions={pinOptions}
        onSetSignalType={onSetSignalType}
        onSetPin={onSetPin}
      />
    </div>
  );
}
