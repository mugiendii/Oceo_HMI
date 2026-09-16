import type { IOPointConfig } from "../types/io";
import type { NetConfig } from "../types/network";
import {
  buildGetPinsCommand,
  buildSetConfigCommand,
  buildGetNetCommand,
  buildSetNetCommand,
  buildSaveCommand,
  encodeCommand,
  parseResponse,
  type NetStatusResponse,
} from "./protocol";

export type SerialStatus = "unsupported" | "disconnected" | "connecting" | "connected";

export interface SerialLogEntry {
  id: string;
  direction: "tx" | "rx";
  text: string;
  timestamp: number;
}

type StatusListener = (status: SerialStatus) => void;
type LogListener = (entry: SerialLogEntry) => void;
type PinsListener = (pins: string[]) => void;
type NetConfigListener = (net: NetStatusResponse) => void;

const DEFAULT_BAUD_RATE = 115200;

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class SerialClient {
  private port: SerialPort | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private readCancelled = false;

  private status: SerialStatus = this.isSupported() ? "disconnected" : "unsupported";
  private statusListeners = new Set<StatusListener>();
  private logListeners = new Set<LogListener>();
  private pinsListeners = new Set<PinsListener>();
  private netConfigListeners = new Set<NetConfigListener>();

  isSupported(): boolean {
    return typeof navigator !== "undefined" && "serial" in navigator && !!navigator.serial;
  }

  getStatus(): SerialStatus {
    return this.status;
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  subscribeLog(listener: LogListener): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  subscribePins(listener: PinsListener): () => void {
    this.pinsListeners.add(listener);
    return () => this.pinsListeners.delete(listener);
  }

  subscribeNetConfig(listener: NetConfigListener): () => void {
    this.netConfigListeners.add(listener);
    return () => this.netConfigListeners.delete(listener);
  }

  async connect(baudRate = DEFAULT_BAUD_RATE): Promise<void> {
    if (!this.isSupported() || !navigator.serial) {
      throw new Error("Web Serial API is not supported in this browser");
    }
    this.setStatus("connecting");
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate });
      this.port = port;
      this.setStatus("connected");
      this.startReadLoop();
    } catch (err) {
      this.setStatus("disconnected");
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.readCancelled = true;
    try {
      await this.reader?.cancel();
    } catch {
      // reader may already be released
    }
    this.reader = null;

    try {
      await this.writer?.close();
    } catch {
      // writer may already be released
    }
    this.writer = null;

    try {
      await this.port?.close();
    } catch {
      // ignore close errors on teardown
    }
    this.port = null;
    this.setStatus(this.isSupported() ? "disconnected" : "unsupported");
  }

  async requestPins(): Promise<void> {
    await this.sendLine(encodeCommand(buildGetPinsCommand()));
  }

  async sendConfig(points: IOPointConfig[]): Promise<void> {
    await this.sendLine(encodeCommand(buildSetConfigCommand(points)));
  }

  async requestNetConfig(): Promise<void> {
    await this.sendLine(encodeCommand(buildGetNetCommand()));
  }

  async sendNetConfig(cfg: NetConfig): Promise<void> {
    await this.sendLine(encodeCommand(buildSetNetCommand(cfg)));
  }

  async saveConfig(): Promise<void> {
    await this.sendLine(encodeCommand(buildSaveCommand()));
  }

  private async sendLine(line: string): Promise<void> {
    if (!this.port?.writable) throw new Error("Serial port is not connected");
    if (!this.writer) this.writer = this.port.writable.getWriter();
    await this.writer.write(new TextEncoder().encode(line));
    this.pushLog("tx", line.trimEnd());
  }

  private async startReadLoop(): Promise<void> {
    if (!this.port?.readable) return;
    this.readCancelled = false;
    this.reader = this.port.readable.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    try {
      while (!this.readCancelled) {
        const { value, done } = await this.reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (line) this.handleIncomingLine(line);
        }
      }
    } catch {
      // port likely disconnected mid-read
    } finally {
      try {
        this.reader?.releaseLock();
      } catch {
        // ignore
      }
      if (!this.readCancelled) {
        // read loop ended unexpectedly (e.g. cable unplugged)
        this.setStatus(this.isSupported() ? "disconnected" : "unsupported");
      }
    }
  }

  private handleIncomingLine(line: string) {
    this.pushLog("rx", line);
    const response = parseResponse(line);
    if (response?.type === "PINS") {
      this.pinsListeners.forEach((l) => l(response.pins));
    } else if (response?.type === "NET") {
      this.netConfigListeners.forEach((l) => l(response));
    }
  }

  private pushLog(direction: "tx" | "rx", text: string) {
    const entry: SerialLogEntry = { id: uid(), direction, text, timestamp: Date.now() };
    this.logListeners.forEach((l) => l(entry));
  }

  private setStatus(status: SerialStatus) {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }
}

export const serialClient = new SerialClient();
