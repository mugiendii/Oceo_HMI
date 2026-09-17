// Generic multi-site device model. Kept entirely separate from
// `types/filtration.ts` (the original hardcoded filtration skid), which
// keeps its own bespoke shape untouched -- see src/hooks/useSites.ts for
// why the two systems run in parallel instead of sharing one model.

/** One of the FlowHub board's 5 fixed relay/digital outputs. */
export type OutputChannel = "A" | "B" | "C" | "D" | "E";

/** One of the FlowHub board's 4 fixed 4-20mA analog inputs. */
export type AnalogInputChannel = "A1" | "A2" | "A3" | "A4";

export type DeviceType = "pump" | "valve" | "sensor" | "alarm" | "tank";

export interface DeviceNode {
  id: string;
  type: DeviceType;
  label: string;
  x: number;
  y: number;
  // ---- sensor-only: analog 4-20mA scaling ----
  unit?: string;
  rangeMin?: number;
  rangeMax?: number;
  // ---- I/O binding, one per type ----
  outputChannel?: OutputChannel; // valve | alarm
  inputChannel?: AnalogInputChannel; // sensor
  busAddress?: number; // pump -- RS485/Modbus slave address, not a board channel
  // ---- tank-only ----
  levelSensorId?: string; // mirror this sensor's scaled value as the tank level; idle drift if unset
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

export type RuleOperator = ">=" | "<=" | ">" | "<" | "==";
export type ActuatorCommand = "on" | "off";

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  condition: {
    sensorId: string;
    operator: RuleOperator;
    value: number;
  };
  actions: { actuatorId: string; command: ActuatorCommand }[];
}

export interface Site {
  id: string;
  name: string;
  templateId: string;
  /** true only for the single auto-created original filtration skid -- see useSites.ts */
  isLegacy?: boolean;
  devices: DeviceNode[];
  connections: Connection[];
  rules: Rule[];
  createdAt: number;
}
