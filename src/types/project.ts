import { SupportedLanguage } from './nlp';
import { ModelProfileMode, VoiceProvider, VoiceType } from './tts';

export type ProductionMode = 'standard' | 'youtube' | 'computerguruhub' | 'story' | 'dialogue';

export type ChunkStatus = 'waiting' | 'generating' | 'complete' | 'failed';

export interface ScriptChunk {
  id: string;
  sequence: number;
  originalText: string;
  processedText: string;
  speaker?: string; // used in dialogue mode
  voiceId: string;
  providerVoiceId?: string; // Real Gemini/provider voice identifier (Section 30)
  voiceType?: VoiceType | string;
  provider: VoiceProvider;
  model: string;
  style: string;
  speed: number;
  status: ChunkStatus;
  progressPercent: number;
  audioBase64?: string;
  audioUrl?: string;
  durationSeconds?: number;
  error?: string;
  retryCount?: number;
  latencyMs?: number;
  pronunciationProfile?: string;
  generationDate?: string;
}

export interface SpeakerTurn {
  id: string;
  speaker: string; // e.g. "Narrator", "Pehel", "Teacher"
  text: string;
  voiceId: string;
  providerVoiceId?: string;
  style?: string;
}

export interface ProjectVersion {
  versionNumber: number;
  createdAt: string;
  title: string;
  originalScript: string;
  processedScript: string;
  voiceId: string;
  providerVoiceId?: string;
  voicePresetId: string;
  speed: number;
  style: string;
  emotion: string;
  language: SupportedLanguage;
  masterAudioUrl?: string;
  masterDuration?: number;
  chunks: ScriptChunk[];
}

export interface Project {
  id: string;
  title: string;
  productionMode: ProductionMode;
  originalScript: string;
  processedScript: string;
  language: SupportedLanguage;
  voiceId: string;
  providerVoiceId?: string; // Real Gemini provider ID (Section 42)
  voiceType?: VoiceType | string;
  voicePresetId: string;
  provider: VoiceProvider;
  modelMode: ModelProfileMode;
  resolvedModel: string;
  style: string;
  emotion: string;
  speed: number;
  pitch: string;
  pronunciationProfile?: string;
  generationDate?: string;
  
  // Dialogue mode specific
  speakers?: Array<{
    name: string;
    voiceId: string;
    providerVoiceId?: string;
    role: string;
  }>;
  dialogueTurns?: SpeakerTurn[];

  // YouTube / Mode specific targets
  targetDurationSeconds?: number;
  narratorIdentityLock: boolean;

  // Chunks & Audio
  chunks: ScriptChunk[];
  masterAudioUrl?: string;
  masterAudioBlob?: Blob;
  masterAudioDuration?: number;
  masterMasteringPreset?: 'OFF' | 'LIGHT' | 'VOICEOVER' | 'BROADCAST';
  generationStatus: 'idle' | 'in_progress' | 'completed' | 'interrupted' | 'error';
  lastInterruptedAt?: string;

  // History & Metadata
  currentVersion: number;
  versions: ProjectVersion[];
  createdAt: string;
  updatedAt: string;
}
