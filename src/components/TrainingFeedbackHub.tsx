import React, { useState, useEffect } from 'react';
import { 
  trainingFeedbackService, 
  TrainingCase, 
  FailureCategory 
} from '../services/trainingFeedbackService';
import { audioCorpusService, AudioTestRecord } from '../services/audioCorpusService';
import { useAssistant } from '../context/AssistantContext';
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Play, 
  Pause, 
  Mic, 
  Sparkles, 
  Tag, 
  Layers, 
  X,
  FileCode,
  BookOpen,
  Filter
} from 'lucide-react';

interface TrainingFeedbackHubProps {
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<FailureCategory, { label: string; bg: string; text: string }> = {
  stt_phonetics: { label: '🎙️ STT Phonetics', bg: 'bg-teal-950/60 border-teal-800/60', text: 'text-teal-300' },
  intent_misclassification: { label: '🎯 Intent Error', bg: 'bg-rose-950/60 border-rose-800/60', text: 'text-rose-300' },
  entity_resolution: { label: '👤 Entity Resolution', bg: 'bg-purple-950/60 border-purple-800/60', text: 'text-purple-300' },
  context_loss: { label: '🔄 Context Loss', bg: 'bg-amber-950/60 border-amber-800/60', text: 'text-amber-300' },
  bad_formatting: { label: '📝 Bad Formatting', bg: 'bg-blue-950/60 border-blue-800/60', text: 'text-blue-300' },
  proactive_noise: { label: '🤖 Proactive Noise', bg: 'bg-orange-950/60 border-orange-800/60', text: 'text-orange-300' },
  other: { label: '⚙️ General Logic', bg: 'bg-slate-900 border-slate-800', text: 'text-slate-400' }
};

export const TrainingFeedbackHub: React.FC<TrainingFeedbackHubProps> = ({ onClose }) => {
  const { dialogueTurns } = useAssistant();
  const [cases, setCases] = useState<TrainingCase[]>(() => trainingFeedbackService.getAllCases());
  const [selectedCase, setSelectedCase] = useState<TrainingCase | null>(cases[0] || null);
  const [categorySummary, setCategorySummary] = useState(() => trainingFeedbackService.getCategorySummary());
  const [audioRecords, setAudioRecords] = useState<AudioTestRecord[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // New Case Form State
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [originalTranscript, setOriginalTranscript] = useState('');
  const [correctedTranscript, setCorrectedTranscript] = useState('');
  const [actualIntent, setActualIntent] = useState('knowledge_qa');
  const [expectedIntent, setExpectedIntent] = useState('email_draft');
  const [actualSpokenResponse, setActualSpokenResponse] = useState('');
  const [expectedSpokenResponse, setExpectedSpokenResponse] = useState('');
  const [failureCategory, setFailureCategory] = useState<FailureCategory>('intent_misclassification');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Audio Playback
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  useEffect(() => {
    audioCorpusService.getAllRecordings().then(recs => setAudioRecords(recs));
  }, []);

  const refreshList = () => {
    const updated = trainingFeedbackService.getAllCases();
    setCases(updated);
    setCategorySummary(trainingFeedbackService.getCategorySummary());
    if (updated.length > 0 && (!selectedCase || !updated.find(c => c.id === selectedCase.id))) {
      setSelectedCase(updated[0]);
    }
  };

  const handleSaveNewCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalTranscript.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    trainingFeedbackService.createTrainingCase({
      originalTranscript,
      correctedTranscript: correctedTranscript || originalTranscript,
      actualIntent,
      expectedIntent,
      actualSpokenResponse,
      expectedSpokenResponse,
      failureCategory,
      notes,
      sttProvider: 'groq_whisper',
      llmProvider: 'gemini-2.5-flash',
      tags
    });

    setIsCreatingNew(false);
    resetForm();
    refreshList();
  };

  const resetForm = () => {
    setOriginalTranscript('');
    setCorrectedTranscript('');
    setActualIntent('knowledge_qa');
    setExpectedIntent('email_draft');
    setActualSpokenResponse('');
    setExpectedSpokenResponse('');
    setFailureCategory('intent_misclassification');
    setNotes('');
    setTagsInput('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this training feedback record?')) {
      trainingFeedbackService.deleteCase(id);
      refreshList();
    }
  };

