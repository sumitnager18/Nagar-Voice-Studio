import React, { useState } from 'react';
import { Play, Pause, Star, Dna, AlertCircle, CheckCircle2, Shield, Radio, Sparkles } from 'lucide-react';
import { Voice } from '../../types/tts';
import { AudioPlayerManager } from '../../services/audio/AudioPlayerManager';

interface VoiceCardProps {
  voice: Voice;
  isSelected?: boolean;
  onSelect?: (voice: Voice) => void;
  onToggleFavorite?: (voiceId: string) => void;
  onOpenDna?: (voice: Voice) => void;
  onPreview?: (voice: Voice) => Promise<string | undefined>;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  isSelected,
  onSelect,
  onToggleFavorite,
  onOpenDna,
  onPreview,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const player = AudioPlayerManager.getInstance();

  const handlePlayPreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoadingPreview(true);
    try {
      if (voice.sampleAudio) {
        const audioUrl = voice.sampleAudio.startsWith('data:')
          ? voice.sampleAudio
          : `data:audio/wav;base64,${voice.sampleAudio}`;
        await player.loadUrl(audioUrl);
        await player.play();
        setIsPlaying(true);
        player.subscribeState((state) => {
          if (state === 'stopped') setIsPlaying(false);
        });
      } else if (onPreview) {
        const audioUrl = await onPreview(voice);
        if (audioUrl) {
          await player.loadUrl(audioUrl);
          await player.play();
          setIsPlaying(true);
          player.subscribeState((state) => {
            if (state === 'stopped') setIsPlaying(false);
          });
        }
      }
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Determine label states (Section 44 & 45)
  const isLiveGoogle = voice.metadata?.liveGoogleVoice || (voice.provider === 'gemini' && voice.type === 'extended');
  const isReference = voice.type === 'reference' || voice.status === 'reference_only';
  const isDesigned = voice.type === 'designed';
  const isReplicated = voice.type === 'replicated';
  const isUnavailable = voice.status === 'unavailable';

  // Provider display name
  const providerLabel = voice.provider === 'gemini'
    ? 'Google Gemini'
    : voice.provider === 'elevenlabs'
    ? 'ElevenLabs'
    : voice.provider === 'clipchamp_ref'
    ? 'Clipchamp (Ref)'
    : voice.provider === 'fish_audio_ref'
    ? 'Fish Audio (Ref)'
    : 'Local Offline';

  return (
    <div
      onClick={() => onSelect && onSelect(voice)}
      className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between transition-all cursor-pointer select-none relative group ${
        isSelected
          ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-950/20'
          : 'bg-[#16171d] hover:bg-[#1c1d24] border-[#25272e] hover:border-[#31333d]'
      }`}
    >
      {/* Top Header: Status Badges, Provider and Actions */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Status Labels (Section 44) */}
            {isUnavailable ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wide uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                UNAVAILABLE
              </span>
            ) : isReference ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wide uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                REFERENCE
              </span>
            ) : isDesigned ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DESIGNED
              </span>
            ) : isReplicated ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wide uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                REPLICATED
              </span>
            ) : isLiveGoogle ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wide uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                LIVE
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                LOCAL
              </span>
            )}

            <span className="text-[10px] text-slate-400 font-mono">
              {providerLabel}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(voice.id);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  voice.favorite
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Favorite"
              >
                <Star className={`w-3.5 h-3.5 ${voice.favorite ? 'fill-current' : ''}`} />
              </button>
            )}

            <button
              onClick={handlePlayPreview}
              disabled={isLoadingPreview || isUnavailable}
              className={`p-1.5 rounded-lg transition-colors ${
                isUnavailable
                  ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  : 'bg-[#22242b] hover:bg-[#2c2f39] text-amber-400 hover:text-amber-300'
              }`}
              title={isPlaying ? 'Pause preview' : 'Play preview'}
            >
              {isLoadingPreview ? (
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
          </div>
        </div>

        {/* Voice Name */}
        <div className="flex items-center gap-1.5">
          <h4 className="font-semibold text-slate-100 text-sm truncate group-hover:text-amber-300 transition-colors">
            {voice.name}
          </h4>
          {isSelected && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
              ✓
            </span>
          )}
        </div>

        {/* Section 45: Provider, Voice ID, Status line */}
        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="truncate max-w-[170px]" title={voice.providerVoiceId}>
            ID: <span className="text-slate-300">{voice.providerVoiceId}</span>
          </span>
          <span className={
            voice.status === 'available'
              ? 'text-emerald-400'
              : voice.status === 'reference_only'
              ? 'text-purple-400'
              : 'text-rose-400'
          }>
            {voice.status === 'available' ? 'Available' : voice.status === 'reference_only' ? 'Reference only' : 'Unavailable'}
          </span>
        </div>

        {/* Description / Legal Notice */}
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-2 mb-2">
          {voice.description}
        </p>

        {/* Ethical/Legal Disclaimers (Section 39) */}
        {voice.name.includes('Ian Cartwell') && isReference && (
          <div className="mb-2 p-1.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300">
            Reference target — not an official ElevenLabs voice.
          </div>
        )}
        {voice.name.includes('Ian Cartwell') && isDesigned && (
          <div className="mb-2 p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300">
            Original Gemini-designed production voice based on user-provided description.
          </div>
        )}
      </div>

      {/* Card Footer: Best For + DNA */}
      <div className="pt-2 border-t border-[#23252c] flex items-center justify-between text-[11px] text-slate-400 mt-1">
        <div className="truncate max-w-[180px]" title={voice.bestUse || voice.language}>
          <span className="text-slate-400">Language: </span>
          <span className="text-slate-300">{voice.languageCode || voice.language}</span>
        </div>

        {onOpenDna && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDna(voice);
            }}
            className="flex items-center gap-1 text-[10px] font-mono text-amber-400/90 hover:text-amber-300"
            title="Inspect Voice DNA"
          >
            <Dna className="w-3 h-3" />
            <span>DNA</span>
          </button>
        )}
      </div>
    </div>
  );
};
