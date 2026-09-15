import React, { useState } from 'react';
import { 
  ActionCard, 
  ActionIntentType, 
  EmailDraft, 
  CalendarAppointment, 
  TaskItem 
} from '../types';
import { useAssistant } from '../context/AssistantContext';
import { trainingFeedbackService } from '../services/trainingFeedbackService';
import { 
  Send, 
  Calendar, 
  CheckSquare, 
  Globe, 
  Edit3, 
  RotateCcw, 
  Check, 
  X, 
  Sparkles, 
  Clock, 
  User, 
  ArrowRightLeft,
  ChevronDown,
  GraduationCap
} from 'lucide-react';

interface ActionCardEditorProps {
  card: ActionCard;
  onExecute?: (updatedCard: ActionCard) => void;
  onCancel?: () => void;
}

const INTENT_METADATA: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  email_draft: { label: '✉️ Email Draft', icon: Send, color: 'text-teal-300', bg: 'bg-teal-950/60', border: 'border-teal-800/80' },
  calendar_booking: { label: '📅 Calendar Meeting', icon: Calendar, color: 'text-purple-300', bg: 'bg-purple-950/60', border: 'border-purple-800/80' },
  task_create: { label: '📋 Work Hub Task', icon: CheckSquare, color: 'text-sky-300', bg: 'bg-sky-950/60', border: 'border-sky-800/80' },
  web_search: { label: '🌐 Web Research', icon: Globe, color: 'text-amber-300', bg: 'bg-amber-950/60', border: 'border-amber-800/80' },
  knowledge_qa: { label: '🧠 Conversational Advisory', icon: Sparkles, color: 'text-slate-300', bg: 'bg-slate-900', border: 'border-slate-800' }
};

const VIP_ROSTER = [
  { name: 'Celine Loeuille', email: 'celine.loeuille@gmail.com', relation: 'Wife' },
  { name: 'Eleonore Baxter', email: 'eleonore.a.baxter@gmail.com', relation: 'Daughter (Ellie)' },
  { name: 'Alexander Baxter', email: 'alexander.j.baxter@gmail.com', relation: 'Son' },
  { name: 'Elizabeth Baxter', email: 'elizabth.js.baxter@gmail.com', relation: 'Daughter' },
  { name: 'Angelina Baxter', email: 'angelina.c.baxter@gmail.com', relation: 'Daughter' },
  { name: 'Sarah Chen', email: 'sarah.chen@innovateai.com', relation: 'Partner / Client' },
  { name: 'David Miller', email: 'david.miller@client.co', relation: 'Client Lead' }
];

