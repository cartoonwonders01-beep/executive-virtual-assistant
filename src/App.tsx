import React from 'react';
import { AssistantProvider, useAssistant } from './context/AssistantContext';
import { Navigation } from './components/Navigation';
import { MobileVoiceHUD } from './components/MobileVoiceHUD';
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

const AppContent: React.FC = () => {
  const { activeView } = useAssistant();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-slate-950">
      
      {/* Universal Navigation */}
      <Navigation />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeView === 'voice_hud' && <MobileVoiceHUD />}

        {activeView === 'gmail' && (
          <div className="space-y-6">
            <GmailSuiteView />
          </div>
        )}

        {activeView === 'calendar' && (
          <div className="space-y-6">
            <CalendarAppointmentsView />
          </div>
        )}

        {activeView === 'comms' && (
          <div className="space-y-6">
            <CommunicationsHubView />
          </div>
        )}

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

        {activeView === 'autonomous' && (
          <div className="space-y-6">
            <AutonomousWorkerDeck />
          </div>
        )}

        {activeView === 'swarm' && (
          <div className="space-y-6">
            <MultiAgentSwarmView />
          </div>
        )}

        {activeView === 'wiki' && (
          <div className="space-y-6">
            <WikiKnowledgeHub />
          </div>
        )}

        {activeView === 'skills' && (
          <div className="space-y-6">
            <SkillLearningHub />
          </div>
        )}
      </main>

      {/* Global Modals */}
      <AutomationStudioModal />
      <VoiceRecorderModal />
      <TaskDetailModal />
      <InteractiveTourModal />
      <SettingsModal />
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
