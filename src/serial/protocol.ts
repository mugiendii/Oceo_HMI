import type { IOPointConfig } from "../types/io";
import type { NetConfig, NetMode, NetPriority, NetStatus } from "../types/network";

/**
 * Line-delimited JSON protocol spoken over the serial link.
 * Each command/response is a single JSON object terminated by "\n".
 *
 *   HMI  → device : {"cmd":"GET_PINS"}
 *   device → HMI  : {"type":"PINS","pins":["PA0","PA1",...]}
 *
 *   HMI  → device : {"cmd":"SET_CONFIG","points":[{...}]}
 *   device → HMI  : {"type":"ACK","cmd":"SET_CONFIG","ok":true}
 *
 *   HMI  → device : {"cmd":"GET_NET"}
 *   device → HMI  : {"type":"NET","mode":"11","apn":"...",...,"status":{"a7672":true,"lorawan":false}}
 *
 *   HMI  → device : {"cmd":"SET_NET","mode":"01","apn":"..."}
 *   device → HMI  : {"type":"ACK","cmd":"SET_NET","ok":true}
 *
 *   HMI  → device : {"cmd":"SAVE"}
 *   device → HMI  : {"type":"ACK","cmd":"SAVE","ok":true}
 */

export interface GetPinsCommand {
  cmd: "GET_PINS";
}

export interface ConfigPoint {
  id: string;
  name: string;
  direction: IOPointConfig["direction"];
  signalType: IOPointConfig["signalType"];
  pin: string;
}

export interface SetConfigCommand {
  cmd: "SET_CONFIG";
  points: ConfigPoint[];
}

export interface GetNetCommand {
  cmd: "GET_NET";
}

export interface SetNetCommand {
  cmd: "SET_NET";
  mode: NetMode;
  apn: string;
  dev_eui: string;
  join_eui: string;
  app_key: string;
  region: string;
  adr: 0 | 1;
  priority: NetPriority;
}

export interface SaveCommand {
  cmd: "SAVE";
}

export type SerialCommand = GetPinsCommand | SetConfigCommand | GetNetCommand | SetNetCommand | SaveCommand;

export function buildGetPinsCommand(): GetPinsCommand {
  return { cmd: "GET_PINS" };
}

export function buildSetConfigCommand(points: IOPointConfig[]): SetConfigCommand {
  return {
    cmd: "SET_CONFIG",
    points: points.map((p) => ({ id: p.id, name: p.name, direction: p.direction, signalType: p.signalType, pin: p.pin })),
  };
}

export function buildGetNetCommand(): GetNetCommand {
  return { cmd: "GET_NET" };
}

export function buildSetNetCommand(cfg: NetConfig): SetNetCommand {
  return {
    cmd: "SET_NET",
    mode: cfg.mode,
    apn: cfg.apn,
    dev_eui: cfg.devEui,
    join_eui: cfg.joinEui,
    app_key: cfg.appKey,
    region: cfg.region,
    adr: cfg.adr,
    priority: cfg.priority,
  };
}

export function buildSaveCommand(): SaveCommand {
  return { cmd: "SAVE" };
}

export function encodeCommand(command: SerialCommand): string {
  return `${JSON.stringify(command)}\n`;
}

export interface PinsResponse {
  type: "PINS";
  pins: string[];
}

export interface AckResponse {
  type: "ACK";
  cmd: string;
  ok: boolean;
  message?: string;
}

export interface NetStatusResponse extends NetConfig {
  type: "NET";
  status: NetStatus;
}

export type SerialResponse = PinsResponse | AckResponse | NetStatusResponse;

export function parseResponse(line: string): SerialResponse | null {
  try {
    const parsed = JSON.parse(line);
    if (parsed && parsed.type === "PINS" && Array.isArray(parsed.pins)) {
      return { type: "PINS", pins: parsed.pins.filter((p: unknown) => typeof p === "string") };
    }
    if (parsed && parsed.type === "ACK") {
      return { type: "ACK", cmd: String(parsed.cmd ?? ""), ok: Boolean(parsed.ok), message: parsed.message };
    }
    if (parsed && parsed.type === "NET") {
      const mode: NetMode = ["00", "01", "10", "11"].includes(parsed.mode) ? parsed.mode : "00";
      const priority: NetPriority = parsed.priority === "lora" ? "lora" : "4g";
      return {
        type: "NET",
        mode,
        apn: String(parsed.apn ?? ""),
        devEui: String(parsed.dev_eui ?? ""),
        joinEui: String(parsed.join_eui ?? ""),
        appKey: String(parsed.app_key ?? ""),
        region: String(parsed.region ?? ""),
        adr: parsed.adr ? 1 : 0,
        priority,
        status: {
          a7672: Boolean(parsed.status?.a7672),
          lorawan: Boolean(parsed.status?.lorawan),
        },
      };
    }
    return null;
  } catch {
    return null;
  }
}
