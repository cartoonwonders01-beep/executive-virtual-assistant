import React from 'react';
import { LiveActivityLogPanel } from './LiveActivityLogPanel';

interface ActivityLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityLogDrawer: React.FC<ActivityLogDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <LiveActivityLogPanel onClose={onClose} isSidePanel={false} />
      </div>
    </div>
  );
};
