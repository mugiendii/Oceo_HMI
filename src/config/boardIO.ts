import type { AnalogInputChannel, OutputChannel } from "../types/site";

// Fixed I/O budget of one FlowHub board (see root FlowHub package.json
// description): 5 relay/digital outputs, 4 analog (4-20mA) inputs, plus
// pump controllers hanging off a separate RS485/Modbus bus rather than a
// board output. Valves and alarms are the only device types that consume an
// output channel; sensors are the only type that consume an analog input.
export const OUTPUT_CHANNELS: OutputChannel[] = ["A", "B", "C", "D", "E"];
export const ANALOG_INPUT_CHANNELS: AnalogInputChannel[] = ["A1", "A2", "A3", "A4"];

// Standard Modbus RTU unit ID range, used for RS485-connected pump controllers.
export const RS485_BUS_ADDRESS_RANGE = { min: 1, max: 247 };

export const DEFAULT_ANALOG_RANGE = { min: 4, max: 20, unit: "mA" };
