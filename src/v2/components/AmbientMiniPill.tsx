/**
 * Ambient Mini-Pill Heads-Up Display
 * Lightweight floating bar triggered by Option+Space / Alt+Space.
 * Supports quick query execution, clipboard context paste, screen snapshot snip, and active audio visualization.
 */

import React, { useState, useEffect, useRef } from 'react';
import { hotkeyService } from '../services/hotkeyService';
import { screenCaptureService, CapturedFrame } from '../services/screenCaptureService';
import { audioVisualizerService } from '../services/audioVisualizerService';

interface AmbientMiniPillProps {
  onQuerySubmit: (query: string, imageFrame?: string) => Promise<void>;
  isProcessing?: boolean;
}

export const AmbientMiniPill: React.FC<AmbientMiniPillProps> = ({ onQuerySubmit, isProcessing = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [clipboardSnippet, setClipboardSnippet] = useState<string | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<CapturedFrame | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isVisible) return;
    let animId: number;
    const renderWave = () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const bands = audioVisualizerService.simulateFrequencyBands(isProcessing ? 0.85 : 0.25, 8);
          audioVisualizerService.drawWaveform(ctx, 36, 16, bands, isProcessing ? '#a855f7' : '#3b82f6');
        }
      }
      animId = requestAnimationFrame(renderWave);
    };
    renderWave();
    return () => cancelAnimationFrame(animId);
  }, [isVisible, isProcessing]);

  useEffect(() => {
    const unbindToggle = hotkeyService.onToggle(() => {
      setIsVisible(prev => {
        const next = !prev;
        if (next) setTimeout(() => inputRef.current?.focus(), 50);
        return next;
      });
    });

    const unbindDismiss = hotkeyService.onDismiss(() => {
      setIsVisible(false);
    });

    return () => {
      unbindToggle();
      unbindDismiss();
    };
  }, []);

  const handlePasteClipboard = async () => {
    const clip = await hotkeyService.readClipboardText();
    if (clip) {
      setClipboardSnippet(clip);
      setQuery(prev => (prev ? `${prev}\n\nContext:\n${clip}` : clip));
      inputRef.current?.focus();
    }
  };

  const handleCaptureScreen = async () => {
    const frame = await screenCaptureService.captureScreenSnapshot();
    if (frame) {
      setCapturedFrame(frame);
      setQuery(prev => (prev ? prev : 'Explain what is on my screen'));
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;
    const q = query.trim();
    const frame = capturedFrame?.dataUrl;
    setQuery('');
    setClipboardSnippet(null);
    setCapturedFrame(null);
    setIsVisible(false);
    await onQuerySubmit(q, frame);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="bg-gray-950/90 border border-blue-500/40 rounded-2xl shadow-2xl backdrop-blur-md p-3 flex flex-col gap-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse ml-1" />
          <canvas ref={canvasRef} width={36} height={16} className="rounded shrink-0 opacity-80" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Eve, snip screen, or paste context... (Esc to close)"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none px-2"
          />
          <button
            type="button"
            onClick={handleCaptureScreen}
            title="Snip active screen or window"
            className="px-2 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-purple-300 rounded-lg text-xs transition-colors flex items-center gap-1"
          >
            <span>📸</span> Screen
          </button>
          <button
            type="button"
            onClick={handlePasteClipboard}
            title="Paste Clipboard Context"
            className="px-2 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded-lg text-xs transition-colors flex items-center gap-1"
          >
            <span>📋</span> Context
          </button>
          <button
            type="submit"
            disabled={!query.trim() || isProcessing}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {isProcessing ? 'Thinking...' : 'Send'}
          </button>
        </form>

        {capturedFrame && (
          <div className="text-[11px] text-purple-300 bg-purple-950/30 p-1.5 rounded-lg border border-purple-800/60 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🖼️</span> Screen snapshot attached ({capturedFrame.width}x{capturedFrame.height})
            </span>
            <button onClick={() => setCapturedFrame(null)} className="text-gray-400 hover:text-white px-1">✕</button>
          </div>
        )}

        {clipboardSnippet && (
          <div className="text-[11px] text-gray-400 bg-black/40 p-1.5 rounded-lg border border-gray-800/80 flex items-center justify-between">
            <span className="truncate">Attached clipboard: "{clipboardSnippet.slice(0, 60)}..."</span>
            <button onClick={() => setClipboardSnippet(null)} className="text-gray-500 hover:text-gray-300 px-1">✕</button>
          </div>
        )}

        <div className="flex items-center justify-between px-1 text-[10px] text-gray-500 font-mono">
          <span>Option+Space to toggle</span>
          <span>Esc to dismiss</span>
        </div>
      </div>
    </div>
  );
};
