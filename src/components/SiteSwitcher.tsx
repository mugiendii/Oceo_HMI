import { useState } from "react";
import type { Site } from "../types/site";
import { TEMPLATES } from "../config/templates";

interface SiteSwitcherProps {
  sites: Site[];
  activeSite: Site;
  onSelect: (id: string) => void;
  onCreate: (name: string, templateId: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function SiteSwitcher({ sites, activeSite, onSelect, onCreate, onDelete, onRename }: SiteSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function commitRename() {
    if (renamingId) onRename(renamingId, renameValue);
    setRenamingId(null);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-scada-border-light bg-scada-panel text-xs font-bold text-scada-text hover:border-scada-blue transition-colors"
      >
        <span className="truncate max-w-[160px]">{activeSite.name}</span>
        <span className="text-scada-text-dim">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-80 panel-bevel rounded-lg p-2 z-20 flex flex-col gap-1 animate-fade-in-down">
          {sites.map((site) => (
            <div
              key={site.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs ${
                site.id === activeSite.id ? "bg-scada-blue-dim text-scada-blue" : "text-scada-text hover:bg-scada-panel-light"
              }`}
            >
              {renamingId === site.id ? (
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
                    onSelect(site.id);
                    setOpen(false);
                  }}
                  className="flex-1 text-left truncate font-semibold"
                >
                  {site.name}
                  {site.isLegacy && <span className="ml-1.5 text-[9px] text-scada-text-dim uppercase tracking-wide">Original</span>}
                </button>
              )}
              <button
                onClick={() => {
                  setRenamingId(site.id);
                  setRenameValue(site.name);
                }}
                className="text-scada-text-dim hover:text-scada-blue transition-colors text-[10px] font-bold uppercase shrink-0"
              >
                Rename
              </button>
              {!site.isLegacy && sites.length > 1 && (
                <button
                  onClick={() => {
                    if (confirm(`Delete site "${site.name}"? This can't be undone.`)) onDelete(site.id);
                  }}
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
              + New Site
            </button>
          </div>
        </div>
      )}

      {showNew && (
        <NewSiteModal
          onClose={() => setShowNew(false)}
          onCreate={(name, templateId) => {
            onCreate(name, templateId);
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function NewSiteModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, templateId: string) => void }) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30 p-4" onClick={onClose}>
      <div
        className="panel-bevel rounded-lg p-5 w-full max-w-md max-h-[85vh] overflow-y-auto flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold uppercase tracking-widest text-scada-text">New Site</h3>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold tracking-widest uppercase text-scada-text-dim">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Green Valley Farm"
            className="bg-scada-panel border border-scada-border rounded-md px-2.5 py-1.5 text-sm text-scada-text focus:outline-none focus:border-scada-blue"
          />
        </label>
        <div className="flex flex-col gap-2 min-h-0">
          <span className="text-[10px] font-bold tracking-widest uppercase text-scada-text-dim">Template</span>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {TEMPLATES.map((t) => (
            <label
              key={t.id}
              className={`flex flex-col gap-0.5 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                templateId === t.id ? "border-scada-blue bg-scada-blue-dim/20" : "border-scada-border hover:border-scada-border-light"
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-bold text-scada-text">
                <input type="radio" name="template" checked={templateId === t.id} onChange={() => setTemplateId(t.id)} />
                {t.label}
              </span>
              <span className="text-[11px] text-scada-text-dim pl-5">{t.description}</span>
            </label>
          ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border border-scada-border-light text-scada-text-dim hover:text-scada-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, templateId)}
            className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border border-scada-blue text-scada-blue hover:bg-scada-blue-dim/30 transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
