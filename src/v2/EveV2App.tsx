import React, { useState, useEffect, useRef } from 'react';
import { nativeSpeech } from './services/nativeSpeech';
import { whisperVerifier } from './services/whisperVerifier';
import { telemetry, TelemetryEvent } from './services/telemetryLogger';
import { intelligenceBridge } from './services/intelligenceBridge';
import { nativeTts } from './services/nativeTts';
import { mobileAudio } from './services/mobileAudio';
import { briefingEngine } from './services/briefingEngine';
import { wakeWordService } from './services/wakeWordService';
import { ActionCardView, ActionCardData } from './components/ActionCardView';
import { MemoryVaultModal } from './components/MemoryVaultModal';
import { SettingsModal } from './components/SettingsModal';
import { AmbientMiniPill } from './components/AmbientMiniPill';
import { executiveProfile } from './brain/executiveProfile';

export default function EveV2App() {
  const [transcript, setTranscript] = useState(''), [interimText, setInterimText] = useState(''), [textInput, setTextInput] = useState('');
  const [response, setResponse] = useState(''), [actionCard, setActionCard] = useState<ActionCardData | null>(null);
  const [isRecording, setIsRecording] = useState(false), [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<TelemetryEvent[]>([]), [showTelemetry, setShowTelemetry] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false), [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null), transcriptRef = useRef<string>('');

  useEffect(() => {
    const unsub = telemetry.subscribe(setEvents);
    wakeWordService.onWake(async (q) => {
      if (q && q.length > 2) {
        setTranscript(q);
        await handleProcessText(q);
      } else {
        toggleRecording();
      }
    });
    if (wakeWordService.isEnabled()) wakeWordService.start();
    return () => {
      unsub();
      wakeWordService.stop();
    };
  }, []);

  const handleUserInteraction = () => {
    mobileAudio.unlock();
  };

  const handleProcessText = async (textToProcess: string, audioBlob?: Blob, imageFrame?: string) => {
    if (!textToProcess.trim()) return;
    setIsProcessing(true);
    try {
      let isStreaming = false;
      const aiResponse = await intelligenceBridge.handleUtterance(textToProcess, audioBlob, {
        onToken: (_tok, fullAcc) => {
          isStreaming = true;
          setResponse(fullAcc);
        }
      }, imageFrame);
      setResponse(aiResponse.responseText);
      setActionCard(aiResponse.actionCard || null);
      if (!isStreaming) nativeTts.speak(aiResponse.responseText);
    } catch (err) {
      telemetry.log('error', { source: 'Processing', error: String(err) });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBriefing = async () => {
    handleUserInteraction();
    setIsProcessing(true);
    try {
      const b = await briefingEngine.generateMorningBriefing();
      setTranscript("Give me my morning briefing");
      setResponse(b.spokenBriefing);
      setActionCard({
        id: 'brief-' + Date.now(),
        type: 'briefing',
        title: 'Executive Morning Briefing',
        subtitle: b.weatherSummary,
        details: [...b.activeProjects, ...b.pendingTasks]
      });
      nativeTts.speak(b.spokenBriefing);
    } catch (e) {
      telemetry.log('error', { source: 'Briefing', error: String(e) });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = async () => {
    handleUserInteraction();

    if (isRecording) {
      nativeSpeech.stop();
      setIsRecording(false);
      
      const currentText = transcriptRef.current.trim();
      const finalVerified = await whisperVerifier.stopAndVerify(currentText);
      if (finalVerified !== currentText) {
        setTranscript(finalVerified);
      }

      if (finalVerified || currentText) {
        await handleProcessText(finalVerified || currentText);
      }
    } else {
      nativeTts.stop(); // Stop speaking if barge-in
      transcriptRef.current = '';
      setTranscript('');
      setInterimText('');
      setResponse('');
      
      await whisperVerifier.startRecording();
      
      nativeSpeech.start(
        (text, isFinal) => {
          if (isFinal) {
            transcriptRef.current = (transcriptRef.current ? transcriptRef.current + ' ' : '') + text;
            setTranscript(transcriptRef.current);
            setInterimText('');
          } else {
            setInterimText(text);
          }
        },
        // Automatic silence callback (1.8s pause after speaking)
        async () => {
          const finishedText = transcriptRef.current.trim();
          if (finishedText) {
            nativeSpeech.stop();
            setIsRecording(false);
            const finalVerified = await whisperVerifier.stopAndVerify(finishedText);
            if (finalVerified && finalVerified !== finishedText) {
              setTranscript(finalVerified);
            }
            await handleProcessText(finalVerified || finishedText);
          }
        }
      );
      setIsRecording(true);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUserInteraction();
    if (!textInput.trim() || isProcessing) return;

    const query = textInput.trim();
    setTranscript(query);
    setTextInput('');
    handleProcessText(query);
  };

  return (
    <div 
      className="flex flex-col lg:flex-row h-screen bg-gray-950 text-gray-100 font-sans select-none"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      {/* Main Interactive Assistant Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
        <header className="mb-4 pb-4 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Eve <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">v2 Core</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Native Acoustic Loop & PWA Mobile Engine</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/60 text-xs font-medium rounded border border-purple-800/60 text-purple-300 flex items-center gap-1.5 transition-colors"
              onClick={handleBriefing}
            >
              <span>🌅</span> Briefing
            </button>
            <button
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-xs font-medium rounded border border-gray-800 text-gray-300 flex items-center gap-1.5 transition-colors"
              onClick={() => setIsSettingsOpen(true)}
            >
              <span>⚙️</span> Settings
            </button>
            <button
              className="px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900/60 text-xs font-medium rounded border border-blue-800/60 text-blue-300 flex items-center gap-1.5 transition-colors relative"
              onClick={() => setIsVaultOpen(true)}
            >
              <span>🧠</span> Memory Vault
              {executiveProfile.getPendingUpdates().length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>
            <button
              className="lg:hidden px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-xs font-medium rounded border border-gray-800 text-gray-300"
              onClick={() => setShowTelemetry(!showTelemetry)}
            >
              {showTelemetry ? 'Hide Telemetry' : 'Telemetry'}
            </button>
            <button 
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-xs font-medium rounded border border-gray-800 text-gray-400 hover:text-gray-200" 
              onClick={() => window.location.search = '?v1'}
            >
              v1 Legacy
            </button>
          </div>
        </header>

        {/* Content Stream: Transcript & AI Response */}
        <main className="flex-1 flex flex-col mb-4 space-y-3 overflow-hidden">
          <div className="flex-1 bg-gray-900/70 border border-gray-800/80 rounded-xl p-4 sm:p-6 shadow-inner flex flex-col overflow-y-auto">
            <div className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">Live Transcript / Voice Input</div>
            <div className="text-lg sm:text-xl leading-relaxed text-gray-200 flex-1 whitespace-pre-wrap">
              {transcript}
              {interimText && (
                <span className="text-blue-400/80 italic ml-2">{interimText}</span>
              )}
              {!transcript && !interimText && !isRecording && (
                <span className="text-gray-600 italic">Tap Push-to-Talk or use your keyboard's microphone...</span>
              )}
            </div>
          </div>
          
          {response && (
            <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="text-blue-400 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Eve Response</span>
                {isProcessing && <span className="animate-pulse text-xs">Reasoning...</span>}
              </div>
              <div className="text-base sm:text-lg text-blue-100">{response}</div>
              {actionCard && (
                <div className="mt-3">
                  <ActionCardView card={actionCard} onComplete={() => setActionCard(null)} />
                </div>
              )}
            </div>
          )}
        </main>

        {/* Voice & Keyboard Dictation Input Controls */}
        <div className="flex flex-col items-center gap-2 pt-2">
          {/* Hardware Mic Status Badge */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wide mb-1">
            {isRecording ? (
              <span className="flex items-center gap-1.5 text-red-400 bg-red-950/40 border border-red-800/50 px-2.5 py-0.5 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Hardware Mic Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400/80 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Hardware Mic Closed & Released
              </span>
            )}
          </div>

          <button 
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full font-bold text-sm sm:text-base transition-all duration-300 shadow-xl flex items-center justify-center cursor-pointer ${isRecording ? 'bg-red-500/20 text-red-400 border-2 border-red-500 animate-pulse scale-105' : 'bg-gray-800/90 text-gray-200 hover:bg-gray-700/90 border border-gray-700 hover:scale-102'}`}
            onClick={toggleRecording}
            aria-label="Push to Talk"
          >
            {isRecording ? 'Listening...' : 'Push to Talk'}
          </button>

          {/* Gboard & Native Mobile Dictation Input Bar */}
          <form onSubmit={handleInputSubmit} className="w-full max-w-xl flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type or tap keyboard mic (Gboard / iOS)..."
              className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button type="submit" disabled={!textInput.trim() || isProcessing} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium rounded-lg text-white transition-colors">
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Telemetry Sidebar */}
      <div className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-800 p-4 sm:p-6 flex flex-col bg-gray-950 ${showTelemetry ? 'block' : 'hidden lg:flex'}`}>
        <h2 className="text-xs font-semibold mb-3 text-gray-400 uppercase tracking-widest flex items-center justify-between">
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>Telemetry Console</span>
          <span className="text-[10px] text-gray-600 font-mono">{events.length} events</span>
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] bg-black/40 rounded-lg p-3 border border-gray-900 max-h-48 lg:max-h-none">
          {events.slice().reverse().map((e, idx) => (
            <div key={idx} className="border-b border-gray-800/40 pb-1.5">
              <span className="text-gray-500">[{new Date(e.timestamp).toISOString().split('T')[1].replace('Z', '')}] </span>
              <span className="px-1 py-0.2 rounded bg-gray-800 text-blue-400 font-semibold">{e.type}</span>
              {e.payload && <div className="text-gray-400 pl-2 break-words">{typeof e.payload === 'object' ? JSON.stringify(e.payload) : String(e.payload)}</div>}
            </div>
          ))}
          {events.length === 0 && <div className="text-gray-600 italic">Awaiting telemetry...</div>}
        </div>
      </div>

      <AmbientMiniPill onQuerySubmit={(q, img) => handleProcessText(q, undefined, img)} isProcessing={isProcessing} />
      <MemoryVaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} /></div>);
}
