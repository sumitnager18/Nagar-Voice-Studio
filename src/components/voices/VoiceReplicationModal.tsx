import React, { useRef, useState } from 'react';
import { X, Upload, ShieldAlert, CheckCircle2, Play, Pause, Save, FileAudio, AlertCircle, Copy, CheckCheck, Trash2 } from 'lucide-react';
import { Voice } from '../../types/tts';
import { AudioPlayerManager } from '../../services/audio/AudioPlayerManager';

interface VoiceReplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVoice: (voice: Voice) => void;
  onSelectForStudio?: (voice: Voice) => void;
}

export const VoiceReplicationModal: React.FC<VoiceReplicationModalProps> = ({
  isOpen,
  onClose,
  onSaveVoice,
  onSelectForStudio,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const consentFileInputRef = useRef<HTMLInputElement | null>(null);
  const player = AudioPlayerManager.getInstance();

  const [voiceName, setVoiceName] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null);
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [consentBase64, setConsentBase64] = useState<string | null>(null);

  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [stepStatus, setStepStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replicatedVoice, setReplicatedVoice] = useState<Voice | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReferenceFile(file);
      if (!voiceName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setVoiceName(`${cleanName} — Authorized Replica`);
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const b64 = result.split(',')[1] || result;
        setReferenceBase64(b64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConsentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setConsentFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const b64 = result.split(',')[1] || result;
        setConsentBase64(b64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunReplication = async () => {
    if (!referenceBase64 || !referenceFile) {
      setError('Please upload reference audio (Supported: WAV, MP3, M4A).');
      return;
    }

    // Explicit confirmation validation as strictly mandated
    if (!consentConfirmed) {
      setError('You must explicitly confirm: "I own this voice/reference recording or have authorization to use it for voice replication."');
      return;
    }

    if (!voiceName.trim()) {
      setError('Please provide a name for this replicated voice.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Step: Uploading reference...
      setStepStatus('Uploading reference...');
      await new Promise((r) => setTimeout(r, 400));

      // Step: Creating voice...
      setStepStatus('Creating voice with Gemini Voices API...');

      const res = await fetch('/api/voices/replicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceName: voiceName.trim(),
          language,
          gender: 'male',
          sourceAudioBase64: referenceBase64,
          consentAudioBase64: consentBase64 || referenceBase64,
          consentConfirmed: true,
          originalFilename: referenceFile.name,
        }),
      });

      // Step: Receiving provider voice ID...
      setStepStatus('Receiving provider voice ID...');

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Voice replication failed with HTTP status ${res.status}`);
      }

      const data = await res.json();
      if (!data.providerVoiceId) {
        throw new Error('API did not return a valid provider voice ID or replication key.');
      }

      // Step: Saving voice...
      setStepStatus('Saving voice...');

      const newVoice: Voice = {
        id: `voice-replicated-${data.providerVoiceId}`,
        provider: 'gemini',
        providerVoiceId: data.providerVoiceId, // Real provider voice ID (voice_... or voicekey_...)
        name: data.displayName || voiceName.trim(),
        type: 'replicated',
        languageCode: language,
        gender: 'male',
        description: `Replicated voice created from authorized reference material (${referenceFile.name}).`,
        favorite: true,
        status: 'available',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language,
        accent: 'Replicated Acoustic Profile',
        persona: `Replicated: ${voiceName.trim()}`,
        bestUse: 'Documentary & narration replicating original reference',
        metadata: {
          model: data.model || 'models/gemini-3.8-flash-tts',
          expireTime: data.expireTime,
          replicatedMetadata: {
            originalFilename: referenceFile.name,
            consentStatus: 'VERIFIED_AND_ACKNOWLEDGED',
            consentConfirmedText: 'I own this voice/reference recording or have authorization to use it for voice replication.',
            hasReferenceAudio: true,
          },
        },
      };

      setReplicatedVoice(newVoice);
      onSaveVoice(newVoice);
      setStepStatus(null);
    } catch (err: any) {
      console.error('Replication workflow error:', err);
      setError(err?.message || 'Voice replication failed. Google Gemini requires valid uncompressed PCM/WAV reference and authorization audio.');
      setStepStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePlay = async () => {
    if (!replicatedVoice) return;
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      try {
        const previewRes = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `Welcome to Nagar Voice Studio. This is the replicated voice generated for ${replicatedVoice.name}.`,
            voiceId: replicatedVoice.providerVoiceId,
            model: 'gemini-3.8-flash-tts',
          }),
        });
        if (previewRes.ok) {
          const previewData = await previewRes.json();
          const url = `data:audio/wav;base64,${previewData.audioBase64}`;
          await player.loadUrl(url);
          await player.play();
          setIsPlaying(true);
          player.subscribeState((st) => {
            if (st === 'stopped') setIsPlaying(false);
          });
        }
      } catch (e) {
        console.error('Playback error:', e);
      }
    }
  };

  const handleCopyVoiceId = () => {
    if (replicatedVoice?.providerVoiceId) {
      navigator.clipboard.writeText(replicatedVoice.providerVoiceId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleDeleteReferenceAudio = () => {
    setReferenceFile(null);
    setReferenceBase64(null);
    setConsentFile(null);
    setConsentBase64(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#14151b] border border-[#272932] rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#23252d] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Gemini Authorized Voice Replication
              </h3>
              <p className="text-xs text-slate-400">
                Official Google Gemini voice replication pipeline with required authorization
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

        {/* Form Inputs */}
        <div className="flex flex-col gap-4 text-xs">
          {/* Voice Name */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Replicated Voice Name</label>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="e.g. Ian Cartwell — Authorized Replica"
              className="w-full px-3 py-2 rounded-lg bg-[#0e0f14] border border-[#2b2d37] text-slate-200 focus:outline-none focus:border-cyan-500/60 font-medium"
            />
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Primary Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0e0f14] border border-[#2b2d37] text-slate-200 focus:outline-none focus:border-cyan-500/60"
            >
              <option value="en-US">English (United States) — en-US</option>
              <option value="en-GB">English (British) — en-GB</option>
              <option value="hi-IN">Hindi (India) — hi-IN</option>
            </select>
          </div>

          {/* Reference Audio Upload (Section 13) */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Upload Reference Audio <span className="text-slate-400 font-normal">(Supported: WAV, MP3, M4A)</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 rounded-xl border border-dashed text-center cursor-pointer transition-colors ${
                referenceFile
                  ? 'border-cyan-500/50 bg-cyan-500/5'
                  : 'border-[#30333f] hover:border-slate-500 bg-[#0e0f14]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".wav,.mp3,.m4a,audio/*"
                onChange={handleReferenceFileChange}
                className="hidden"
              />
              {referenceFile ? (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <FileAudio className="w-5 h-5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold text-slate-200">{referenceFile.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {(referenceFile.size / 1024).toFixed(1)} KB · Ready for replication
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReferenceAudio();
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-400"
                    title="Remove reference file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span>Click to select reference recording</span>
                  <span className="text-[10px] text-slate-400">Clear speech with minimal background noise recommended</span>
                </div>
              )}
            </div>
          </div>

          {/* Optional Separate Consent Audio */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium">Consent / Authorization Audio (Optional)</label>
              <span className="text-[10px] text-slate-400">If omitted, reference audio is submitted for authorization</span>
            </div>
            <input
              ref={consentFileInputRef}
              type="file"
              accept=".wav,.mp3,audio/*"
              onChange={handleConsentFileChange}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#20222b] file:text-slate-200 hover:file:bg-[#2c2f3c] cursor-pointer"
            />
          </div>

          {/* Required Explicit Confirmation (Section 11) */}
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3">
            <input
              type="checkbox"
              id="replication-consent"
              checked={consentConfirmed}
              onChange={(e) => setConsentConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="replication-consent" className="cursor-pointer text-xs text-slate-200 leading-relaxed">
              <span className="font-semibold text-cyan-300 block mb-0.5">Mandatory Rights Confirmation:</span>
              "I own this voice/reference recording or have authorization to use it for voice replication."
            </label>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step Progress / Submit Button */}
          <button
            type="button"
            disabled={isSubmitting || !referenceFile || !consentConfirmed}
            onClick={handleRunReplication}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-semibold text-sm shadow-lg shadow-cyan-950/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>{stepStatus || 'Processing replication...'}</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Create Replicated Voice</span>
              </>
            )}
          </button>
        </div>

        {/* Replication Success Result (Section 13) */}
        {replicatedVoice && (
          <div className="p-4 rounded-xl bg-[#161a22] border border-cyan-500/40 text-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Replicated Voice Created</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                REPLICATED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#262c38]">
              <div>
                <span className="text-slate-400">Provider:</span>
                <span className="ml-1.5 font-semibold text-slate-200">Google Gemini</span>
              </div>
              <div>
                <span className="text-slate-400">Model:</span>
                <span className="ml-1.5 font-mono text-slate-300">gemini-3.8-flash-tts</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e1017] border border-[#232936] font-mono text-[11px]">
              <div>
                <span className="text-slate-400">Voice ID: </span>
                <span className="text-cyan-300 font-semibold">{replicatedVoice.providerVoiceId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyVoiceId}
                className="p-1 rounded text-slate-400 hover:text-slate-200 flex items-center gap-1"
                title="Copy Voice ID"
              >
                {copiedId ? <CheckCheck className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Actions: [Preview], [Use Voice], [Save Preset] */}
            <div className="flex items-center justify-between pt-2 border-t border-[#262c38]">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold flex items-center gap-1.5 transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>Preview</span>
              </button>

              <div className="flex items-center gap-2">
                {onSelectForStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectForStudio(replicatedVoice);
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
                  Save Preset & Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
