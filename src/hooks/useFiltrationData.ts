import { useEffect, useRef, useState } from "react";
import { filtrationSimulator } from "../mock/filtrationSimulator";
import { adaptLiveState } from "../live/liveFiltrationAdapter";
import { getLiveClient, type LiveLogEntry, type LiveStatus } from "../live/liveClient";
import { DEFAULT_HUB_ID } from "../config/hubDefaults";
import type { SolenoidId, SystemState } from "../types/filtration";

const MAX_LOG_LINES = 200;

// The legacy filtration skid is always wired to the default hub -- it isn't
// a generic per-device-hub canvas, so it has no hub picker of its own. This
// resolves to the same cached client instance the Flow Hubs page's default
// hub panel uses, so both views reflect one real connection, never two.
const liveClient = getLiveClient(DEFAULT_HUB_ID);

export function useFiltrationData() {
  const [mockState, setMockState] = useState<SystemState>(() => filtrationSimulator.getState());
  const [liveRaw, setLiveRaw] = useState<Record<string, unknown> | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>(() => liveClient.getStatus());
  const [liveLog, setLiveLog] = useState<LiveLogEntry[]>([]);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      filtrationSimulator.start();
      started.current = true;
    }
    return filtrationSimulator.subscribe(setMockState);
  }, []);

  useEffect(() => {
    const unsubStatus = liveClient.subscribeStatus(setLiveStatus);
    const unsubState = liveClient.subscribeState(setLiveRaw);
    const unsubLog = liveClient.subscribeLog((entry) => setLiveLog((prev) => [...prev, entry].slice(-MAX_LOG_LINES)));
    return () => {
      unsubStatus();
      unsubState();
      unsubLog();
    };
  }, []);

  const isLive = liveStatus === "connected" && liveRaw !== null && liveRaw.online !== false;
  const state = isLive ? adaptLiveState(liveRaw!) : mockState;

  return {
    state,
    isLive,
    live: {
      status: liveStatus,
      log: liveLog,
      connect: (url: string) => liveClient.connect(url),
      disconnect: () => liveClient.disconnect(),
    },
    controls: {
      toggleSolenoid: (id: SolenoidId) => {
        if (isLive) {
          liveClient.sendCommand(`solenoid${id}`, state.solenoids[id].open ? 0 : 1).catch((err) => {
            console.error("Failed to send solenoid command:", err);
          });
        } else {
          filtrationSimulator.toggleSolenoid(id);
        }
      },
      togglePump: () => {
        if (isLive) {
          liveClient.sendCommand("pump1", state.pump.running ? 0 : 1).catch((err) => {
            console.error("Failed to send pump command:", err);
          });
        } else {
          filtrationSimulator.togglePump();
        }
      },
    },
  };
}
