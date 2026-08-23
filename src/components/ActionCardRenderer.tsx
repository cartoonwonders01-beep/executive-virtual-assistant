import React, { useState } from 'react';
import { ActionCard } from '../types';
import { useAssistant } from '../context/AssistantContext';
import { 
  Mail, 
  Send, 
  Calendar, 
  Clock, 
  PhoneCall, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  Bot, 
  CalendarPlus, 
  ArrowRightCircle, 
  AlertTriangle 
} from 'lucide-react';

interface ActionCardRendererProps {
  card: ActionCard;
}

export const ActionCardRenderer: React.FC<ActionCardRendererProps> = ({ card }) => {
  const { sendEmailDraft, rescheduleAppointment, executeActionCard, setSelectedTaskForBlueprint, tasks } = useAssistant();
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Email Card
  if (card.intent === 'email_draft' && card.emailData) {
    const em = card.emailData;
    const isSent = em.status === 'sent' || sentSuccess;

    const handleSend = async () => {
      setIsSending(true);
      await sendEmailDraft(em.id);
      setIsSending(false);
      setSentSuccess(true);
    };

    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            <Mail className="w-4 h-4" />
            <span>Email Assistant</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            isSent ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {isSent ? 'Sent ✅' : 'Draft Ready'}
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-100 mt-2">{card.title}</h4>
        
        <div className="mt-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
          <p className="text-slate-400">
            <strong className="text-slate-200">To:</strong> {em.toName} &lt;<span className="text-brand-400">{em.toEmail}</span>&gt;
          </p>
          <p className="text-slate-400">
            <strong className="text-slate-200">Subject:</strong> {em.subject}
          </p>
          <div className="pt-1 text-slate-300 whitespace-pre-line border-t border-slate-800/60 font-sans">
            {em.body}
          </div>
        </div>

        {!isSent && (
          <div className="mt-3 flex items-center justify-end space-x-2">
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-600 hover:to-teal-600 text-slate-950 shadow-md transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Send Email Now'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Calendar Card
  if ((card.intent === 'calendar_booking' || card.intent === 'calendar_reschedule') && card.calendarData) {
    const apt = card.calendarData;
    const isCancelled = apt.status === 'cancelled';
    const startDate = new Date(apt.startDateTime);
    const endDate = new Date(apt.endDateTime);

    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Calendar Executive</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            isCancelled ? 'bg-red-500/20 text-red-300' : 'bg-teal-500/20 text-teal-300'
          }`}>
            {isCancelled ? 'Cancelled' : 'Confirmed'}
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-100 mt-2">{apt.title}</h4>

        <div className="mt-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
          <div className="flex items-center space-x-2 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>
              {startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {apt.location && (
            <p className="text-slate-400">
              <strong className="text-slate-200">Location:</strong> {apt.location}
            </p>
          )}
          {apt.attendees.length > 0 && (
            <p className="text-slate-400">
              <strong className="text-slate-200">With:</strong> {apt.attendees.map(a => a.name).join(', ')}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          {apt.googleCalendarUrl && (
            <a
              href={apt.googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-400 hover:text-brand-300 underline flex items-center gap-1"
            >
              <span>Add to Google Calendar</span>
              <ChevronRight className="w-3 h-3" />
            </a>
          )}
          {!isCancelled && (
            <button
              onClick={() => rescheduleAppointment(apt.id, 1)}
              className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              Move +1 Day
            </button>
          )}
        </div>
      </div>
    );
  }

  // Call / Phone Card
  if (card.intent === 'call_contact' && card.contactData) {
    const contact = card.contactData;
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <PhoneCall className="w-4 h-4" />
          <span>Quick Call</span>
        </div>

        <h4 className="text-sm font-bold text-slate-100 mt-2">{contact.name}</h4>
        <p className="text-xs text-slate-400 mt-1">{contact.role || 'Executive Contact'} • {contact.phone}</p>

        <div className="mt-3 flex items-center justify-end">
          <a
            href={`tel:${contact.phone?.replace(/[^0-9+]/g, '')}`}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 shadow-md transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Dial Now</span>
          </a>
        </div>
      </div>
    );
  }

  // Task Creation Card
  if (card.intent === 'task_create' && card.taskData) {
    const task = card.taskData;
    const fullTask = tasks.find(t => t.id === task.id) || (task as any);

    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Bot className="w-4 h-4" />
            <span>Task Logged to Work Hub</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {task.category}
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-100 mt-2">{task.title}</h4>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>

        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-brand-400 font-mono">
            <span>ROI:</span>
            <strong>{task.timeWonBackHours || 8}h won back</strong>
          </div>

          <button
            onClick={() => setSelectedTaskForBlueprint(fullTask)}
            className="flex items-center space-x-1 text-xs px-3 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 rounded-lg transition border border-brand-500/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>View Blueprint</span>
          </button>
        </div>
      </div>
    );
  }

  // AI Knowledge & Strategic Solution Card
  if (card.intent === 'knowledge_qa') {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(`${card.title}\n\n${card.description}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-brand-950/40 border border-brand-500/40 rounded-2xl p-4 shadow-xl relative overflow-hidden transition-all hover:border-brand-400/60">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>AI Strategic Solution & Answer</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium border border-slate-700 transition"
          >
            {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-brand-400" />}
            <span>{copied ? 'Copied!' : 'Copy Solution'}</span>
          </button>
        </div>

        <h4 className="text-sm font-bold text-white mt-2 flex items-center gap-1.5">
          <span>💡</span>
          <span>{card.title}</span>
        </h4>

        <div className="mt-2.5 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans space-y-2">
          {card.description}
        </div>

        {card.spokenResponse && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-teal-400 font-medium">
              <Bot className="w-3.5 h-3.5" />
              <span>Spoken Audio Summary:</span>
            </span>
            <span className="italic text-slate-300 truncate max-w-[280px]">"{card.spokenResponse}"</span>
          </div>
        )}
      </div>
    );
  }

  // Default Action Card
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
        <Sparkles className="w-4 h-4 text-brand-400" />
        <span>Assistant Response</span>
      </div>
      <h4 className="text-sm font-bold text-slate-100 mt-2">{card.title}</h4>
      <p className="text-xs text-slate-300 mt-1">{card.spokenResponse || card.description}</p>
    </div>
  );
};
