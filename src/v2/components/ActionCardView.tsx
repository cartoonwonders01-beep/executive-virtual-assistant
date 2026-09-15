import React, { useState } from 'react';

export interface ActionCardData {
  id: string;
  type: 'calendar' | 'task' | 'briefing';
  title: string;
  subtitle?: string;
  details?: string[];
  dateStr?: string;
  timeStr?: string;
  completed?: boolean;
}

interface ActionCardViewProps {
  card: ActionCardData;
  onComplete?: (id: string) => void;
}

export const sanitizeUrl = (rawUrl: string, allowedHosts: string[] = ['calendar.google.com']): string | null => {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return null;
    if (allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

export const ActionCardView: React.FC<ActionCardViewProps> = ({ card, onComplete }) => {
  const [done, setDone] = useState(card.completed || false);

  const handleMarkDone = () => {
    setDone(true);
    if (onComplete) onComplete(card.id);
  };

  const getGoogleCalendarUrl = (): string => {
    const text = encodeURIComponent(card.title);
    const details = encodeURIComponent(card.subtitle || card.title);
    const raw = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}`;
    return sanitizeUrl(raw, ['calendar.google.com']) || '#';
  };

  const downloadIcs = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Eve Executive Assistant//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${card.title}`,
      `DESCRIPTION:${card.subtitle || card.title}`,
      `DTSTART:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${new Date(Date.now() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.title.replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (card.type === 'calendar') {
    return (
      <div className="my-2 p-3.5 bg-blue-950/40 border border-blue-800/60 rounded-xl max-w-sm text-left shadow-lg">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <span>📅</span> Calendar Event
          </span>
          {card.dateStr && <span className="text-[10px] text-blue-300 font-mono">{card.dateStr}</span>}
        </div>
        <div className="text-sm font-semibold text-white">{card.title}</div>
        {card.subtitle && (
          <div className={`text-xs mt-1 ${card.subtitle.includes('⚠️') ? 'p-1.5 bg-amber-950/50 border border-amber-800/60 rounded-lg text-amber-300 font-medium' : 'text-gray-400'}`}>
            {card.subtitle}
          </div>
        )}
        
        <div className="mt-3 flex flex-wrap gap-2 pt-1 border-t border-blue-900/50">
          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium rounded-lg flex items-center gap-1 transition-colors"
          >
            <span>🔗</span> Google Calendar
          </a>
          <button
            type="button"
            onClick={downloadIcs}
            className="px-2.5 py-1 bg-blue-900/50 hover:bg-blue-800/60 text-blue-200 text-[11px] font-medium rounded-lg border border-blue-700/50 flex items-center gap-1 transition-colors"
          >
            <span>📥</span> Export .ics
          </button>
        </div>
      </div>
    );
  }

  if (card.type === 'briefing') {
    return (
      <div className="my-2 p-4 bg-purple-950/40 border border-purple-800/60 rounded-xl max-w-md text-left shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <span>🌅</span> Executive Morning Briefing
          </span>
          <span className="text-[10px] text-purple-300 font-mono">Today</span>
        </div>
        <div className="text-xs text-purple-200 font-medium mb-2">
          {card.subtitle}
        </div>
        {card.details && card.details.length > 0 && (
          <ul className="space-y-1 text-xs text-gray-300 list-disc list-inside">
            {card.details.map((d, i) => (
              <li key={i} className="text-gray-300">{d}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className={`my-2 p-3 bg-emerald-950/40 border ${done ? 'border-emerald-900/40 opacity-60' : 'border-emerald-800/60'} rounded-xl max-w-sm text-left shadow-lg transition-all`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
          <span>✓</span> Action Item
        </span>
        {done && <span className="text-[10px] text-emerald-400 font-medium">✓ Completed</span>}
      </div>
      <div className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-white'}`}>{card.title}</div>
      {card.subtitle && <div className="text-xs text-gray-400 mt-0.5">{card.subtitle}</div>}
      
      {!done && (
        <div className="mt-2.5 pt-1.5 border-t border-emerald-900/40 flex justify-end">
          <button
            type="button"
            onClick={handleMarkDone}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium rounded-lg transition-colors"
          >
            Mark Done
          </button>
        </div>
      )}
    </div>
  );
};
