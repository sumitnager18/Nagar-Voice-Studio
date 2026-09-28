import React, { useState } from 'react';
import { Mic, Sliders, Sparkles, Volume2, ShieldCheck, Zap, Gauge, ChevronDown, Check } from 'lucide-react';
import { ModelProfileMode, Voice, VoicePreset } from '../../types/tts';
import { SupportedLanguage } from '../../types/nlp';

interface VoiceControlsPanelProps {
  voices: Voice[];
  presets: VoicePreset[];
  selectedVoiceId: string;
  selectedPresetId: string;
  selectedLanguage: SupportedLanguage;
  selectedStyle: string;
  selectedEmotion: string;
  speed: number;
  pitch: string;
  modelMode: ModelProfileMode;
  onSelectVoice: (voiceId: string) => void;
  onSelectPreset: (presetId: string) => void;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onSelectStyle: (style: string) => void;
  onSelectEmotion: (emotion: string) => void;
  onChangeSpeed: (spd: number) => void;
  onChangePitch: (pitch: string) => void;
  onChangeModelMode: (mode: ModelProfileMode) => void;
  onOpenVoiceDna?: (voiceId: string) => void;
}

const STYLE_PRESETS = [
  'Documentary',
  'Educational',
  'YouTube Narration',
  'Storytelling',
  'Mystery',
  'Horror',
  'Suspense',
  'Conversational',
  'Audiobook',
  'Serious',
  'Calm',
  'Energetic',
  'Natural',
  'Neutral',
  'Custom Style',
];

const EMOTIONS = [
  'Authoritative',
  'Calm',
  'Warm',
  'Serious',
  'Curious',
  'Suspenseful',
  'Sad',
  'Excited',
  'Hopeful',
  'Friendly',
];

const SPEED_STEPS = [0.75, 0.85, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];

