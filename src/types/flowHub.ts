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
