import type { Connection, DeviceNode, Site } from "../types/site";
import { uid } from "../lib/uid";
import { DEFAULT_ANALOG_RANGE } from "./boardIO";
import { DEFAULT_HUB_ID } from "./hubDefaults";

type DeviceInit = Omit<DeviceNode, "id"> & { id?: string };

function device(init: DeviceInit): DeviceNode {
  // Every non-tank device starts wired to the default hub -- tanks have no
  // channel of their own, only an optional mirrored sensor.
  return { id: uid(init.type), ...(init.type !== "tank" ? { hubId: DEFAULT_HUB_ID } : {}), ...init };
}

function connect(from: DeviceNode, to: DeviceNode): Connection {
  return { id: uid("conn"), fromId: from.id, toId: to.id };
}

function analogSensor(label: string, inputChannel: DeviceInit["inputChannel"], x: number, y: number): DeviceNode {
  return device({
    type: "sensor",
    label,
    x,
    y,
    inputChannel,
    unit: DEFAULT_ANALOG_RANGE.unit,
    rangeMin: DEFAULT_ANALOG_RANGE.min,
    rangeMax: DEFAULT_ANALOG_RANGE.max,
  });
}

function baseSite(name: string, templateId: string): Omit<Site, "devices" | "connections" | "rules"> {
  return { id: uid("site"), name, templateId, defaultHubId: DEFAULT_HUB_ID, createdAt: Date.now() };
}

function blank(name: string): Site {
  return { ...baseSite(name, "blank"), devices: [], connections: [], rules: [] };
}

/** Scenario 1 -- Agriculture / Smart Farm: precision crop irrigation & water allocation. */
function smartFarmIrrigation(name: string): Site {
  const pump = device({ type: "pump", label: "Borehole Pump", x: 150, y: 460, busAddress: 1 });
  const boreholeLevel = analogSensor("Borehole Level", "A1", 150, 280);
  const dryRunAlarm = device({ type: "alarm", label: "Dry-Run / Low Borehole Alarm", x: 150, y: 140, outputChannel: "D" });
  const orchardValve = device({ type: "valve", label: "Orchard Zone Valve", x: 420, y: 140, outputChannel: "A" });
  const greenhouseValve = device({ type: "valve", label: "Greenhouse 1 Zone Valve", x: 650, y: 280, outputChannel: "B" });
  const maizeValve = device({ type: "valve", label: "Maize Field Zone Valve", x: 420, y: 460, outputChannel: "C" });
  const soilMoisture = analogSensor("Maize Field Soil Moisture", "A2", 650, 460);

  return {
    ...baseSite(name, "smart-farm-irrigation"),
    devices: [pump, boreholeLevel, dryRunAlarm, orchardValve, greenhouseValve, maizeValve, soilMoisture],
    connections: [
      connect(pump, boreholeLevel),
      connect(pump, orchardValve),
      connect(pump, greenhouseValve),
      connect(pump, maizeValve),
      connect(maizeValve, soilMoisture),
    ],
    rules: [],
  };
}

/** Scenario 2 -- Field Service & Commissioning: starts blank, framed for testing one vendor device at a time. */
function fieldCommissioning(name: string): Site {
  return { ...baseSite(name, "field-commissioning"), devices: [], connections: [], rules: [] };
}

/** Scenario 3 -- Residential Estate / Apartment Complex: rooftop reservoir & supply management. */
function estateWaterSupply(name: string): Site {
  const groundTank = device({ type: "tank", label: "Ground Collection Tank", x: 150, y: 460 });
  const groundFloat = analogSensor("Ground Tank Float Level", "A1", 340, 460);
  const pump = device({ type: "pump", label: "Booster Pump", x: 150, y: 280, busAddress: 1 });
  const inflowValve = device({ type: "valve", label: "Rooftop Inflow Shut-Off", x: 420, y: 180, outputChannel: "A" });
  const rooftopTank = device({ type: "tank", label: "Rooftop Reservoir", x: 650, y: 140 });
  const rooftopFloat = analogSensor("Rooftop Float Level", "A2", 650, 280);
  const pressure = analogSensor("Upper Floor Line Pressure", "A3", 850, 460);
  const overflowAlarm = device({ type: "alarm", label: "Overflow / Dry-Run Alarm", x: 420, y: 460, outputChannel: "B" });
  groundTank.levelSensorId = groundFloat.id;
  rooftopTank.levelSensorId = rooftopFloat.id;

  return {
    ...baseSite(name, "estate-water-supply"),
    devices: [groundTank, groundFloat, pump, inflowValve, rooftopTank, rooftopFloat, pressure, overflowAlarm],
    connections: [connect(groundTank, pump), connect(pump, inflowValve), connect(inflowValve, rooftopTank), connect(pump, pressure)],
    rules: [],
  };
}

/** Scenario 4 -- Hospitality / Healthcare: centralized hot water & thermal mixing control. */
function hotWaterThermalMixing(name: string): Site {
  const pump = device({ type: "pump", label: "Recirculation Pump", x: 150, y: 460, busAddress: 1 });
  const heaterTemp = analogSensor("Heater Core Temp", "A1", 150, 260);
  const mixingValve = device({ type: "valve", label: "Thermal Mixing Valve", x: 420, y: 360, outputChannel: "A" });
  const supplyTemp = analogSensor("Blended Supply Temp", "A2", 650, 360);
  const scaldAlarm = device({ type: "alarm", label: "Scald / High-Temp Alarm", x: 650, y: 180, outputChannel: "B" });

  return {
    ...baseSite(name, "hot-water-thermal-mixing"),
    devices: [pump, heaterTemp, mixingValve, supplyTemp, scaldAlarm],
    connections: [connect(heaterTemp, pump), connect(pump, mixingValve), connect(mixingValve, supplyTemp), connect(supplyTemp, scaldAlarm)],
    rules: [],
  };
}

