import { useEffect, useState } from "react";
import { getLiveClient, type LiveLogEntry, type LiveStatus } from "../live/liveClient";

const MAX_LOG_LINES = 200;

/**
 * Thin per-hub wrapper around the live relay WebSocket client -- the same
 * status/log subscription shape useFiltrationData wires up inline for the
 * legacy skid, extracted here so the Flow Hubs page can reuse it for any
 * hub. useFiltrationData.ts deliberately keeps its own inline copy of this
 * logic rather than being refactored to call this hook, to minimize the
 * diff on that zero-regression-sensitive path.
 */
export function useLiveRelayConnection(hubId: string) {
  const client = getLiveClient(hubId);
  const [status, setStatus] = useState<LiveStatus>(() => client.getStatus());
  const [log, setLog] = useState<LiveLogEntry[]>([]);

  useEffect(() => {
    const unsubStatus = client.subscribeStatus(setStatus);
    const unsubLog = client.subscribeLog((entry) => setLog((prev) => [...prev, entry].slice(-MAX_LOG_LINES)));
    return () => {
      unsubStatus();
      unsubLog();
    };
  }, [client]);

  return {
    status,
    log,
    connect: (url: string) => client.connect(url),
    disconnect: () => client.disconnect(),
  };
}