export const ActionCardEditor: React.FC<ActionCardEditorProps> = ({ card, onExecute, onCancel }) => {
  const { submitVoiceTranscript, sendDirectEmail } = useAssistant();
  const [isEditing, setIsEditing] = useState(false);
  const [currentIntent, setCurrentIntent] = useState<ActionIntentType>(card.intent || 'email_draft');
  const [showIntentMenu, setShowIntentMenu] = useState(false);
  const [showTeachSuccess, setShowTeachSuccess] = useState(false);

  // Email Slots
  const [toName, setToName] = useState(card.emailData?.toName || 'Celine Loeuille');
  const [toEmail, setToEmail] = useState(card.emailData?.toEmail || 'celine.loeuille@gmail.com');
  const [emailSubject, setEmailSubject] = useState(card.emailData?.subject || card.title || 'Note from Andrew');
  const [emailBody, setEmailBody] = useState(card.emailData?.body || card.description || '');

  // Calendar Slots
  const [meetingTitle, setMeetingTitle] = useState(card.calendarData?.title || card.title || 'Executive Strategy Sync');
  const [meetingDate, setMeetingDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 16);
  });
  const [meetingLocation, setMeetingLocation] = useState(card.calendarData?.location || 'Google Meet / Virtual Bridge');

  // Task Slots
  const [taskTitle, setTaskTitle] = useState(card.taskData?.title || card.title || 'New Action Item');
  const [taskCategory, setTaskCategory] = useState<string>(card.taskData?.category || 'Tech/Dev');
  const [taskPriority, setTaskPriority] = useState<string>(card.taskData?.userPriority || 'high');

  const intentMeta = INTENT_METADATA[currentIntent] || INTENT_METADATA.knowledge_qa;

  const handleSelectVIP = (vip: typeof VIP_ROSTER[0]) => {
    setToName(vip.name);
    setToEmail(vip.email);
  };

  const handleSwitchIntent = (newIntent: ActionIntentType) => {
    setCurrentIntent(newIntent);
    setShowIntentMenu(false);
    setIsEditing(true);
  };

  const handleExecute = () => {
    if (currentIntent === 'email_draft') {
      const emailPayload: EmailDraft = {
        id: card.emailData?.id || 'em-' + Date.now().toString(36),
        toName,
        toEmail,
        subject: emailSubject,
        body: emailBody,
        tone: 'friendly',
        status: 'sent',
        sentAt: new Date().toISOString()
      };
      sendDirectEmail(emailPayload).catch(() => {});
      submitVoiceTranscript(`Confirmed email sent to ${toName}`);
    } else if (currentIntent === 'task_create') {
      submitVoiceTranscript(`Create high-priority task: ${taskTitle}`);
    } else if (currentIntent === 'calendar_booking') {
      submitVoiceTranscript(`Meeting confirmed: "${meetingTitle}" at ${meetingDate}`);
    } else {
      submitVoiceTranscript('Yes, proceed');
    }

    if (onExecute) {
      onExecute({
        ...card,
        intent: currentIntent,
        title: currentIntent === 'task_create' ? taskTitle : emailSubject,
        description: emailBody,
        status: 'executed'
      });
    }
  };

  const handleTeachRule = () => {
    trainingFeedbackService.createTrainingCase({
      originalTranscript: card.title || 'User voice turn',
      correctedTranscript: card.title || 'User voice turn',
      actualIntent: card.intent,
      expectedIntent: currentIntent,
      actualSpokenResponse: card.spokenResponse,
      expectedSpokenResponse: `Executed ${currentIntent} for ${toName}`,
      failureCategory: 'intent_misclassification',
      notes: `User explicitly corrected action to ${currentIntent} with recipient ${toName} (${toEmail})`,
      sttProvider: 'groq_whisper',
      llmProvider: 'gemini-2.5-flash',
      tags: ['action_correction', currentIntent]
    });
    setShowTeachSuccess(true);
    setTimeout(() => setShowTeachSuccess(false), 3000);
  };

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-slate-900/95 border-2 border-slate-700/80 shadow-2xl space-y-3 text-xs text-slate-200">
      
      {/* Top Header: Intent Badge & Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowIntentMenu(!showIntentMenu)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${intentMeta.bg} ${intentMeta.color} ${intentMeta.border} hover:opacity-90 cursor-pointer shadow-sm`}
            title="Click to switch action type (e.g. from Task to Email or Calendar)"
          >
            <span>{intentMeta.label}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {/* Action Switcher Dropdown */}
          {showIntentMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-52 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl py-1 z-30 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-mono px-3 py-1 block uppercase">Switch Action Type:</span>
              <button
                type="button"
                onClick={() => handleSwitchIntent('email_draft')}
                className="w-full text-left px-3 py-1.5 text-xs text-teal-300 hover:bg-slate-800/80 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>✉️ Draft Email</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchIntent('calendar_booking')}
                className="w-full text-left px-3 py-1.5 text-xs text-purple-300 hover:bg-slate-800/80 flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>📅 Book Meeting</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchIntent('task_create')}
                className="w-full text-left px-3 py-1.5 text-xs text-sky-300 hover:bg-slate-800/80 flex items-center gap-2"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>📋 Create Task</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchIntent('web_search')}
                className="w-full text-left px-3 py-1.5 text-xs text-amber-300 hover:bg-slate-800/80 flex items-center gap-2"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>🌐 Search Web</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition ${
              isEditing ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditing ? 'Done Editing' : 'Edit Slots'}</span>
          </button>
        </div>
      </div>

      {/* Action Body (Email / Calendar / Task / QA) */}
      {currentIntent === 'email_draft' && (
        <div className="space-y-2.5">
          {/* VIP Quick Select Chips */}
          {isEditing && (
            <div>
              <span className="text-[10px] text-slate-400 font-mono block mb-1">Quick Select Recipient:</span>
              <div className="flex flex-wrap gap-1.5">
                {VIP_ROSTER.map((vip) => (
                  <button
                    key={vip.email}
                    type="button"
                    onClick={() => handleSelectVIP(vip)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                      toEmail === vip.email
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {vip.name} ({vip.relation})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recipient Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Recipient Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-teal-400 outline-none"
                />
              ) : (
                <p className="font-semibold text-teal-300">{toName}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-teal-400 outline-none"
                />
              ) : (
                <p className="text-slate-300 font-mono text-[11px]">{toEmail}</p>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Subject</label>
            {isEditing ? (
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-teal-400 outline-none"
              />
            ) : (
              <p className="font-semibold text-slate-200">"{emailSubject}"</p>
            )}
          </div>

          {/* Body */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Email Body</label>
            {isEditing ? (
              <textarea
                rows={3}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-teal-400 outline-none"
              />
            ) : (
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 whitespace-pre-wrap">
                {emailBody}
              </div>
            )}
          </div>
        </div>
      )}

      {currentIntent === 'calendar_booking' && (
        <div className="space-y-2.5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Meeting Title</label>
            {isEditing ? (
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-purple-400 outline-none"
              />
            ) : (
              <p className="font-semibold text-purple-300">{meetingTitle}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Date & Time</label>
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-purple-400 outline-none"
                />
              ) : (
                <p className="text-slate-300 font-mono text-[11px]">{new Date(meetingDate).toLocaleString()}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-purple-400 outline-none"
                />
              ) : (
                <p className="text-slate-300 text-[11px]">{meetingLocation}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {currentIntent === 'task_create' && (
        <div className="space-y-2.5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Task Title</label>
            {isEditing ? (
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-sky-400 outline-none"
              />
            ) : (
              <p className="font-semibold text-sky-300">{taskTitle}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Category</label>
              {isEditing ? (
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <option value="Tech/Dev">Tech/Dev</option>
                  <option value="Business & Strategy">Business & Strategy</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations & Admin">Operations & Admin</option>
                  <option value="Personal & Health">Personal & Health</option>
                </select>
              ) : (
                <p className="text-slate-300 text-[11px]">{taskCategory}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Priority</label>
              {isEditing ? (
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              ) : (
                <p className="text-slate-300 text-[11px] font-bold uppercase">{taskPriority}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExecute}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm & Execute Action</span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Teach Eve This Rule Button */}
        <button
          type="button"
          onClick={handleTeachRule}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition flex items-center gap-1 cursor-pointer ${
            showTeachSuccess 
              ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
              : 'bg-purple-950/40 hover:bg-purple-900/60 border-purple-800/60 text-purple-300'
          }`}
          title="Permanently teach Eve this action mapping rule for future turns"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>{showTeachSuccess ? '✓ Rule Saved to Memory!' : 'Teach Eve this Action'}</span>
        </button>
      </div>

    </div>
  );
};