/** Scenario 5 -- Industrial Campus / Business Park: multi-hop grid & mainline leak detection. */
function campusLeakDetection(name: string): Site {
  const mainFlow = analogSensor("Main Feeder Flow", "A1", 150, 340);
  const zoneAValve = device({ type: "valve", label: "Zone A Isolation Valve", x: 420, y: 180, outputChannel: "A" });
  const zoneAFlow = analogSensor("Zone A Branch Flow", "A2", 650, 180);
  const zoneBValve = device({ type: "valve", label: "Zone B Isolation Valve", x: 420, y: 340, outputChannel: "B" });
  const zoneBFlow = analogSensor("Zone B Branch Flow", "A3", 650, 340);
  const zoneCValve = device({ type: "valve", label: "Zone C Isolation Valve", x: 420, y: 500, outputChannel: "C" });
  const zoneCFlow = analogSensor("Zone C Branch Flow", "A4", 650, 500);
  const leakAlarm = device({ type: "alarm", label: "Pipe Burst / Leak Alarm", x: 880, y: 340, outputChannel: "D" });

  return {
    ...baseSite(name, "campus-leak-detection"),
    devices: [mainFlow, zoneAValve, zoneAFlow, zoneBValve, zoneBFlow, zoneCValve, zoneCFlow, leakAlarm],
    connections: [
      connect(mainFlow, zoneAValve),
      connect(zoneAValve, zoneAFlow),
      connect(mainFlow, zoneBValve),
      connect(zoneBValve, zoneBFlow),
      connect(mainFlow, zoneCValve),
      connect(zoneCValve, zoneCFlow),
    ],
    rules: [],
  };
}

function waterFiltrationSkid(name: string): Site {
  const pump = device({ type: "pump", label: "Feed Pump", x: 480, y: 520, busAddress: 1 });
  const tankA = device({ type: "tank", label: "Tank A", x: 140, y: 140 });
  const tankB = device({ type: "tank", label: "Tank B", x: 980, y: 140 });
  const levelA = analogSensor("LVL-A", "A1", 300, 140);
  const levelB = analogSensor("LVL-B", "A2", 820, 140);
  const valve1 = device({ type: "valve", label: "Feed Valve", x: 300, y: 320, outputChannel: "A" });
  const valve2 = device({ type: "valve", label: "Discharge Valve", x: 660, y: 320, outputChannel: "B" });
  const valve3 = device({ type: "valve", label: "Outlet Valve", x: 820, y: 460, outputChannel: "C" });
  tankA.levelSensorId = levelA.id;
  tankB.levelSensorId = levelB.id;

  return {
    ...baseSite(name, "water-filtration-skid"),
    devices: [pump, tankA, tankB, levelA, levelB, valve1, valve2, valve3],
    connections: [connect(tankA, valve1), connect(valve1, pump), connect(pump, valve2), connect(valve2, tankB), connect(valve2, valve3)],
    rules: [],
  };
}

export interface Template {
  id: string;
  label: string;
  description: string;
  build: (name: string) => Site;
}

export const TEMPLATES: Template[] = [
  { id: "blank", label: "Blank Canvas", description: "Start empty and drag on your own pumps, sensors, valves, and alarms.", build: blank },
  {
    id: "smart-farm-irrigation",
    label: "Smart Farm Irrigation",
    description:
      "Commercial farm / greenhouses. Borehole pump with dry-run protection, and zone valves + soil moisture for Orchard, Greenhouse 1, and Maize Field.",
    build: smartFarmIrrigation,
  },
  {
    id: "field-commissioning",
    label: "Field Service Commissioning",
    description:
      "On-site installation & commissioning. Starts blank -- drag in and configure one vendor device at a time as you test and calibrate it.",
    build: fieldCommissioning,
  },
  {
    id: "estate-water-supply",
    label: "Residential Estate Water Supply",
    description:
      "Multi-unit residential / gated community. Ground + rooftop tanks with float-level sensors, a booster pump, line pressure, and an automatic inflow shut-off.",
    build: estateWaterSupply,
  },
  {
    id: "hot-water-thermal-mixing",
    label: "Hot Water & Thermal Mixing",
    description:
      "Hotels, hospitals, gyms. Recirculation pump and thermal mixing valve across heater-core and blended-supply temperature sensors, with a scald/high-temp alarm.",
    build: hotWaterThermalMixing,
  },
  {
    id: "campus-leak-detection",
    label: "Campus Leak Detection",
    description:
      "Industrial campus / business park. Main feeder flow plus per-zone branch flow sensors and isolation valves, with a pipe-burst/leak alarm.",
    build: campusLeakDetection,
  },
  {
    id: "water-filtration-skid",
    label: "Water Filtration Skid (generic)",
    description: "A generic canvas approximation of the original filtration skid layout -- not the original itself, just a starting point inspired by it.",
    build: waterFiltrationSkid,
  },
];
