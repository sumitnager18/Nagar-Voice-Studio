import React, { useEffect, useState } from 'react';
import {
  Settings,
  BookA,
  Cpu,
  Sliders,
  Shield,
  Activity,
  Plus,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  Radio,
  Dna,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { PronunciationEntry, SupportedLanguage } from '../../types/nlp';
import { AppSettings } from '../../services/storage/LocalDatabase';
import { VoiceLibraryRepository } from '../../services/tts/VoiceLibraryRepository';

interface SettingsScreenProps {
  settings: AppSettings;
  pronunciationEntries: PronunciationEntry[];
  onUpdateSettings: (newSettings: AppSettings) => void;
  onAddPronunciation: (entry: Omit<PronunciationEntry, 'id'>) => void;
  onDeletePronunciation: (id: string) => void;
  onTogglePronunciation: (id: string) => void;
  onImportPronunciation: (jsonStr: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  pronunciationEntries,
  onUpdateSettings,
  onAddPronunciation,
  onDeletePronunciation,
  onTogglePronunciation,
  onImportPronunciation,
}) => {
  const [activeTab, setActiveTab] = useState<'nlp' | 'models' | 'audio' | 'privacy' | 'diagnostics'>('nlp');

  // Add pronunciation entry form state
  const [newSource, setNewSource] = useState('');
  const [newSpoken, setNewSpoken] = useState('');
  const [newIpa, setNewIpa] = useState('');
  const [newCategory, setNewCategory] = useState<'technical' | 'acronym' | 'brand' | 'phonetic'>('technical');

  // Diagnostics state
  const [healthData, setHealthData] = useState<any>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Gemini Connection Test state (Section 36)
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);
  const [isRunningConnectionTest, setIsRunningConnectionTest] = useState(false);

  // Custom Voice Health state (Section 37)
  const [voiceHealthResults, setVoiceHealthResults] = useState<Record<string, { status: string; error?: string }>>({});
  const [isCheckingVoiceHealth, setIsCheckingVoiceHealth] = useState(false);

  const fetchHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (err) {
      console.error('Health fetch failed:', err);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const runGeminiConnectionTest = async () => {
    setIsRunningConnectionTest(true);
    try {
      const res = await fetch('/api/health/gemini-test');
      const data = await res.json();
      setConnectionTestResult(data);
    } catch (err: any) {
      setConnectionTestResult({
        status: 'error',
        error: err.message || 'Connection test failed to contact server',
      });
    } finally {
      setIsRunningConnectionTest(false);
    }
  };

  const runVoiceHealthTest = async () => {
    setIsCheckingVoiceHealth(true);
    const voices = VoiceLibraryRepository.getVoices().filter(
      (v) => v.type === 'designed' || v.type === 'replicated' || v.providerVoiceId.startsWith('voice_')
    );
    const results: Record<string, { status: string; error?: string }> = {};

    for (const v of voices) {
      try {
        const res = await fetch(`/api/voices/${v.providerVoiceId}/health`);
        if (res.ok) {
          const data = await res.json();
          results[v.providerVoiceId] = { status: data.status, error: data.error };
        } else {
          results[v.providerVoiceId] = { status: 'unavailable', error: `HTTP ${res.status}` };
        }
      } catch (err: any) {
        results[v.providerVoiceId] = { status: 'unavailable', error: err.message };
      }
    }

    setVoiceHealthResults(results);
    setIsCheckingVoiceHealth(false);
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleAddNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.trim() || !newSpoken.trim()) return;
    onAddPronunciation({
      sourceText: newSource.trim(),
      spokenAs: newSpoken.trim(),
      ipa: newIpa.trim() || undefined,
      category: newCategory,
      scope: 'global',
      enabled: true,
      notes: 'User defined rule in Settings',
    });
    setNewSource('');
    setNewSpoken('');
    setNewIpa('');
  };

  const handleExportDictionary = () => {
    const jsonStr = JSON.stringify(pronunciationEntries, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NagarVoice_PronunciationDictionary_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="border-b border-[#23252d] pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Studio Settings & Production Engine</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Manage pronunciation dictionary, official Gemini 3.8 models, audio mastering defaults, and real API health
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#20222a] pb-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('nlp')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'nlp' ? 'bg-amber-500 text-black font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookA className="w-3.5 h-3.5" />
          <span>Pronunciation Dictionary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('models')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'models' ? 'bg-amber-500 text-black font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Gemini 3.8 Models</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audio')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'audio' ? 'bg-amber-500 text-black font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Mastering & Formats</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'privacy' ? 'bg-amber-500 text-black font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy & Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diagnostics')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'diagnostics' ? 'bg-amber-500 text-black font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>API & Voice Health</span>
        </button>
      </div>

      {/* Tab 1: Pronunciation Dictionary */}
      {activeTab === 'nlp' && (
        <div className="space-y-4 text-xs">
          {/* Add Entry Form */}
          <div className="bg-[#15161b] border border-[#26282e] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Add Custom Pronunciation Rule</h3>
            <form onSubmit={handleAddNewRule} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Source Word / Acronym</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="e.g. ComputerGuruHub, SQL"
                  className="w-full bg-[#101115] border border-[#2b2d35] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Spoken Replacement</label>
                <input
                  type="text"
                  value={newSpoken}
                  onChange={(e) => setNewSpoken(e.target.value)}
                  placeholder="e.g. कम्प्यूटर गुरु हब, सीक्वेल"
                  className="w-full bg-[#101115] border border-[#2b2d35] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#101115] border border-[#2b2d35] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="technical">Technical Acronym</option>
                  <option value="brand">Brand / YouTube Name</option>
                  <option value="phonetic">Phonetic Correction</option>
                  <option value="acronym">General Acronym</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>
            </form>
          </div>

          {/* Dictionary Table */}
          <div className="bg-[#15161b] border border-[#26282e] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                Active Hierarchical Rules ({pronunciationEntries.length})
              </span>
              <button
                type="button"
                onClick={handleExportDictionary}
                className="px-2.5 py-1 rounded bg-[#20222a] hover:bg-[#2b2d38] text-slate-300 text-xs flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Export JSON</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#252830] text-slate-400 font-mono text-[11px]">
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Original Token</th>
                    <th className="py-2 px-3">Spoken Output</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Scope</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2128]">
                  {pronunciationEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#1a1c22]">
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={entry.enabled}
                          onChange={() => onTogglePronunciation(entry.id)}
                          className="accent-amber-500 rounded"
                        />
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-100 font-mono">{entry.sourceText}</td>
                      <td className="py-2 px-3 text-amber-300 font-mono">{entry.spokenAs}</td>
                      <td className="py-2 px-3 text-slate-400">{entry.category || 'general'}</td>
                      <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{entry.scope}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => onDeletePronunciation(entry.id)}
                          className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Gemini Models */}
      {activeTab === 'models' && (
        <div className="space-y-4 text-xs">
          <div className="bg-[#15161b] border border-[#26282e] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Official Google Gemini 3.8 Production Models</h3>
            <p className="text-slate-400 leading-relaxed">
              The studio strictly employs the current production TTS models via the secure server-side SDK:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-lg bg-[#181a20] border border-[#252830] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-400 font-mono text-sm">gemini-3.8-flash-tts</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Flagship Audio
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Flagship text-to-speech engine. Powers Voice Design, custom promptable persona synthesis, dual-speaker dialogues, and high-fidelity style direction.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#181a20] border border-[#252830] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 font-mono text-sm">gemini-3.8-flash-lite-tts</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    High Throughput
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  High-efficiency, cost-optimized synthesis model. Ideal for high-throughput batch generation of long script segments and quick previews.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Audio & Mastering Defaults */}
      {activeTab === 'audio' && (
        <div className="bg-[#15161b] border border-[#26282e] rounded-xl p-4 space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-slate-200">Mastering & Output Encoding Standards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Export Container</label>
              <select
                value={settings.exportFormat}
                onChange={(e) => onUpdateSettings({ ...settings, exportFormat: e.target.value as any })}
                className="w-full bg-[#111216] border border-[#272930] rounded px-3 py-2 text-slate-200"
              >
                <option value="WAV">WAV (Canonical 16-bit Lossless)</option>
                <option value="MP3">MP3 (True LAME Engine 192/320 kbps)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Canonical Sample Rate</label>
              <select
                value={settings.exportSampleRate}
                onChange={(e) => onUpdateSettings({ ...settings, exportSampleRate: parseInt(e.target.value, 10) as any })}
                className="w-full bg-[#111216] border border-[#272930] rounded px-3 py-2 text-slate-200 font-mono"
              >
                <option value={24000}>24000 Hz (Gemini Native Rate)</option>
                <option value={44100}>44100 Hz (CD Audio Quality)</option>
                <option value={48000}>48000 Hz (Broadcast Video Standard)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Privacy & Security */}
      {activeTab === 'privacy' && (
        <div className="bg-[#15161b] border border-[#26282e] rounded-xl p-4 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Security & Ethical Policy</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#181a20] border border-[#282b35] text-slate-300 leading-relaxed space-y-2">
            <p>
              <strong className="text-amber-300">Server-Side Key Isolation (Section 34):</strong> All Gemini API calls execute strictly through server-side endpoints. Secrets are never exposed to browser bundles or exported project packages.
            </p>
            <p>
              <strong className="text-amber-300">Ethical Attribution (Section 39):</strong> Reference targets (like Ian Cartwell) are strictly designated descriptive references. The application does not scrape proprietary voice models or claim false identity.
            </p>
          </div>
        </div>
      )}

      {/* Tab 5: Real API & Voice Health (Sections 36, 37) */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-4 text-xs">
          {/* Section 36: Gemini Connection Test */}
          <div className="bg-[#15161b] border border-[#26282e] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Gemini Connection Test</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Performs real authenticated API operations against Google Gemini endpoints (Section 36).
                </p>
              </div>

              <button
                type="button"
                disabled={isRunningConnectionTest}
                onClick={runGeminiConnectionTest}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isRunningConnectionTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" />
                    <span>Run Connection Test</span>
                  </>
                )}
              </button>
            </div>

            {connectionTestResult && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {/* 1. Credential Configured */}
                <div className={`p-3 rounded-lg border ${
                  connectionTestResult.credentialConfigured
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">1. Credential</div>
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    {connectionTestResult.credentialConfigured ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{connectionTestResult.credentialConfigured ? 'Configured' : 'Missing Key'}</span>
                  </div>
                </div>

                {/* 2. API Reachable */}
                <div className={`p-3 rounded-lg border ${
                  connectionTestResult.apiReachable
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">2. API Reachable</div>
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    {connectionTestResult.apiReachable ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{connectionTestResult.apiReachable ? 'Reachable' : 'Unreachable'}</span>
                  </div>
                </div>

                {/* 3. TTS Model Available */}
                <div className={`p-3 rounded-lg border ${
                  connectionTestResult.ttsModelAvailable
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">3. TTS Model</div>
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    {connectionTestResult.ttsModelAvailable ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{connectionTestResult.ttsModelAvailable ? 'Available' : 'Unavailable'}</span>
                  </div>
                </div>

                {/* 4. Voices Endpoint Available */}
                <div className={`p-3 rounded-lg border ${
                  connectionTestResult.voicesEndpointAvailable
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">4. Voices Endpoint</div>
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    {connectionTestResult.voicesEndpointAvailable ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{connectionTestResult.voicesEndpointAvailable ? `${connectionTestResult.voicesCount} Voices` : 'Unavailable'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 37: Voice Health For Custom Voices */}
          <div className="bg-[#15161b] border border-[#26282e] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Custom Voice Health Verification</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Verifies each custom voice exists on Gemini and is usable for speech synthesis (Section 37).
                </p>
              </div>

              <button
                type="button"
                disabled={isCheckingVoiceHealth}
                onClick={runVoiceHealthTest}
                className="px-3 py-1.5 rounded-lg bg-[#20222b] hover:bg-[#2b2e3b] text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isCheckingVoiceHealth ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <span>Test Custom Voices</span>
                )}
              </button>
            </div>

            {Object.keys(voiceHealthResults).length > 0 ? (
              <div className="space-y-2 pt-1">
                {Object.entries(voiceHealthResults).map(([vid, res]) => (
                  <div
                    key={vid}
                    className="p-2.5 rounded-lg bg-[#111216] border border-[#252731] flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="text-slate-300 font-semibold">{vid}</span>
                      {res.error && <p className="text-[10px] text-rose-400 mt-0.5 font-sans">{res.error}</p>}
                    </div>
                    <span className={res.status === 'available' ? 'text-emerald-400' : 'text-rose-400'}>
                      {res.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">Click above to verify custom voice accessibility and TTS status.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
