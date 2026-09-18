import { useEffect, useState } from "react";
import type { Site } from "../types/site";
import { TEMPLATES } from "../config/templates";

const SITES_KEY = "oceo-hmi-sites";
const ACTIVE_KEY = "oceo-hmi-active-site-id";

/**
 * The one site that renders through the original, untouched components
 * (FiltrationDiagram/useFiltrationData/etc). It carries no devices of its
 * own -- it's a marker record the generic engine never reads.
 */
function createDefaultLegacySite(): Site {
  return {
    id: "default-filtration-skid",
    name: "Water Filtration Skid",
    templateId: "legacy",
    isLegacy: true,
    devices: [],
    connections: [],
    rules: [],
    createdAt: Date.now(),
  };
}

function loadInitialSites(): Site[] {
  try {
    const raw = localStorage.getItem(SITES_KEY);
    if (!raw) return [createDefaultLegacySite()];
    const saved = JSON.parse(raw);
    if (Array.isArray(saved) && saved.length > 0) return saved as Site[];
    return [createDefaultLegacySite()];
  } catch {
    return [createDefaultLegacySite()];
  }
}

function loadInitialActiveId(sites: Site[]): string {
  const raw = localStorage.getItem(ACTIVE_KEY);
  if (raw && sites.some((s) => s.id === raw)) return raw;
  return sites[0].id;
}

export function useSites() {
  const [sites, setSites] = useState<Site[]>(loadInitialSites);
  const [activeSiteId, setActiveSiteId] = useState<string>(() => loadInitialActiveId(sites));

  useEffect(() => {
    localStorage.setItem(SITES_KEY, JSON.stringify(sites));
  }, [sites]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeSiteId);
  }, [activeSiteId]);

  const activeSite = sites.find((s) => s.id === activeSiteId) ?? sites[0];

  function createSite(name: string, templateId: string): Site {
    const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
    const site = template.build(name.trim() || template.label);
    setSites((prev) => [...prev, site]);
    setActiveSiteId(site.id);
    return site;
  }

  function deleteSite(id: string) {
    if (sites.length <= 1) return; // always keep at least one site
    const next = sites.filter((s) => s.id !== id);
    setSites(next);
    if (activeSiteId === id) setActiveSiteId(next[0].id);
  }

  function renameSite(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSites((prev) => prev.map((s) => (s.id === id ? { ...s, name: trimmed } : s)));
  }

  function updateSite(id: string, updater: (site: Site) => Site) {
    setSites((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  }

  // Clears every reference to a hub that's about to be deleted, across every
  // site at once -- useSites is the only hook with visibility into every
  // site's devices, same reason createSite/deleteSite/updateSite all live
  // here instead of being split across per-site state. Called from App.tsx
  // before useFlowHubs.deleteHub actually removes the hub.
  function clearHubReferences(hubId: string) {
    setSites((prev) =>
      prev.map((s) => ({
        ...s,
        defaultHubId: s.defaultHubId === hubId ? undefined : s.defaultHubId,
        devices: s.devices.map((d) => (d.hubId === hubId ? { ...d, hubId: undefined } : d)),
      })),
    );
  }

  return { sites, activeSite, activeSiteId, setActiveSiteId, createSite, deleteSite, renameSite, updateSite, clearHubReferences };
}
