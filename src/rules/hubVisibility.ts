import type { DeviceWithSite, Site } from "../types/site";
import type { HubLink } from "../types/flowHub";

/** Every hub id at least one of this site's own devices is wired to. Tanks
 * never have a hubId, so they never contribute. */
function hubIdsUsedBySite(site: Site): Set<string> {
  return new Set(site.devices.map((d) => d.hubId).filter((id): id is string => !!id));
}

/** Every hub id reachable from this site: its own hub(s), plus any hub
 * directly linked (either direction) to one of its own hubs. Direct links
 * only -- no transitive multi-hop reachability (HubLink is v1-scoped to a
 * single interconnection, not a mesh). */
export function linkedHubIds(site: Site, links: HubLink[]): Set<string> {
  const own = hubIdsUsedBySite(site);
  const result = new Set(own);
  for (const link of links) {
    if (own.has(link.fromHubId)) result.add(link.toHubId);
    if (own.has(link.toHubId)) result.add(link.fromHubId);
  }
  return result;
}

/**
 * Devices belonging to OTHER sites that this site's rules should be able to
 * see/drive, because they share a hub id with this site or sit on a hub
 * linked to one of this site's hubs.
 *
 * Deliberately excludes this site's own devices (siteId !== site.id) rather
 * than relying on `device.hubId` truthiness to separate "own" from
 * "foreign": callers MUST keep sourcing this site's own sensors/actuators
 * from `site.devices` directly (as buildGenericRuleContext does,
 * unconditional on hubId), and treat this list as a pure addition. If this
 * function's hubId-gated filter were used to source "own" devices too, any
 * of the site's own pump/valve/alarm/sensor devices sitting at "Unassigned"
 * (a normal, supported state) would silently disappear from automation --
 * a regression from today's behavior, which has no hubId dependency at all.
 */
export function foreignDevicesForSite(site: Site, allDevices: DeviceWithSite[], links: HubLink[]): DeviceWithSite[] {
  const hubs = linkedHubIds(site, links);
  return allDevices.filter((e) => e.siteId !== site.id && e.device.hubId && hubs.has(e.device.hubId));
}