export const VoiceControlsPanel: React.FC<VoiceControlsPanelProps> = ({
  voices,
  presets,
  selectedVoiceId,
  selectedPresetId,
  selectedLanguage,
  selectedStyle,
  selectedEmotion,
  speed,
  pitch,
  modelMode,
  onSelectVoice,
  onSelectPreset,
  onSelectLanguage,
  onSelectStyle,
  onSelectEmotion,
  onChangeSpeed,
  onChangePitch,
  onChangeModelMode,
  onOpenVoiceDna,
}) => {
  const [customStyleText, setCustomStyleText] = useState('');
  const [isCustomStyleOpen, setIsCustomStyleOpen] = useState(false);

  const currentVoice = voices.find((v) => v.id === selectedVoiceId) || voices[0];
  const currentPreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className="bg-[#15161b] border border-[#26282e] rounded-xl p-4 flex flex-col gap-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#24262c] pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Voice & Production Parameters
          </h3>
        </div>

        {/* Voice DNA quick inspection */}
        {currentVoice && onOpenVoiceDna && (
          <button
            onClick={() => onOpenVoiceDna(currentVoice.id)}
            className="text-[11px] text-amber-400/90 hover:text-amber-300 transition-colors flex items-center gap-1 font-mono"
          >
            <span>Inspect Voice DNA</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* 1. Production Presets (One-click workflow configuration) */}
      <div>
        <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
          <span>Production Voice Preset</span>
          <span className="text-[11px] text-slate-400 font-mono">
            {currentPreset ? currentPreset.provider : 'Custom'}
          </span>
        </label>
        <select
          value={selectedPresetId}
          onChange={(e) => onSelectPreset(e.target.value)}
          className="w-full bg-[#18191e] border border-[#2d3037] text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
        >
          <optgroup label="My Production Presets (CGH & References)">
            {presets
              .filter((p) => p.name.startsWith('CGH'))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.speed}x · {p.language})
                </option>
              ))}
          </optgroup>
          <optgroup label="Other Presets">
            {presets
              .filter((p) => !p.name.startsWith('CGH'))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </optgroup>
        </select>
        {currentPreset && (
          <p className="mt-1 text-[11px] text-slate-400 leading-snug">
            {currentPreset.notes}
          </p>
        )}
      </div>

      {/* 2. Voice Selection & Provider Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-300 mb-1 block">
            Acoustic Voice Identity
          </label>
          <select
            value={selectedVoiceId}
            onChange={(e) => onSelectVoice(e.target.value)}
            className="w-full bg-[#18191e] border border-[#2d3037] text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <optgroup label="Production Identities">
              {voices
                .filter((v) => v.metadata?.isProductionPreset || (v.type as any) === 'production_preset')
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    ★ {v.name} ({v.language})
                  </option>
                ))}
            </optgroup>
            <optgroup label="Google Prebuilt Catalog">
              {voices
                .filter((v) => v.type === 'prebuilt' || v.type === 'extended')
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · {v.gender} ({v.persona})
                  </option>
                ))}
            </optgroup>
            {voices.some((v) => v.type === 'designed' || v.type === 'replicated') && (
              <optgroup label="Custom & Replicated">
                {voices
                  .filter((v) => v.type === 'designed' || v.type === 'replicated')
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} [{v.type}]
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Language Target Mode */}
        <div>
          <label className="text-xs font-medium text-slate-300 mb-1 block">
            Language Mode
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => onSelectLanguage(e.target.value as SupportedLanguage)}
            className="w-full bg-[#18191e] border border-[#2d3037] text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="AUTO">AUTO (Automatic Detection)</option>
            <option value="HINGLISH">HINGLISH (Preserve Code-Switching)</option>
            <option value="HINDI">HINDI (Devanagari Articulation)</option>
            <option value="ENGLISH">ENGLISH (International/Indian)</option>
          </select>
        </div>
      </div>

      {/* 3. Style Engine & Emotion Engine */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-300 mb-1 block">
            Style Engine Preset
          </label>
          <select
            value={selectedStyle}
            onChange={(e) => {
              if (e.target.value === 'Custom Style') {
                setIsCustomStyleOpen(true);
              } else {
                setIsCustomStyleOpen(false);
                onSelectStyle(e.target.value);
              }
            }}
            className="w-full bg-[#18191e] border border-[#2d3037] text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            {STYLE_PRESETS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 mb-1 block">
            Emotion Engine
          </label>
          <select
            value={selectedEmotion}
            onChange={(e) => onSelectEmotion(e.target.value)}
            className="w-full bg-[#18191e] border border-[#2d3037] text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            {EMOTIONS.map((em) => (
              <option key={em} value={em}>
                {em}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Style Input Drawer */}
      {isCustomStyleOpen && (
        <div className="p-2.5 rounded-lg bg-[#18191e] border border-amber-500/30">
          <label className="text-[11px] text-amber-300 font-medium block mb-1">
            Custom Delivery Instructions (No script rewriting):
          </label>
          <input
            type="text"
            value={customStyleText}
            onChange={(e) => setCustomStyleText(e.target.value)}
            onBlur={() => {
              if (customStyleText.trim()) onSelectStyle(customStyleText.trim());
            }}
            placeholder='e.g. "Speak as a calm Hindi documentary narrator with subtle emphasis and natural pauses."'
            className="w-full bg-[#121316] border border-[#2d3037] text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
          />
        </div>
      )}

      {/* 4. Speed Pace Controls (0.75x to 2.0x) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>Speaking Pace / Speed</span>
          </label>
          <span className="text-xs font-mono font-semibold text-amber-400">
            {speed}x {speed === 1.5 ? '(CGH Standard)' : ''}
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {SPEED_STEPS.map((step) => (
            <button
              key={step}
              onClick={() => onChangeSpeed(step)}
              className={`py-1 text-xs rounded font-mono transition-all ${
                speed === step
                  ? 'bg-amber-500 text-black font-semibold shadow-sm'
                  : 'bg-[#1a1c22] hover:bg-[#22242c] text-slate-300 border border-[#262830]'
              }`}
            >
              {step}x
            </button>
          ))}
        </div>
      </div>

      {/* 5. Model Strategy & Quality Mode */}
      <div className="pt-2 border-t border-[#22242a]">
        <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Gemini Model Strategy</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {modelMode === 'MAXIMUM_QUALITY'
              ? 'gemini-3.8-flash-tts'
              : modelMode === 'FAST'
              ? 'gemini-3.8-flash-lite-tts'
              : 'Auto-Balanced'}
          </span>
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-[#121316] p-1 rounded-lg border border-[#25272e]">
          {(['BALANCED', 'MAXIMUM_QUALITY', 'FAST'] as ModelProfileMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onChangeModelMode(mode)}
              className={`py-1 px-2 rounded text-xs font-medium text-center transition-all ${
                modelMode === mode
                  ? 'bg-[#22242b] text-amber-300 shadow-sm border border-[#2d3039]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'MAXIMUM_QUALITY' ? 'Max Quality' : mode === 'BALANCED' ? 'Balanced' : 'Fast Mode'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
