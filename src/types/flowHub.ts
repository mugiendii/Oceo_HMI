/** A physical FlowHub controller board, independent of any Site -- see
 * useFlowHubs.ts. Devices on any site's canvas bind to one of these via
 * DeviceNode.hubId. */
export interface FlowHub {
  id: string;
  name: string;
  /** true only for the single auto-created default hub -- mirrors
   * Site.isLegacy: renameable, but never offered for deletion in the UI. */
  isDefault?: boolean;
  createdAt: number;
}

/** A hub-to-hub interconnection. Stored directionally (mirrors
 * Connection{fromId,toId}'s shape for device pipes) but treated as
 * symmetric everywhere it's consumed -- see rules/hubVisibility.ts. Direct
 * links only for v1: no transitive multi-hop reachability. No self-links,
 * no duplicate links in either direction -- enforced in useFlowHubs.createLink. */
export interface HubLink {
  id: string;
  fromHubId: string;
  toHubId: string;
  createdAt: number;
}
