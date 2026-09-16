import { useEffect, useState } from "react";
import type { IOPointConfig, SignalType } from "../types/io";
import { DEFAULT_IO_POINTS } from "../config/ioDefaults";

const STORAGE_KEY = "oceo-hmi-io-config";

function loadInitial(): IOPointConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_IO_POINTS;
    const saved: IOPointConfig[] = JSON.parse(raw);
    // Merge onto defaults so newly added I/O points still show up after an update.
    return DEFAULT_IO_POINTS.map((def) => saved.find((s) => s.id === def.id) ?? def);
  } catch {
    return DEFAULT_IO_POINTS;
  }
}

export function useIOConfig() {
  const [points, setPoints] = useState<IOPointConfig[]>(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  }, [points]);

  const setSignalType = (id: string, signalType: SignalType) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, signalType } : p)));
  };

  const setPin = (id: string, pin: string) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, pin } : p)));
  };

  const resetToDefaults = () => setPoints(DEFAULT_IO_POINTS);

  return { points, setSignalType, setPin, resetToDefaults };
}
