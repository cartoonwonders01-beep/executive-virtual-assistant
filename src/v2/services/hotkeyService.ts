/**
 * Desktop Ambient Hotkey Service & Clipboard Context Injector
 * Handles global keybindings (Option+Space / Alt+Space, Escape) and clipboard ingestion.
 */

import { telemetry } from './telemetryLogger';

export type HotkeyCallback = () => void;

export class HotkeyService {
  private toggleCallbacks: Set<HotkeyCallback> = new Set();
  private dismissCallbacks: Set<HotkeyCallback> = new Set();
  private isListening: boolean = false;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.startListening();
  }

  public startListening(): void {
    if (typeof window === 'undefined' || this.isListening) return;

    this.keydownHandler = (e: KeyboardEvent) => this.processKeyEvent(e);
    window.addEventListener('keydown', this.keydownHandler);
    this.isListening = true;
  }

  public processKeyEvent(e: { altKey?: boolean; code?: string; key?: string; preventDefault?: () => void }): void {
    // Option+Space (Mac) or Alt+Space (Windows/Linux)
    if (e.altKey && e.code === 'Space') {
      if (e.preventDefault) e.preventDefault();
      telemetry.log('event', { action: 'hotkey_triggered', shortcut: 'Alt+Space' });
      this.toggleCallbacks.forEach(cb => cb());
      return;
    }

    // Escape to dismiss
    if (e.key === 'Escape') {
      this.dismissCallbacks.forEach(cb => cb());
    }
  }

  public stopListening(): void {
    if (typeof window !== 'undefined' && this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
      this.isListening = false;
    }
  }

  public onToggle(callback: HotkeyCallback): () => void {
    this.toggleCallbacks.add(callback);
    return () => this.toggleCallbacks.delete(callback);
  }

  public onDismiss(callback: HotkeyCallback): () => void {
    this.dismissCallbacks.add(callback);
    return () => this.dismissCallbacks.delete(callback);
  }

  /**
   * Reads clipboard text securely to inject into conversational prompts
   */
  public async readClipboardText(): Promise<string | null> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      telemetry.log('error', { source: 'HotkeyService', message: 'Clipboard API not available' });
      return null;
    }

    try {
      const text = await navigator.clipboard.readText();
      telemetry.log('event', { action: 'clipboard_read_success', length: text.length });
      return text;
    } catch (err) {
      telemetry.log('error', { source: 'HotkeyService', message: String(err) });
      return null;
    }
  }

  /**
   * Helper to simulate hotkey events for testing
   */
  public simulateKeydown(eventProps: Partial<KeyboardEvent>): void {
    this.processKeyEvent(eventProps);
  }
}

export const hotkeyService = new HotkeyService();
