import React, { useState, useEffect, useRef } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { VoiceMemo } from '../types';
import { 
  Play, 
  Pause, 
  X, 
  Clock, 
  FileAudio, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw,
  Volume2
} from 'lucide-react';
import { playChime } from '../services/soundEffects';

interface VoiceMemoPlayerModalProps {
  memo: VoiceMemo | null;
  onClose: () => void;
}

export const VoiceMemoPlayerModal: React.FC<VoiceMemoPlayerModalProps> = ({ memo, onClose }) => {
  const { tasks, setSelectedTaskForBlueprint } = useAssistant();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const duration = memo?.durationSeconds || 30;

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackSeconds(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Waveform visualization animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const barCount = 48;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 2);
        const progressFrac = playbackSeconds / duration;
        const barFrac = i / barCount;
        const isPassed = barFrac <= progressFrac;

        // Dynamic frequency bar height
        const barHeight = isPlaying 
          ? Math.max(6, Math.sin(phase + i * 0.3) * (height * 0.4) + Math.cos(phase * 0.7 + i * 0.2) * (height * 0.3))
          : Math.max(6, Math.sin(i * 0.4) * (height * 0.3) + 12);

        ctx.fillStyle = isPassed ? '#14b8a6' : '#334155';
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 3);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.12;
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSeconds, duration]);

  if (!memo) return null;

  const togglePlay = () => {
    if (!isPlaying) {
      playChime('listen_start');
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const extractedTasks = tasks.filter(t => memo.extractedTaskIds?.includes(t.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-fadeIn text-xs text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/30">
              <FileAudio className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Audio Voice Memo Player</h2>
              <p className="text-[10px] text-slate-400 font-mono">
                {new Date(memo.recordedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsPlaying(false);
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xs font-bold text-white">{memo.title}</h3>
        </div>

        {/* Waveform Canvas & Time */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
          <canvas
            ref={canvasRef}
            width={440}
            height={64}
            className="w-full h-16 pointer-events-none"
          />

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="text-teal-300 font-bold">{formatTime(playbackSeconds)}</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-md transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Full Transcript */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-400">Recorded Speech Transcript:</label>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed italic">
            "{memo.transcript}"
          </div>
        </div>

        {/* Extracted Tasks List */}
        {extractedTasks.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Extracted Work Hub Tasks ({extractedTasks.length})</span>
            </label>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {extractedTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    onClose();
                    setSelectedTaskForBlueprint(t);
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl cursor-pointer transition flex items-center justify-between"
                >
                  <span className="truncate text-[11px] font-medium text-slate-200">{t.title}</span>
                  <span className="text-[10px] text-brand-400 font-mono">+{t.timeWonBackHours}h ↗</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
