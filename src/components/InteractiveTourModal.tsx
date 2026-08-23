import React, { useState, useEffect } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { speakResponse, stopSpeaking } from '../services/speechSynthesis';
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Mic, 
  Mail, 
  Calendar, 
  Table2, 
  GanttChartSquare, 
  Bot, 
  Volume2, 
  VolumeX, 
  Play, 
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface TourStep {
  title: string;
  subtitle: string;
  speechNarrative: string;
  icon: React.ReactNode;
  highlights: string[];
  samplePrompt?: string;
  viewTarget?: 'voice_hud' | 'table' | 'gantt' | 'calendar' | 'wiki';
}

export const InteractiveTourModal: React.FC = () => {
  const { 
    isTourOpen, 
    setIsTourOpen, 
    voiceFeedbackEnabled, 
    setActiveView, 
    submitVoiceTranscript 
  } = useAssistant();

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isSpeakingStep, setIsSpeakingStep] = useState<boolean>(false);

  const steps: TourStep[] = [
    {
      title: "Welcome to your Executive AI Assistant",
      subtitle: "Frictionless voice capture & autonomous work execution",
      speechNarrative: "Welcome! I am your Executive AI Assistant. I listen to your voice notes, dissect your ideas, automate your daily tasks, and manage your entire work hub in real-time.",
      icon: <Sparkles className="w-6 h-6 text-brand-400" />,
      highlights: [
        "📱 Mobile PWA Voice HUD: Install on your phone for a 'Hello Google' experience.",
        "🎙️ Real-Time Listening: Tactile push-to-talk with dynamic glowing audio visualizer.",
        "🗣️ Natural Voice Output: I speak status confirmations and answers directly back to you."
      ],
      samplePrompt: "Hey assistant, what can you do for me today?",
      viewTarget: 'voice_hud'
    },
    {
      title: "Autonomous Action Engine",
      subtitle: "Instant Email Drafts, Calendar Bookings & Phone Calls",
      speechNarrative: "Instead of just taking notes, I execute actions directly. Tell me to draft emails to contacts, schedule meetings with conflict detection, or dial phone numbers.",
      icon: <Calendar className="w-6 h-6 text-teal-400" />,
      highlights: [
        "📧 Email Assistant: 'Draft an email to Sarah regarding Q3 growth sprint' -> 1-click send.",
        "📅 Smart Calendar: 'Book strategy sync with David next Tuesday at 2 PM' -> checks overlaps & generates Google Calendar links.",
        "📞 Contact Calls: Automatically looks up phone numbers and renders 1-tap dial buttons."
      ],
      samplePrompt: "Book a strategy sync with David Miller next Tuesday at 2 PM",
      viewTarget: 'calendar'
    },
    {
      title: "Monday.com-Style Work Hub",
      subtitle: "Multi-dimensional task dissection, Dual Priority & Feasibility",
      speechNarrative: "Whenever you talk, I break your speech into categorized tasks. I compare your gut urgency with objective AI leverage, and classify feasibility into AI-Automated, Human-Only, or Hybrid.",
      icon: <Table2 className="w-6 h-6 text-indigo-400" />,
      highlights: [
        "📊 Categorized Spreadsheets: 7 core domains with custom status pills.",
        "🧭 Dual Priority: Compares User Priority vs AI Objective Priority (Urgency vs Value).",
        "🤖 Feasibility Scoring: AI-Automated vs Human-Only vs Hybrid.",
        "⏳ Hours Won Back: Tracks cumulative hours saved with Automation ROI Multiplier."
      ],
      samplePrompt: "Automate supplier invoice extraction from billing emails to Google Sheets",
      viewTarget: 'table'
    },
    {
      title: "Interactive Gantt Timeline & Dependencies",
      subtitle: "Visual critical path with SVG dependency connector arrows",
      speechNarrative: "In the Gantt view, you can visually timeline every task, see progress percentage overlays, and trace dependency lines between prerequisite and child tasks.",
      icon: <GanttChartSquare className="w-6 h-6 text-emerald-400" />,
      highlights: [
        "📅 Dual Scale: Switch between detailed Day View and compact Week View.",
        "🔗 Dynamic Dependency Arrows: Visual SVG curves linking parent and child tasks.",
        "📈 Milestone Tracking: See completion dates and critical execution paths."
      ],
      viewTarget: 'gantt'
    },
    {
      title: "Self-Teaching Automation Studio & Living Wiki",
      subtitle: "Auto-generated code recipes, web research & knowledge base",
      speechNarrative: "For every automated task, I generate a step-by-step automation blueprint, provide executable code, and scan the web for best practices. Plus, our Living Wiki documents everything we build!",
      icon: <Bot className="w-6 h-6 text-amber-400" />,
      highlights: [
        "🛠️ Blueprint Generator: Tools, APIs, and step-by-step strategy for any task.",
        "💻 Executable Code: Starter scripts in TypeScript, Python, and Cloudflare Workers.",
        "🔒 Isolated Sandbox VM: Safe execution on Linux sandbox at 10.211.55.6.",
        "📚 Living Wiki: Enrich and update our system documentation as we grow."
      ],
      viewTarget: 'wiki'
    }
  ];

  const currentStep = steps[currentStepIdx];

  // Speak narrative when step changes if voice feedback is enabled
  useEffect(() => {
    if (isTourOpen && voiceFeedbackEnabled) {
      setIsSpeakingStep(true);
      speakResponse(currentStep.speechNarrative, () => setIsSpeakingStep(false));
    }
    return () => {
      stopSpeaking();
    };
  }, [currentStepIdx, isTourOpen, voiceFeedbackEnabled]);

  if (!isTourOpen) return null;

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleClose = () => {
    stopSpeaking();
    setIsTourOpen(false);
    setCurrentStepIdx(0);
  };

  const handleTrySample = (prompt: string) => {
    handleClose();
    submitVoiceTranscript(prompt);
  };

  const handleJumpToView = (view?: 'voice_hud' | 'table' | 'gantt' | 'calendar' | 'wiki') => {
    if (view) {
      setActiveView(view);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-2xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fadeIn text-slate-200 relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-brand-500/20 text-brand-300 rounded-xl border border-brand-500/30 shadow-md shadow-teal-500/20">
              {currentStep.icon}
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                Interactive Assistant Guide (Step {currentStepIdx + 1} of {steps.length})
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">{currentStep.title}</h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtitle & Narrative Card */}
        <div className="space-y-4 relative z-10">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-400 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span>Assistant Spoken Audio:</span>
              </span>
              <button
                onClick={() => speakResponse(currentStep.speechNarrative)}
                className="text-[11px] text-slate-400 hover:text-brand-300 underline"
              >
                Replay Audio
              </button>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed italic font-serif">
              "{currentStep.speechNarrative}"
            </p>
          </div>

          {/* Highlights List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Core Capabilities in this Module:
            </h4>
            <div className="space-y-2">
              {currentStep.highlights.map((item, idx) => (
                <div key={idx} className="bg-slate-850/70 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Interactive Voice Prompt */}
          {currentStep.samplePrompt && (
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Try this live voice action right now:
              </span>
              <button
                onClick={() => handleTrySample(currentStep.samplePrompt!)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-brand-950 to-slate-900 border border-brand-500/40 hover:border-brand-400 text-left transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <Mic className="w-4 h-4 text-brand-400 group-hover:animate-bounce" />
                  <span className="text-xs font-medium text-slate-100 italic">
                    "{currentStep.samplePrompt}"
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-brand-400 group-hover:underline flex items-center gap-1">
                  <span>Execute Voice Action</span>
                  <Play className="w-3 h-3 fill-current" />
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Tour Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 relative z-10">
          <div className="flex items-center space-x-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIdx(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIdx ? 'w-6 bg-brand-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {currentStep.viewTarget && (
              <button
                onClick={() => handleJumpToView(currentStep.viewTarget)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Open {currentStep.viewTarget.replace('_', ' ').toUpperCase()} View
              </button>
            )}

            {currentStepIdx > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center space-x-1.5 px-5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-600 hover:to-teal-600 text-slate-950 shadow-md shadow-teal-900/30 transition"
            >
              <span>{currentStepIdx === steps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
