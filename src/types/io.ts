export type IODirection = "input" | "output";
export type SignalType = "analog" | "digital";

export interface IOPointConfig {
  id: string;
  name: string;
  description: string;
  direction: IODirection;
  signalType: SignalType;
  pin: string;
}
