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
  Radio,
  Zap,
  MessageSquare,
  User,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Terminal
} from 'lucide-react';

import { wakeWordService } from '../services/wakeWordService';

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
    dialogueTurns,
    customSkills,
    isWakeWordActive,
    toggleWakeWordListener,
    executeCustomSkill,
    setIsActivityLogOpen,
    kpi,
    setActiveView
  } = useAssistant();

  const [sensitivity, setSensitivityState] = React.useState<'high' | 'normal'>(() => wakeWordService.getSensitivity());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const toggleSensitivity = () => {
    const next = sensitivity === 'high' ? 'normal' : 'high';
    setSensitivityState(next);
    wakeWordService.setSensitivity(next);
  };

  // Keyboard shortcut listener (Cmd+K or Spacebar to activate Assistant)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isListening) stopVoiceListening();
        else startVoiceListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening]);

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
    "What are 3 strategies to improve my morning routine?",
    "How do I handle a difficult client escalation?",
    "Can you explain how a DCF model works?",
    "Send an email to my wife to say I love her",
    "When I say 'Daily Standup', triage inbox and summarize tasks",
    "Who is Sarah?",
    "Send her an email about the budget",
    "Yes, send it",
    "What is 15% of $850?",
    "Book strategy session with David next Tuesday at 2 PM"
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fadeIn">
      
      {/* Top Wake-Word Status & Metric Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border flex items-center justify-center transition ${
            isWakeWordActive 
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' 
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Radio className={`w-5 h-5 ${isWakeWordActive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white">"Hey Eve" Wake Word</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isWakeWordActive ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {isWakeWordActive ? 'Listening Active' : 'Muted'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Say <em>"Hey Eve"</em> or press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-[10px] font-mono">Cmd+K</kbd></p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleWakeWordListener}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isWakeWordActive
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-teal-600 hover:bg-teal-500 text-white border-teal-500'
            }`}
          >
            {isWakeWordActive ? 'Disable Wake Word' : 'Enable Wake Word'}
          </button>

          {isWakeWordActive && (
            <button
              onClick={toggleSensitivity}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1 ${
                sensitivity === 'high'
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Wake-Word Sensitivity (High vs Standard)"
            >
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>{sensitivity === 'high' ? 'High Sensitivity' : 'Standard'}</span>
            </button>
          )}

          <button
            onClick={() => setIsActivityLogOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
            title="Open Live GUI Activity Log"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live Logs</span>
          </button>

          <button
            onClick={() => setActiveView('skills')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-semibold transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Skill Studio ({customSkills.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* Main Center Voice Orb & Transcript */}
      <div className="flex flex-col items-center justify-center py-2 relative">
        
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
            onTouchStart={() => {
              if (!isListening && !isProcessingSpeech) startVoiceListening();
            }}
            onTouchEnd={() => {
              if (isListening) setTimeout(() => stopVoiceListening(), 300);
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
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Listening</span>
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
        <div className="w-full max-w-xl mt-2 px-4">
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
                Executing conversational turn & intelligence...
              </p>
            </div>
          ) : (
            <div className="text-center text-slate-400 text-xs py-1">
              <p className="font-medium text-slate-300">Try saying or clicking prompts:</p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                {quickPrompts.slice(0, 4).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => submitVoiceTranscript(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-brand-300 border border-slate-800 hover:border-brand-500/30 transition text-left"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Learned Custom Voice Skills Shortcut Bar */}
      {customSkills.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span>Learned Voice Routines ({customSkills.length})</span>
            </span>
            <button 
              onClick={() => setActiveView('skills')}
              className="text-[11px] text-brand-400 hover:underline font-semibold"
            >
              Manage Blueprint Studio ➔
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {customSkills.map(skill => (
              <button
                key={skill.id}
                onClick={() => executeCustomSkill(skill.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/40 text-xs text-slate-300 hover:text-white flex items-center space-x-2 transition"
              >
                <span>⚡</span>
                <span className="font-medium">{skill.name}</span>
                <code className="text-[10px] text-brand-400 font-mono">"{skill.triggerPhrase}"</code>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Conversational Multi-Turn Dialogue Feed */}
      {dialogueTurns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <span>Conversational Dialogue History</span>
            </h3>
            <span className="text-[11px] text-slate-400">{dialogueTurns.length} turns</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 max-h-72 overflow-y-auto">
            {dialogueTurns.slice(0, 6).map((turn) => (
              <div 
                key={turn.id} 
                className={`flex space-x-3 p-3 rounded-xl ${
                  turn.speaker === 'user' 
                    ? 'bg-slate-950/70 border border-slate-800/80 ml-6' 
                    : 'bg-brand-950/20 border border-brand-500/20 mr-6'
                }`}
              >
                <div className={`p-2 rounded-xl h-fit shrink-0 ${
                  turn.speaker === 'user' ? 'bg-slate-800 text-slate-300' : 'bg-brand-500/20 text-brand-400'
                }`}>
                  {turn.speaker === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">
                      {turn.speaker === 'user' ? 'You' : 'Assistant (Eve)'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed break-words">{turn.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            No voice actions yet. Say "Hey Eve" or tap the microphone to begin!
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

