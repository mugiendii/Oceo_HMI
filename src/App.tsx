import { useEffect, useState } from "react";
import { useFiltrationData } from "./hooks/useFiltrationData";
import { useIOConfig } from "./hooks/useIOConfig";
import { useNetConfig } from "./hooks/useNetConfig";
import { useSerialConnection } from "./hooks/useSerialConnection";
import { useSites } from "./hooks/useSites";
import { useRuleEngine } from "./hooks/useRuleEngine";
import { buildLegacyRuleContext } from "./rules/adapters";
import { FiltrationDiagram } from "./components/FiltrationDiagram";
import { IOConfigPage } from "./components/IOConfigPage";
import { NetworkConfigPage } from "./components/NetworkConfigPage";
import { LiveRelayPanel } from "./components/LiveRelayPanel";
import { RulesPage } from "./components/RulesPage";
import { SiteSwitcher } from "./components/SiteSwitcher";
import { GenericSiteShell } from "./components/GenericSiteShell";
import { TEMPLATES } from "./config/templates";

type View = "diagram" | "io-config" | "network" | "automation";

function HeaderClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-sm text-scada-text-dim">{now.toLocaleString()}</span>;
}

function NavTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-bold tracking-widest uppercase rounded-md transition-colors ${
        active ? "bg-scada-blue-dim text-scada-blue" : "text-scada-text-dim hover:text-scada-text"
      }`}
    >
      {label}
    </button>
  );
}

function App() {
  const [view, setView] = useState<View>("diagram");
  const { state, controls, isLive, live } = useFiltrationData();
  const ioConfig = useIOConfig();
  const netConfig = useNetConfig();
  const serial = useSerialConnection();
  const { sites, activeSite, setActiveSiteId, createSite, deleteSite, renameSite, updateSite } = useSites();

  const allOpen = state.pump.running && state.solenoids[1].open && state.solenoids[2].open && state.solenoids[3].open;
  const waitingForDevice = live.status === "connected" && !isLive;

  // The original filtration skid's automation keeps running regardless of
  // which site is currently displayed -- it's the one site backed by a real
  // (or simulated-as-real) physical process, so switching the screen to a
  // different site shouldn't pause its interlocks. See rules/adapters.ts.
  const legacySite = sites.find((s) => s.isLegacy);
  const legacyRuleCtx = buildLegacyRuleContext(state, controls);
  useRuleEngine(legacyRuleCtx, legacySite?.rules ?? [], false);

  // Generic sites have no I/O Config tab -- if the operator switches to one
  // while that tab happens to be open, fall back to the diagram tab. This is
  // computed rather than pushed back into `view` via an effect so switching
  // sites can't trigger an extra render pass.
  const currentView = !activeSite.isLegacy && view === "io-config" ? "diagram" : view;

  const headerTitle = activeSite.isLegacy ? "WATER FILTRATION SCADA HMI" : activeSite.name.toUpperCase();
  const headerSubtitle = activeSite.isLegacy
    ? "4-Stage Filtration Skid"
    : (TEMPLATES.find((t) => t.id === activeSite.templateId)?.label ?? "Custom Site");

  return (
    <div className="min-h-screen bg-scada-bg">
      <header className="border-b border-scada-border bg-scada-panel/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-8 bg-scada-blue rounded-sm shadow-[0_0_10px_rgba(47,168,255,0.6)]" />
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-wide text-white">{headerTitle}</h1>
              <p className="text-[11px] text-scada-text-dim tracking-widest uppercase">{headerSubtitle}</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 panel-bevel rounded-lg p-1 flex-wrap">
            <NavTab label="Process Diagram" active={currentView === "diagram"} onClick={() => setView("diagram")} />
            {activeSite.isLegacy && (
              <NavTab label="I/O Config" active={currentView === "io-config"} onClick={() => setView("io-config")} />
            )}
            <NavTab label="Network" active={currentView === "network"} onClick={() => setView("network")} />
            <NavTab label="Automation" active={currentView === "automation"} onClick={() => setView("automation")} />
          </nav>

          <div className="flex items-center gap-3">
            <SiteSwitcher
              sites={sites}
              activeSite={activeSite}
              onSelect={setActiveSiteId}
              onCreate={createSite}
              onDelete={deleteSite}
              onRename={renameSite}
            />
            <div className="hidden sm:flex flex-col items-end gap-0.5">
              <HeaderClock />
              <span
                className={`text-[11px] font-bold tracking-widest uppercase ${
                  isLive
                    ? "text-scada-green text-glow-green"
                    : waitingForDevice
                      ? "text-scada-blue"
                      : "text-scada-amber text-glow-amber"
                }`}
              >
                ● {isLive ? "Live" : waitingForDevice ? "Relay Connected — Waiting for Device" : "Simulation Mode"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 flex flex-col gap-5">
        {currentView === "diagram" && activeSite.isLegacy && (
          <>
            <LiveRelayPanel status={live.status} log={live.log} connect={live.connect} disconnect={live.disconnect} />

            <div className="panel-bevel rounded-lg px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
              <span className="text-xs text-scada-text-dim">
                {isLive
                  ? "Connected to the live relay — this reflects the real device's state. Click a solenoid valve or the pump to send a command."
                  : waitingForDevice
                    ? "Connected to the relay, but no status has arrived from the device yet — clicks still only affect the simulation. Check that the device is actually publishing to oceo/status."
                    : "No live relay connected — flow is simulated. Click any solenoid valve or the pump in the diagram to shut it off and see flow stop downstream of it."}
              </span>
              <span
                className={`text-[11px] font-bold tracking-widest uppercase shrink-0 ${
                  allOpen ? "text-scada-green text-glow-green" : "text-scada-amber text-glow-amber"
                }`}
              >
                ● {allOpen ? "All Paths Flowing" : "Path(s) Shut"}
              </span>
            </div>

            <div className="panel-bevel rounded-lg p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-xs font-bold tracking-widest uppercase text-scada-text-dim">Process Overview</h3>
                <div className="flex items-center gap-4 text-[10px] font-semibold tracking-widest uppercase">
                  <span className="flex items-center gap-1.5 text-scada-green">
                    <span className="w-2 h-2 rounded-full bg-scada-green shadow-[0_0_6px_rgba(46,230,107,0.8)]" />{" "}
                    Flowing
                  </span>
                  <span className="flex items-center gap-1.5 text-scada-text-dim">
                    <span className="w-2 h-2 rounded-full bg-scada-gray" /> Closed / Idle
                  </span>
                </div>
              </div>
              <FiltrationDiagram state={state} onToggleSolenoid={controls.toggleSolenoid} onTogglePump={controls.togglePump} />
            </div>
          </>
        )}

        {currentView === "io-config" && (
          <IOConfigPage
            points={ioConfig.points}
            onSetSignalType={ioConfig.setSignalType}
            onSetPin={ioConfig.setPin}
            onReset={ioConfig.resetToDefaults}
            serial={serial}
          />
        )}

        {currentView === "network" && (
          <NetworkConfigPage
            config={netConfig.config}
            onSetField={netConfig.setField}
            onLoadFromDevice={netConfig.loadFromDevice}
            onReset={netConfig.resetToDefaults}
            serial={serial}
          />
        )}

        {currentView === "automation" && activeSite.isLegacy && (
          <RulesPage
            rules={activeSite.rules}
            ctx={legacyRuleCtx}
            onChangeRules={(rules) => updateSite(activeSite.id, (s) => ({ ...s, rules }))}
          />
        )}

        {!activeSite.isLegacy && (currentView === "diagram" || currentView === "automation") && (
          <GenericSiteShell
            key={activeSite.id}
            site={activeSite}
            view={currentView === "automation" ? "automation" : "diagram"}
            onUpdateSite={(updater) => updateSite(activeSite.id, updater)}
          />
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-6 text-center text-[11px] text-scada-text-dim">
        {isLive
          ? "Live telemetry via the WebSocket relay (see docs/live-relay-protocol.md)."
          : "Simulated telemetry — connect to the live relay above to control and monitor the real device."}
      </footer>
    </div>
  );
}

export default App;
