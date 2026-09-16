import type { SolenoidId, SystemState } from "../types/filtration";
import { SOLENOID_LABELS, TANK_MICRON } from "../config/filtrationLabels";

/**
 * No PLC/controller is wired up yet by default. Until the operator connects
 * to the live relay (src/live/), this simulator assumes the happy path:
 * feed pump running, all 3 solenoids open, water flowing through every
 * stage. The 3 solenoids can be toggled from the HMI to preview what
 * happens when a path is shut off — downstream flow, tank filling, and
 * sensor activity are all derived from valve/pump state via deriveFlows(),
 * which src/live/liveFiltrationAdapter.ts reuses for the real thing so
 * there's one source of truth for "what does an open valve + running pump
 * imply downstream," not two.
 */

const TICK_MS = 1000;

type StateListener = (state: SystemState) => void;

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Stage 1 & 2 sit upstream of every valve, so they always flow off the
 * feed. Everything past a solenoid depends on that valve (and the pump,
 * for the suction side) actually being open. Mutates `s` in place.
 */
export function deriveFlows(s: SystemState): void {
  const stage3Flowing = s.solenoids[2].open && s.pump.running;

  s.stages[3].flowing = stage3Flowing;
  s.stages[4].flowing = stage3Flowing; // stage 4 has no valve of its own — it mirrors stage 3's supply
  s.tankA.filling = s.solenoids[1].open;
  s.tankB.filling = stage3Flowing;
  s.externalOutletFlowing = s.solenoids[3].open && stage3Flowing;
}

class FiltrationSimulator {
  private state: SystemState;
  private listeners = new Set<StateListener>();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.state = {
      timestamp: Date.now(),
      simulated: true,
      feedFlowing: true,
      stages: {
        1: { id: 1, flowing: true },
        2: { id: 2, flowing: true },
        3: { id: 3, flowing: true },
        4: { id: 4, flowing: true },
      },
      tankA: { level: 38, micron: TANK_MICRON.a, filling: true },
      tankB: { level: 61, micron: TANK_MICRON.b, filling: true },
      solenoids: {
        1: { id: 1, label: SOLENOID_LABELS[1], open: true },
        2: { id: 2, label: SOLENOID_LABELS[2], open: true },
        3: { id: 3, label: SOLENOID_LABELS[3], open: true },
      },
      pump: { running: true },
      externalOutletFlowing: true,
      sensors: {
        tdsAfterStage2: 420,
        tdsBeforeStage4: 95,
        flowToTankA: 12.4,
      },
    };
    deriveFlows(this.state);
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): SystemState {
    return this.state;
  }

  // ---- operator commands ----

  toggleSolenoid(id: SolenoidId) {
    const solenoid = this.state.solenoids[id];
    solenoid.open = !solenoid.open;
    deriveFlows(this.state);
    this.emit();
  }

  togglePump() {
    this.state.pump.running = !this.state.pump.running;
    deriveFlows(this.state);
    this.emit();
  }

  // ---- internal simulation ----

  private tick() {
    const s = this.state;
    s.timestamp = Date.now();

    // Gentle sawtooth fill so the tanks feel alive even with no real telemetry
    // — but only while their supply valve is actually open.
    if (s.tankA.filling) s.tankA.level = wrap(s.tankA.level + 0.12 + Math.random() * 0.06);
    if (s.tankB.filling) s.tankB.level = wrap(s.tankB.level + 0.09 + Math.random() * 0.06);

    // Sensor readings random-walk around a plausible baseline while flowing.
    if (s.stages[2].flowing) {
      s.sensors.tdsAfterStage2 = clamp(s.sensors.tdsAfterStage2 + (Math.random() - 0.5) * 6, 350, 480);
    }
    if (s.stages[3].flowing && s.stages[4].flowing) {
      s.sensors.tdsBeforeStage4 = clamp(s.sensors.tdsBeforeStage4 + (Math.random() - 0.5) * 3, 60, 130);
    }
    if (s.solenoids[1].open) {
      s.sensors.flowToTankA = clamp(s.sensors.flowToTankA + (Math.random() - 0.5) * 0.4, 8, 16);
    } else {
      s.sensors.flowToTankA = 0;
    }

    this.emit();
  }

  private emit() {
    this.listeners.forEach((l) => l({ ...this.state }));
  }
}

function wrap(level: number): number {
  const next = clamp(level, 5, 96);
  return next >= 95.5 ? 20 : next;
}

export const filtrationSimulator = new FiltrationSimulator();
