import { useState } from "react";
import type { FlowHub } from "../types/flowHub";
import type { DeviceWithSite } from "../types/site";

interface HubSwitcherProps {
  hubs: FlowHub[];
  activeHub: FlowHub;
  allDevices: DeviceWithSite[];
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function HubSwitcher({ hubs, activeHub, allDevices, onSelect, onCreate, onDelete, onRename }: HubSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function commitRename() {
    if (renamingId) onRename(renamingId, renameValue);
    setRenamingId(null);
  }

  function handleDelete(hub: FlowHub) {
    const count = allDevices.filter((e) => e.device.hubId === hub.id).length;
    const msg =
      count > 0
        ? `Delete "${hub.name}"? ${count} device(s) across your sites reference it and will become unassigned. This can't be undone.`
        : `Delete "${hub.name}"? This can't be undone.`;
    if (confirm(msg)) onDelete(hub.id);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-scada-border-light bg-scada-panel text-xs font-bold text-scada-text hover:border-scada-blue transition-colors"
      >
        <span className="truncate max-w-[160px]">{activeHub.name}</span>
        <span className="text-scada-text-dim">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-80 panel-bevel rounded-lg p-2 z-20 flex flex-col gap-1 animate-fade-in-down">
          {hubs.map((hub) => (
            <div
              key={hub.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs ${
                hub.id === activeHub.id ? "bg-scada-blue-dim text-scada-blue" : "text-scada-text hover:bg-scada-panel-light"
              }`}
            >
              {renamingId === hub.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  onBlur={commitRename}
                  className="flex-1 bg-scada-panel border border-scada-blue rounded px-1.5 py-0.5 text-xs text-scada-text focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => {
                    onSelect(hub.id);
                    setOpen(false);
                  }}
                  className="flex-1 text-left truncate font-semibold"
                >
                  {hub.name}
                  {hub.isDefault && <span className="ml-1.5 text-[9px] text-scada-text-dim uppercase tracking-wide">Default</span>}
                </button>
              )}
              <button
                onClick={() => {
                  setRenamingId(hub.id);
                  setRenameValue(hub.name);
                }}
                className="text-scada-text-dim hover:text-scada-blue transition-colors text-[10px] font-bold uppercase shrink-0"
              >
                Rename
              </button>
              {!hub.isDefault && hubs.length > 1 && (
                <button
                  onClick={() => handleDelete(hub)}
                  className="text-scada-text-dim hover:text-scada-red transition-colors text-[10px] font-bold uppercase shrink-0"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
          <div className="border-t border-scada-border mt-1 pt-1.5">
            <button
              onClick={() => {
                setShowNew(true);
                setOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-bold text-scada-blue hover:bg-scada-blue-dim/30 transition-colors"
            >
              + New Hub
            </button>
          </div>
        </div>
      )}

      {showNew && (
        <NewHubModal
          onClose={() => setShowNew(false)}
          onCreate={(name) => {
            onCreate(name);
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function NewHubModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30 p-4" onClick={onClose}>
      <div
        className="panel-bevel rounded-lg p-5 w-full max-w-md flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold uppercase tracking-widest text-scada-text">New Flow Hub</h3>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold tracking-widest uppercase text-scada-text-dim">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Greenhouse Block B"
            className="bg-scada-panel border border-scada-border rounded-md px-2.5 py-1.5 text-sm text-scada-text focus:outline-none focus:border-scada-blue"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border border-scada-border-light text-scada-text-dim hover:text-scada-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name)}
            className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border border-scada-blue text-scada-blue hover:bg-scada-blue-dim/30 transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
