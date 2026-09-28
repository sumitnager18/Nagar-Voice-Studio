export type MasteringPreset = 'OFF' | 'LIGHT' | 'VOICEOVER' | 'BROADCAST';

export interface AudioMasteringConfig {
  preset: MasteringPreset;
  trimSilence: boolean; // trim unwanted leading/trailing silence
  silenceThresholdDb: number; // e.g. -45 dB
  normalizeLoudness: boolean; // e.g. -16 LUFS / -1 dBTP peak
  compression: boolean;
  limiter: boolean;
  interChunkPauseMs: number; // default 400ms
  crossfadeMs: number; // default 15ms anti-click
}

export type ExportFormat = 'WAV' | 'MP3';
export type ExportSampleRate = 24000 | 44100 | 48000;

export interface ExportOptions {
  format: ExportFormat;
  sampleRate: ExportSampleRate;
  bitrateKbps?: number; // for MP3: 192 or 320
  includeMetadata: boolean;
}

export interface AudioAsset {
  id: string;
  filename: string; // e.g. "CGH_AI_Chapter_01_Arjun_001.wav"
  projectId: string;
  projectTitle: string;
  chunkIndex?: number;
  voiceId: string;
  voiceName: string;
  provider: string;
  model: string;
  format: ExportFormat;
  sampleRate: number;
  durationSeconds: number;
  fileSizeBytes: number;
  createdAt: string;
  audioBlob?: Blob;
  audioUrl?: string;
}

export interface QAQualityCheckItem {
  id: string;
  title: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  details: string;
}

export interface QAQualityReport {
  overallStatus: 'PASS' | 'WARNING' | 'FAIL';
  checks: QAQualityCheckItem[];
  checkedAt: string;
  totalDurationSeconds: number;
  chunkCount: number;
}
