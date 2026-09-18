import type { ActuatorCommand } from "../types/site";
import type { SiteRuntime } from "../hooks/useGenericSiteRuntime";

export interface SiteRuntimeEntry {
  runtime: SiteRuntime;
  dispatch: (deviceId: string, command: ActuatorCommand) => void;
}

/**
 * Last-published-value cache of every currently-mounted non-legacy site's
 * live runtime, keyed by site id -- lets one site's rule engine read/dispatch
 * into a hub-linked sibling site without lifting fast-changing state into
 * React context (see components/SiteEngine.tsx).
 *
 * Same Map-at-module-scope shape as serial/serialClient.ts and
 * live/liveClient.ts, but deliberately without their subscribe/listener
 * machinery: nothing here needs push notifications. Every reader
 * (buildGenericRuleContext, invoked from a site's own render) only ever
 * needs "whatever the sibling last published," read on that reader's own
 * ~1s render cadence -- see useRuleEngine.ts's ref-based tick design for why
 * that's sufficient; a sibling's write doesn't need to force anyone to
 * re-render, it just needs to be there the next time someone looks.
 */
const registry = new Map<string, SiteRuntimeEntry>();

export function publishSiteRuntime(siteId: string, entry: SiteRuntimeEntry): void {
  registry.set(siteId, entry);
}

/** Call only on a site's true unmount (site deleted), not on every tick --
 * see SiteEngine.tsx's two-effect split for why publish and unpublish are
 * kept on separate effects with different dependency arrays. */
export function unpublishSiteRuntime(siteId: string): void {
  registry.delete(siteId);
}

export function getSiteRuntimeEntry(siteId: string): SiteRuntimeEntry | undefined {
  return registry.get(siteId);
}
