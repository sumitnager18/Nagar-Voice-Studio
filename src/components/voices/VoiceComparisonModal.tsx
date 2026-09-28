import React, { useState } from 'react';
import { X, GitCompare, Play, Pause, Check, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { Voice } from '../../types/tts';
import { AudioPlayerManager } from '../../services/audio/AudioPlayerManager';

interface VoiceComparisonModalProps {
  voices: Voice[];
  isOpen: boolean;
  onClose: () => void;
  onSelectWinningVoice?: (voice: Voice) => void;
}

export const VoiceComparisonModal: React.FC<VoiceComparisonModalProps> = ({
  voices,
  isOpen,
  onClose,
  onSelectWinningVoice,
}) => {
  if (!isOpen) return null;

  const [compareMode, setCompareMode] = useState<'AB' | 'MATRIX'>('AB');
  const [testText, setTestText] = useState(
    'Welcome to Nagar Voice Studio. Today we are exploring how artificial intelligence is changing the way we learn.'
  );

  // Default Voice A: Ian Cartwell Production Target if present, else first voice
  const defaultVoiceA = voices.find((v) => v.name.includes('Ian Cartwell') && v.type === 'designed') || voices[0];
  const defaultVoiceB = voices.find((v) => v.id !== defaultVoiceA?.id && v.status === 'available') || voices[1] || voices[0];

  const [voiceAId, setVoiceAId] = useState(defaultVoiceA?.id || '');
  const [voiceBId, setVoiceBId] = useState(defaultVoiceB?.id || '');

  // 4-Voice Matrix Selection (A, B, C, D)
  const [matrixVoiceIds, setMatrixVoiceIds] = useState<string[]>([
    defaultVoiceA?.id || '',
    defaultVoiceB?.id || '',
    voices[2]?.id || '',
    voices[3]?.id || '',
  ].filter(Boolean));

  // Audio caches
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [generatingIds, setGeneratingIds] = useState<Record<string, boolean>>({});
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const player = AudioPlayerManager.getInstance();

  const handleGenerateSample = async (voice: Voice) => {
    if (voice.status === 'reference_only') {
      setGenerationError(`${voice.name} is a descriptive reference target only and cannot be directly synthesized without authorized reference material.`);
      return;
    }

    setGenerationError(null);
    setGeneratingIds((prev) => ({ ...prev, [voice.id]: true }));
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceId: voice.providerVoiceId || voice.id,
          model: 'gemini-3.8-flash-tts',
          style: voice.description,
          language: voice.languageCode || voice.language,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Generation failed for ${voice.name}`);
      }
      const data = await res.json();
      const url = `data:audio/wav;base64,${data.audioBase64}`;
      setAudioUrls((prev) => ({ ...prev, [voice.id]: url }));
    } catch (err: any) {
      console.error('Sample generation failed:', err);
      setGenerationError(err?.message || `Failed to synthesize audio for ${voice.name}`);
    } finally {
      setGeneratingIds((prev) => ({ ...prev, [voice.id]: false }));
    }
  };

  const handleGenerateAll = async () => {
    const targetVoices = compareMode === 'AB'
      ? [voiceA, voiceB].filter(Boolean) as Voice[]
      : matrixVoiceIds.map((id) => voices.find((v) => v.id === id)).filter(Boolean) as Voice[];

    for (const v of targetVoices) {
      if (v.status !== 'reference_only') {
        await handleGenerateSample(v);
      }
    }
  };

  const handlePlayVoice = async (voiceId: string) => {
    const url = audioUrls[voiceId];
    if (!url) return;

    if (playingVoiceId === voiceId) {
      player.pause();
      setPlayingVoiceId(null);
    } else {
      await player.loadUrl(url);
      await player.play();
      setPlayingVoiceId(voiceId);
      player.subscribeState((st) => {
        if (st === 'stopped') setPlayingVoiceId(null);
      });
    }
  };

  const voiceA = voices.find((v) => v.id === voiceAId) || defaultVoiceA;
  const voiceB = voices.find((v) => v.id === voiceBId) || defaultVoiceB;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#14151b] border border-[#272932] rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242630] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Acoustic Voice Comparison & A/B Evaluation
              </h3>
              <p className="text-xs text-slate-400">
                Compare timbre, pacing, and delivery on identical text. No fabricated similarity percentages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 rounded-lg bg-[#1f2028] border border-[#2d303b] text-xs">
              <button
                type="button"
                onClick={() => setCompareMode('AB')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  compareMode === 'AB' ? 'bg-amber-500 text-black font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                A/B Mode
              </button>
              <button
                type="button"
                onClick={() => setCompareMode('MATRIX')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  compareMode === 'MATRIX' ? 'bg-amber-500 text-black font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                A / B / C / D (4-Way)
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#20222a] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Test Script Prompt */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Identical Test Script</label>
            <button
              type="button"
              onClick={handleGenerateAll}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
            >
              Generate All Audio
            </button>
          </div>
          <textarea
            rows={2}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0e0f14] border border-[#2b2d37] text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500/60 leading-relaxed"
          />
        </div>

        {generationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{generationError}</span>
          </div>
        )}

        {/* Comparison Render */}
        {compareMode === 'AB' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slot A: Ian Cartwell Production Target */}
            <div className="p-4 rounded-xl bg-[#181921] border border-[#2b2e3b] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    VOICE A
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {voiceA?.providerVoiceId}
                  </span>
                </div>

                <select
                  value={voiceAId}
                  onChange={(e) => setVoiceAId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0e0f14] border border-[#2f3240] text-xs text-slate-200 mb-2 font-medium"
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.type})
                    </option>
                  ))}
                </select>

                <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                  {voiceA?.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#262833]">
                {audioUrls[voiceA?.id || ''] ? (
                  <button
                    type="button"
                    onClick={() => handlePlayVoice(voiceA!.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {playingVoiceId === voiceA?.id ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>A Play</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={generatingIds[voiceA?.id || ''] || voiceA?.status === 'reference_only'}
                    onClick={() => voiceA && handleGenerateSample(voiceA)}
                    className="px-3 py-1.5 rounded-lg bg-[#242632] hover:bg-[#2e3140] text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {generatingIds[voiceA?.id || ''] ? 'Generating...' : 'Synthesize A'}
                  </button>
                )}

                {onSelectWinningVoice && voiceA && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectWinningVoice(voiceA);
                      onClose();
                    }}
                    className="text-[11px] text-slate-400 hover:text-amber-400 font-medium"
                  >
                    Select as Winner
                  </button>
                )}
              </div>
            </div>

            {/* Slot B: Alternative Voice */}
            <div className="p-4 rounded-xl bg-[#181921] border border-[#2b2e3b] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    VOICE B
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {voiceB?.providerVoiceId}
                  </span>
                </div>

                <select
                  value={voiceBId}
                  onChange={(e) => setVoiceBId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0e0f14] border border-[#2f3240] text-xs text-slate-200 mb-2 font-medium"
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.type})
                    </option>
                  ))}
                </select>

                <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                  {voiceB?.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#262833]">
                {audioUrls[voiceB?.id || ''] ? (
                  <button
                    type="button"
                    onClick={() => handlePlayVoice(voiceB!.id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {playingVoiceId === voiceB?.id ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>B Play</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={generatingIds[voiceB?.id || ''] || voiceB?.status === 'reference_only'}
                    onClick={() => voiceB && handleGenerateSample(voiceB)}
                    className="px-3 py-1.5 rounded-lg bg-[#242632] hover:bg-[#2e3140] text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {generatingIds[voiceB?.id || ''] ? 'Generating...' : 'Synthesize B'}
                  </button>
                )}

                {onSelectWinningVoice && voiceB && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectWinningVoice(voiceB);
                      onClose();
                    }}
                    className="text-[11px] text-slate-400 hover:text-blue-400 font-medium"
                  >
                    Select as Winner
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* 4-way Matrix Comparison (Section 40) */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {matrixVoiceIds.slice(0, 4).map((vid, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx];
              const voice = voices.find((v) => v.id === vid) || voices[idx];
              const hasAudio = Boolean(audioUrls[voice?.id || '']);

              return (
                <div key={idx} className="p-3.5 rounded-xl bg-[#181921] border border-[#2b2e3b] flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                        VOICE {letter}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                        {voice?.providerVoiceId}
                      </span>
                    </div>

                    <select
                      value={voice?.id || ''}
                      onChange={(e) => {
                        const newIds = [...matrixVoiceIds];
                        newIds[idx] = e.target.value;
                        setMatrixVoiceIds(newIds);
                      }}
                      className="w-full px-2 py-1 rounded bg-[#0e0f14] border border-[#2f3240] text-xs text-slate-200 mb-1"
                    >
                      {voices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.type})
                        </option>
                      ))}
                    </select>

                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {voice?.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-[#252733]">
                    {hasAudio ? (
                      <button
                        type="button"
                        onClick={() => handlePlayVoice(voice!.id)}
                        className="px-2.5 py-1 rounded bg-amber-500 text-black font-semibold text-xs flex items-center gap-1"
                      >
                        {playingVoiceId === voice?.id ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                        <span>{letter} Play</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={generatingIds[voice?.id || ''] || voice?.status === 'reference_only'}
                        onClick={() => voice && handleGenerateSample(voice)}
                        className="px-2.5 py-1 rounded bg-[#242632] hover:bg-[#2e3140] text-slate-300 text-[11px] disabled:opacity-50"
                      >
                        {generatingIds[voice?.id || ''] ? 'Generating...' : `Synthesize ${letter}`}
                      </button>
                    )}

                    {onSelectWinningVoice && voice && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectWinningVoice(voice);
                          onClose();
                        }}
                        className="text-[10px] text-slate-400 hover:text-amber-400"
                      >
                        Choose {letter}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
