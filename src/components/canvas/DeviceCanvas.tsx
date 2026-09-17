import { useRef, useState, type DragEvent, type PointerEvent, type ReactNode } from "react";
import type { Connection, DeviceNode, DeviceType } from "../../types/site";
import type { SiteRuntime } from "../../hooks/useGenericSiteRuntime";
import { FiltrationPump } from "../FiltrationPump";
import { SolenoidValve } from "../SolenoidValve";
import { Sensor } from "../Sensor";
import { FiltrationTank } from "../FiltrationTank";
import { Pipe } from "../Pipe";
import { Alarm } from "../Alarm";
import { DEVICE_TYPE_MIME } from "./DevicePalette";

const VIEW_W = 1180;
const VIEW_H = 660;
const TANK_W = 180;
const TANK_H = 100;

const HALO_RADIUS: Record<Exclude<DeviceType, "tank">, number> = {
  pump: 50,
  valve: 40,
  alarm: 34,
  sensor: 24,
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function clientToViewBoxPoint(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = svg.getBoundingClientRect();
  const relX = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
  const relY = rect.height === 0 ? 0 : (clientY - rect.top) / rect.height;
  return { x: clamp(relX * VIEW_W, 20, VIEW_W - 20), y: clamp(relY * VIEW_H, 20, VIEW_H - 20) };
}

function isFlowing(device: DeviceNode | undefined, runtime: SiteRuntime): boolean {
  if (!device) return false;
  if (device.type === "pump" || device.type === "valve") return !!runtime[device.id]?.on;
  return true;
}

interface DeviceCanvasProps {
  devices: DeviceNode[];
  connections: Connection[];
  runtime: SiteRuntime;
  mode: "run" | "edit";
  selectedId: string | null;
  connecting: boolean;
  onSelect: (id: string | null) => void;
  onToggleDevice: (id: string) => void;
  onMoveDevice: (id: string, x: number, y: number) => void;
  onDropNewDevice: (type: DeviceType, x: number, y: number) => void;
  onDeviceConnectClick: (id: string) => void;
  onPipeClick: (connectionId: string) => void;
}

interface DragState {
  id: string;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
}

export function DeviceCanvas({
  devices,
  connections,
  runtime,
  mode,
  selectedId,
  connecting,
  onSelect,
  onToggleDevice,
  onMoveDevice,
  onDropNewDevice,
  onDeviceConnectClick,
  onPipeClick,
}: DeviceCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const byId = new Map(devices.map((d) => [d.id, d]));

  function positionOf(device: DeviceNode): { x: number; y: number } {
    return drag?.id === device.id ? { x: drag.x, y: drag.y } : { x: device.x, y: device.y };
  }

  function handlePointerDown(e: PointerEvent<SVGGElement>, device: DeviceNode) {
    if (mode !== "edit") return;
    e.stopPropagation();
    if (connecting) {
      onDeviceConnectClick(device.id);
      return;
    }
    onSelect(device.id);
    const svg = svgRef.current;
    if (!svg) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const start = clientToViewBoxPoint(svg, e.clientX, e.clientY);
    setDrag({ id: device.id, offsetX: device.x - start.x, offsetY: device.y - start.y, x: device.x, y: device.y });
  }

  function handlePointerMove(e: PointerEvent<SVGGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const point = clientToViewBoxPoint(svg, e.clientX, e.clientY);
    setDrag((prev) =>
      prev
        ? { ...prev, x: clamp(point.x + prev.offsetX, 20, VIEW_W - 20), y: clamp(point.y + prev.offsetY, 20, VIEW_H - 20) }
        : prev,
    );
  }

  function handlePointerUp() {
    setDrag((prev) => {
      if (prev) {
        const device = byId.get(prev.id);
        if (!device || device.x !== prev.x || device.y !== prev.y) onMoveDevice(prev.id, prev.x, prev.y);
      }
      return null;
    });
  }

  function handleDrop(e: DragEvent<SVGSVGElement>) {
    e.preventDefault();
    const type = e.dataTransfer.getData(DEVICE_TYPE_MIME) as DeviceType;
    if (!type) return;
    const svg = svgRef.current;
    if (!svg) return;
    const point = clientToViewBoxPoint(svg, e.clientX, e.clientY);
    onDropNewDevice(type, point.x, point.y);
  }

  function renderSelectionHalo(device: DeviceNode, pos: { x: number; y: number }) {
    if (mode !== "edit" || selectedId !== device.id) return null;
    if (device.type === "tank") {
      return (
        <rect
          x={pos.x - TANK_W / 2 - 6}
          y={pos.y - TANK_H / 2 - 6}
          width={TANK_W + 12}
          height={TANK_H + 12}
          rx={8}
          fill="none"
          stroke="#2fa8ff"
          strokeWidth={2}
          strokeDasharray="5 4"
        />
      );
    }
    return (
      <circle cx={pos.x} cy={pos.y} r={HALO_RADIUS[device.type]} fill="none" stroke="#2fa8ff" strokeWidth={2} strokeDasharray="5 4" />
    );
  }

  function renderDevice(device: DeviceNode) {
    const pos = positionOf(device);
    const rt = runtime[device.id];
    const editHandlers =
      mode === "edit"
        ? {
            onPointerDown: (e: PointerEvent<SVGGElement>) => handlePointerDown(e, device),
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerCancel: handlePointerUp,
          }
        : {};
    const toggle = mode === "run" ? () => onToggleDevice(device.id) : undefined;

    let content: ReactNode;
    switch (device.type) {
      case "pump":
        content = <FiltrationPump x={pos.x} y={pos.y} running={!!rt?.on} onToggle={toggle} />;
        break;
      case "valve":
        content = <SolenoidValve x={pos.x} y={pos.y} label={device.label} open={!!rt?.on} onToggle={toggle} />;
        break;
      case "alarm":
        content = <Alarm x={pos.x} y={pos.y} label={device.label} active={!!rt?.on} onToggle={toggle} />;
        break;
      case "sensor":
        content = (
          <Sensor
            x={pos.x}
            y={pos.y}
            tag={device.label}
            value={`${(rt?.value ?? 0).toFixed(1)} ${device.unit ?? "mA"}`}
            active
            leaderTo={{ x: pos.x, y: pos.y + 30 }}
          />
        );
        break;
      case "tank":
        content = (
          <FiltrationTank
            x={pos.x - TANK_W / 2}
            y={pos.y - TANK_H / 2}
            width={TANK_W}
            height={TANK_H}
            title={device.label}
            micron="--"
            level={rt?.level ?? 0}
            filling={false}
          />
        );
        break;
    }

    return (
      <g key={device.id} {...editHandlers} style={{ cursor: mode === "edit" ? (connecting ? "crosshair" : "grab") : undefined }}>
        {content}
        {renderSelectionHalo(device, pos)}
      </g>
    );
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full h-full"
      style={{ minHeight: 520 }}
      onPointerDown={() => mode === "edit" && !connecting && onSelect(null)}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={handleDrop}
    >
      <defs>
        <marker id="pipe-arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill="#2ee66b" />
        </marker>
        <marker id="pipe-arrow-inactive" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill="#3a4d5c" />
        </marker>
        <pattern id="diagram-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24,0 L0,0 L0,24" fill="none" stroke="#182129" strokeWidth={1} />
        </pattern>
      </defs>

      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="#0a0f13" />
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="url(#diagram-grid)" />

      {connections.map((conn) => {
        const from = byId.get(conn.fromId);
        const to = byId.get(conn.toId);
        if (!from || !to) return null;
        const a = positionOf(from);
        const b = positionOf(to);
        const active = isFlowing(from, runtime) && isFlowing(to, runtime);
        return (
          <g
            key={conn.id}
            onPointerDown={(e) => {
              if (mode !== "edit") return;
              e.stopPropagation();
              onPipeClick(conn.id);
            }}
            className={mode === "edit" ? "cursor-pointer" : undefined}
          >
            <Pipe d={`M${a.x},${a.y} L${b.x},${b.y}`} active={active} />
          </g>
        );
      })}

      {devices.map(renderDevice)}

      {devices.length === 0 && (
        <text x={VIEW_W / 2} y={VIEW_H / 2} textAnchor="middle" fontSize={13} fontFamily="var(--font-mono)" fill="#6b8190">
          {mode === "edit" ? "Drag a device from the palette to get started" : "This site has no devices yet — switch to Edit to add some"}
        </text>
      )}
    </svg>
  );
}
