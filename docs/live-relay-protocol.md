# Oceo HMI — Live Relay Protocol

Describes the plain WebSocket protocol between the HMI's Process Diagram
(browser) and `mqtt_relay_oceo` (`/home/user/Desktop/Mugiendii hub/mqtt_relay_oceo`).
This is **not** MQTT — browsers can't open a raw MQTT/TCP socket, so the
relay sits between the broker and here, speaking plain WebSocket JSON.

Source of truth in code: [`src/live/liveClient.ts`](../src/live/liveClient.ts).

Each FlowHub board gets its own independent WebSocket connection to its own
`mqtt_relay_oceo` instance -- the HMI can hold several of these open
concurrently (one per hub, via `getLiveClient(hubId)`), each speaking exactly
this same protocol independently. There is no hub identifier in any
message; a hub's identity is which WebSocket connection the message arrived
on, not anything in the payload.

## Transport

| Setting  | Value |
|----------|-------|
| Physical | WebSocket, `ws://<relay-host>:8766` by default |
| Framing  | One JSON object per message |

## Status broadcast (relay → HMI)

Sent once on connect (if a status is already cached) and again every time
the device publishes to `oceo/status` on the broker. The relay passes the
device's payload through close to as-is, plus `online`/`timestamp`:

```json
{"v":"12.10","i":"340.20","p":"4114.00","tds1":420,"tds2":95,"flow1":1,
 "levelA":38,"levelB":61,"solenoid1":1,"solenoid2":1,"solenoid3":0,
 "pump1":1,"online":true,"timestamp":1732650000.1}
```

`solenoid1/2/3` and `pump1` are `0`/`1`. The 5 sensor fields (`tds1`,
`tds2`, `flow1`, `levelA`, `levelB`) are whatever the firmware's `ioRead()`
returned for that channel's current mode — raw ADC counts if analog, `0`/`1`
if digital. No calibration/scaling on the wire; `src/live/liveFiltrationAdapter.ts`
does a best-effort display scale client-side.

`v`/`i`/`p` (power telemetry) are only present when the device's INA219 is
actually detected — absent, not zeroed, otherwise. Don't assume they exist.

`online` flips to `false` if the relay hasn't seen a status message in
`STALE_AFTER_S` (15s default) — the HMI should treat this the same as a lost
connection, not trust the rest of the payload as current.

The device also tags every `oceo/status` publish with an `"id"` field
(`1001` for this periodic broadcast, `3003` for a one-off "command consumed"
confirmation after a remote command is applied — see the firmware README's
"Remote control" section). The relay logs both to SQLite but **only
forwards `id:1001` to the browser** — a `3003` message is missing almost
every field a real status has, so broadcasting it here would look like
every other point just dropped to `0`. If you need to see `3003` events,
query the relay's `events.db` directly rather than expecting them over this
WebSocket.

## Command (HMI → relay)

Sent when the operator clicks a solenoid valve or the pump in the diagram.

```json
{"point":"solenoid1","value":0}
```

| Field   | Type                                          | Notes |
|---------|------------------------------------------------|-------|
| `point` | `"solenoid1"\|"solenoid2"\|"solenoid3"\|"pump1"` | Only the 4 output points — anything else is dropped by the relay |
| `value` | `0\|1`                                          | Clamped/dropped by the relay if out of range |

The relay republishes this verbatim to `oceo/cmd` on the broker, and logs it
to SQLite as `data_id:2002` before doing so. There's no ack on this path —
it's fire-and-forget, same as the firmware's MQTT subscribe/LoRaWAN downlink
handling on the other end. The next status broadcast (up to
`MQTT_PUBLISH_MS`, 5s, after the device applies it) is how the HMI finds out
whether it took — or query `events.db` for the `id:3003` confirmation the
device published in between.

## Notes for relay/firmware implementers

- The relay never sends anything to the browser unprompted beyond status
  broadcasts and the stale-flip — no polling loop needed on the HMI side.
- Malformed or unrecognized messages are dropped silently on both ends.
- `solenoid1/2/3`/`pump1` map to fixed I/O channels 5-8 in the firmware
  (`HmiPoints.h`) regardless of which physical pin each is currently
  assigned to via the I/O Config page — reassigning a pin there doesn't
  break remote control.
