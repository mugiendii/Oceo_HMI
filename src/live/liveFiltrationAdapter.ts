import type { SystemState } from "../types/filtration";
import { SOLENOID_LABELS, TANK_MICRON } from "../config/filtrationLabels";
import { deriveFlows } from "../mock/filtrationSimulator";

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool01(v: unknown): boolean {
  return num(v) !== 0;
}

// No real sensor calibration yet -- raw is either already ~0-100 or a
// 12-bit ADC reading, and there's no way to tell which without it.
function scaleToPercent(raw: number): number {
  if (raw <= 1) return raw * 100;
  return Math.max(0, Math.min(100, (raw / 4095) * 100));
}

export function adaptLiveState(raw: Record<string, unknown>): SystemState {
  const solenoid1 = bool01(raw.solenoid1);
  const solenoid2 = bool01(raw.solenoid2);
  const solenoid3 = bool01(raw.solenoid3);
  const pumpRunning = bool01(raw.pump1);

  const state: SystemState = {
    timestamp: num(raw.timestamp, Date.now() / 1000) * 1000,
    simulated: false,
    feedFlowing: true,
    stages: {
      1: { id: 1, flowing: true },
      2: { id: 2, flowing: true },
      3: { id: 3, flowing: false },
      4: { id: 4, flowing: false },
    },
    tankA: { level: scaleToPercent(num(raw.levelA)), micron: TANK_MICRON.a, filling: false },
    tankB: { level: scaleToPercent(num(raw.levelB)), micron: TANK_MICRON.b, filling: false },
    solenoids: {
      1: { id: 1, label: SOLENOID_LABELS[1], open: solenoid1 },
      2: { id: 2, label: SOLENOID_LABELS[2], open: solenoid2 },
      3: { id: 3, label: SOLENOID_LABELS[3], open: solenoid3 },
    },
    pump: { running: pumpRunning },
    externalOutletFlowing: false,
    sensors: {
      tdsAfterStage2: num(raw.tds1),
      tdsBeforeStage4: num(raw.tds2),
      flowToTankA: num(raw.flow1),
    },
  };

  deriveFlows(state);
  return state;
}
