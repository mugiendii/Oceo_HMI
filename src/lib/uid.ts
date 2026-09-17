// Same convention as the existing inline uid() helpers in live/liveClient.ts
// and serial/serialClient.ts -- kept here so templates.ts, useSites.ts, and
// the canvas can all mint ids the same way instead of each rolling their own.
export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
