import React, { useState, useRef } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { 
  Mic, 
  Upload, 
  X, 
  Sparkles, 
  FileAudio, 
  Radio, 
  Play, 
  CheckCircle2, 
  Layers,
  ArrowRight
} from 'lucide-react';

export const VoiceRecorderModal: React.FC = () => {
  const { 
    isRecordModalOpen, 
    setIsRecordModalOpen, 
    uploadAudioFile, 
    submitVoiceTranscript,
    isProcessingSpeech 
  } = useAssistant();

  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isRecordModalOpen) return null;

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    await uploadAudioFile(selectedFile);
    setSelectedFile(null);
    setIsRecordModalOpen(false);
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    await submitVoiceTranscript(textInput);
    setTextInput('');
    setIsRecordModalOpen(false);
  };

  const demoVoiceNotes = [
    {
      title: "Invoice OCR & Finance Automation",
      text: "Hey assistant, let's automate our supplier invoice processing. When billing emails arrive, parse all line items, dates, and VAT amounts, and append them straight into our Google Sheet ledger."
    },
    {
      title: "Weekly Competitor Scraper",
      text: "Set up a scheduled web scraper on Sunday mornings that checks competitor pricing tiers, analyzes changelogs, and sends me an executive digest."
    },
    {
      title: "Executive Calendar & Follow-up Email",
      text: "Book a strategy sync with Sarah Chen next Tuesday at 2:00 PM to review Q3 growth metrics, and draft a follow-up email confirming our agenda."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-5 animate-fadeIn text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-brand-500/20 text-brand-300 rounded-lg">
              <FileAudio className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">Voice Note & Task Ingestion Hub</h2>
          </div>
          <button
            onClick={() => setIsRecordModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File Drag & Drop */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-brand-500/60 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition space-y-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
          />

          <Upload className="w-8 h-8 text-brand-400 mx-auto animate-bounce" />
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {selectedFile ? selectedFile.name : 'Upload Audio Note or Voice Recording'}
            </p>
            <p className="text-xs text-slate-400">
              Supports .mp3, .m4a, .wav, .webm, .ogg (up to 50MB)
            </p>
          </div>
        </div>

        {selectedFile && (
          <div className="flex justify-end">
            <button
              onClick={handleFileUpload}
              disabled={isProcessingSpeech}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-slate-950 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessingSpeech ? 'Processing Audio...' : 'Transcribe & Extract Tasks'}</span>
            </button>
          </div>
        )}

        {/* Direct Text / Speech Fallback Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400">Or Type / Dictate Voice Transcript:</label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={3}
            placeholder="e.g. Schedule strategy sync with David next Tuesday at 2pm and draft an email to Sarah..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
          <div className="flex justify-end">
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || isProcessingSpeech}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-500 to-teal-500 text-slate-950 transition disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Process Transcript</span>
            </button>
          </div>
        </div>

        {/* Demo Preset Voice Notes */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Test Preset Demo Notes:</p>
          <div className="space-y-1.5">
            {demoVoiceNotes.map((demo, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  setTextInput(demo.text);
                }}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 hover:border-brand-500/40 cursor-pointer transition text-xs flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-200">{demo.title}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{demo.text}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
