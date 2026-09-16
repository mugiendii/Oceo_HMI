import { useEffect, useState } from "react";
import type { NetConfig } from "../types/network";
import { DEFAULT_NET_CONFIG } from "../config/netDefaults";

const STORAGE_KEY = "oceo-hmi-net-config";

function loadInitial(): NetConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NET_CONFIG;
    return { ...DEFAULT_NET_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NET_CONFIG;
  }
}

export function useNetConfig() {
  const [config, setConfig] = useState<NetConfig>(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  function setField<K extends keyof NetConfig>(key: K, value: NetConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  // Overwrites the local draft with what the controller reported (e.g. after
  // "Request Current Config") -- same "device is the source of truth once
  // connected" idea as availablePins replacing the default pin dropdown.
  const loadFromDevice = (net: NetConfig) => setConfig(net);
  const resetToDefaults = () => setConfig(DEFAULT_NET_CONFIG);

  return { config, setField, loadFromDevice, resetToDefaults };
}
