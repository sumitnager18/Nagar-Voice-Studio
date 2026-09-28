import React, { useState } from 'react';
import { Volume2, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { SupportedLanguage } from '../../types/nlp';
import { Voice } from '../../types/tts';

interface FirstRunWizardProps {
  isOpen: boolean;
  voices: Voice[];
  onComplete: (data: { language: SupportedLanguage; defaultVoiceId: string }) => void;
  onSkip: () => void;
}

export const FirstRunWizard: React.FC<FirstRunWizardProps> = ({
  isOpen,
  voices,
  onComplete,
  onSkip,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState(1);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('HINGLISH');
  const [selectedVoiceId, setSelectedVoiceId] = useState(
    voices.find((v) => v.id === 'voice-cgh-arjun')?.id || voices[0]?.id || ''
  );

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete({ language: selectedLang, defaultVoiceId: selectedVoiceId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#16171d] border border-[#2b2d35] rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5">
        {/* Header & Skip */}
        <div className="flex items-center justify-between border-b border-[#262830] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-bold">
              <Volume2 className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Welcome to Nagar Voice Studio
              </h3>
              <p className="text-[11px] text-slate-400">
                Step {step} of {totalSteps}
              </p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="text-xs text-slate-400 hover:text-slate-200 p-1"
          >
            Skip Setup
          </button>
        </div>

        {/* Step 1: Welcome & Mission */}
        {step === 1 && (
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <h4 className="font-semibold text-slate-100 text-sm">
              Professional Voice Production for Indian & Global Content
            </h4>
            <p>
              Nagar Voice Studio is an NLP-powered production workstation built specifically for YouTube creators, documentaries, educational courses, and ComputerGuruHub narration.
            </p>
            <div className="p-3 rounded-lg bg-[#111216] border border-[#24262d] space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-2 text-slate-200">
                <Check className="w-3.5 h-3.5 text-amber-400" />
                <span>Code-switching preservation (Hindi + English without translation)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Check className="w-3.5 h-3.5 text-amber-400" />
                <span>Protected technical terminology (Python, GPU, API, Neural Networks)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Check className="w-3.5 h-3.5 text-amber-400" />
                <span>Intelligent long-form chunking with anti-click audio mastering</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preferred Language */}
        {step === 2 && (
          <div className="space-y-3 text-xs">
            <h4 className="font-semibold text-slate-100 text-sm">
              Select Your Primary Content Language
            </h4>
            <p className="text-slate-400">
              Choose the language profile that best represents your typical scripts:
            </p>

            <div className="space-y-2">
              {[
                { id: 'HINGLISH' as SupportedLanguage, title: 'Hinglish (Natural Mixed)', desc: 'Natural Hindi sentences with English technical words (Ideal for ComputerGuruHub)' },
                { id: 'HINDI' as SupportedLanguage, title: 'Hindi (Devanagari)', desc: 'Articulate formal and storytelling Hindi' },
                { id: 'ENGLISH' as SupportedLanguage, title: 'English (Indian / International)', desc: 'Global English narration with clean pronunciation' },
                { id: 'AUTO' as SupportedLanguage, title: 'Automatic Detection', desc: 'Detect language automatically on every script paste' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedLang(item.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedLang === item.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-slate-100'
                      : 'bg-[#111216] border-[#252830] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center justify-between">
                    <span>{item.title}</span>
                    {selectedLang === item.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Choose Default Voice Identity */}
        {step === 3 && (
          <div className="space-y-3 text-xs">
            <h4 className="font-semibold text-slate-100 text-sm">
              Choose Your Default Narrator Voice
            </h4>
            <p className="text-slate-400">
              You can change voices or switch presets anytime inside the studio:
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {voices.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVoiceId(v.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedVoiceId === v.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-slate-100'
                      : 'bg-[#111216] border-[#252830] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center justify-between">
                    <span>{v.name} ({v.language})</span>
                    {selectedVoiceId === v.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{v.bestUse}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Ready to Launch */}
        {step === 4 && (
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed text-center py-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-100 text-base">
              You're Ready to Produce Speech!
            </h4>
            <p className="max-w-xs mx-auto text-slate-400 text-xs">
              Your workstation is initialized with ComputerGuruHub production presets, pronunciation lexicon, and long-form chunking.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#262830]">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3.5 py-1.5 rounded-lg bg-[#24262e] text-slate-300 text-xs font-medium"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold shadow-sm transition-colors ml-auto"
          >
            <span>{step === totalSteps ? 'Enter Studio' : 'Continue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
