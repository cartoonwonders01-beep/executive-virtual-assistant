import React, { useRef, useEffect } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { ActionCardRenderer } from './ActionCardRenderer';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Volume2, 
  ArrowUpRight, 
  Clock, 
  Calendar, 
  Mail, 
  Bot,
  Layers,
  ChevronRight,
  Radio
} from 'lucide-react';

export const MobileVoiceHUD: React.FC = () => {
  const { 
    isListening, 
    audioLevel, 
    liveTranscript, 
    isProcessingSpeech, 
    startVoiceListening, 
    stopVoiceListening, 
    submitVoiceTranscript,
    actionCards,
    kpi,
    setActiveView
  } = useAssistant();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic Glowing Audio Waveform Visualizer
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

      // Outer ambient glowing circles
      const baseRadius = 55 + (audioLevel * 45);
      const gradient = ctx.createRadialGradient(
        width / 2, centerY, 10,
        width / 2, centerY, baseRadius * 1.6
      );

      if (isListening) {
        gradient.addColorStop(0, 'rgba(20, 184, 166, 0.85)'); // Teal
        gradient.addColorStop(0.5, 'rgba(13, 148, 136, 0.4)');
        gradient.addColorStop(1, 'rgba(19, 78, 74, 0)');
      } else if (isProcessingSpeech) {
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.85)'); // Purple
        gradient.addColorStop(0.5, 'rgba(126, 34, 206, 0.4)');
        gradient.addColorStop(1, 'rgba(88, 28, 135, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(45, 212, 191, 0.3)');
        gradient.addColorStop(0.6, 'rgba(20, 184, 166, 0.1)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(width / 2, centerY, baseRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Fluid Sine Waves
      const waves = 4;
      for (let w = 0; w < waves; w++) {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        const alpha = isListening ? 0.7 - (w * 0.12) : 0.25;
        ctx.strokeStyle = w % 2 === 0 ? `rgba(45, 212, 191, ${alpha})` : `rgba(56, 189, 248, ${alpha})`;

        const amplitude = isListening ? 18 + (audioLevel * 40) * (1 - w * 0.2) : 6;
        const frequency = 0.02 + (w * 0.008);

        for (let x = 0; x < width; x += 4) {
          const y = centerY + Math.sin(x * frequency + phase + (w * 1.2)) * amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      phase += isListening ? 0.08 + (audioLevel * 0.08) : 0.03;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isListening, audioLevel, isProcessingSpeech]);

  const quickPrompts = [
    "Send an email to my wife to say I love her",
    "Remember that Emily loves peonies and dark chocolate",
    "What did I ask you to remember?",
    "Set a timer for 15 minutes",
    "What is 15% of $850?",
    "What's the weather in Tokyo?",
    "Draft an email to Sarah about our Q3 growth sprint",
    "Book strategy session with David next Tuesday at 2 PM",
    "Take a note: Review Q3 enterprise security audit"
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Status & Metrics Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 flex items-center space-x-3 shadow-lg">
          <div className="p-2.5 bg-brand-500/10 rounded-xl text-brand-400 border border-brand-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Hours Won Back</p>
            <p className="text-lg font-bold text-white font-mono">{kpi?.totalHoursWonBack || 0}h</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 flex items-center space-x-3 shadow-lg">
          <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">ROI Multiplier</p>
            <p className="text-lg font-bold text-white font-mono">{kpi?.roiMultiplier || 0}x</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 flex items-center space-x-3 shadow-lg">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">AI Feasible</p>
            <p className="text-lg font-bold text-white font-mono">{kpi?.aiAutomatedCount || 0} Tasks</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveView('table')}
          className="bg-slate-900/80 border border-slate-800/90 hover:border-brand-500/40 rounded-2xl p-3.5 flex items-center justify-between shadow-lg cursor-pointer transition group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Work Board</p>
              <p className="text-xs font-semibold text-brand-400 group-hover:underline">Open Monday View</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition" />
        </div>
      </div>

      {/* Fast Executive Switcher Bar */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveView('gmail')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 transition whitespace-nowrap"
        >
          <Mail className="w-3.5 h-3.5 text-red-400" />
          <span>Gmail Suite</span>
        </button>

        <button
          onClick={() => setActiveView('calendar')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 transition whitespace-nowrap"
        >
          <Calendar className="w-3.5 h-3.5 text-teal-400" />
          <span>Calendar Hub</span>
        </button>

        <button
          onClick={() => setActiveView('comms')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 transition whitespace-nowrap"
        >
          <Radio className="w-3.5 h-3.5 text-indigo-400" />
          <span>Comms & Calls</span>
        </button>

        <button
          onClick={() => setActiveView('autonomous')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 transition whitespace-nowrap"
        >
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autonomous Loop</span>
        </button>
      </div>

      {/* Main Center Voice Orb & Transcript */}
      <div className="flex flex-col items-center justify-center py-4 relative">
        
        {/* Canvas Visualizer */}
        <div className="relative flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={340}
            height={240}
            className="w-80 h-56 max-w-full pointer-events-none"
          />

          {/* Central Tactile Push-to-Talk Orb Button */}
          <button
            onClick={isListening ? stopVoiceListening : startVoiceListening}
            onTouchStart={(e) => {
              // Push to talk on mobile hold
              if (!isListening && !isProcessingSpeech) {
                startVoiceListening();
              }
            }}
            onTouchEnd={(e) => {
              // Release to talk
              if (isListening) {
                setTimeout(() => stopVoiceListening(), 300);
              }
            }}
            className={`absolute z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 shadow-2xl ${
              isListening
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white scale-110 shadow-red-500/40 animate-pulse'
                : isProcessingSpeech
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-purple-500/40 animate-spin'
                : 'bg-gradient-to-tr from-slate-900 via-brand-950 to-slate-900 border-2 border-brand-400/80 text-brand-400 hover:border-brand-300 hover:text-brand-300 shadow-teal-500/30'
            }`}
          >
            {isListening ? (
              <>
                <Radio className="w-8 h-8 animate-bounce" />
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Tap/Release</span>
              </>
            ) : isProcessingSpeech ? (
              <>
                <Sparkles className="w-8 h-8" />
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Thinking</span>
              </>
            ) : (
              <>
                <Mic className="w-8 h-8" />
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Hold or Tap</span>
              </>
            )}
          </button>
        </div>

        {/* Live Streaming Transcript Card */}
        <div className="w-full max-w-xl mt-4 px-4">
          {liveTranscript ? (
            <div className="bg-slate-900/90 border border-brand-500/40 rounded-2xl p-4 shadow-xl text-center animate-fadeIn">
              <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping"></span>
                Hearing You Now:
              </p>
              <p className="text-base text-slate-100 font-medium italic">"{liveTranscript}"</p>
            </div>
          ) : isProcessingSpeech ? (
            <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-4 shadow-xl text-center">
              <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                Analyzing intent, extracting tasks & blueprints...
              </p>
            </div>
          ) : (
            <div className="text-center text-slate-400 text-xs py-2">
              <p className="font-medium text-slate-300">Talk to me anytime. Say commands like:</p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5">
                {quickPrompts.slice(0, 3).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => submitVoiceTranscript(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-brand-300 border border-slate-800 hover:border-brand-500/30 transition text-left"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Cards & Live Executive Feed */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-brand-400" />
            <span>Recent Action Executions & Confirmations</span>
          </h3>
          <span className="text-[11px] text-slate-400">{actionCards.length} generated</span>
        </div>

        {(!Array.isArray(actionCards) || actionCards.length === 0) ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
            No voice actions yet. Tap the microphone and tell me what you need done!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(Array.isArray(actionCards) ? actionCards : []).slice(0, 4).map((card) => (
              <ActionCardRenderer key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
