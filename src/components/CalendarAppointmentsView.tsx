import React, { useState } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { CalendarAppointment } from '../types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  XCircle,
  CalendarCheck2,
  CalendarDays,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Video,
  Sparkles,
  Link2
} from 'lucide-react';

export const CalendarAppointmentsView: React.FC = () => {
  const { appointments, rescheduleAppointment, contacts, refreshAll } = useAssistant();

  const [viewMode, setViewMode] = useState<'cards' | 'day_grid' | 'month_grid'>('cards');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // New Appointment Modal
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('14:00');
  const [newEndTime, setNewEndTime] = useState('15:00');
  const [newLocation, setNewLocation] = useState('Google Meet / Virtual');
  const [selectedAttendeeName, setSelectedAttendeeName] = useState('');
  const [selectedAttendeeEmail, setSelectedAttendeeEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Check for time overlaps / conflicts
  const conflicts: { apt1: CalendarAppointment; apt2: CalendarAppointment }[] = [];
  for (let i = 0; i < appointments.length; i++) {
    for (let j = i + 1; j < appointments.length; j++) {
      const a = appointments[i];
      const b = appointments[j];
      if (a.status !== 'cancelled' && b.status !== 'cancelled') {
        const startA = new Date(a.startDateTime).getTime();
        const endA = new Date(a.endDateTime).getTime();
        const startB = new Date(b.startDateTime).getTime();
        const endB = new Date(b.endDateTime).getTime();
        if (startA < endB && endA > startB) {
          conflicts.push({ apt1: a, apt2: b });
        }
      }
    }
  }

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSaving(true);

    const startDateTime = new Date(`${newDate}T${newStartTime}:00`).toISOString();
    const endDateTime = new Date(`${newDate}T${newEndTime}:00`).toISOString();

    const attendees = selectedAttendeeName ? [{ name: selectedAttendeeName, email: selectedAttendeeEmail || 'partner@company.com' }] : [];
    
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'apt-' + Date.now().toString(36),
        title: newTitle.trim(),
        startDateTime,
        endDateTime,
        location: newLocation,
        attendees,
        status: 'confirmed',
        googleCalendarUrl: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(newTitle.trim())}`
      })
    });

    await refreshAll();
    setIsSaving(false);
    setIsAddingAppointment(false);
    setNewTitle('');
  };

  const handleSelectQuickContact = (c: any) => {
    setSelectedAttendeeName(c.name);
    setSelectedAttendeeEmail(c.email || '');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-2xl">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Executive Calendar Hub</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-400 border border-teal-500/40">
                {appointments.filter(a => a.status === 'confirmed').length} Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Google Calendar sync, conflict coordinator, and 1-tap reschedule engine
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          
          {/* Feed Export */}
          <a
            href="/api/appointments/feed.ics"
            download="executive_calendar.ics"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Download .ics Calendar Feed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .ICS</span>
          </a>

          {/* New Appointment Button */}
          <button
            onClick={() => setIsAddingAppointment(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* Conflicts Warning Alert */}
      {conflicts.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-2xl space-y-2 text-xs text-amber-200 animate-fadeIn">
          <div className="flex items-center space-x-2 font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Scheduling Overlap Detected ({conflicts.length} conflict)</span>
          </div>
          <div className="space-y-1 text-slate-300">
            {conflicts.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <span>
                  <strong>"{c.apt1.title}"</strong> overlaps with <strong>"{c.apt2.title}"</strong> on {new Date(c.apt1.startDateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}.
                </span>
                <button
                  onClick={() => rescheduleAppointment(c.apt2.id, 1)}
                  className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-semibold hover:bg-amber-500/30"
                >
                  Resolve (+1 Day)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Appointments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs italic bg-slate-900/40 rounded-3xl border border-slate-800 space-y-2">
            <CalendarDays className="w-10 h-10 mx-auto text-brand-400 opacity-40" />
            <p className="font-semibold text-slate-300">No appointments currently scheduled.</p>
            <p className="text-[11px] text-slate-500">Say "Book strategy sync with Sarah next Tuesday at 2 PM" or tap New Appointment!</p>
          </div>
        ) : (
          appointments.map((apt) => {
            const startDate = new Date(apt.startDateTime);
            const endDate = new Date(apt.endDateTime);
            const isCancelled = apt.status === 'cancelled';

            return (
              <div 
                key={apt.id}
                className={`bg-slate-900 border rounded-3xl p-5 shadow-xl space-y-4 flex flex-col justify-between transition ${
                  isCancelled ? 'border-red-500/30 opacity-60' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isCancelled ? 'bg-red-500/20 text-red-300' : 'bg-teal-500/20 text-teal-300'
                    }`}>
                      {apt.status}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold font-mono">
                      {startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white tracking-tight">{apt.title}</h3>

                  <div className="space-y-2 text-xs text-slate-300 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center space-x-2 text-brand-300 font-mono">
                      <Clock className="w-3.5 h-3.5 text-brand-400" />
                      <span>
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {apt.location && (
                      <div className="flex items-center space-x-2 text-slate-400">
                        {apt.location.includes('Meet') || apt.location.includes('Virtual') ? (
                          <Video className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="truncate">{apt.location}</span>
                      </div>
                    )}

                    {apt.attendees && apt.attendees.length > 0 && (
                      <div className="flex items-start space-x-2 text-slate-400 pt-1.5 border-t border-slate-900">
                        <Users className="w-3.5 h-3.5 mt-0.5 text-slate-500" />
                        <span className="truncate">{apt.attendees.map(a => a.name).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="flex items-center space-x-2">
                    {apt.googleCalendarUrl && !isCancelled && (
                      <a
                        href={apt.googleCalendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-brand-400 hover:underline flex items-center gap-1"
                      >
                        <span>Google Cal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <a
                      href={`/api/appointments/${apt.id}/ics`}
                      download
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>.ics</span>
                    </a>
                  </div>

                  {!isCancelled && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => rescheduleAppointment(apt.id, 1)}
                        className="text-xs px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition"
                        title="Move 1 Day Ahead"
                      >
                        +1 Day
                      </button>
                      <button
                        onClick={() => rescheduleAppointment(apt.id, 3)}
                        className="text-xs px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition"
                        title="Move 3 Days Ahead"
                      >
                        +3 Days
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Appointment Modal */}
      {isAddingAppointment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" />
                <span>Schedule New Executive Meeting</span>
              </h3>
              <button onClick={() => setIsAddingAppointment(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Quick Contact Attendee Picker */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-500">Add Contact:</span>
              {contacts.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectQuickContact(c)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 whitespace-nowrap"
                >
                  {c.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Growth Sprint Sync"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Start *</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">End *</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Location / Video Link</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Attendee Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Chen"
                    value={selectedAttendeeName}
                    onChange={e => setSelectedAttendeeName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Attendee Email</label>
                  <input
                    type="email"
                    placeholder="sarah@example.com"
                    value={selectedAttendeeEmail}
                    onChange={e => setSelectedAttendeeEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-brand-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingAppointment(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold shadow-md transition"
                >
                  {isSaving ? 'Scheduling...' : 'Save & Sync Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
