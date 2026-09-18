import { useState } from "react";
import type { FlowHub, HubLink, HubLinkMedium } from "../types/flowHub";

interface HubInterconnectionsProps {
  hub: FlowHub;
  hubs: FlowHub[];
  links: HubLink[];
  onCreateLink: (fromHubId: string, toHubId: string, medium?: HubLinkMedium) => void;
  onRemoveLink: (id: string) => void;
  onSetLinkMedium: (id: string, medium: HubLinkMedium | undefined) => void;
}

/** A <select> for HubLinkMedium | undefined, sharing the same "" ==
 * unspecified convention as every other optional picker in this app (e.g.
 * DeviceInspector's Output Channel). */
function MediumSelect({ value, onChange, className }: { value: HubLinkMedium | undefined; onChange: (v: HubLinkMedium | undefined) => void; className: string }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange((e.target.value || undefined) as HubLinkMedium | undefined)} className={className}>
      <option value="">Unspecified</option>
      <option value="wired">Wired</option>
      <option value="wireless">Wireless</option>
    </select>
  );
}

/**
 * Topology links between this hub and others -- see rules/hubVisibility.ts
 * for the automation-visibility consequence (linking two hubs lets each
 * side's rules read/drive the other's devices). Hubs have no x/y canvas
 * position to draw a graph against (unlike devices' "Connect Devices"), so
 * this is a simple picker + list instead. `medium` (wired/wireless) is
 * purely descriptive record-keeping of the real physical transport between
 * two boards -- it has no bearing on the automation visibility above.
 */
export function HubInterconnections({ hub, hubs, links, onCreateLink, onRemoveLink, onSetLinkMedium }: HubInterconnectionsProps) {
  const [selected, setSelected] = useState("");
  const [newMedium, setNewMedium] = useState<HubLinkMedium | undefined>(undefined);

  const hubLinks = links.filter((l) => l.fromHubId === hub.id || l.toHubId === hub.id);
  const otherHubId = (l: HubLink) => (l.fromHubId === hub.id ? l.toHubId : l.fromHubId);
  const nameOf = (id: string) => hubs.find((h) => h.id === id)?.name ?? "Unknown Hub";
  const linkedIds = new Set(hubLinks.map(otherHubId));
  const candidates = hubs.filter((h) => h.id !== hub.id && !linkedIds.has(h.id));

  function handleCreate() {
    if (!selected) return;
    onCreateLink(hub.id, selected, newMedium);
    setSelected("");
    setNewMedium(undefined);
  }

  return (
    <div className="panel-bevel rounded-lg p-4 flex flex-col gap-3">
      <h3 className="text-xs font-bold tracking-widest uppercase text-scada-text-dim">Interconnections</h3>
      <p className="text-xs text-scada-text-dim">
        Linking two Flow Hubs lets a rule on either hub's site(s) read sensors and drive actuators on the other's.
      </p>

      {hubLinks.length === 0 && <p className="text-xs text-scada-text-dim">No interconnections yet.</p>}
      <div className="flex flex-col gap-1.5">
        {hubLinks.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-scada-panel-light text-xs">
            <span className="text-scada-text font-semibold">{nameOf(otherHubId(l))}</span>
            <div className="flex items-center gap-2">
              <MediumSelect
                value={l.medium}
                onChange={(medium) => onSetLinkMedium(l.id, medium)}
                className="bg-scada-panel border border-scada-border rounded-md px-2 py-1 text-[11px] text-scada-text focus:outline-none focus:border-scada-blue"
              />
              <button
                onClick={() => onRemoveLink(l.id)}
                className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded border border-scada-red text-scada-red hover:bg-scada-red-dim/30 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {candidates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-scada-panel border border-scada-border rounded-md px-2 py-1.5 text-xs text-scada-text focus:outline-none focus:border-scada-blue flex-1 min-w-[160px]"
          >
            <option value="">Select a hub…</option>
            {candidates.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <MediumSelect
            value={newMedium}
            onChange={setNewMedium}
            className="bg-scada-panel border border-scada-border rounded-md px-2 py-1.5 text-xs text-scada-text focus:outline-none focus:border-scada-blue"
          />
          <button
            onClick={handleCreate}
            disabled={!selected}
            className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border border-scada-blue text-scada-blue hover:bg-scada-blue-dim/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Interconnect
          </button>
        </div>
      )}
    </div>
  );
}
