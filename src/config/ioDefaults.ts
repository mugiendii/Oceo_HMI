import type { IOPointConfig } from "../types/io";

const PORTS = ["A", "B", "C", "D"] as const;
const PINS_PER_PORT = 16;

export const AVAILABLE_PINS: string[] = PORTS.flatMap((port) =>
  Array.from({ length: PINS_PER_PORT }, (_, i) => `P${port}${i}`),
);

export const DEFAULT_IO_POINTS: IOPointConfig[] = [
  // ---- inputs (sensors / feedback) ----
  {
    id: "tds1",
    name: "TDS-1",
    description: "Water quality sensor — after Stage 2",
    direction: "input",
    signalType: "analog",
    pin: "PA0",
  },
  {
    id: "tds2",
    name: "TDS-2",
    description: "Water quality sensor — before Stage 4 inlet",
    direction: "input",
    signalType: "analog",
    pin: "PA1",
  },
  {
    id: "flow1",
    name: "FLOW-1",
    description: "Flow sensor — before Tank A inlet",
    direction: "input",
    signalType: "digital",
    pin: "PA2",
  },
  {
    id: "levelA",
    name: "LVL-A",
    description: "Tank A level sensor",
    direction: "input",
    signalType: "analog",
    pin: "PA3",
  },
  {
    id: "levelB",
    name: "LVL-B",
    description: "Tank B level sensor",
    direction: "input",
    signalType: "analog",
    pin: "PA4",
  },
  // ---- outputs (actuators) ----
  {
    id: "solenoid1",
    name: "SOL-1",
    description: "Solenoid valve — Tank A feed",
    direction: "output",
    signalType: "digital",
    pin: "PB0",
  },
  {
    id: "solenoid2",
    name: "SOL-2",
    description: "Solenoid valve — pump suction",
    direction: "output",
    signalType: "digital",
    pin: "PB1",
  },
  {
    id: "solenoid3",
    name: "SOL-3",
    description: "Solenoid valve — external outlet",
    direction: "output",
    signalType: "digital",
    pin: "PB2",
  },
  {
    id: "pump1",
    name: "PUMP-1",
    description: "Feed pump run/stop",
    direction: "output",
    signalType: "digital",
    pin: "PB3",
  },
];
