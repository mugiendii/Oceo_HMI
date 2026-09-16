import type { NetConfig } from "../types/network";

export const DEFAULT_NET_CONFIG: NetConfig = {
  mode: "00",
  apn: "",
  devEui: "",
  joinEui: "",
  appKey: "",
  region: "",
  adr: 0,
  priority: "4g",
};
