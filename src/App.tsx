import React from 'react';
import { AssistantProvider, useAssistant } from './context/AssistantContext';
import { LiveChatView } from './components/LiveChatView';
import { ThoughtActionHub } from './components/ThoughtActionHub';
import { KPIDashboard } from './components/KPIDashboard';
import { TaskTableView } from './components/TaskTableView';
import { GanttChartView } from './components/GanttChartView';
import { EisenhowerMatrixView } from './components/EisenhowerMatrixView';
import { CalendarAppointmentsView } from './components/CalendarAppointmentsView';
import { GmailSuiteView } from './components/GmailSuiteView';
import { CommunicationsHubView } from './components/CommunicationsHubView';
import { AutonomousWorkerDeck } from './components/AutonomousWorkerDeck';
import { MultiAgentSwarmView } from './components/MultiAgentSwarmView';
import { WikiKnowledgeHub } from './components/WikiKnowledgeHub';
import { SkillLearningHub } from './components/SkillLearningHub';
import { AutomationStudioModal } from './components/AutomationStudioModal';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { InteractiveTourModal } from './components/InteractiveTourModal';
import { SettingsModal } from './components/SettingsModal';
import { ActivityLogDrawer } from './components/ActivityLogDrawer';
import { LLMPromptStudioModal } from './components/LLMPromptStudioModal';
import { ArrowLeft } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeView, setActiveView, isActivityLogOpen, setIsActivityLogOpen } = useAssistant();

  // If in pure chat mode (default), render LiveChatView exclusively for a 100% clean experience
  if (activeView === 'transcript' || !activeView) {
    return (
      <div className="fixed inset-0 w-full h-full bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden selection:bg-teal-500 selection:text-slate-950">
        <LiveChatView />

        {/* Global Modals */}
        <AutomationStudioModal />
        <VoiceRecorderModal />
        <TaskDetailModal />
        <InteractiveTourModal />
        <SettingsModal />
        <LLMPromptStudioModal />
        <ActivityLogDrawer isOpen={isActivityLogOpen} onClose={() => setIsActivityLogOpen(false)} />
      </div>
    );
  }

  // Secondary Tools View (when explicitly navigated to from menu)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      
      {/* Minimal Top Header for Secondary Views */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setActiveView('transcript')}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-300 hover:text-teal-200 text-xs font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Chat</span>
        </button>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          {activeView.replace('_', ' ')}
        </span>
      </header>

      {/* Main Secondary View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeView === 'thought_hub' && <ThoughtActionHub />}
        {activeView === 'gmail' && <GmailSuiteView />}
        {activeView === 'calendar' && <CalendarAppointmentsView />}
        {activeView === 'comms' && <CommunicationsHubView />}
        {activeView === 'skills' && <SkillLearningHub />}
        {activeView === 'table' && (
          <div className="space-y-6">
            <KPIDashboard />
            <TaskTableView />
          </div>
        )}
        {activeView === 'gantt' && (
          <div className="space-y-6">
            <KPIDashboard />
            <GanttChartView />
          </div>
        )}
        {activeView === 'matrix' && (
          <div className="space-y-6">
            <KPIDashboard />
            <EisenhowerMatrixView />
          </div>
        )}
        {activeView === 'autonomous' && <AutonomousWorkerDeck />}
        {activeView === 'swarm' && <MultiAgentSwarmView />}
        {activeView === 'wiki' && <WikiKnowledgeHub />}
      </main>

      {/* Global Modals */}
      <AutomationStudioModal />
      <VoiceRecorderModal />
      <TaskDetailModal />
      <InteractiveTourModal />
      <SettingsModal />
      <LLMPromptStudioModal />
      <ActivityLogDrawer isOpen={isActivityLogOpen} onClose={() => setIsActivityLogOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <AssistantProvider>
      <AppContent />
    </AssistantProvider>
  );
}

export default App;
