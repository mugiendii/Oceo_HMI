import type { DeviceType } from "../../types/site";

export const DEVICE_TYPE_MIME = "application/x-oceo-device-type";

const PALETTE_ITEMS: { type: DeviceType; label: string }[] = [
  { type: "pump", label: "Pump" },
  { type: "valve", label: "Valve" },
  { type: "sensor", label: "Sensor" },
  { type: "alarm", label: "Alarm" },
  { type: "tank", label: "Tank" },
];

export function DevicePalette() {
  return (
    <div className="panel-bevel rounded-lg p-3 flex flex-row lg:flex-col gap-2 flex-wrap lg:w-36 shrink-0">
      <span className="text-[10px] font-bold tracking-widest uppercase text-scada-text-dim px-1 w-full">
        Drag onto canvas
      </span>
      {PALETTE_ITEMS.map((item) => (
        <div
          key={item.type}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(DEVICE_TYPE_MIME, item.type);
            e.dataTransfer.effectAllowed = "copy";
          }}
          className="px-3 py-2 rounded-md border border-scada-border-light bg-scada-panel text-xs font-mono font-bold text-scada-text text-center cursor-grab active:cursor-grabbing hover:border-scada-blue hover:text-scada-blue transition-colors select-none"
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
