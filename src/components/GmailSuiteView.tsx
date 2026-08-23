import React, { useState } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { InboxEmail } from '../types';
import { 
  Mail, 
  Send, 
  Star, 
  Trash2, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Paperclip, 
  User, 
  ArrowLeft,
  RefreshCw,
  Clock,
  Mic,
  Smile,
  Briefcase,
  AlertTriangle
} from 'lucide-react';

export const GmailSuiteView: React.FC = () => {
  const { 
    inboxEmails, 
    contacts, 
    sendDirectEmail, 
    triageInbox, 
    markEmailRead, 
    toggleEmailStar, 
    deleteInboxEmail,
    startVoiceListening,
    isListening,
    liveTranscript
  } = useAssistant();

  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(inboxEmails[0] || null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'vip' | 'finance' | 'starred'>('all');
  const [search, setSearch] = useState('');
  
  // Compose modal state
  const [isComposing, setIsComposing] = useState(false);
  const [composeToEmail, setComposeToEmail] = useState('');
  const [composeToName, setComposeToName] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeTone, setComposeTone] = useState<'professional' | 'urgent' | 'friendly' | 'concise'>('professional');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // AI Triage Banner
  const [triageSummary, setTriageSummary] = useState<string | null>(null);
  const [isTriaging, setIsTriaging] = useState(false);

  // Quick Reply
  const [replyText, setReplyText] = useState('');

  const unreadCount = inboxEmails.filter(e => e.isUnread).length;

  const filteredEmails = inboxEmails.filter(e => {
    if (filter === 'unread' && !e.isUnread) return false;
    if (filter === 'vip' && e.category !== 'vip') return false;
    if (filter === 'finance' && e.category !== 'finance') return false;
    if (filter === 'starred' && !e.isStarred) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.fromName.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.snippet.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectEmail = (email: InboxEmail) => {
    setSelectedEmail(email);
    if (email.isUnread) {
      markEmailRead(email.id, false);
    }
    setReplyText('');
  };

  const handleTriage = async () => {
    setIsTriaging(true);
    const summary = await triageInbox();
    setTriageSummary(summary);
    setIsTriaging(false);
  };

  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeToEmail || !composeSubject || !composeBody) return;
    setIsSending(true);
    const success = await sendDirectEmail({
      toName: composeToName || composeToEmail.split('@')[0],
      toEmail: composeToEmail,
      subject: composeSubject,
      body: composeBody,
      tone: composeTone
    });
    setIsSending(false);
    if (success) {
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setIsComposing(false);
        setComposeToEmail('');
        setComposeToName('');
        setComposeSubject('');
        setComposeBody('');
      }, 1200);
    }
  };

  const handleSendReply = async () => {
    if (!selectedEmail || !replyText.trim()) return;
    setIsSending(true);
    await sendDirectEmail({
      toName: selectedEmail.fromName,
      toEmail: selectedEmail.fromEmail,
      subject: selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
      body: replyText,
      tone: 'professional'
    });
    setIsSending(false);
    setReplyText('');
    setSendSuccess(true);
    setTimeout(() => setSendSuccess(false), 2000);
  };

  const handleQuickContactSelect = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact && contact.email) {
      setComposeToName(contact.name);
      setComposeToEmail(contact.email);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Gmail Executive Suite</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white shadow-sm animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Read, draft, triage, and send emails with AI tone adjustment & speech dictation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleTriage}
            disabled={isTriaging}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition shadow-sm"
          >
            <Sparkles className={`w-4 h-4 text-indigo-400 ${isTriaging ? 'animate-spin' : ''}`} />
            <span>{isTriaging ? 'Triaging...' : 'AI Executive Triage'}</span>
          </button>

          <button
            onClick={() => {
              setIsComposing(true);
              setSelectedEmail(null);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-md transition"
          >
            <Send className="w-4 h-4" />
            <span>Compose Email</span>
          </button>
        </div>
      </div>

      {/* AI Triage Summary Banner */}
      {triageSummary && (
        <div className="bg-indigo-950/40 border border-indigo-500/40 p-4 rounded-2xl space-y-2 animate-fadeIn text-xs text-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Executive Inbox Summary</span>
            </div>
            <button 
              onClick={() => setTriageSummary(null)}
              className="text-slate-400 hover:text-white"
            >
              Dismiss ✕
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 leading-relaxed">
            {triageSummary}
          </pre>
        </div>
      )}

      {/* Main Inbox & Reader Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Email List */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Filter Pills & Search */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search sender, subject, or keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-medium text-slate-400">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'vip', label: 'VIP' },
                { id: 'finance', label: 'Finance' },
                { id: 'starred', label: 'Starred' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                    filter === tab.id
                      ? 'bg-brand-500/10 text-brand-300 border border-brand-500/30'
                      : 'hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Email Items List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredEmails.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 text-slate-500 text-xs">
                No emails found matching this filter.
              </div>
            ) : (
              filteredEmails.map(email => (
                <div
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col gap-1.5 ${
                    selectedEmail?.id === email.id
                      ? 'bg-brand-950/20 border-brand-500/50 shadow-md'
                      : email.isUnread
                      ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                      : 'bg-slate-950 border-slate-800/60 opacity-80 hover:opacity-100 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${email.isUnread ? 'bg-red-500' : 'bg-transparent'}`} />
                      <span className={`text-xs ${email.isUnread ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                        {email.fromName}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEmailStar(email.id);
                        }}
                        className="p-1 text-slate-500 hover:text-amber-400 transition"
                      >
                        <Star className={`w-3.5 h-3.5 ${email.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <p className={`text-xs truncate ${email.isUnread ? 'font-semibold text-slate-100' : 'text-slate-400'}`}>
                    {email.subject}
                  </p>

                  <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">
                    {email.snippet}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                      email.category === 'vip' 
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30' 
                        : email.category === 'finance'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {email.category}
                    </span>

                    {email.hasAttachments && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Paperclip className="w-3 h-3 text-slate-500" />
                        <span>PDF</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Right Column: Email Viewer or Composer */}
        <div className="lg:col-span-7">
          
          {isComposing ? (
            /* Compose Box */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-brand-400" />
                  <span>New Executive Message</span>
                </h3>
                <button
                  onClick={() => setIsComposing(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {/* Quick Contact Picker */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <span className="text-slate-500">Quick Recipient:</span>
                {contacts.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleQuickContactSelect(c.id)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 whitespace-nowrap"
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendCompose} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">To Name</label>
                    <input
                      type="text"
                      placeholder="Recipient Name"
                      value={composeToName}
                      onChange={e => setComposeToName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">To Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={composeToEmail}
                      onChange={e => setComposeToEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="Subject line..."
                    value={composeSubject}
                    onChange={e => setComposeSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Tone selector */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500">Tone:</span>
                  {(['professional', 'urgent', 'friendly', 'concise'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setComposeTone(t)}
                      className={`px-2 py-0.5 rounded capitalize ${
                        composeTone === t
                          ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 font-semibold'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-slate-400">Message Body *</label>
                    <button
                      type="button"
                      onClick={() => startVoiceListening()}
                      className="flex items-center space-x-1 text-[10px] text-brand-400 hover:underline"
                    >
                      <Mic className={`w-3 h-3 ${isListening ? 'animate-pulse text-red-400' : ''}`} />
                      <span>{isListening ? 'Listening...' : 'Dictate with Voice'}</span>
                    </button>
                  </div>
                  <textarea
                    required
                    rows={8}
                    placeholder="Draft your executive email message here..."
                    value={composeBody}
                    onChange={e => setComposeBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-500 leading-relaxed font-sans"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-lg transition"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                    <span>{sendSuccess ? 'Sent! ✅' : isSending ? 'Sending...' : 'Send Message Now'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : selectedEmail ? (
            /* Email Thread Viewer */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-fadeIn">
              
              {/* Email Top Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedEmail.category === 'vip' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {selectedEmail.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(selectedEmail.receivedAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {selectedEmail.subject}
                  </h2>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => toggleEmailStar(selectedEmail.id)}
                    className="p-2 text-slate-400 hover:text-amber-400 bg-slate-950 rounded-xl border border-slate-800"
                  >
                    <Star className={`w-4 h-4 ${selectedEmail.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                  <button
                    onClick={() => deleteInboxEmail(selectedEmail.id)}
                    className="p-2 text-slate-400 hover:text-red-400 bg-slate-950 rounded-xl border border-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sender Metadata */}
              <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                  {selectedEmail.fromName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{selectedEmail.fromName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedEmail.fromEmail}</p>
                </div>
              </div>

              {/* Email Content Body */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedEmail.body}
              </div>

              {/* Suggested AI Quick Reply Chip */}
              {selectedEmail.suggestedReply && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>AI Suggested Quick Reply:</span>
                  </span>
                  <button
                    onClick={() => setReplyText(selectedEmail.suggestedReply!)}
                    className="w-full text-left p-2.5 rounded-xl bg-indigo-950/30 hover:bg-indigo-950/50 border border-indigo-500/30 text-indigo-200 text-xs transition"
                  >
                    "{selectedEmail.suggestedReply}"
                  </button>
                </div>
              )}

              {/* Direct Reply Composer */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Send Fast Reply</span>
                  <button
                    onClick={() => startVoiceListening()}
                    className="flex items-center space-x-1 text-[10px] text-brand-400 hover:underline"
                  >
                    <Mic className="w-3 h-3" />
                    <span>Dictate Voice Reply</span>
                  </button>
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply to ${selectedEmail.fromName}...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isSending}
                    className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 shadow-md transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendSuccess ? 'Replied! ✅' : isSending ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-3xl text-slate-500 text-xs">
              <Mail className="w-10 h-10 mb-2 opacity-40 text-brand-400" />
              <p>Select an email from your inbox to view full thread, or compose a new message.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
