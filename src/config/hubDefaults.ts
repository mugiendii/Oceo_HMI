/** Stable id for the single auto-created default hub -- mirrors the
 * "default-filtration-skid" stable site id pattern in useSites.ts. Both the
 * legacy filtration skid's live relay connection and any pre-existing
 * single-hub localStorage data (io config / net config / relay url) are
 * adopted onto this hub id. Lives in its own file (not inside useFlowHubs.ts)
 * so non-hook modules -- serialClient/liveClient, templates.ts -- can import
 * it without pulling React into their dependency graph. */
export const DEFAULT_HUB_ID = "default-hub";
