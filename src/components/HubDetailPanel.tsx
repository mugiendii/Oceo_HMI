import { useState } from "react";
import type { FlowHub, HubLink } from "../types/flowHub";
import { useIOConfig } from "../hooks/useIOConfig";
import { useNetConfig } from "../hooks/useNetConfig";
import { useSerialConnection } from "../hooks/useSerialConnection";
import { useLiveRelayConnection } from "../hooks/useLiveRelayConnection";
import { LiveRelayPanel } from "./LiveRelayPanel";
import { HubInterconnections } from "./HubInterconnections";
import { IOConfigPage } from "./IOConfigPage";
import { NetworkConfigPage } from "./NetworkConfigPage";

interface HubDetailPanelProps {
  hub: FlowHub;
  hubs: FlowHub[];
  links: HubLink[];
  onCreateLink: (fromHubId: string, toHubId: string) => void;
  onRemoveLink: (id: string) => void;
}

type HubSubView = "io" | "network";

const SUB_VIEWS: { key: HubSubView; label: string }[] = [
  { key: "io", label: "I/O Config" },
  { key: "network", label: "Network" },
];

/**
 * Everything for one Flow Hub: its live relay connection plus its I/O pin
 * map and network config, both reached over the same serial connection --
 * the caller MUST mount this with `key={hub.id}` (see HubsPage) so that
 * switching the active hub remounts it. useIOConfig/useNetConfig/
 * useSerialConnection all seed their state from a useState(() => ...) lazy
 * initializer, which only runs once per mount, same reason App.tsx already
 * keys <GenericSiteShell> on the active site id.
 */
export function HubDetailPanel({ hub, hubs, links, onCreateLink, onRemoveLink }: HubDetailPanelProps) {
  const [subView, setSubView] = useState<HubSubView>("io");
  const ioConfig = useIOConfig(hub.id);
  const netConfig = useNetConfig(hub.id);
  const serial = useSerialConnection(hub.id);
  const relay = useLiveRelayConnection(hub.id);

  return (
    <div className="flex flex-col gap-5">
      <LiveRelayPanel hubId={hub.id} status={relay.status} log={relay.log} connect={relay.connect} disconnect={relay.disconnect} />

      <HubInterconnections hub={hub} hubs={hubs} links={links} onCreateLink={onCreateLink} onRemoveLink={onRemoveLink} />

      <div className="inline-flex rounded-md border border-scada-border overflow-hidden self-start">
        {SUB_VIEWS.map((sv) => (
          <button
            key={sv.key}
            onClick={() => setSubView(sv.key)}
            className={`px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${
              subView === sv.key ? "bg-scada-blue-dim text-scada-blue" : "bg-scada-panel text-scada-text-dim hover:text-scada-text"
            }`}
          >
            {sv.label}
          </button>
        ))}
      </div>

      {subView === "io" && (
        <IOConfigPage
          points={ioConfig.points}
          onSetSignalType={ioConfig.setSignalType}
          onSetPin={ioConfig.setPin}
          onReset={ioConfig.resetToDefaults}
          serial={serial}
        />
      )}

      {subView === "network" && (
        <NetworkConfigPage
          config={netConfig.config}
          onSetField={netConfig.setField}
          onLoadFromDevice={netConfig.loadFromDevice}
          onReset={netConfig.resetToDefaults}
          serial={serial}
        />
      )}
    </div>
  );
}
