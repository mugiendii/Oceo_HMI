import type { FlowHub, HubLink } from "../types/flowHub";
import type { DeviceWithSite } from "../types/site";
import { HubSwitcher } from "./HubSwitcher";
import { HubDetailPanel } from "./HubDetailPanel";

interface HubsPageProps {
  hubs: FlowHub[];
  activeHubId: string;
  allDevices: DeviceWithSite[];
  links: HubLink[];
  onSelectHub: (id: string) => void;
  onCreateHub: (name: string) => void;
  onDeleteHub: (id: string) => void;
  onRenameHub: (id: string, name: string) => void;
  onCreateLink: (fromHubId: string, toHubId: string) => void;
  onRemoveLink: (id: string) => void;
}

export function HubsPage({
  hubs,
  activeHubId,
  allDevices,
  links,
  onSelectHub,
  onCreateHub,
  onDeleteHub,
  onRenameHub,
  onCreateLink,
  onRemoveLink,
}: HubsPageProps) {
  const activeHub = hubs.find((h) => h.id === activeHubId) ?? hubs[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="panel-bevel rounded-lg px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-xs text-scada-text-dim">
          Each Flow Hub is a separate physical FlowHub board with its own connection, I/O pin map, and network config.
        </span>
        <HubSwitcher
          hubs={hubs}
          activeHub={activeHub}
          allDevices={allDevices}
          links={links}
          onSelect={onSelectHub}
          onCreate={onCreateHub}
          onDelete={onDeleteHub}
          onRename={onRenameHub}
        />
      </div>

      <HubDetailPanel key={activeHub.id} hub={activeHub} hubs={hubs} links={links} onCreateLink={onCreateLink} onRemoveLink={onRemoveLink} />
    </div>
  );
}
