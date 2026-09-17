import type { ReactNode } from "react";
import type { AnalogInputChannel, DeviceNode, OutputChannel } from "../../types/site";
import { ANALOG_INPUT_CHANNELS, OUTPUT_CHANNELS, RS485_BUS_ADDRESS_RANGE } from "../../config/boardIO";

interface DeviceInspectorProps {
  device: DeviceNode | null;
  devices: DeviceNode[];
  onChange: (id: string, patch: Partial<DeviceNode>) => void;
  onDelete: (id: string) => void;
}

const inputClass =
  "bg-scada-panel border border-scada-border rounded-md px-2.5 py-1.5 text-xs font-mono text-scada-text focus:outline-none focus:border-scada-blue w-full";

function Field({ label, children, warning }: { label: string; children: ReactNode; warning?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold tracking-widest uppercase text-scada-text-dim">{label}</span>
      {children}
      {warning && <span className="text-[10px] text-scada-red font-semibold uppercase tracking-wide">{warning}</span>}
    </label>
  );
}

export function DeviceInspector({ device, devices, onChange, onDelete }: DeviceInspectorProps) {
  if (!device) {
    return (
      <div className="panel-bevel rounded-lg p-4 lg:w-64 shrink-0 text-xs text-scada-text-dim">
        Select a device on the canvas to edit it, or drag a new one from the palette.
      </div>
    );
  }

  const outputConflict =
    device.outputChannel && devices.find((d) => d.id !== device.id && d.outputChannel === device.outputChannel);
  const inputConflict =
    device.inputChannel && devices.find((d) => d.id !== device.id && d.inputChannel === device.inputChannel);
  const busConflict =
    device.busAddress !== undefined && devices.find((d) => d.id !== device.id && d.busAddress === device.busAddress);

  return (
    <div className="panel-bevel rounded-lg p-4 lg:w-64 shrink-0 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest uppercase text-scada-blue">{device.type}</span>
        <button
          onClick={() => onDelete(device.id)}
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded border border-scada-red text-scada-red hover:bg-scada-red-dim/30 transition-colors"
        >
          Delete
        </button>
      </div>

      <Field label="Label">
        <input className={inputClass} value={device.label} onChange={(e) => onChange(device.id, { label: e.target.value })} />
      </Field>

      {device.type === "pump" && (
        <Field label="RS485 Bus Address" warning={busConflict ? `Already used by ${busConflict.label}` : undefined}>
          <input
            type="number"
            min={RS485_BUS_ADDRESS_RANGE.min}
            max={RS485_BUS_ADDRESS_RANGE.max}
            className={inputClass}
            value={device.busAddress ?? ""}
            onChange={(e) => onChange(device.id, { busAddress: Number(e.target.value) || undefined })}
          />
        </Field>
      )}

      {(device.type === "valve" || device.type === "alarm") && (
        <Field label="Output Channel" warning={outputConflict ? `Already used by ${outputConflict.label}` : undefined}>
          <select
            className={inputClass}
            value={device.outputChannel ?? ""}
            onChange={(e) => onChange(device.id, { outputChannel: (e.target.value || undefined) as OutputChannel | undefined })}
          >
            <option value="">Unassigned</option>
            {OUTPUT_CHANNELS.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </Field>
      )}

      {device.type === "sensor" && (
        <>
          <Field label="Analog Input" warning={inputConflict ? `Already used by ${inputConflict.label}` : undefined}>
            <select
              className={inputClass}
              value={device.inputChannel ?? ""}
              onChange={(e) =>
                onChange(device.id, { inputChannel: (e.target.value || undefined) as AnalogInputChannel | undefined })
              }
            >
              <option value="">Unassigned</option>
              {ANALOG_INPUT_CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Unit">
              <input
                className={inputClass}
                value={device.unit ?? "mA"}
                onChange={(e) => onChange(device.id, { unit: e.target.value })}
              />
            </Field>
            <Field label="Min">
              <input
                type="number"
                className={inputClass}
                value={device.rangeMin ?? 4}
                onChange={(e) => onChange(device.id, { rangeMin: Number(e.target.value) })}
              />
            </Field>
            <Field label="Max">
              <input
                type="number"
                className={inputClass}
                value={device.rangeMax ?? 20}
                onChange={(e) => onChange(device.id, { rangeMax: Number(e.target.value) })}
              />
            </Field>
          </div>
        </>
      )}

      {device.type === "tank" && (
        <Field label="Level Sensor">
          <select
            className={inputClass}
            value={device.levelSensorId ?? ""}
            onChange={(e) => onChange(device.id, { levelSensorId: e.target.value || undefined })}
          >
            <option value="">None (idle drift)</option>
            {devices
              .filter((d) => d.type === "sensor")
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
          </select>
        </Field>
      )}
    </div>
  );
}
