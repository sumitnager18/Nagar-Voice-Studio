import React, { useState } from 'react';
import { Eye, Edit3, Sparkles, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import { NLPTokenHighlight, ScriptStats, SupportedLanguage } from '../../types/nlp';

interface ScriptEditorProps {
  originalText: string;
  processedText: string;
  highlights: NLPTokenHighlight[];
  stats: ScriptStats;
  detectedLanguage: SupportedLanguage;
  onChangeOriginal: (val: string) => void;
  onAnalyze: () => void;
  onLoadSample: (sampleKey: 'english' | 'hindi' | 'hinglish' | 'computerguruhub') => void;
  disabled?: boolean;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  originalText,
  processedText,
  highlights,
  stats,
  detectedLanguage,
  onChangeOriginal,
  onAnalyze,
  onLoadSample,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'original' | 'processed'>('original');
  const [selectedHighlight, setSelectedHighlight] = useState<NLPTokenHighlight | null>(null);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex flex-col h-full bg-[#15161b] border border-[#26282e] rounded-xl overflow-hidden shadow-sm">
      {/* Top Bar: Tabs, Language Badge, Quick Samples */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-[#24262c] bg-[#17181e] gap-2">
        {/* Editor Tabs */}
        <div className="flex items-center gap-1 bg-[#101115] p-0.5 rounded-lg border border-[#272930]">
          <button
            onClick={() => setActiveTab('original')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'original'
                ? 'bg-[#22242b] text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Original Script</span>
          </button>
          <button
            onClick={() => setActiveTab('processed')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'processed'
                ? 'bg-[#22242b] text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>NLP Processed</span>
            {highlights.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded">
                {highlights.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 hidden sm:inline">Samples:</span>
          <button
            onClick={() => onLoadSample('computerguruhub')}
            className="px-2 py-0.5 rounded bg-[#1e2026] hover:bg-[#272932] text-slate-300 text-[11px] border border-[#2c2f38] transition-colors"
          >
            CGH Tech
          </button>
          <button
            onClick={() => onLoadSample('hinglish')}
            className="px-2 py-0.5 rounded bg-[#1e2026] hover:bg-[#272932] text-slate-300 text-[11px] border border-[#2c2f38] transition-colors"
          >
            Hinglish
          </button>
          <button
            onClick={() => onLoadSample('hindi')}
            className="px-2 py-0.5 rounded bg-[#1e2026] hover:bg-[#272932] text-slate-300 text-[11px] border border-[#2c2f38] transition-colors"
          >
            Hindi
          </button>
          <button
            onClick={() => onLoadSample('english')}
            className="px-2 py-0.5 rounded bg-[#1e2026] hover:bg-[#272932] text-slate-300 text-[11px] border border-[#2c2f38] transition-colors"
          >
            English
          </button>
        </div>
      </div>

      {/* Main Text Content Area */}
      <div className="flex-1 relative min-h-[260px] p-3 overflow-y-auto">
        {activeTab === 'original' ? (
          <textarea
            value={originalText}
            onChange={(e) => onChangeOriginal(e.target.value)}
            disabled={disabled}
            placeholder="Write or paste your script here in Hindi, English, or Hinglish... The NLP Engine will automatically handle number normalization, dates, acronyms, and pronunciation rules without translating."
            className="w-full h-full min-h-[240px] resize-none bg-transparent text-slate-100 placeholder-slate-400 text-sm leading-relaxed font-sans focus:outline-none scrollbar-thin"
          />
        ) : (
          <div className="space-y-4">
            {processedText ? (
              <div className="text-sm leading-relaxed text-slate-200 font-sans whitespace-pre-wrap">
                {/* Render processed text with clickable highlight chips */}
                {renderHighlightedText(processedText, highlights, (h) => setSelectedHighlight(h))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <Sparkles className="w-8 h-8 text-amber-500/40 mb-2" />
                <p className="text-xs">No processed script yet. Click "Analyze & Prepare" to run the NLP pipeline.</p>
              </div>
            )}

            {/* Selected Highlight Inspector Detail Card */}
            {selectedHighlight && (
              <div className="mt-3 p-3 rounded-lg bg-[#1a1c22] border border-amber-500/30 flex items-start justify-between gap-3 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center gap-2 mb-1 text-xs">
                    <span className="font-semibold text-amber-300 uppercase tracking-wide text-[10px]">
                      {selectedHighlight.type} Normalization
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      "{selectedHighlight.original}" → "{selectedHighlight.normalized}"
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedHighlight.explanation}</p>
                </div>
                <button
                  onClick={() => setSelectedHighlight(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs p-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Statistics & NLP Status Bar */}
      <div className="px-3 py-2 border-t border-[#22242a] bg-[#141519] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
          <span>{stats.wordCount} words</span>
          <span>·</span>
          <span>{stats.characterCount} chars</span>
          <span>·</span>
          <span>{stats.sentenceCount} sentences</span>
          <span>·</span>
          <span className="text-amber-400 font-medium">{stats.chunkCount} chunks</span>
          <span>·</span>
          <span className="text-emerald-400 font-medium">~{formatDuration(stats.estimatedDurationSeconds)}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Detected Language Tag (Clean text, no pill) */}
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Detected:</span>
            <span className="text-amber-300 font-mono font-medium">{detectedLanguage}</span>
          </div>

          <button
            onClick={onAnalyze}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#20232a] hover:bg-[#282b34] text-slate-200 text-xs font-medium border border-[#2d3039] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Analyze Script</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper: Safely renders text with highlight tags
function renderHighlightedText(
  text: string,
  highlights: NLPTokenHighlight[],
  onSelect: (h: NLPTokenHighlight) => void
) {
  if (!highlights || highlights.length === 0) {
    return text;
  }

  // Find occurrences of normalized text in string
  // Highlight each matching phrase
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  for (const h of highlights) {
    const idx = remaining.indexOf(h.normalized);
    if (idx !== -1) {
      if (idx > 0) {
        elements.push(remaining.substring(0, idx));
      }
      elements.push(
        <mark
          key={`hl-${keyIndex++}`}
          onClick={() => onSelect(h)}
          title={`Click to inspect: ${h.explanation}`}
          className="bg-amber-500/20 text-amber-200 underline decoration-amber-500/50 decoration-dotted cursor-pointer px-1 py-0.5 rounded transition-colors hover:bg-amber-500/30"
        >
          {h.normalized}
        </mark>
      );
      remaining = remaining.substring(idx + h.normalized.length);
    }
  }

  if (remaining.length > 0) {
    elements.push(remaining);
  }

  return <>{elements}</>;
}
