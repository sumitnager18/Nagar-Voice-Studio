import React from 'react';
import { X, Dna, Info, Sliders, Volume2, ShieldCheck } from 'lucide-react';
import { Voice } from '../../types/tts';

interface VoiceDNAModalProps {
  voice: Voice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceDNAModal: React.FC<VoiceDNAModalProps> = ({
  voice,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !voice) return null;

  const dna = voice.dnaProfile || {
    pitch: 0,
    timbre: 'Neutral studio resonance',
    ageImpression: 'Adult',
    energy: 70,
    warmth: 75,
    authority: 80,
    emotionRange: 'Balanced',
    speakingSpeed: 1.0,
    clarity: 95,
    breathiness: 15,
    roughness: 10,
    narrationStyle: voice.persona || 'Narration',
    bestUse: voice.bestUse || 'General Speech',
    avoidedUses: voice.avoidedUses || 'None',
    pronunciationProfile: 'Standard phonetics',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#16171d] border border-[#2b2d35] rounded-xl max-w-xl w-full p-5 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262830] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Dna className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>{voice.name}</span>
                <span className="text-[10px] font-mono text-amber-400 font-normal">
                  [{voice.type}]
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Acoustic Voice DNA & DSP Parameter Profile
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Note on provider control mapping */}
        <div className="p-2.5 rounded-lg bg-[#111216] border border-[#24262d] flex items-start gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-amber-400/80 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Where the TTS provider directly supports parameters (e.g. rate, style), they are transmitted natively. Otherwise, the Voice Engine automatically translates these sliders into structured natural-language style instructions.
          </p>
        </div>

        {/* Sliders & Characteristics Grid */}
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {/* Acoustic Characteristics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 rounded bg-[#1b1d24] border border-[#262830]">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                Timbre & Resonance
              </span>
              <span className="text-slate-200 font-medium">{dna.timbre}</span>
            </div>
            <div className="p-2 rounded bg-[#1b1d24] border border-[#262830]">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                Age Impression
              </span>
              <span className="text-slate-200 font-medium">{dna.ageImpression}</span>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-2.5 p-3 rounded-lg bg-[#181920] border border-[#262830]">
            {/* Clarity */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Articulation Clarity</span>
                <span className="font-mono text-amber-400">{dna.clarity}%</span>
              </div>
              <div className="w-full bg-[#101115] h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${dna.clarity}%` }} />
              </div>
            </div>

            {/* Warmth */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Vocal Warmth</span>
                <span className="font-mono text-amber-400">{dna.warmth}%</span>
              </div>
              <div className="w-full bg-[#101115] h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${dna.warmth}%` }} />
              </div>
            </div>

            {/* Authority */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Narrative Authority</span>
                <span className="font-mono text-amber-400">{dna.authority}%</span>
              </div>
              <div className="w-full bg-[#101115] h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${dna.authority}%` }} />
              </div>
            </div>

            {/* Energy */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Projection Energy</span>
                <span className="font-mono text-amber-400">{dna.energy}%</span>
              </div>
              <div className="w-full bg-[#101115] h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${dna.energy}%` }} />
              </div>
            </div>

            {/* Breathiness */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Micro-Breathiness</span>
                <span className="font-mono text-slate-300">{dna.breathiness}%</span>
              </div>
              <div className="w-full bg-[#101115] h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-500 h-full" style={{ width: `${dna.breathiness}%` }} />
              </div>
            </div>
          </div>

          {/* Profile metadata */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-slate-400 w-28 flex-shrink-0">Narration Style:</span>
              <span className="text-slate-200">{dna.narrationStyle}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-400 w-28 flex-shrink-0">Best Production Use:</span>
              <span className="text-slate-200">{dna.bestUse}</span>
            </div>
            {dna.avoidedUses && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400 w-28 flex-shrink-0">Avoided Uses:</span>
                <span className="text-slate-400">{dna.avoidedUses}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="text-slate-400 w-28 flex-shrink-0">Pronunciation Profile:</span>
              <span className="text-amber-300 font-mono text-[11px]">{dna.pronunciationProfile}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#262830]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#24262e] hover:bg-[#2d303a] text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
