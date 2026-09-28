import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Upload,
  GitCompare,
  Download,
  Star,
  Mic,
  Sliders,
  Sparkles,
  FileJson,
  RefreshCw,
  Radio,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Voice, VoiceType } from '../../types/tts';
import { VoiceCard } from './VoiceCard';
import { VoiceDNAModal } from './VoiceDNAModal';
import { VoiceDesignLabModal } from './VoiceDesignLabModal';
import { VoiceReplicationModal } from './VoiceReplicationModal';
import { VoiceComparisonModal } from './VoiceComparisonModal';
import { VoiceLibraryRepository } from '../../services/tts/VoiceLibraryRepository';

interface VoiceLibraryScreenProps {
  voices: Voice[];
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  onToggleFavorite: (voiceId: string) => void;
  onSaveNewVoice: (voice: Voice) => void;
  onRefreshLiveVoices?: () => Promise<void>;
}

type TabCategory = 'all' | 'live_google' | 'production' | 'designed' | 'replicated' | 'reference' | 'favorites';

export const VoiceLibraryScreen: React.FC<VoiceLibraryScreenProps> = ({
  voices,
  selectedVoiceId,
  onSelectVoice,
  onToggleFavorite,
  onSaveNewVoice,
  onRefreshLiveVoices,
}) => {
  const [activeTab, setActiveTab] = useState<TabCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  // Modals state
  const [dnaVoice, setDnaVoice] = useState<Voice | null>(null);
  const [isDesignOpen, setIsDesignOpen] = useState(false);
  const [designInitialMode, setDesignInitialMode] = useState<'default' | 'ian_cartwell'>('default');
  const [isReplicationOpen, setIsReplicationOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Trigger live Google voices fetch on mount if none yet
  useEffect(() => {
    const checkLiveVoices = async () => {
      const hasLiveVoices = voices.some((v) => v.type === 'extended' || v.metadata?.liveGoogleVoice);
      if (!hasLiveVoices) {
        setIsRefreshing(true);
        const res = await VoiceLibraryRepository.fetchLiveGoogleVoices();
        setIsRefreshing(false);
        if (res.liveCount > 0 && onRefreshLiveVoices) {
          await onRefreshLiveVoices();
        }
      }
    };
    checkLiveVoices();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setRefreshNotice(null);
    try {
      const res = await VoiceLibraryRepository.fetchLiveGoogleVoices();
      if (res.error) {
        setRefreshNotice(`Live refresh note: ${res.error}`);
      } else {
        setRefreshNotice(`Refreshed ${res.liveCount} live voices from Google Gemini`);
        if (onRefreshLiveVoices) await onRefreshLiveVoices();
      }
    } catch (e: any) {
      setRefreshNotice(`Refresh failed: ${e.message}`);
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setRefreshNotice(null), 4000);
    }
  };

  // Tab definitions with counts
  const tabs: Array<{ id: TabCategory; label: string; count?: number }> = [
    { id: 'all', label: 'All Voices', count: voices.length },
    {
      id: 'production',
      label: 'Production Presets',
      count: voices.filter((v) => v.metadata?.isProductionPreset || v.type === ('production_preset' as any)).length
    },
    {
      id: 'live_google',
      label: 'Live Google Voices',
      count: voices.filter((v) => v.metadata?.liveGoogleVoice || v.type === 'prebuilt' || v.type === 'extended').length
    },
    {
      id: 'designed',
      label: 'Designed Voices',
      count: voices.filter((v) => v.type === 'designed').length
    },
    {
      id: 'replicated',
      label: 'Replicated',
      count: voices.filter((v) => v.type === 'replicated').length
    },
    {
      id: 'reference',
      label: 'Reference Targets',
      count: voices.filter((v) => v.type === 'reference' || v.status === 'reference_only').length
    },
    {
      id: 'favorites',
      label: 'Favorites',
      count: voices.filter((v) => v.favorite).length
    },
  ];

  // Natural language query & filter (Section 41)
  const filteredVoices = useMemo(() => {
    return voices.filter((voice) => {
      // Tab filter
      if (activeTab === 'production' && !(voice.metadata?.isProductionPreset || (voice.type as any) === 'production_preset')) return false;
      if (activeTab === 'live_google' && !(voice.metadata?.liveGoogleVoice || voice.type === 'prebuilt' || voice.type === 'extended')) return false;
      if (activeTab === 'designed' && voice.type !== 'designed') return false;
      if (activeTab === 'replicated' && voice.type !== 'replicated') return false;
      if (activeTab === 'reference' && !(voice.type === 'reference' || voice.status === 'reference_only')) return false;
      if (activeTab === 'favorites' && !voice.favorite) return false;

      // Gender filter
      if (genderFilter !== 'ALL' && voice.gender !== genderFilter) return false;

      // Language filter
      if (languageFilter !== 'ALL') {
        const langLower = (voice.languageCode || voice.language || '').toLowerCase();
        if (!langLower.includes(languageFilter.toLowerCase())) return false;
      }

      // Natural Language Search (Section 41): searches both live provider metadata and local voice metadata
      if (searchQuery.trim()) {
        const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        const meta = voice.metadata || {};
        const searchableCorpus = [
          voice.name,
          voice.providerVoiceId,
          voice.provider,
          voice.languageCode,
          voice.language,
          voice.accent,
          voice.gender,
          voice.persona,
          voice.bestUse,
          voice.description,
          voice.type,
          meta.prompt || '',
          meta.context || '',
          meta.persona || '',
          meta.accent || '',
          meta.presetName || '',
          meta.productionPreset?.historicalIdentity || '',
          voice.dnaProfile?.timbre || '',
          voice.dnaProfile?.narrationStyle || '',
        ].join(' ').toLowerCase();

        const matchesAll = queryTerms.every((term) => searchableCorpus.includes(term));
        if (!matchesAll) return false;
      }

      return true;
    });
  }, [voices, activeTab, searchQuery, languageFilter, genderFilter]);

  const handleExportVoices = () => {
    const jsonStr = VoiceLibraryRepository.exportVoicesJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NagarVoice_VoicesCatalog_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Top Header & Lab Launchers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#23252d] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Voice Catalog & Production Profiles
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Gemini 3.8 Real Infrastructure
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real Gemini 3.8 Flash TTS voices, live Google catalog, verified production presets, and authorized replicas
          </p>
        </div>

        {/* Action Buttons: Design Lab, Replication Lab, A/B Compare, Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-[#1a1b22] hover:bg-[#252733] border border-[#2c2f3c] text-xs text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Refresh live catalog from Google Gemini API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh Google</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCompareOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#1a1b22] hover:bg-[#252733] border border-[#2c2f3c] text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5 text-amber-400" />
            <span>A/B Compare</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReplicationOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-1.5 transition-colors font-medium"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Voice Replication</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDesignInitialMode('default');
              setIsDesignOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-amber-950/20"
          >
            <WandIcon />
            <span>Voice Design Lab</span>
          </button>
        </div>
      </div>

      {refreshNotice && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{refreshNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#1f2129] scrollbar-none text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181920]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-black/20 text-black' : 'bg-[#22242c] text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filters (Section 41) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Natural Language Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Natural search: "warm Indian male documentary", "deep male narrator", "calm educational", "professional technology narrator"...'
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#14151b] border border-[#262832] text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder:text-slate-400 font-sans"
          />
        </div>

        {/* Language Filter */}
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#14151b] border border-[#262832] text-xs text-slate-300 focus:outline-none focus:border-amber-500/60"
        >
          <option value="ALL">All Languages</option>
          <option value="en">English (All variants)</option>
          <option value="hi">Hindi (hi-IN)</option>
          <option value="hinglish">Hinglish (Code-switching)</option>
        </select>

        {/* Gender Filter */}
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#14151b] border border-[#262832] text-xs text-slate-300 focus:outline-none focus:border-amber-500/60"
        >
          <option value="ALL">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="neutral">Neutral</option>
        </select>

        {/* Export Catalog */}
        <button
          type="button"
          onClick={handleExportVoices}
          className="p-2 rounded-xl bg-[#14151b] border border-[#262832] text-slate-400 hover:text-slate-200 transition-colors"
          title="Export voice catalog JSON"
        >
          <FileJson className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Voices */}
      {filteredVoices.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs border border-dashed border-[#242630] rounded-2xl flex flex-col items-center gap-2">
          <p>No voices match your search query or filter criteria.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setLanguageFilter('ALL');
              setGenderFilter('ALL');
              setActiveTab('all');
            }}
            className="text-amber-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVoices.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              isSelected={voice.id === selectedVoiceId || voice.providerVoiceId === selectedVoiceId}
              onSelect={() => onSelectVoice(voice.providerVoiceId || voice.id)}
              onToggleFavorite={onToggleFavorite}
              onOpenDna={() => setDnaVoice(voice)}
              onPreview={async (v) => {
                const res = await fetch('/api/tts/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: v.sampleText || 'Welcome to Nagar Voice Studio. This is an acoustic demonstration of the voice.',
                    voiceId: v.providerVoiceId || v.id,
                    model: 'gemini-3.8-flash-tts',
                    style: v.description,
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  return `data:audio/wav;base64,${data.audioBase64}`;
                }
                return undefined;
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {dnaVoice && (
        <VoiceDNAModal
          voice={dnaVoice}
          isOpen={Boolean(dnaVoice)}
          onClose={() => setDnaVoice(null)}
        />
      )}

      {isDesignOpen && (
        <VoiceDesignLabModal
          isOpen={isDesignOpen}
          initialMode={designInitialMode}
          onClose={() => setIsDesignOpen(false)}
          onSaveVoice={(v) => {
            onSaveNewVoice(v);
          }}
          onSelectForStudio={(v) => {
            onSelectVoice(v.providerVoiceId || v.id);
          }}
        />
      )}

      {isReplicationOpen && (
        <VoiceReplicationModal
          isOpen={isReplicationOpen}
          onClose={() => setIsReplicationOpen(false)}
          onSaveVoice={(v) => {
            onSaveNewVoice(v);
          }}
          onSelectForStudio={(v) => {
            onSelectVoice(v.providerVoiceId || v.id);
          }}
        />
      )}

      {isCompareOpen && (
        <VoiceComparisonModal
          voices={voices}
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          onSelectWinningVoice={(winner) => {
            onSelectVoice(winner.providerVoiceId || winner.id);
          }}
        />
      )}
    </div>
  );
};

function WandIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
      <path d="m14 7 3 3" />
      <path d="M5 6v4" />
      <path d="M19 14v4" />
      <path d="M10 2v2" />
      <path d="M7 8H3" />
      <path d="M21 16h-4" />
      <path d="M11 3H9" />
    </svg>
  );
}
