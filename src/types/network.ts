export type NetMode = "00" | "01" | "10" | "11"; // offline / 4G / LoRaWAN / both (failover)
export type NetPriority = "4g" | "lora";

export interface NetConfig {
  mode: NetMode;
  apn: string;
  devEui: string;
  joinEui: string;
  appKey: string;
  region: string;
  adr: 0 | 1;
  priority: NetPriority;
}

export interface NetStatus {
  a7672: boolean;
  lorawan: boolean;
}
