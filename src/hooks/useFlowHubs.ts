import { useEffect, useState } from "react";
import type { FlowHub, HubLink, HubLinkMedium } from "../types/flowHub";
import { uid } from "../lib/uid";
import { DEFAULT_HUB_ID } from "../config/hubDefaults";

const HUBS_KEY = "oceo-hmi-hubs";
const ACTIVE_KEY = "oceo-hmi-active-hub-id";
const LINKS_KEY = "oceo-hmi-hub-links";

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

function loadInitialLinks(): HubLink[] {
  try {
    const raw = localStorage.getItem(LINKS_KEY);
    if (!raw) return [];
    const saved = JSON.parse(raw);
    return Array.isArray(saved) ? (saved as HubLink[]) : [];
  } catch {
    return [];
  }
}

export function useFlowHubs() {
  const [hubs, setHubs] = useState<FlowHub[]>(loadInitialHubs);
  const [activeHubId, setActiveHubId] = useState<string>(() => loadInitialActiveId(hubs));
  const [links, setLinks] = useState<HubLink[]>(loadInitialLinks);

  useEffect(() => {
    localStorage.setItem(HUBS_KEY, JSON.stringify(hubs));
  }, [hubs]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeHubId);
  }, [activeHubId]);

  useEffect(() => {
    localStorage.setItem(LINKS_KEY, JSON.stringify(links));
  }, [links]);

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
    // This hook owns both hubs and links, so pruning happens right here with
    // no cross-hook coordination needed -- unlike useSites.clearHubReferences,
    // which has to reach across hooks for device/site hubId references.
    setLinks((prev) => prev.filter((l) => l.fromHubId !== id && l.toHubId !== id));
    if (activeHubId === id) setActiveHubId(next[0].id);
  }

  function renameHub(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setHubs((prev) => prev.map((h) => (h.id === id ? { ...h, name: trimmed } : h)));
  }

  function createLink(fromHubId: string, toHubId: string, medium?: HubLinkMedium): void {
    if (fromHubId === toHubId) return; // no self-links
    const exists = links.some(
      (l) => (l.fromHubId === fromHubId && l.toHubId === toHubId) || (l.fromHubId === toHubId && l.toHubId === fromHubId),
    );
    if (exists) return; // no duplicate links, either direction
    setLinks((prev) => [...prev, { id: uid("link"), fromHubId, toHubId, medium, createdAt: Date.now() }]);
  }

  function deleteLink(id: string): void {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  function setLinkMedium(id: string, medium: HubLinkMedium | undefined): void {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, medium } : l)));
  }

  return { hubs, activeHub, activeHubId, setActiveHubId, createHub, deleteHub, renameHub, links, createLink, deleteLink, setLinkMedium };
}
