import React, { useState } from 'react';
import { Music, Play, Pause, Download, Trash2, HardDrive, FileAudio, ExternalLink } from 'lucide-react';
import { AudioAsset } from '../../types/audio';
import { AudioPlayerManager } from '../../services/audio/AudioPlayerManager';

interface AudioLibraryScreenProps {
  assets: AudioAsset[];
  onDeleteAsset: (id: string) => void;
}

export const AudioLibraryScreen: React.FC<AudioLibraryScreenProps> = ({
  assets,
  onDeleteAsset,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const player = AudioPlayerManager.getInstance();

  const handlePlayAsset = async (asset: AudioAsset) => {
    if (!asset.audioUrl) return;

    if (playingId === asset.id) {
      player.pause();
      setPlayingId(null);
    } else {
      await player.loadUrl(asset.audioUrl);
      await player.play();
      setPlayingId(asset.id);
      player.subscribeState((st) => {
        if (st === 'stopped') setPlayingId(null);
      });
    }
  };

  const handleDownload = (asset: AudioAsset) => {
    if (!asset.audioUrl) return;
    const a = document.createElement('a');
    a.href = asset.audioUrl;
    a.download = asset.filename;
    a.click();
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#25272e] pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Mastered Audio & Export Repository</span>
            <span className="text-xs font-mono font-normal text-amber-400">
              ({assets.length} Master Files)
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Canonical 16-bit WAV, LAME MP3 exports, clean production naming, and file-backed playback
          </p>
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center bg-[#15161b] border border-[#25272e] rounded-xl p-8">
          <Music className="w-10 h-10 text-slate-600 mb-2" />
          <p className="font-medium text-slate-300">No exported audio files yet</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Generate speech in the Studio screen and click "Export WAV" or "Export MP3" to save master files here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {assets.map((asset) => {
            const isPlaying = playingId === asset.id;
            return (
              <div
                key={asset.id}
                className="p-3.5 rounded-xl bg-[#16171d] border border-[#25272e] hover:border-[#30333c] text-xs flex flex-wrap items-center justify-between gap-3 transition-colors"
              >
                {/* File info */}
                <div className="flex items-center gap-3 min-w-[240px]">
                  <button
                    onClick={() => handlePlayAsset(asset)}
                    className="w-9 h-9 rounded-lg bg-[#22242c] hover:bg-amber-500 text-amber-400 hover:text-black flex items-center justify-center transition-colors flex-shrink-0"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div>
                    <h4 className="font-mono font-semibold text-slate-200 text-xs">
                      {asset.filename}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{asset.projectTitle}</span>
                      <span>·</span>
                      <span className="text-amber-400/90">{asset.voiceName}</span>
                      <span>·</span>
                      <span>{asset.format} ({asset.sampleRate} Hz)</span>
                      <span>·</span>
                      <span className="font-mono">{formatSize(asset.fileSizeBytes)}</span>
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-300 text-xs font-semibold">
                    {Math.round(asset.durationSeconds * 10) / 10}s
                  </span>

                  <button
                    onClick={() => handleDownload(asset)}
                    className="p-2 rounded-lg bg-[#22242c] hover:bg-[#2c2f3a] text-amber-400 hover:text-amber-300 transition-colors"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteAsset(asset.id)}
                    className="p-2 rounded-lg bg-[#22242c] hover:bg-[#2c2f3a] text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
