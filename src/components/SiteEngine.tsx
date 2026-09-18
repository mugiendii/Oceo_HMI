import { useEffect, useState } from "react";
import type { DeviceWithSite, Site } from "../types/site";
import type { FlowHub, HubLink } from "../types/flowHub";
import { useGenericSiteRuntime } from "../hooks/useGenericSiteRuntime";
import { useRuleEngine } from "../hooks/useRuleEngine";
import { buildGenericRuleContext } from "../rules/adapters";
import { foreignDevicesForSite } from "../rules/hubVisibility";
import { publishSiteRuntime, unpublishSiteRuntime } from "../rules/siteRuntimeRegistry";
import { GenericSiteShell, type CanvasMode } from "./GenericSiteShell";

interface SiteEngineProps {
  /** Never the legacy site -- callers filter that out (see App.tsx); it has
   * no DeviceNodes and structurally can't participate in hub visibility. */
  site: Site;
  isActive: boolean;
  view: "diagram" | "hubs" | "automation";
  onUpdateSite: (updater: (site: Site) => Site) => void;
  hubs: FlowHub[];
  allDevices: DeviceWithSite[];
  hubLinks: HubLink[];
}

/**
 * Mounted once per non-legacy site, ALWAYS -- regardless of which site is
 * active or which top nav tab is selected. This is what makes cross-hub
 * automation actually live: a site's runtime tick + rule engine have to keep
 * running in the background for its values to mean anything to a hub-linked
 * sibling site's rules, even while nobody is looking at it. See
 * rules/hubVisibility.ts and rules/siteRuntimeRegistry.ts.
 *
 * Only renders visible UI (<GenericSiteShell>) when this site is the one
 * currently on screen; otherwise renders null but keeps every hook above
 * running regardless.
 */
export function SiteEngine({ site, isActive, view, onUpdateSite, hubs, allDevices, hubLinks }: SiteEngineProps) {
  const { runtime, dispatch, toggleDevice } = useGenericSiteRuntime(site);
  const [mode, setMode] = useState<CanvasMode>("run");

  // Publish this site's live runtime every tick, so hub-linked siblings can
  // read/dispatch into it. Kept separate from the unmount-cleanup effect
  // below so this one re-running every ~1s (runtime/dispatch are fresh
  // references every tick) is a plain overwrite, not delete-then-reset churn
  // that would flicker the registry entry to `undefined` between ticks.
  useEffect(() => {
    publishSiteRuntime(site.id, { runtime, dispatch });
  }, [site.id, runtime, dispatch]);

  // Unpublish only on true unmount (site deleted).
  useEffect(() => {
    return () => unpublishSiteRuntime(site.id);
  }, [site.id]);

  const foreignDevices = foreignDevicesForSite(site, allDevices, hubLinks);
  const ruleCtx = buildGenericRuleContext(site, runtime, dispatch, foreignDevices);

  const showShell = isActive && (view === "diagram" || view === "automation");
  // Only pause while this site's own canvas is actually on screen in Edit
  // mode -- not just because `mode` happens to still say "edit" from before
  // the operator navigated to the Flow Hubs tab. Unlike the old
  // GenericSiteShell (which unmounted whenever it wasn't visible), this
  // component never unmounts on tab/site switches, so `mode` now persists
  // across them -- a site left mid-edit must not stay paused forever in the
  // background.
  useRuleEngine(ruleCtx, site.rules, showShell && mode === "edit");

  if (!showShell) return null;

  return (
    <GenericSiteShell
      site={site}
      view={view === "automation" ? "automation" : "diagram"}
      onUpdateSite={onUpdateSite}
      hubs={hubs}
      allDevices={allDevices}
      runtime={runtime}
      toggleDevice={toggleDevice}
      ruleCtx={ruleCtx}
      mode={mode}
      onModeChange={setMode}
    />
  );
}
