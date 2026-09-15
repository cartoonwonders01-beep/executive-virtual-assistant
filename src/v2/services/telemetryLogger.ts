export interface TelemetryEvent {
  timestamp: number;
  type: 'speech_start' | 'interim_token' | 'speech_end' | 'whisper_result' | 'llm_start' | 'llm_end' | 'tts_start' | 'tts_end' | 'event' | 'error';
  payload?: any;
}

class TelemetryLogger {
  private events: TelemetryEvent[] = [];
  private listeners: ((events: TelemetryEvent[]) => void)[] = [];

  log(type: TelemetryEvent['type'], payload?: any) {
    const event = { timestamp: Date.now(), type, payload };
    this.events.push(event);
    console.log(`[Telemetry] ${type}`, payload);
    this.notify();
  }

  getEvents() {
    return this.events;
  }

  subscribe(listener: (events: TelemetryEvent[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l([...this.events]));
  }
}

export const telemetry = new TelemetryLogger();
