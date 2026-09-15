import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AutonomousJob, InboxEmail, CalendarAppointment, TaskItem, CustomLLMProfile, DialogueTurn, ActionCard } from '../types';
import { proactiveLoopService, ProactiveAlert } from '../services/proactiveLoopService';
import { logger } from '../services/loggerService';

export interface AutonomousContextType {
  isAutonomousLoopRunning: boolean;
  toggleAutonomousLoop: () => void;
  proactiveIntervalSeconds: number;
  setProactiveIntervalSeconds: (sec: number) => void;
  triggerProactiveCheck: (params: {
    inboxEmails: InboxEmail[];
    appointments: CalendarAppointment[];
    tasks: TaskItem[];
    activeProfile?: CustomLLMProfile;
    onAlertGenerated?: (alert: ProactiveAlert) => void;
  }) => ProactiveAlert | null;
  resetProactiveAlertHistory: () => void;
}

export const AutonomousContext = createContext<AutonomousContextType | undefined>(undefined);

export const AutonomousProvider: React.FC<{
  children: React.ReactNode;
  inboxEmails?: InboxEmail[];
  appointments?: CalendarAppointment[];
  tasks?: TaskItem[];
  activeProfile?: CustomLLMProfile;
  onProactiveAlert?: (alert: ProactiveAlert) => void;
}> = ({
  children,
  inboxEmails = [],
  appointments = [],
  tasks = [],
  activeProfile,
  onProactiveAlert
}) => {
  const [isAutonomousLoopRunning, setIsAutonomousLoopRunning] = useState<boolean>(() => {
    try {
      return localStorage.getItem('assistant_proactive_loop_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const [proactiveIntervalSeconds, setProactiveIntervalSecondsState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('assistant_proactive_interval_sec');
      return saved ? parseInt(saved, 10) : 120; // default 2 minutes
    } catch {
      return 120;
    }
  });

  const timerRef = useRef<any>(null);
  const dataRef = useRef({ inboxEmails, appointments, tasks, activeProfile, onProactiveAlert });
  dataRef.current = { inboxEmails, appointments, tasks, activeProfile, onProactiveAlert };

  const setProactiveIntervalSeconds = useCallback((sec: number) => {
    setProactiveIntervalSecondsState(sec);
    try {
      localStorage.setItem('assistant_proactive_interval_sec', String(sec));
    } catch {}
    logger.log('info', 'autonomous_loop', `⏱️ Proactive loop interval set to ${sec}s.`);
  }, []);

  const toggleAutonomousLoop = useCallback(() => {
    setIsAutonomousLoopRunning(prev => {
      const next = !prev;
      try {
        localStorage.setItem('assistant_proactive_loop_enabled', String(next));
      } catch {}
      logger.log('info', 'autonomous_loop', `🤖 Proactive autonomous loop turned ${next ? 'ON' : 'OFF'}.`);
      return next;
    });
  }, []);

  const triggerProactiveCheck = useCallback((params: {
    inboxEmails: InboxEmail[];
    appointments: CalendarAppointment[];
    tasks: TaskItem[];
    activeProfile?: CustomLLMProfile;
    onAlertGenerated?: (alert: ProactiveAlert) => void;
  }): ProactiveAlert | null => {
    const alert = proactiveLoopService.checkUrgentEvents(params);
    if (alert && params.onAlertGenerated) {
      params.onAlertGenerated(alert);
    }
    return alert;
  }, []);

  const resetProactiveAlertHistory = useCallback(() => {
    proactiveLoopService.resetAlertHistory();
  }, []);

  // Periodic autonomous polling loop
  useEffect(() => {
    if (!isAutonomousLoopRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const runCheck = () => {
      const { inboxEmails, appointments, tasks, activeProfile, onProactiveAlert } = dataRef.current;
      const alert = proactiveLoopService.checkUrgentEvents({
        inboxEmails,
        appointments,
        tasks,
        activeProfile
      });

      if (alert && onProactiveAlert) {
        onProactiveAlert(alert);
      }
    };

    // Run first check after 5 seconds on boot
    const bootTimer = setTimeout(runCheck, 5000);

    // Setup recurring interval (every proactiveIntervalSeconds, default 120s)
    timerRef.current = setInterval(runCheck, Math.max(30, proactiveIntervalSeconds) * 1000);

    return () => {
      clearTimeout(bootTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutonomousLoopRunning, proactiveIntervalSeconds]);

  return (
    <AutonomousContext.Provider
      value={{
        isAutonomousLoopRunning,
        toggleAutonomousLoop,
        proactiveIntervalSeconds,
        setProactiveIntervalSeconds,
        triggerProactiveCheck,
        resetProactiveAlertHistory
      }}
    >
      {children}
    </AutonomousContext.Provider>
  );
};

export const useAutonomous = (): AutonomousContextType => {
  const context = useContext(AutonomousContext);
  if (!context) {
    throw new Error('useAutonomous must be used within an AutonomousProvider');
  }
  return context;
};
