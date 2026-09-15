import React, { useState, useEffect } from 'react';
import { executiveProfile, ExecutiveProfileData, StagedProfileUpdate } from '../brain/executiveProfile';
import { eveVectorStore } from '../brain/eveVectorStore';
import { EntityGraphExplorer } from './EntityGraphExplorer';

interface MemoryVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryVaultModal: React.FC<MemoryVaultModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'facts' | 'graph'>('facts');
  const [profile, setProfile] = useState<ExecutiveProfileData>(executiveProfile.getProfile());
  const [pendingUpdates, setPendingUpdates] = useState<StagedProfileUpdate[]>([]);
  const [memoryCount, setMemoryCount] = useState<number>(0);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [category, setCategory] = useState<'family' | 'preferences' | 'active_projects' | 'key_facts'>('key_facts');

  const refreshState = () => {
    setProfile(executiveProfile.getProfile());
    setPendingUpdates(executiveProfile.getPendingUpdates());
    setMemoryCount(eveVectorStore.getMemoriesCount());
  };

  useEffect(() => {
    if (isOpen) {
      refreshState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    executiveProfile.updateField(category, newKey, newValue);
    refreshState();
    setNewKey('');
    setNewValue('');
  };

  const handleDelete = (cat: 'family' | 'preferences' | 'active_projects' | 'key_facts', key: string) => {
    executiveProfile.deleteField(cat, key);
    refreshState();
  };

  const handleApprove = (id: string) => {
    executiveProfile.approveUpdate(id);
    refreshState();
  };

  const handleReject = (id: string) => {
    executiveProfile.rejectUpdate(id);
    refreshState();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-950/60">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🧠</span> Executive Memory Vault
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setActiveTab('facts')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'facts' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Ground Truth Facts
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'graph' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <span>🕸️</span> Relational Entity Graph
              </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {activeTab === 'graph' ? (
            <EntityGraphExplorer />
          ) : (
            <>
          {/* Add Entry Form */}
          <form onSubmit={handleAddFact} className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Teach Eve a Permanent Fact</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value as any)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300"
              >
                <option value="key_facts">Key Fact</option>
                <option value="family">Family / Circle</option>
                <option value="preferences">Preference</option>
                <option value="active_projects">Active Project</option>
              </select>
              <input 
                type="text" 
                placeholder="Topic / Key (e.g. Angelina)" 
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <input 
                type="text" 
                placeholder="Value / Details" 
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors"
            >
              Commit to Ground Truth Vault
            </button>
          </form>

          {/* Staged AI Updates (Confirmation Gate) */}
          {pendingUpdates.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛡️</span> Proposed Knowledge Updates ({pendingUpdates.length})
                </span>
                <span className="text-[10px] text-amber-300 font-mono">Taint Tracking Active</span>
              </div>
              <p className="text-xs text-gray-300">
                Eve extracted the following updates from conversation. Confirm before committing to permanent Ground Truth:
              </p>
              <div className="space-y-2">
                {pendingUpdates.map(u => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/40 p-2.5 rounded-lg border border-amber-900/40 gap-2">
                    <div className="text-xs">
                      <span className="text-amber-400 font-mono text-[10px] uppercase mr-2">[{u.category}]</span>
                      <span className="font-semibold text-gray-200">{u.key}: </span>
                      <span className="text-gray-300">{u.value}</span>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => handleApprove(u.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => handleReject(u.id)}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
                      >
                        ✕ Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Family & Circle */}
          <div>
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Family & Circle</h3>
            <div className="space-y-1.5">
              {Object.entries(profile.family).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center bg-gray-950/40 px-3 py-2 rounded-lg border border-gray-800/60">
                  <span className="font-semibold text-gray-200">{k}: <span className="font-normal text-gray-400">{v}</span></span>
                  <button onClick={() => handleDelete('family', k)} className="text-gray-500 hover:text-red-400 text-xs px-2">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Active Projects */}
          <div>
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Active Projects</h3>
            <div className="space-y-1.5">
              {Object.entries(profile.active_projects).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center bg-gray-950/40 px-3 py-2 rounded-lg border border-gray-800/60">
                  <span className="font-semibold text-gray-200">{k}: <span className="font-normal text-gray-400">{v}</span></span>
                  <button onClick={() => handleDelete('active_projects', k)} className="text-gray-500 hover:text-red-400 text-xs px-2">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Key Facts & Preferences */}
          <div>
            <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Learned Facts & Preferences</h3>
            <div className="space-y-1.5">
              {Object.entries({ ...profile.preferences, ...profile.key_facts }).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center bg-gray-950/40 px-3 py-2 rounded-lg border border-gray-800/60">
                  <span className="font-semibold text-gray-200">{k}: <span className="font-normal text-gray-400">{v}</span></span>
                  <button onClick={() => handleDelete('key_facts', k)} className="text-gray-500 hover:text-red-400 text-xs px-2">✕</button>
                </div>
              ))}
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};
