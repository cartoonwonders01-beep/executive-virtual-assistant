import React, { useState, useEffect } from 'react';
import { nativeTts, VoiceOption } from '../services/nativeTts';
import { wakeWordService } from '../services/wakeWordService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [groqKey, setGroqKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [openAiVoice, setOpenAiVoice] = useState('nova');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voiceRate, setVoiceRate] = useState('1.02');
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [silenceDelay, setSilenceDelay] = useState('2000');
  const [maxIdleTimeout, setMaxIdleTimeout] = useState('15');
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGroqKey(localStorage.getItem('assistant_groq_api_key') || '');
      setOpenAiKey(localStorage.getItem('assistant_openai_api_key') || '');
      setOpenAiVoice(localStorage.getItem('eve_v2_openai_voice') || 'nova');
      setSelectedVoice(localStorage.getItem('eve_v2_voice_name') || '');
      setVoiceRate(localStorage.getItem('eve_v2_voice_rate') || '1.02');
      setWebhookUrl(localStorage.getItem('GOOGLE_WEBHOOK_URL') || '');
      setSilenceDelay(localStorage.getItem('eve_v2_silence_delay_ms') || '2000');
      setMaxIdleTimeout(localStorage.getItem('eve_v2_max_idle_sec') || '15');
      setWakeWordEnabled(localStorage.getItem('eve_v2_wake_word_enabled') === 'true');
      setAvailableVoices(nativeTts.getAvailableVoices());
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestSample = () => {
    setIsPlayingSample(true);
    nativeTts.speak(
      "Hello Andrew! I am Eve, your executive assistant. How can I help you today?",
      () => setIsPlayingSample(false)
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('assistant_groq_api_key', groqKey.trim());
    localStorage.setItem('assistant_openai_api_key', openAiKey.trim());
    localStorage.setItem('eve_v2_openai_voice', openAiVoice);
    localStorage.setItem('eve_v2_silence_delay_ms', silenceDelay);
    localStorage.setItem('eve_v2_max_idle_sec', maxIdleTimeout);

    nativeTts.setVoice(selectedVoice);
    nativeTts.setRate(parseFloat(voiceRate) || 1.02);
    wakeWordService.setEnabled(wakeWordEnabled);

    if (webhookUrl.trim()) {
      localStorage.setItem('GOOGLE_WEBHOOK_URL', webhookUrl.trim());
    } else {
      localStorage.removeItem('GOOGLE_WEBHOOK_URL');
    }
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-950/60">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⚙️</span> Eve v2 Settings & Privacy
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Microphone timeouts, API keys, and cloud webhooks</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 text-sm max-h-[75vh] overflow-y-auto">
          {/* Microphone Hardware & Silence Timeouts */}
          <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-4 space-y-4">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎙️</span> Hardware Microphone Auto-Release
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Silence Endpoint (Pause)</label>
                <select
                  value={silenceDelay}
                  onChange={(e) => setSilenceDelay(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="1200">1.2s — Snappy / Fast</option>
                  <option value="2000">2.0s — Balanced (Default)</option>
                  <option value="3000">3.0s — Deliberate speaker</option>
                  <option value="5000">5.0s — Long pauses</option>
                </select>
                <p className="text-[10px] text-gray-500 mt-1">Answers after this pause duration.</p>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Max Inactivity Shutoff</label>
                <select
                  value={maxIdleTimeout}
                  onChange={(e) => setMaxIdleTimeout(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="10">10 seconds</option>
                  <option value="15">15 seconds (Default)</option>
                  <option value="30">30 seconds</option>
                  <option value="60">60 seconds</option>
                </select>
                <p className="text-[10px] text-gray-500 mt-1">Kills hardware mic if idle.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-gray-200">Hands-Free "Hey Eve" Wake Word</div>
                <div className="text-[10px] text-gray-500">Passively listens offline to wake Eve without tapping.</div>
              </div>
              <input
                type="checkbox"
                checked={wakeWordEnabled}
                onChange={(e) => setWakeWordEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* AI Voice & Studio Neural Calibration */}
          <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🔊</span> AI Voice & Studio Synthesis
              </div>
              <button
                type="button"
                onClick={handleTestSample}
                disabled={isPlayingSample}
                className="px-2.5 py-1 rounded-md bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-medium border border-purple-500/30 flex items-center gap-1"
              >
                {isPlayingSample ? '🔊 Playing...' : '▶️ Test Voice'}
              </button>
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">Select Assistant Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="">✨ Auto (Best High-Fidelity Studio Voice)</option>
                {availableVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.isHighQuality ? '🌟 ' : ''}{v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 mt-1">
                Prioritizes Ava Premium, Samantha Enhanced, or Google US neural voices over legacy compact synthesizers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Speaking Speed</label>
                <select
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="0.90">0.9x — Calm / Measured</option>
                  <option value="1.00">1.0x — Natural Standard</option>
                  <option value="1.05">1.05x — Snappy Executive (Default)</option>
                  <option value="1.15">1.15x — Fast Information Density</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">OpenAI Studio Voice (Optional)</label>
                <select
                  value={openAiVoice}
                  onChange={(e) => setOpenAiVoice(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="nova">Nova (Expressive Conversational Female)</option>
                  <option value="alloy">Alloy (Balanced & Crisp)</option>
                  <option value="shimmer">Shimmer (Clear & Warm Female)</option>
                  <option value="echo">Echo (Executive Male)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                OpenAI API Key (Optional — Studio Neural TTS)
              </label>
              <input
                type="password"
                value={openAiKey}
                onChange={(e) => setOpenAiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                If provided, Eve uses OpenAI's ultra-realistic Studio TTS (tts-1). Leave empty to use local neural voices for 0ms latency and zero API cost.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Groq API Key (Whisper & LLaMA 3.3)
            </label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-gray-500 mt-1.5">
              Required for fast Whisper voice verification and LLaMA 3.3 70B cognitive reasoning.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Google Apps Script Webhook URL (Relay Meeting Scribe)
            </label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-gray-500 mt-1.5">
              Target for offloading meeting audio and full transcripts to Google Drive & Sheets.
            </p>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-emerald-300 text-xs text-center font-medium">
              ✓ Settings saved & microphone timeouts updated!
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
