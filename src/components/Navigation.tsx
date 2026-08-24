import React, { useState, useRef, useEffect } from 'react';
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
  Users,
  Terminal,
  MessageSquare,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    isListening, 
    startVoiceListening, 
    stopVoiceListening, 
    quietMode,
    toggleQuietMode,
    dialogueTurns,
    setIsSettingsOpen,
    setIsActivityLogOpen,
    inboxEmails,
    kpi
  } = useAssistant();

  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadEmailCount = inboxEmails.filter(e => e.isUnread).length;

  const secondaryModules: { id: AppView; label: string; icon: React.ReactNode; desc: string; badge?: number; badgeColor?: string }[] = [
    { id: 'thought_hub', label: 'Thought Studio', icon: <Sparkles className="w-4 h-4 text-amber-400" />, desc: 'Voice memo waveforms & executive notes' },
    { id: 'voice_hud', label: 'Voice AI HUD & Visualizer', icon: <Mic className="w-4 h-4 text-teal-400" />, desc: 'Glowing push-to-talk audio orb' },
    { id: 'gmail', label: 'Gmail Suite', icon: <Mail className="w-4 h-4 text-rose-400" />, desc: 'Inbox triaging & quick reply drafts', badge: unreadEmailCount, badgeColor: 'bg-red-500 text-white' },
    { id: 'calendar', label: 'Calendar Hub', icon: <CalendarDays className="w-4 h-4 text-blue-400" />, desc: 'Meetings & scheduling sync' },
    { id: 'comms', label: 'Comms & Calls', icon: <Phone className="w-4 h-4 text-emerald-400" />, desc: 'Direct calls & client chat logs' },
    { id: 'skills', label: 'Skill Studio', icon: <Bot className="w-4 h-4 text-purple-400" />, desc: 'Self-teaching voice routines' },
    { id: 'table', label: 'Work Table', icon: <Table2 className="w-4 h-4 text-indigo-400" />, desc: 'Monday.com-style task database', badge: kpi?.totalTasks },
    { id: 'gantt', label: 'Gantt Timeline', icon: <GanttChartSquare className="w-4 h-4 text-amber-400" />, desc: 'Critical Path & timeline view' },
    { id: 'matrix', label: 'Priority Matrix', icon: <LayoutGrid className="w-4 h-4 text-teal-400" />, desc: 'Eisenhower 2x2 decision quadrants' },
    { id: 'autonomous', label: 'Autonomous Worker', icon: <Bot className="w-4 h-4 text-emerald-400" />, desc: 'Background execution queue' },
    { id: 'swarm', label: 'Agent Swarm', icon: <Users className="w-4 h-4 text-purple-400" />, desc: 'Multi-agent parallel execution' },
    { id: 'wiki', label: 'Wiki Guides', icon: <BookOpen className="w-4 h-4 text-slate-400" />, desc: 'Living executive knowledge base' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo & Status */}
          <div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => setActiveView('transcript')}
          >
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
                <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Eve Assistant
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  AI Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Hours Saved: <strong className="text-brand-400 font-semibold">+{kpi?.totalHoursWonBack || 0}h</strong>
              </p>
            </div>
          </div>

          {/* Right: Primary Minimalist Action Bar */}
          <div className="flex items-center space-x-2">
            
            {/* Primary Chat & Transcript View Pill */}
            <button
              onClick={() => setActiveView('transcript')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'transcript'
                  ? 'bg-gradient-to-r from-brand-600 to-teal-600 text-white shadow-md shadow-teal-900/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat & Transcript</span>
              {dialogueTurns.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
                  {dialogueTurns.length}
                </span>
              )}
            </button>

            {/* Quiet Mode Switch */}
            <button
              onClick={toggleQuietMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center space-x-1.5 ${
                quietMode
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title={quietMode ? 'Quiet Mode ON (Silent Typing)' : 'Spoken Feedback ON'}
            >
              {quietMode ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-teal-400" />}
              <span className="hidden sm:inline">{quietMode ? '🤫 Quiet Mode' : '🔊 Spoken'}</span>
            </button>

            {/* Live Activity Logs Drawer Trigger */}
            <button
              onClick={() => setIsActivityLogOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition shadow-sm cursor-pointer"
              title="Live GUI Activity & Telemetry Logs"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Logs</span>
            </button>

            {/* Config & Settings Modal Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
              title="Relay Tuning & API Configuration"
            >
              <Settings className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Config</span>
            </button>

            {/* More Tools & Modules Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  activeView !== 'transcript'
                    ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
                title="All Additional Work Tools"
              >
                <Menu className="w-3.5 h-3.5" />
                <span className="hidden md:inline">More Tools</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Sleek Dropdown Drawer */}
              {isToolsMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Executive Work Suite</span>
                    <span className="text-[10px] text-slate-500">{secondaryModules.length} Modules</span>
                  </div>

                  <div className="max-h-96 overflow-y-auto py-1 space-y-1">
                    {secondaryModules.map((item) => {
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveView(item.id);
                            setIsToolsMenuOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition cursor-pointer ${
                            isActive
                              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="p-1.5 rounded-lg bg-slate-800 shrink-0 mt-0.5">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold truncate">{item.label}</p>
                              {item.badge !== undefined && item.badge > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Mic Push-To-Talk Orb */}
            <button
              onClick={isListening ? stopVoiceListening : startVoiceListening}
              className={`p-2 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/30'
                  : 'bg-gradient-to-r from-brand-500 to-teal-500 text-slate-950 shadow-teal-500/20'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak to Eve'}
            >
              {isListening ? <Radio className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
