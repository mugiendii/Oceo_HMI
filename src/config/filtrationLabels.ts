import type { SolenoidId } from "../types/filtration";

// Presentation-only metadata -- not hardware data, so it doesn't come from
// the device. Shared between the mock simulator and the live state adapter
// so both build a SystemState with the same labels.
export const SOLENOID_LABELS: Record<SolenoidId, string> = {
  1: "SOL-1 · Tank A Feed",
  2: "SOL-2 · Pump Suction",
  3: "SOL-3 · External Outlet",
};

export const TANK_MICRON = { a: "0.3", b: "0.6" } as const;
