import { useEffect, useState } from "react";
import { serialClient, type SerialLogEntry, type SerialStatus } from "../serial/serialClient";
import type { NetStatusResponse } from "../serial/protocol";
import type { IOPointConfig } from "../types/io";
import type { NetConfig } from "../types/network";

const MAX_LOG_LINES = 200;

export function useSerialConnection() {
  const [status, setStatus] = useState<SerialStatus>(() => serialClient.getStatus());
  const [log, setLog] = useState<SerialLogEntry[]>([]);
  const [availablePins, setAvailablePins] = useState<string[] | null>(null);
  const [netStatus, setNetStatus] = useState<NetStatusResponse | null>(null);

  useEffect(() => {
    const unsubStatus = serialClient.subscribeStatus(setStatus);
    const unsubLog = serialClient.subscribeLog((entry) => setLog((prev) => [...prev, entry].slice(-MAX_LOG_LINES)));
    const unsubPins = serialClient.subscribePins(setAvailablePins);
    const unsubNet = serialClient.subscribeNetConfig(setNetStatus);
    return () => {
      unsubStatus();
      unsubLog();
      unsubPins();
      unsubNet();
    };
  }, []);

  return {
    status,
    log,
    availablePins,
    netStatus,
    isSupported: serialClient.isSupported(),
    connect: () => serialClient.connect(),
    disconnect: () => serialClient.disconnect(),
    requestPins: () => serialClient.requestPins(),
    sendConfig: (points: IOPointConfig[]) => serialClient.sendConfig(points),
    requestNetConfig: () => serialClient.requestNetConfig(),
    sendNetConfig: (cfg: NetConfig) => serialClient.sendNetConfig(cfg),
    saveConfig: () => serialClient.saveConfig(),
  };
}
