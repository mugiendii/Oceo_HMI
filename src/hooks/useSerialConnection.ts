import { useEffect, useState } from "react";
import { getSerialClient, type SerialLogEntry, type SerialStatus } from "../serial/serialClient";
import type { NetStatusResponse } from "../serial/protocol";
import type { IOPointConfig } from "../types/io";
import type { NetConfig } from "../types/network";

const MAX_LOG_LINES = 200;

export function useSerialConnection(hubId: string) {
  const client = getSerialClient(hubId);
  const [status, setStatus] = useState<SerialStatus>(() => client.getStatus());
  const [log, setLog] = useState<SerialLogEntry[]>([]);
  const [availablePins, setAvailablePins] = useState<string[] | null>(null);
  const [netStatus, setNetStatus] = useState<NetStatusResponse | null>(null);

  useEffect(() => {
    const unsubStatus = client.subscribeStatus(setStatus);
    const unsubLog = client.subscribeLog((entry) => setLog((prev) => [...prev, entry].slice(-MAX_LOG_LINES)));
    const unsubPins = client.subscribePins(setAvailablePins);
    const unsubNet = client.subscribeNetConfig(setNetStatus);
    return () => {
      unsubStatus();
      unsubLog();
      unsubPins();
      unsubNet();
    };
  }, [client]);

  return {
    status,
    log,
    availablePins,
    netStatus,
    isSupported: client.isSupported(),
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
    requestPins: () => client.requestPins(),
    sendConfig: (points: IOPointConfig[]) => client.sendConfig(points),
    requestNetConfig: () => client.requestNetConfig(),
    sendNetConfig: (cfg: NetConfig) => client.sendNetConfig(cfg),
    saveConfig: () => client.saveConfig(),
  };
}
