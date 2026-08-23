import React, { useState, useEffect } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { ContactPerson, ChatMessage, CallLog } from '../types';
import { 
  Phone, 
  MessageSquare, 
  User, 
  Search, 
  Send, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  Check, 
  Clock, 
  Sparkles, 
  Plus,
  ShieldCheck,
  Star
} from 'lucide-react';

export const CommunicationsHubView: React.FC = () => {
  const { 
    contacts, 
    chatMessages, 
    callLogs, 
    sendChatMessage, 
    createContact, 
    logCompletedCall,
    startVoiceListening,
    isListening
  } = useAssistant();

  const [selectedContact, setSelectedContact] = useState<ContactPerson | null>(contacts[0] || null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'call_bridge' | 'history'>('chat');
  const [messageInput, setMessageInput] = useState('');

  // Voice Call Bridge State
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callNotes, setCallNotes] = useState('');

  // New Contact Modal
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactCompany, setNewContactCompany] = useState('');

  // Call timer interval
  useEffect(() => {
    let timer: any = null;
    if (isCallActive) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  const filteredContacts = contacts.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.role && c.role.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const activeMessages = chatMessages.filter(m => selectedContact && m.contactId === selectedContact.id);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !messageInput.trim()) return;
    const text = messageInput.trim();
    setMessageInput('');
    await sendChatMessage(selectedContact.id, text);
  };

  const handleStartCall = () => {
    setIsCallActive(true);
    setActiveTab('call_bridge');
    setCallNotes(`Live conversation with ${selectedContact?.name || 'Contact'}.`);
  };

  const handleEndCall = async () => {
    if (!selectedContact) {
      setIsCallActive(false);
      return;
    }
    const finalDuration = callDuration;
    setIsCallActive(false);
    await logCompletedCall({
      contactId: selectedContact.id,
      contactName: selectedContact.name,
      phone: selectedContact.phone || '+1 (555) 000-0000',
      durationSeconds: Math.max(15, finalDuration),
      notes: callNotes,
      transcriptSummary: `Automated call transcription with ${selectedContact.name}. Key points captured and synced.`
    });
    setActiveTab('history');
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;
    const created = await createContact({
      id: 'c-' + Date.now().toString(36),
      name: newContactName.trim(),
      role: newContactRole.trim(),
      email: newContactEmail.trim(),
      phone: newContactPhone.trim(),
      company: newContactCompany.trim()
    });
    setSelectedContact(created);
    setIsAddingContact(false);
    setNewContactName('');
    setNewContactRole('');
    setNewContactEmail('');
    setNewContactPhone('');
    setNewContactCompany('');
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Communications & Calling Hub</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live messaging, direct tel: calling, WebRTC audio bridge simulation, and auto-transcribed call logs
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddingContact(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Contact</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Contacts Directory */}
        <div className="lg:col-span-4 space-y-3">
          
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search name, company, or role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredContacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  selectedContact?.id === contact.id
                    ? 'bg-brand-950/20 border-brand-500/50 shadow-md'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                    {contact.avatarUrl ? (
                      <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      contact.name.charAt(0)
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-slate-200">{contact.name}</p>
                      {contact.isVIP && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">{contact.role || contact.company || 'Contact'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      onClick={e => e.stopPropagation()}
                      className="p-2 bg-slate-950 hover:bg-brand-500/20 text-slate-400 hover:text-brand-300 border border-slate-800 rounded-xl transition"
                      title="Direct Phone Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Column: Interactive Chat, Calling Bridge & Call History */}
        <div className="lg:col-span-8 space-y-4">
          
          {selectedContact ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              
              {/* Contact Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center font-bold text-white text-base shadow-md">
                    {selectedContact.avatarUrl ? (
                      <img src={selectedContact.avatarUrl} alt={selectedContact.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      selectedContact.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{selectedContact.name}</span>
                      {selectedContact.company && (
                        <span className="text-xs font-normal text-slate-400">({selectedContact.company})</span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-400 flex items-center gap-3">
                      <span>{selectedContact.role || 'Executive Partner'}</span>
                      {selectedContact.phone && <span className="font-mono">{selectedContact.phone}</span>}
                    </p>
                  </div>
                </div>

                {/* Call Actions */}
                <div className="flex items-center space-x-2">
                  <a
                    href={`tel:${selectedContact.phone || ''}`}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Direct Call</span>
                  </a>

                  <button
                    onClick={handleStartCall}
                    disabled={isCallActive}
                    className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold shadow-md transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Start Voice Bridge</span>
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                    activeTab === 'chat'
                      ? 'bg-brand-500/10 text-brand-300 border border-brand-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Direct Chat</span>
                </button>

                <button
                  onClick={() => setActiveTab('call_bridge')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                    activeTab === 'call_bridge'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Live Call Bridge {isCallActive && `(${formatSeconds(callDuration)})`}</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                    activeTab === 'history'
                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Call Logs & History</span>
                </button>
              </div>

              {/* TAB 1: DIRECT CHAT */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <div className="h-80 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 overflow-y-auto space-y-3">
                    {activeMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                        <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-brand-400" />
                        <p>No message history with {selectedContact.name} yet.</p>
                        <p className="text-[10px] text-slate-600 mt-1">Send a message below to start chatting!</p>
                      </div>
                    ) : (
                      activeMessages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${msg.sender === 'Andrew' ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                              msg.sender === 'Andrew'
                                ? 'bg-brand-500 text-slate-950 font-medium rounded-br-none shadow-md'
                                : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[9px] text-slate-500 mt-1 font-mono">
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder={`Message ${selectedContact.name}...`}
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 transition shadow-md"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: LIVE CALL BRIDGE SIMULATION */}
              {activeTab === 'call_bridge' && (
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 text-center space-y-6">
                  {isCallActive ? (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center animate-pulse mx-auto">
                          <Phone className="w-10 h-10 text-emerald-400" />
                        </div>
                        <span className="absolute bottom-0 right-2 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-950" />
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white">{selectedContact.name}</h3>
                        <p className="text-xs text-emerald-400 font-mono font-semibold mt-1">
                          Active Call: {formatSeconds(callDuration)}
                        </p>
                      </div>

                      {/* Live Call Notes Box */}
                      <div className="max-w-md mx-auto text-left space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400">Live Executive Notes (Auto-saved on Hangup):</label>
                        <textarea
                          rows={3}
                          value={callNotes}
                          onChange={e => setCallNotes(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Call Controls */}
                      <div className="flex items-center justify-center space-x-4 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className={`p-3 rounded-full border transition ${
                            isMuted ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <button
                          type="button"
                          onClick={handleEndCall}
                          className="px-6 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg flex items-center space-x-2 transition"
                        >
                          <PhoneOff className="w-4 h-4" />
                          <span>End Call</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-8">
                      <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                        <Phone className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Ready to call {selectedContact.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Press Start Voice Bridge to simulate a live executive audio call with real-time transcription notes.
                        </p>
                      </div>
                      <button
                        onClick={handleStartCall}
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs shadow-md transition inline-flex items-center space-x-2"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Start Voice Bridge Now</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CALL HISTORY & TRANSCRIPTS */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300">Call Log History</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {callLogs.filter(c => c.contactId === selectedContact.id).length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">No call logs for this contact yet.</p>
                    ) : (
                      callLogs
                        .filter(c => c.contactId === selectedContact.id)
                        .map(log => (
                          <div
                            key={log.id}
                            className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200">
                                Call Duration: {formatSeconds(log.durationSeconds)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(log.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">{log.notes}</p>
                            {log.transcriptSummary && (
                              <p className="text-indigo-400 text-[10px] font-mono mt-1">
                                📝 {log.transcriptSummary}
                              </p>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-3xl text-slate-500 text-xs">
              <User className="w-10 h-10 mb-2 opacity-40 text-indigo-400" />
              <p>Select a contact to start chatting or launch a voice calling session.</p>
            </div>
          )}

        </div>

      </div>

      {/* Add Contact Modal */}
      {isAddingContact && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-brand-400" />
              <span>Add New Executive Contact</span>
            </h3>

            <form onSubmit={handleSaveContact} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Role / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. CTO"
                    value={newContactRole}
                    onChange={e => setNewContactRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={newContactCompany}
                    onChange={e => setNewContactCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={newContactEmail}
                    onChange={e => setNewContactEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={newContactPhone}
                    onChange={e => setNewContactPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold shadow-md transition"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
