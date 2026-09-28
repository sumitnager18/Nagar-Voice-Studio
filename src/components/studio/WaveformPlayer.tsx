import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Sliders,
  CheckCircle,
  FileAudio,
  Radio,
  Sparkles
} from 'lucide-react';
import { AudioPlayerManager, PlayerState, PlayerTimeUpdate } from '../../services/audio/AudioPlayerManager';
import { AudioMasteringConfig, ExportFormat, MasteringPreset } from '../../types/audio';
import { AudioExporter } from '../../services/audio/AudioExporter';
import { AudioProcessor } from '../../services/audio/AudioProcessor';

interface WaveformPlayerProps {
  masterBuffer: AudioBuffer | null;
  projectTitle: string;
  voiceName: string;
  onRunQA?: () => void;
  masteringConfig: AudioMasteringConfig;
  onChangeMasteringPreset: (preset: MasteringPreset) => void;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  masterBuffer,
  projectTitle,
  voiceName,
  onRunQA,
  masteringConfig,
  onChangeMasteringPreset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const player = AudioPlayerManager.getInstance();

  const [playerState, setPlayerState] = useState<PlayerState>('stopped');
  const [timeUpdate, setTimeUpdate] = useState<PlayerTimeUpdate>({ currentTime: 0, duration: 0, progressPercent: 0 });
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Subscribe to player state and time updates
  useEffect(() => {
    const unsubState = player.subscribeState((state) => setPlayerState(state));
    const unsubTime = player.subscribeTime((update) => setTimeUpdate(update));

    return () => {
      unsubState();
      unsubTime();
    };
  }, [player]);

  // When master buffer updates, load buffer into player and extract waveform peaks
  useEffect(() => {
    if (masterBuffer) {
      player.loadBuffer(masterBuffer);
      const extracted = AudioPlayerManager.extractWaveformData(masterBuffer, 180);
      setPeaks(extracted);
    } else {
      setPeaks([]);
    }
  }, [masterBuffer, player]);

  // Draw Waveform on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (peaks.length === 0) {
      // Draw quiet baseline
      ctx.strokeStyle = '#22242b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const barWidth = Math.max(2, (width / peaks.length) - 1.5);
    const progress = timeUpdate.duration > 0 ? timeUpdate.currentTime / timeUpdate.duration : 0;
    const currentProgressX = progress * width;

    for (let i = 0; i < peaks.length; i++) {
      const x = i * (barWidth + 1.5);
      const peakVal = peaks[i];
      const barHeight = Math.max(3, peakVal * (height * 0.85));
      const y = (height - barHeight) / 2;

      // Color bars based on played progress
      if (x <= currentProgressX) {
        ctx.fillStyle = '#f59e0b'; // Amber-500
      } else {
        ctx.fillStyle = '#3a3d47'; // Muted dark slate
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1);
      ctx.fill();
    }

    // Playhead indicator
    if (currentProgressX > 0) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(currentProgressX - 1, 0, 2, height);
    }
  }, [peaks, timeUpdate]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !masterBuffer) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = ratio * masterBuffer.duration;
    player.seek(targetSeconds);
  };

  const togglePlay = () => {
    if (playerState === 'playing') {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!masterBuffer) return;
    setIsExporting(true);
    try {
      // Apply selected mastering preset
      const mastered = await AudioProcessor.applyMastering(masterBuffer, masteringConfig);
      const filename = AudioExporter.generateFilename(projectTitle, voiceName, undefined, format);
      const { blob } = await AudioExporter.exportAudio(mastered, {
        format,
        sampleRate: 24000,
        bitrateKbps: 192,
        includeMetadata: true,
      });
      AudioExporter.triggerDownload(blob, filename);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="bg-[#15161b] border border-[#26282e] rounded-xl p-4 flex flex-col gap-3 shadow-md">
      {/* Waveform Visualization Canvas Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
            Master Output Monitor
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300 font-mono text-[11px]">
            {masterBuffer ? `${masterBuffer.sampleRate} Hz · 16-bit PCM` : 'No audio assembled'}
          </span>
        </div>

        {/* Time display */}
        <div className="font-mono text-xs flex items-center gap-1">
          <span className="text-amber-400 font-semibold">{formatTime(timeUpdate.currentTime)}</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-400">{formatTime(timeUpdate.duration || (masterBuffer?.duration || 0))}</span>
        </div>
      </div>

      {/* Waveform Canvas */}
      <div className="relative w-full h-20 bg-[#101115] rounded-lg border border-[#22242a] overflow-hidden cursor-pointer group">
        <canvas
          ref={canvasRef}
          width={800}
          height={80}
          onClick={handleCanvasClick}
          className="w-full h-full block"
        />
        {!masterBuffer && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
            Generate speech chunks above to monitor and play master waveform
          </div>
        )}
      </div>

      {/* Transport Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => player.skip(-10)}
            disabled={!masterBuffer}
            title="Skip backward 10s"
            className="p-2 rounded-lg bg-[#1c1e24] hover:bg-[#252830] text-slate-300 disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            disabled={!masterBuffer}
            title={playerState === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
            className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-40 shadow-sm shadow-amber-950/40 transition-transform active:scale-95"
          >
            {playerState === 'playing' ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          <button
            onClick={() => player.stop()}
            disabled={!masterBuffer}
            title="Stop playback"
            className="p-2 rounded-lg bg-[#1c1e24] hover:bg-[#252830] text-slate-300 disabled:opacity-40 transition-colors"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => player.skip(10)}
            disabled={!masterBuffer}
            title="Skip forward 10s"
            className="p-2 rounded-lg bg-[#1c1e24] hover:bg-[#252830] text-slate-300 disabled:opacity-40 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Speed Rate Switcher */}
          <div className="ml-1 flex items-center gap-1 bg-[#1a1c22] p-1 rounded-lg border border-[#272930] text-xs">
            {[1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => {
                  setPlaybackRate(rate);
                  player.setPlaybackRate(rate);
                }}
                className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                  playbackRate === rate
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Mastering Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Mastering:</span>
          <div className="flex items-center gap-1 bg-[#121316] p-0.5 rounded-lg border border-[#272930] text-xs">
            {(['OFF', 'LIGHT', 'VOICEOVER', 'BROADCAST'] as MasteringPreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => onChangeMasteringPreset(preset)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  masteringConfig.preset === preset
                    ? 'bg-[#22242b] text-amber-300 shadow-sm border border-[#2e313a]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* QA Check & Export Actions */}
        <div className="flex items-center gap-2">
          {onRunQA && (
            <button
              onClick={onRunQA}
              disabled={!masterBuffer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202228] hover:bg-[#282b33] text-slate-200 text-xs font-medium border border-[#2d3038] disabled:opacity-40 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Speech QA</span>
            </button>
          )}

          {/* Export WAV Button */}
          <button
            onClick={() => handleExport('WAV')}
            disabled={!masterBuffer || isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold shadow-sm disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export WAV</span>
          </button>

          {/* Export MP3 Button */}
          <button
            onClick={() => handleExport('MP3')}
            disabled={!masterBuffer || isExporting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#202228] hover:bg-[#282b33] text-slate-200 text-xs font-medium border border-[#2c2f37] disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>MP3</span>
          </button>
        </div>
      </div>
    </div>
  );
};
