import { useState } from "react";
import type { DeviceNode, DeviceType, DeviceWithSite, Site } from "../types/site";
import type { FlowHub } from "../types/flowHub";
import type { SiteRuntime } from "../hooks/useGenericSiteRuntime";
import type { RuleContext } from "../rules/types";
import { DeviceCanvas } from "./canvas/DeviceCanvas";
import { DevicePalette } from "./canvas/DevicePalette";
import { DeviceInspector } from "./canvas/DeviceInspector";
import { RulesPage } from "./RulesPage";
import { uid } from "../lib/uid";
import { DEFAULT_ANALOG_RANGE } from "../config/boardIO";

export type CanvasMode = "run" | "edit";

interface GenericSiteShellProps {
  site: Site;
  view: "diagram" | "automation";
  onUpdateSite: (updater: (site: Site) => Site) => void;
  hubs: FlowHub[];
  allDevices: DeviceWithSite[];
  /** Everything below is owned and kept ticking by SiteEngine, which mounts
   * this shell only while its site is the one actually on screen -- see
   * components/SiteEngine.tsx for why the runtime/rule-engine ownership
   * moved out of this component. */
  runtime: SiteRuntime;
  toggleDevice: (id: string) => void;
  ruleCtx: RuleContext;
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
}

/**
 * The interactive view for one generic site's Process Diagram / Automation
 * tabs. Purely a controlled view: the runtime tick, rule engine, and
 * run/edit mode all live in the always-mounted SiteEngine that renders this
 * component, so switching away and back doesn't reset or pause any of it.
 */
export function GenericSiteShell({ site, view, onUpdateSite, hubs, allDevices, runtime, toggleDevice, ruleCtx, mode, onModeChange }: GenericSiteShellProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);

  const selectedDevice = site.devices.find((d) => d.id === selectedId) ?? null;

  function handleDropNewDevice(type: DeviceType, x: number, y: number) {
    const count = site.devices.filter((d) => d.type === type).length + 1;
    const label = `${type.charAt(0).toUpperCase()}${type.slice(1)} ${count}`;
    const newDevice: DeviceNode = {
      id: uid(type),
      type,
      label,
      x,
      y,
      ...(type !== "tank" ? { hubId: site.defaultHubId } : {}),
      ...(type === "sensor" ? { unit: DEFAULT_ANALOG_RANGE.unit, rangeMin: DEFAULT_ANALOG_RANGE.min, rangeMax: DEFAULT_ANALOG_RANGE.max } : {}),
    };
    onUpdateSite((s) => ({ ...s, devices: [...s.devices, newDevice] }));
    setSelectedId(newDevice.id);
  }

  function handleMoveDevice(id: string, x: number, y: number) {
    onUpdateSite((s) => ({ ...s, devices: s.devices.map((d) => (d.id === id ? { ...d, x, y } : d)) }));
  }

  function handleChangeDevice(id: string, patch: Partial<DeviceNode>) {
    onUpdateSite((s) => ({ ...s, devices: s.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  }

  function handleDeleteDevice(id: string) {
    onUpdateSite((s) => {
      const devices = s.devices.filter((d) => d.id !== id).map((d) => (d.levelSensorId === id ? { ...d, levelSensorId: undefined } : d));
      const connections = s.connections.filter((c) => c.fromId !== id && c.toId !== id);
      const rules = s.rules
        .filter((r) => r.condition.sensorId !== id)
        .map((r) => ({ ...r, actions: r.actions.filter((a) => a.actuatorId !== id) }));
      return { ...s, devices, connections, rules };
    });
    setSelectedId(null);
  }

  function handleDeviceConnectClick(id: string) {
    if (!connectFromId) {
      setConnectFromId(id);
      return;
    }
    if (connectFromId !== id) {
      onUpdateSite((s) => ({ ...s, connections: [...s.connections, { id: uid("conn"), fromId: connectFromId, toId: id }] }));
    }
    setConnectFromId(null);
    setConnecting(false);
  }

  function handlePipeClick(connectionId: string) {
    onUpdateSite((s) => ({ ...s, connections: s.connections.filter((c) => c.id !== connectionId) }));
  }

  if (view === "automation") {
    return <RulesPage rules={site.rules} ctx={ruleCtx} onChangeRules={(rules) => onUpdateSite((s) => ({ ...s, rules }))} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="panel-bevel rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-md border border-scada-border overflow-hidden">
          {(["run", "edit"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                onModeChange(m);
                setConnecting(false);
                setConnectFromId(null);
                if (m === "run") setSelectedId(null);
              }}
              className={`px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${
                mode === m ? "bg-scada-blue-dim text-scada-blue" : "bg-scada-panel text-scada-text-dim hover:text-scada-text"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {mode === "edit" && (
          <button
            onClick={() => {
              setConnecting((c) => !c);
              setConnectFromId(null);
            }}
            className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border transition-colors ${
              connecting ? "border-scada-blue text-scada-blue bg-scada-blue-dim/30" : "border-scada-border-light text-scada-text-dim hover:text-scada-text"
            }`}
          >
            {connecting ? (connectFromId ? "Click second device…" : "Click first device…") : "Connect Devices"}
          </button>
        )}
        {mode === "edit" && (
          <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-scada-text-dim">
            Primary Hub
            <select
              value={site.defaultHubId ?? ""}
              onChange={(e) => onUpdateSite((s) => ({ ...s, defaultHubId: e.target.value || undefined }))}
              className="bg-scada-panel border border-scada-border rounded-md px-2 py-1 text-[11px] font-mono normal-case text-scada-text focus:outline-none focus:border-scada-blue"
            >
              <option value="">Unassigned</option>
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="text-xs text-scada-text-dim">
          {mode === "edit"
            ? "Drag devices from the palette onto the canvas, drag to reposition, click to configure."
            : "Click a pump, valve, or alarm to toggle it — same as the original diagram."}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        {mode === "edit" && <DevicePalette />}
        <div className="panel-bevel rounded-lg p-5 flex-1 min-w-0">
          <DeviceCanvas
            devices={site.devices}
            connections={site.connections}
            runtime={runtime}
            mode={mode}
            selectedId={selectedId}
            connecting={connecting}
            onSelect={setSelectedId}
            onToggleDevice={toggleDevice}
            onMoveDevice={handleMoveDevice}
            onDropNewDevice={handleDropNewDevice}
            onDeviceConnectClick={handleDeviceConnectClick}
            onPipeClick={handlePipeClick}
          />
        </div>
        {mode === "edit" && (
          <DeviceInspector
            device={selectedDevice}
            devices={site.devices}
            allDevices={allDevices}
            hubs={hubs}
            onChange={handleChangeDevice}
            onDelete={handleDeleteDevice}
          />
        )}
      </div>
    </div>
  );
}
