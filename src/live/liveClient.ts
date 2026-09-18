/**
 * Plain WebSocket client for the Oceo relay
 * (/home/user/Desktop/Mugiendii hub/mqtt_relay_oceo) -- NOT an MQTT client.
 * Browsers can't open a raw MQTT/TCP socket, so the relay sits between the
 * broker and here, speaking plain WebSocket JSON: it broadcasts the
 * device's decoded status object on every update, and forwards
 * {"point":"...","value":N} commands sent here straight to the broker's
 * command topic. See docs/live-relay-protocol.md.
 */

export type LiveStatus = "disconnected" | "connecting" | "connected";

export interface LiveLogEntry {
  id: string;
  direction: "tx" | "rx";
  text: string;
  timestamp: number;
}

type StatusListener = (status: LiveStatus) => void;
type StateListener = (state: Record<string, unknown>) => void;
type LogListener = (entry: LiveLogEntry) => void;

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class LiveClient {
  private ws: WebSocket | null = null;
  private status: LiveStatus = "disconnected";
  private statusListeners = new Set<StatusListener>();
  private stateListeners = new Set<StateListener>();
  private logListeners = new Set<LogListener>();

  getStatus(): LiveStatus {
    return this.status;
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  subscribeLog(listener: LogListener): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  connect(url: string): Promise<void> {
    this.ws?.close();
    return new Promise((resolve, reject) => {
      this.setStatus("connecting");
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (err) {
        this.setStatus("disconnected");
        reject(err instanceof Error ? err : new Error("Failed to open WebSocket"));
        return;
      }
      this.ws = ws;
      let settled = false;

      ws.onopen = () => {
        settled = true;
        this.setStatus("connected");
        resolve();
      };
      ws.onclose = () => {
        this.ws = null;
        this.setStatus("disconnected");
        if (!settled) {
          settled = true;
          reject(new Error("Connection closed before it opened"));
        }
      };
      ws.onmessage = (ev) => {
        const text = typeof ev.data === "string" ? ev.data : "";
        this.pushLog("rx", text);
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === "object") {
            this.stateListeners.forEach((l) => l(parsed));
          }
        } catch {
          // ignore non-JSON noise
        }
      };
    });
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.setStatus("disconnected");
  }

  async sendCommand(point: string, value: number): Promise<void> {
    if (!this.ws || this.status !== "connected") throw new Error("Live relay is not connected");
    const line = JSON.stringify({ point, value });
    this.ws.send(line);
    this.pushLog("tx", line);
  }

  private pushLog(direction: "tx" | "rx", text: string) {
    const entry: LiveLogEntry = { id: uid(), direction, text, timestamp: Date.now() };
    this.logListeners.forEach((l) => l(entry));
  }

  private setStatus(status: LiveStatus) {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }
}

const registry = new Map<string, LiveClient>();

/** Each FlowHub board gets its own relay WebSocket -- lazily created and
 * cached per hub id, so N boards can each stay connected concurrently. */
export function getLiveClient(hubId: string): LiveClient {
  let client = registry.get(hubId);
  if (!client) {
    client = new LiveClient();
    registry.set(hubId, client);
  }
  return client;
}

/** Closes and evicts a hub's live client -- call when a hub is deleted so
 * its socket doesn't stay silently open with no UI left to close it from. */
export function releaseLiveClient(hubId: string): void {
  const client = registry.get(hubId);
  if (client) {
    client.disconnect();
    registry.delete(hubId);
  }
}
