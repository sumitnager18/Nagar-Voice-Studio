import React, { useState } from 'react';
import { X, Sparkles, Wand2, Play, Pause, Save, Check, ShieldCheck, AlertCircle, Copy, CheckCheck } from 'lucide-react';
import { GenderPresentation, Voice } from '../../types/tts';
import { AudioPlayerManager } from '../../services/audio/AudioPlayerManager';

interface VoiceDesignLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVoice: (voice: Voice) => void;
  onSelectForStudio?: (voice: Voice) => void;
  initialMode?: 'default' | 'ian_cartwell';
}

export const VoiceDesignLabModal: React.FC<VoiceDesignLabModalProps> = ({
  isOpen,
  onClose,
  onSaveVoice,
  onSelectForStudio,
  initialMode = 'default',
}) => {
  if (!isOpen) return null;

  const IAN_CARTWELL_SUGGESTED =
    'Professional mature male narrator with a polished, articulate, warm and confident vocal presence. Medium-low register, controlled resonance, clear consonants, natural conversational pacing, restrained emotional expression, authoritative but approachable delivery, suitable for documentary narration, technology videos, educational explanations and professional YouTube voiceover. Avoid exaggerated announcer delivery. Maintain natural breaths and subtle human variation.';

  const [voiceName, setVoiceName] = useState(
    initialMode === 'ian_cartwell' ? 'Ian Cartwell Production Target — Gemini' : ''
  );
  const [description, setDescription] = useState(
    initialMode === 'ian_cartwell'
      ? IAN_CARTWELL_SUGGESTED
      : 'A mature Indian male narrator with a warm medium-low register, clear articulation, natural conversational cadence, restrained emotional expression, confident documentary delivery, excellent pronunciation of technical terminology, and a polished professional presence.'
  );
  const [language, setLanguage] = useState('en-US');
  const [gender, setGender] = useState<GenderPresentation>('male');
  const [primaryUse, setPrimaryUse] = useState('Documentary & YouTube Narration');
  const [customAcousticDescription, setCustomAcousticDescription] = useState(
    'Medium-low register, controlled resonance, clear consonants, natural conversational pacing, subtle natural breaths.'
  );

  const [isCreating, setIsCreating] = useState(false);
  const [createdVoice, setCreatedVoice] = useState<Voice | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const player = AudioPlayerManager.getInstance();

  const handleApplyIanCartwellTemplate = () => {
    setVoiceName('Ian Cartwell Production Target — Gemini');
    setDescription(IAN_CARTWELL_SUGGESTED);
    setLanguage('en-US');
    setGender('male');
    setPrimaryUse('Documentary Narration & Tech Explainers');
    setCustomAcousticDescription('Medium-low register, articulate warmth, restrained emotion, subtle human breath variation');
  };

  const handleCreateRealVoice = async () => {
    if (!voiceName.trim() || !description.trim()) {
      setError('Please provide both Voice Name and Voice Description.');
      return;
    }

    // Ethical check: do not claim official proprietary brand identity
    const lowerName = voiceName.toLowerCase();
    if (lowerName.includes('official ian cartwell') || lowerName.includes('elevenlabs ian cartwell')) {
      setError('Legal Requirement: Voice cannot be labeled "Official Ian Cartwell" or "ElevenLabs Ian Cartwell". Use "Ian Cartwell Inspired — Gemini" or "Ian Cartwell Production Target — Gemini".');
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      const res = await fetch('/api/voices/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceName: voiceName.trim(),
          language,
          gender,
          description: description.trim(),
          primaryUse: primaryUse.trim(),
          customAcousticDescription: customAcousticDescription.trim(),
          sampleText: 'Welcome to Nagar Voice Studio. Today we are exploring how artificial intelligence is changing the way we learn.',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Voice Design API failed with HTTP status ${res.status}`);
      }

      const data = await res.json();
      if (!data.providerVoiceId) {
        throw new Error('Real Gemini Voices API did not return a provider voice ID.');
      }

      const sampleUrl = data.sampleAudio ? `data:audio/wav;base64,${data.sampleAudio}` : undefined;

      const newVoice: Voice = {
        id: `voice-custom-${data.providerVoiceId}`,
        provider: 'gemini',
        providerVoiceId: data.providerVoiceId, // Real provider voice ID e.g. voice_XXXXXXXX
        name: data.displayName || voiceName.trim(),
        type: 'designed',
        languageCode: data.languageCode || language,
        gender,
        description: description.trim(),
        sampleAudio: data.sampleAudio,
        sampleAudioUrl: sampleUrl,
        favorite: true,
        status: 'available',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language,
        accent: 'Google Gemini Designed',
        persona: voiceName.trim(),
        bestUse: primaryUse,
        metadata: {
          model: data.model || 'models/gemini-3.8-flash-tts',
          prompt: data.prompt,
          expireTime: data.expireTime,
          liveGoogleVoice: true,
        },
      };

      setCreatedVoice(newVoice);
      setEditedName(newVoice.name);
      onSaveVoice(newVoice);

      if (sampleUrl) {
        await player.loadUrl(sampleUrl);
      }
    } catch (err: any) {
      console.error('Voice Design error:', err);
      setError(err?.message || 'Voice creation failed. Ensure your Gemini API credentials and network are active.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTogglePlay = async () => {
    if (!createdVoice?.sampleAudio && !createdVoice?.sampleAudioUrl) return;

    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      const url = createdVoice.sampleAudioUrl || (createdVoice.sampleAudio ? `data:audio/wav;base64,${createdVoice.sampleAudio}` : '');
      if (url) {
        await player.loadUrl(url);
        await player.play();
        setIsPlaying(true);
        player.subscribeState((st) => {
          if (st === 'stopped') setIsPlaying(false);
        });
      }
    }
  };

  const handleCopyVoiceId = () => {
    if (createdVoice?.providerVoiceId) {
      navigator.clipboard.writeText(createdVoice.providerVoiceId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSaveRenamed = () => {
    if (!createdVoice || !editedName.trim()) return;
    const updated = { ...createdVoice, name: editedName.trim(), persona: editedName.trim() };
    setCreatedVoice(updated);
    onSaveVoice(updated);
    setIsEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#14151b] border border-[#272932] rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#23252d] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Gemini 3.8 Real Voice Design Lab
              </h3>
              <p className="text-xs text-slate-400">
                Direct integration with Google Gemini <code className="text-amber-400 font-mono">voices.create()</code> API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#20222a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Template Switcher */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#1b1c24] border border-[#292b35] text-xs">
          <div>
            <div className="font-semibold text-slate-200">Production Target Template</div>
            <div className="text-[11px] text-slate-400">Load calibrated acoustic description for Ian Cartwell Production Target</div>
          </div>
          <button
            type="button"
            onClick={handleApplyIanCartwellTemplate}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-medium transition-colors"
          >
            Load Ian Cartwell Target
          </button>
        </div>

        {/* Creation Form */}
        <div className="flex flex-col gap-4 text-xs">
          {/* Voice Name */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Voice Name</label>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="e.g. Ian Cartwell Production Target — Gemini"
              className="w-full px-3 py-2 rounded-lg bg-[#0e0f14] border border-[#2b2d37] text-slate-200 focus:outline-none focus:border-amber-500/60 font-medium"
            />
          </div>

          {/* Grid: Language & Gender Presentation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0e0f14] border border-[#2b2d37] text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="en-US">English (United States) — en-US</option>
                <option value="en-GB">English (British) — en-GB</option>
                <option value="en-IN">English (India) — en-IN</option>
                <option value="hi-IN">Hindi (India) — hi-IN</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Gender Presentation</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as GenderPresentation)}
                className="w-full px-3 py-2 rounded-lg bg-[#0e0f14] border border-[#2b2d37] text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>

          {/* Primary Use */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Primary Use</label>
            <input
              type="text"
              value={primaryUse}
              onChange={(e) => setPrimaryUse(e.target.value)}
              placeholder="e.g. Documentary Narration, Tech Tutorials, YouTube Voiceover"
              className="w-full px-3 py-2 rounded-lg bg-[#0e0f14] border border-[#2b2d37] text-slate-200 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Voice Description */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Voice Description (Passed directly to Gemini Voices API)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe vocal timbre, register, pacing, and emotional expression..."
              className="w-full px-3 py-2 rounded-lg bg-[#0e0f14] border border-[#2b2d37] text-slate-200 focus:outline-none focus:border-amber-500/60 font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Custom Acoustic Description */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Custom Acoustic Description</label>
            <input
              type="text"
              value={customAcousticDescription}
              onChange={(e) => setCustomAcousticDescription(e.target.value)}
              placeholder="e.g. Medium-low register, articulate warmth, restrained emotion, subtle human breath variation"
              className="w-full px-3 py-2 rounded-lg bg-[#0e0f14] border border-[#2b2d37] text-slate-200 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Legal / Ethical Notice */}
          <div className="p-3 rounded-xl bg-[#191a22] border border-[#2a2c37] text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Ethical Voice Design Constitution:</span>
              <p className="mt-0.5 leading-relaxed">
                Original Gemini-designed production voice based on user-provided description. This creates a legitimate Google Gemini voice resource (<code className="text-amber-400 font-mono">voice_...</code>). Does NOT download proprietary data or imply endorsement by 3rd party providers.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Creation Button (Section 6) */}
          <button
            type="button"
            disabled={isCreating}
            onClick={handleCreateRealVoice}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm shadow-lg shadow-amber-950/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Creating voice...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>CREATE REAL VOICE</span>
              </>
            )}
          </button>
        </div>

        {/* Results Card (Section 6) */}
        {createdVoice && (
          <div className="p-4 rounded-xl bg-[#1a1c24] border border-emerald-500/40 text-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <Check className="w-4 h-4" />
                <span>Voice created successfully.</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                DESIGNED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#2a2d39]">
              <div>
                <span className="text-slate-400">Provider:</span>
                <span className="ml-1.5 font-semibold text-slate-200">Google Gemini</span>
              </div>
              <div>
                <span className="text-slate-400">Model:</span>
                <span className="ml-1.5 font-mono text-slate-300">gemini-3.8-flash-tts</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#111218] border border-[#272935] font-mono text-[11px]">
              <div>
                <span className="text-slate-400">Voice ID: </span>
                <span className="text-amber-400 font-semibold">{createdVoice.providerVoiceId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyVoiceId}
                className="p-1 rounded text-slate-400 hover:text-slate-200 flex items-center gap-1"
                title="Copy Voice ID"
              >
                {copiedId ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Audio Preview & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#2a2d39]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>Sample</span>
                </button>

                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="px-2 py-1 rounded bg-[#101116] border border-[#333543] text-xs text-slate-100"
                    />
                    <button
                      onClick={handleSaveRenamed}
                      className="px-2 py-1 rounded bg-amber-500/20 text-amber-300"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#22242e] text-slate-300 hover:bg-[#2c2f3c] transition-colors"
                  >
                    Rename
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onSelectForStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectForStudio(createdVoice);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-medium transition-colors"
                  >
                    Use Voice
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-[#22242e] text-slate-200 hover:bg-[#2c2f3c] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
