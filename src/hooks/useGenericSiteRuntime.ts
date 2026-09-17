import { useEffect, useMemo, useState } from "react";
import type { DeviceNode, Site } from "../types/site";

const TICK_MS = 1000;

export interface RuntimeValue {
  on?: boolean; // pump | valve | alarm
  value?: number; // sensor -- raw reading within [rangeMin, rangeMax]
  level?: number; // tank -- 0-100 %
}

export type SiteRuntime = Record<string, RuntimeValue>;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function seedFor(device: DeviceNode): RuntimeValue {
  switch (device.type) {
    case "pump":
    case "valve":
      return { on: true }; // happy-path default, same idea as the original simulator
    case "alarm":
      return { on: false };
    case "sensor": {
      const min = device.rangeMin ?? 4;
      const max = device.rangeMax ?? 20;
      return { value: (min + max) / 2 };
    }
    case "tank":
      return { level: 50 };
  }
}

/**
 * Drives every non-legacy site. Deliberately independent of
 * mock/filtrationSimulator.ts -- see the plan's "zero regression" note.
 * Sensors gently random-walk; actuators only change via dispatch/toggle;
 * a tank mirrors its linked level sensor if it has one, else idles.
 */
export function useGenericSiteRuntime(site: Site) {
  const [runtime, setRuntime] = useState<SiteRuntime>(() => {
    const initial: SiteRuntime = {};
    for (const d of site.devices) initial[d.id] = seedFor(d);
    return initial;
  });

  // Devices dropped onto the canvas after mount have no runtime entry yet --
  // fall back to a fresh seed for them here (a derived value) rather than
  // writing one via a setState-in-effect, which would trigger an extra
  // render pass for no benefit.
  const effectiveRuntime = useMemo(() => {
    let changed = false;
    const merged: SiteRuntime = { ...runtime };
    for (const d of site.devices) {
      if (!(d.id in merged)) {
        merged[d.id] = seedFor(d);
        changed = true;
      }
    }
    return changed ? merged : runtime;
  }, [runtime, site.devices]);

  useEffect(() => {
    const id = setInterval(() => {
      setRuntime((prev) => {
        const next = { ...prev };

        for (const d of site.devices) {
          if (d.type !== "sensor") continue;
          const min = d.rangeMin ?? 4;
          const max = d.rangeMax ?? 20;
          const cur = next[d.id]?.value ?? (min + max) / 2;
          const drift = (max - min) * 0.03;
          next[d.id] = { value: clamp(cur + (Math.random() - 0.5) * drift, min, max) };
        }

        for (const d of site.devices) {
          if (d.type !== "tank") continue;
          const sensor = d.levelSensorId ? site.devices.find((s) => s.id === d.levelSensorId) : undefined;
          const sensorValue = sensor ? next[sensor.id]?.value : undefined;
          if (sensor && sensorValue !== undefined) {
            const min = sensor.rangeMin ?? 4;
            const max = sensor.rangeMax ?? 20;
            const pct = ((sensorValue - min) / (max - min)) * 100;
            next[d.id] = { level: clamp(pct, 0, 100) };
          } else {
            const cur = next[d.id]?.level ?? 50;
            next[d.id] = { level: clamp(cur + (Math.random() - 0.5) * 2, 5, 95) };
          }
        }

        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [site.devices]);

  // A just-dropped device may have no entry in raw `runtime` yet (only in
  // the seeded `effectiveRuntime` merge above) -- fall back to its seed here
  // too, so the first click/dispatch flips from the value actually on
  // screen instead of from a phantom "off".
  function currentOn(deviceId: string, prev: SiteRuntime): boolean {
    if (deviceId in prev) return !!prev[deviceId]?.on;
    const device = site.devices.find((d) => d.id === deviceId);
    return device ? !!seedFor(device).on : false;
  }

  function dispatch(deviceId: string, command: "on" | "off") {
    setRuntime((prev) => {
      const desired = command === "on";
      if (currentOn(deviceId, prev) === desired) return prev; // idempotent
      return { ...prev, [deviceId]: { ...prev[deviceId], on: desired } };
    });
  }

  function toggleDevice(deviceId: string) {
    setRuntime((prev) => ({ ...prev, [deviceId]: { ...prev[deviceId], on: !currentOn(deviceId, prev) } }));
  }

  return { runtime: effectiveRuntime, dispatch, toggleDevice };
}
