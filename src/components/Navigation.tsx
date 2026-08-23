import React from 'react';
import { useAssistant } from '../context/AssistantContext';
import { AppView } from '../types';
import { 
  Mic, 
  Table2, 
  GanttChartSquare, 
  LayoutGrid, 
  CalendarDays, 
  Volume2, 
  VolumeX, 
  Radio, 
  Sparkles, 
  FileAudio,
  BookOpen,
  Settings,
  Mail,
  Phone,
  Bot,
  Users
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    isListening, 
    startVoiceListening, 
    stopVoiceListening, 
    voiceFeedbackEnabled, 
    setVoiceFeedbackEnabled,
    setIsRecordModalOpen,
    startInteractiveTour,
    setIsSettingsOpen,
    inboxEmails,
    kpi
  } = useAssistant();

  const unreadEmailCount = inboxEmails.filter(e => e.isUnread).length;

  const navItems: { id: AppView; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'voice_hud', label: 'Voice AI HUD', icon: <Mic className="w-4 h-4" /> },
    { id: 'gmail', label: 'Gmail Suite', icon: <Mail className="w-4 h-4" />, badge: unreadEmailCount, badgeColor: 'bg-red-500 text-white' },
    { id: 'calendar', label: 'Calendar Hub', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'comms', label: 'Comms & Calls', icon: <Phone className="w-4 h-4" /> },
    { id: 'table', label: 'Work Table', icon: <Table2 className="w-4 h-4" />, badge: kpi?.totalTasks },
    { id: 'gantt', label: 'Gantt Timeline', icon: <GanttChartSquare className="w-4 h-4" /> },
    { id: 'matrix', label: 'Priority Matrix', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'autonomous', label: 'Autonomous Worker', icon: <Bot className="w-4 h-4 text-emerald-400" /> },
    { id: 'swarm', label: 'Agent Swarm', icon: <Users className="w-4 h-4 text-purple-400" /> },
    { id: 'wiki', label: 'Wiki Guides', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Status */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('voice_hud')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-teal-500 to-emerald-400 shadow-lg shadow-teal-500/20">
              <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Executive AI Assistant
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Hybrid Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Hours Won Back: <strong className="text-brand-400 font-semibold">+{kpi?.totalHoursWonBack || 0}h</strong>
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden xl:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-teal-600 text-white shadow-md shadow-teal-900/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions & Voice Controls */}
          <div className="flex items-center space-x-2">
            
            {/* Interactive Voice Tour Trigger */}
            <button
              onClick={startInteractiveTour}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-xl transition shadow-sm"
              title="Interactive Voice Tour"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden lg:inline">Tour</span>
            </button>

            {/* Audio Upload Trigger */}
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition"
              title="Upload Voice Note"
            >
              <FileAudio className="w-4 h-4" />
            </button>

            {/* TTS Mute Toggle */}
            <button
              onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
              className={`p-2 rounded-lg border transition ${
                voiceFeedbackEnabled 
                  ? 'bg-slate-900 text-brand-400 border-brand-500/30' 
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={voiceFeedbackEnabled ? 'Spoken Feedback ON' : 'Spoken Feedback MUTED'}
            >
              {voiceFeedbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* AI & Groq Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition"
              title="Hybrid Groq & Gemini Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Global Microphone Push-to-Talk Toggle */}
            <button
              onClick={isListening ? stopVoiceListening : startVoiceListening}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/30'
                  : 'bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-600 hover:to-teal-600 text-slate-950 shadow-teal-500/20'
              }`}
            >
              {isListening ? (
                <>
                  <Radio className="w-4 h-4 animate-spin" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span className="hidden sm:inline">Talk to Assistant</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Sub-Navigation Bar */}
        <div className="flex xl:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-850 no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
