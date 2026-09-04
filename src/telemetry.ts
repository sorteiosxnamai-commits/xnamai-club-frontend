import { track } from '@vercel/analytics';

type EventProps = Record<string, string | number | boolean | null>;

export function logAppEvent(name: string, properties?: EventProps) {
  try {
    track(name, properties);
  } catch {
    // Telemetry must never break the app.
  }
}
