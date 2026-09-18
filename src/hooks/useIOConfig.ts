import { useEffect, useState } from "react";
import type { IOPointConfig, SignalType } from "../types/io";
import { DEFAULT_IO_POINTS } from "../config/ioDefaults";
import { DEFAULT_HUB_ID } from "../config/hubDefaults";

// Pre-multi-hub installs kept one global config under this key.
const LEGACY_STORAGE_KEY = "oceo-hmi-io-config";
const storageKey = (hubId: string) => `oceo-hmi-io-config:${hubId}`;

function loadInitial(hubId: string): IOPointConfig[] {
  try {
    let raw = localStorage.getItem(storageKey(hubId));
    // One-time adoption: fold any pre-existing global config into the
    // default hub's scoped key so upgrading users don't lose their setup. A
    // freshly created (non-default) hub has nothing to adopt.
    if (raw === null && hubId === DEFAULT_HUB_ID) raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return DEFAULT_IO_POINTS;
    const saved: IOPointConfig[] = JSON.parse(raw);
    // Merge onto defaults so newly added I/O points still show up after an update.
    return DEFAULT_IO_POINTS.map((def) => saved.find((s) => s.id === def.id) ?? def);
  } catch {
    return DEFAULT_IO_POINTS;
  }
}

export function useIOConfig(hubId: string) {
  const [points, setPoints] = useState<IOPointConfig[]>(() => loadInitial(hubId));

  useEffect(() => {
    localStorage.setItem(storageKey(hubId), JSON.stringify(points));
  }, [hubId, points]);

  const setSignalType = (id: string, signalType: SignalType) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, signalType } : p)));
  };

  const setPin = (id: string, pin: string) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, pin } : p)));
  };

  const resetToDefaults = () => setPoints(DEFAULT_IO_POINTS);

  return { points, setSignalType, setPin, resetToDefaults };
}
