import { useEffect, useState } from "react";
import type { FlowHub } from "../types/flowHub";
import { uid } from "../lib/uid";
import { DEFAULT_HUB_ID } from "../config/hubDefaults";

const HUBS_KEY = "oceo-hmi-hubs";
const ACTIVE_KEY = "oceo-hmi-active-hub-id";

/** The one hub every install starts with -- see DEFAULT_HUB_ID for why its
 * id is stable rather than a random uid. */
function createDefaultHub(): FlowHub {
  return { id: DEFAULT_HUB_ID, name: "FlowHub 1", isDefault: true, createdAt: Date.now() };
}

function loadInitialHubs(): FlowHub[] {
  try {
    const raw = localStorage.getItem(HUBS_KEY);
    if (!raw) return [createDefaultHub()];
    const saved = JSON.parse(raw);
    if (Array.isArray(saved) && saved.length > 0) return saved as FlowHub[];
    return [createDefaultHub()];
  } catch {
    return [createDefaultHub()];
  }
}

function loadInitialActiveId(hubs: FlowHub[]): string {
  const raw = localStorage.getItem(ACTIVE_KEY);
  if (raw && hubs.some((h) => h.id === raw)) return raw;
  return hubs[0].id;
}

export function useFlowHubs() {
  const [hubs, setHubs] = useState<FlowHub[]>(loadInitialHubs);
  const [activeHubId, setActiveHubId] = useState<string>(() => loadInitialActiveId(hubs));

  useEffect(() => {
    localStorage.setItem(HUBS_KEY, JSON.stringify(hubs));
  }, [hubs]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeHubId);
  }, [activeHubId]);

  const activeHub = hubs.find((h) => h.id === activeHubId) ?? hubs[0];

  function createHub(name: string): FlowHub {
    const hub: FlowHub = { id: uid("hub"), name: name.trim() || `FlowHub ${hubs.length + 1}`, createdAt: Date.now() };
    setHubs((prev) => [...prev, hub]);
    setActiveHubId(hub.id);
    return hub;
  }

  function deleteHub(id: string) {
    if (hubs.length <= 1) return; // always keep at least one hub
    const next = hubs.filter((h) => h.id !== id);
    setHubs(next);
    if (activeHubId === id) setActiveHubId(next[0].id);
  }

  function renameHub(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setHubs((prev) => prev.map((h) => (h.id === id ? { ...h, name: trimmed } : h)));
  }

  return { hubs, activeHub, activeHubId, setActiveHubId, createHub, deleteHub, renameHub };
}