  const handleExportJSON = () => {
    const data = trainingFeedbackService.exportDatasetJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eve_training_feedback_corpus_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const populateFromDialogueTurn = (turnText: string, assistantText?: string) => {
    setIsCreatingNew(true);
    setOriginalTranscript(turnText);
    setCorrectedTranscript(turnText);
    setActualSpokenResponse(assistantText || '');
    setExpectedIntent('email_draft');
  };

  const filteredCases = filterCategory === 'all'
    ? cases
    : cases.filter(c => c.failureCategory === filterCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-5xl h-[90vh] max-h-[850px] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>🎓 Diagnostic & Training Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  Ground Truth Active Learning
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Annotate what Eve understood vs. what was expected to generate regression test suites.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Test Dataset</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Analytics Breakdown Strip */}
        <div className="p-3 bg-slate-900/40 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 text-xs">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Total Cases</span>
            <span className="font-bold font-mono text-purple-300">{cases.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">STT Phonetic Issues</span>
            <span className="font-bold font-mono text-teal-300">{categorySummary.stt_phonetics}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Intent Mismatches</span>
            <span className="font-bold font-mono text-rose-300">{categorySummary.intent_misclassification}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Context / Pronoun Drops</span>
            <span className="font-bold font-mono text-amber-300">{categorySummary.context_loss}</span>
          </div>
        </div>

        {/* Main Content Area: Split View */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Panel: Cases List */}
          <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col min-h-0 bg-slate-950/40">
            <div className="p-2.5 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterCategory('all')}
                  className={`px-2 py-0.5 rounded-lg font-semibold transition ${filterCategory === 'all' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  All ({cases.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(true);
                  resetForm();
                }}
                className="px-2.5 py-1 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold flex items-center gap-1 transition shrink-0 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Case</span>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {filteredCases.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <BookOpen className="w-6 h-6 mx-auto mb-1.5 opacity-30 text-purple-400" />
                  <p>No training cases logged.</p>
                  <p className="text-[10px] text-slate-600 mt-1">Click "+ New Case" to log a failure.</p>
                </div>
              ) : (
                filteredCases.map(c => {
                  const catStyle = CATEGORY_LABELS[c.failureCategory] || CATEGORY_LABELS.other;
                  const isSelected = !isCreatingNew && selectedCase?.id === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setIsCreatingNew(false);
                        setSelectedCase(c);
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-purple-950/30 border-purple-500/60 shadow-md'
                          : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${catStyle.bg} ${catStyle.text}`}>
                          {catStyle.label}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(c.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <p className="font-semibold text-slate-200 line-clamp-1 mb-1">
                        "{c.originalTranscript}"
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Expected: <strong className="text-purple-300">{c.expectedIntent}</strong></span>
                        <span className={`font-mono ${c.status === 'resolved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          ● {c.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Case Details or Form */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950 p-4 overflow-y-auto">
            {isCreatingNew ? (
              /* Create New Training Case Form */
              <form onSubmit={handleSaveNewCase} className="space-y-4 max-w-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Log New Diagnostic Training Case</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                {/* Original Transcript */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    What Eve Heard (Original Transcript) *
                  </label>
                  <input
                    type="text"
                    required
                    value={originalTranscript}
                    onChange={(e) => setOriginalTranscript(e.target.value)}
                    placeholder="e.g. Send an email to Selene saying I love her"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Corrected Ground Truth Transcript */}
                <div>
                  <label className="block text-[11px] font-bold text-teal-300 uppercase mb-1">
                    What Was Actually Said (Ground Truth)
                  </label>
                  <input
                    type="text"
                    value={correctedTranscript}
                    onChange={(e) => setCorrectedTranscript(e.target.value)}
                    placeholder="e.g. Send an email to Celine saying I love her"
                    className="w-full bg-slate-900 border border-teal-800/60 rounded-xl px-3 py-2 text-xs text-teal-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Intent Pickers */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Actual Intent (Observed)
                    </label>
                    <select
                      value={actualIntent}
                      onChange={(e) => setActualIntent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-300"
                    >
                      <option value="knowledge_qa">knowledge_qa</option>
                      <option value="email_draft">email_draft</option>
                      <option value="calendar_booking">calendar_booking</option>
                      <option value="task_create">task_create</option>
                      <option value="web_search">web_search</option>
                      <option value="general_query">general_query</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">
                      Expected Intent (Ground Truth) *
                    </label>
                    <select
                      value={expectedIntent}
                      onChange={(e) => setExpectedIntent(e.target.value)}
                      className="w-full bg-purple-950/40 border border-purple-700 rounded-xl px-2.5 py-2 text-xs text-purple-200"
                    >
                      <option value="email_draft">email_draft</option>
                      <option value="calendar_booking">calendar_booking</option>
                      <option value="knowledge_qa">knowledge_qa</option>
                      <option value="task_create">task_create</option>
                      <option value="web_search">web_search</option>
                      <option value="general_query">general_query</option>
                    </select>
                  </div>
                </div>

                {/* Failure Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Failure Classification
                  </label>
                  <select
                    value={failureCategory}
                    onChange={(e) => setFailureCategory(e.target.value as FailureCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="stt_phonetics">🎙️ STT Phonetic Misspelling (Whisper misheard name/term)</option>
                    <option value="intent_misclassification">🎯 Intent Misclassification (Triggered wrong skill/action)</option>
                    <option value="entity_resolution">👤 Entity Resolution (Wrong email/contact/location)</option>
                    <option value="context_loss">🔄 Context Loss (Dropped antecedent pronoun "it/her/him")</option>
                    <option value="bad_formatting">📝 Bad Formatting / Robotic Boilerplate</option>
                    <option value="proactive_noise">🤖 Proactive Background Noise</option>
                    <option value="other">⚙️ Other / General Logic Flaw</option>
                  </select>
                </div>

                {/* Expected Spoken Response */}
                <div>
                  <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">
                    Expected Spoken Response / Behavior
                  </label>
                  <textarea
                    rows={2}
                    value={expectedSpokenResponse}
                    onChange={(e) => setExpectedSpokenResponse(e.target.value)}
                    placeholder="e.g. I've drafted that email to Celine right away, letting her know you'll be home soon."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Diagnostic Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Diagnostic Notes / Telemetry Trace
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Whisper transcribed 'Selene'. Need phonetic mapping to celine.loeuille@gmail.com."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Commit Training Case & Teach Eve</span>
                  </button>
                </div>
              </form>
            ) : selectedCase ? (
              /* Case Viewer & Inspector */
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Case ID: {selectedCase.id}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      "{selectedCase.originalTranscript}"
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedCase.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 transition"
                      title="Delete case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">What Eve Heard & Did</span>
                    <p className="text-slate-200 italic">"{selectedCase.originalTranscript}"</p>
                    <div className="pt-1 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Intent:</span>
                      <span className="font-mono text-rose-300 font-bold">{selectedCase.actualIntent}</span>
                    </div>
                    {selectedCase.actualSpokenResponse && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Response: {selectedCase.actualSpokenResponse}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-1.5">
                    <span className="text-[10px] font-bold text-purple-300 uppercase">Expected Behavior (Ground Truth)</span>
                    <p className="text-teal-200 font-medium">"{selectedCase.correctedTranscript || selectedCase.originalTranscript}"</p>
                    <div className="pt-1 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Expected Intent:</span>
                      <span className="font-mono text-purple-300 font-bold">{selectedCase.expectedIntent}</span>
                    </div>
                    {selectedCase.expectedSpokenResponse && (
                      <p className="text-[11px] text-slate-200 mt-1">
                        Expected: "{selectedCase.expectedSpokenResponse}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedCase.notes && (
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Diagnostic Notes & Rule</span>
                    <p className="text-slate-300">{selectedCase.notes}</p>
                  </div>
                )}

                {/* Status Switcher */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <span className="text-xs text-slate-400">Verification Status:</span>
                  <div className="flex items-center space-x-2 text-xs">
                    {(['open', 'investigating', 'resolved'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          trainingFeedbackService.updateCaseStatus(selectedCase.id, st);
                          refreshList();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                          selectedCase.status === st
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
                <p>Select a training case from the left or create a new one.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
