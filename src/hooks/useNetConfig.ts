import { useEffect, useState } from "react";
import type { NetConfig } from "../types/network";
import { DEFAULT_NET_CONFIG } from "../config/netDefaults";
import { DEFAULT_HUB_ID } from "../config/hubDefaults";

// Pre-multi-hub installs kept one global config under this key.
const LEGACY_STORAGE_KEY = "oceo-hmi-net-config";
const storageKey = (hubId: string) => `oceo-hmi-net-config:${hubId}`;

function loadInitial(hubId: string): NetConfig {
  try {
    let raw = localStorage.getItem(storageKey(hubId));
    // One-time adoption: fold any pre-existing global config into the
    // default hub's scoped key so upgrading users don't lose their setup. A
    // freshly created (non-default) hub has nothing to adopt.
    if (raw === null && hubId === DEFAULT_HUB_ID) raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return DEFAULT_NET_CONFIG;
    return { ...DEFAULT_NET_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NET_CONFIG;
  }
}

export function useNetConfig(hubId: string) {
  const [config, setConfig] = useState<NetConfig>(() => loadInitial(hubId));

  useEffect(() => {
    localStorage.setItem(storageKey(hubId), JSON.stringify(config));
  }, [hubId, config]);

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
