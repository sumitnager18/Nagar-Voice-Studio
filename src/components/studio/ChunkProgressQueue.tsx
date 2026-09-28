import React from 'react';
import { Play, Pause, RefreshCw, XCircle, CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { ChunkStatus, ScriptChunk } from '../../types/project';

interface ChunkProgressQueueProps {
  chunks: ScriptChunk[];
  isGenerating: boolean;
  onRetryChunk: (chunkId: string) => void;
  onRetryFailed: () => void;
  onRetryAll: () => void;
  onCancelGeneration: () => void;
  onPlayChunkAudio?: (chunk: ScriptChunk) => void;
}

export const ChunkProgressQueue: React.FC<ChunkProgressQueueProps> = ({
  chunks,
  isGenerating,
  onRetryChunk,
  onRetryFailed,
  onRetryAll,
  onCancelGeneration,
  onPlayChunkAudio,
}) => {
  if (!chunks || chunks.length === 0) {
    return null;
  }

  const completedCount = chunks.filter((c) => c.status === 'complete').length;
  const failedCount = chunks.filter((c) => c.status === 'failed').length;
  const generatingCount = chunks.filter((c) => c.status === 'generating').length;
  const waitingCount = chunks.filter((c) => c.status === 'waiting').length;

  const total = chunks.length;
  const percent = Math.round((completedCount / total) * 100);

  const getStatusBadge = (status: ChunkStatus) => {
    switch (status) {
      case 'complete':
        return (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete</span>
          </span>
        );
      case 'generating':
        return (
          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Generating...</span>
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      case 'waiting':
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Waiting</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-[#15161b] border border-[#26282e] rounded-xl p-4 flex flex-col gap-3">
      {/* Top Header & Queue Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24262c] pb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Long-Form Generation Queue
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {completedCount}/{total} Chunks ({percent}%)
          </span>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {isGenerating && (
            <button
              onClick={onCancelGeneration}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 rounded transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}

          {failedCount > 0 && !isGenerating && (
            <button
              onClick={onRetryFailed}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 rounded transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Failed ({failedCount})</span>
            </button>
          )}

          {!isGenerating && completedCount < total && (
            <button
              onClick={onRetryAll}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-[#202228] hover:bg-[#282b33] border border-[#2c2e36] rounded transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry All</span>
            </button>
          )}
        </div>
      </div>

      {/* Linear Progress Bar */}
      <div className="w-full bg-[#1e2026] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-amber-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Chunks List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {chunks.map((chunk, index) => (
          <div
            key={chunk.id}
            className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1.5 transition-all ${
              chunk.status === 'generating'
                ? 'bg-amber-500/10 border-amber-500/40'
                : chunk.status === 'failed'
                ? 'bg-rose-950/20 border-rose-900/40'
                : chunk.status === 'complete'
                ? 'bg-[#181a20] border-[#252830]'
                : 'bg-[#14151a] border-[#202228] opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-slate-300">
                  Chunk {index + 1}
                </span>
                {chunk.speaker && (
                  <span className="text-[11px] text-amber-300 font-medium">
                    [{chunk.speaker}]
                  </span>
                )}
                <span className="text-slate-400">·</span>
                {getStatusBadge(chunk.status)}
              </div>

              {/* Chunk Controls & Metadata */}
              <div className="flex items-center gap-2">
                {chunk.durationSeconds ? (
                  <span className="text-[11px] font-mono text-slate-400">
                    {Math.round(chunk.durationSeconds * 10) / 10}s
                  </span>
                ) : null}

                {chunk.latencyMs ? (
                  <span className="text-[10px] font-mono text-slate-400">
                    {chunk.latencyMs}ms
                  </span>
                ) : null}

                {chunk.audioBase64 && onPlayChunkAudio && (
                  <button
                    onClick={() => onPlayChunkAudio(chunk)}
                    className="p-1 rounded bg-[#252730] hover:bg-[#30333e] text-slate-200 transition-colors"
                    title="Play chunk audio"
                  >
                    <Play className="w-3 h-3 text-amber-400" />
                  </button>
                )}

                {chunk.status === 'failed' && (
                  <button
                    onClick={() => onRetryChunk(chunk.id)}
                    className="p-1 text-rose-400 hover:text-rose-200 text-[11px] flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            </div>

            {/* Chunk Text Preview */}
            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
              {chunk.processedText || chunk.originalText}
            </p>

            {chunk.error && (
              <p className="text-[10px] text-rose-400 font-mono">
                Error: {chunk.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
