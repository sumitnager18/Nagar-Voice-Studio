export type VoiceProvider = 'gemini' | 'elevenlabs' | 'clipchamp_ref' | 'fish_audio_ref' | 'local' | 'custom';

export type VoiceType = 'prebuilt' | 'extended' | 'designed' | 'replicated' | 'reference';

export type VoiceStatus = 'available' | 'reference_only' | 'unavailable';

export type GenderPresentation = 'male' | 'female' | 'neutral';

export interface VoiceDNA {
  pitch: number; // -100 to 100
  timbre: string; // e.g. 'Warm resonant', 'Crisp metallic', 'Deep baritone'
  ageImpression: string; // e.g. 'Late 20s', 'Late 30s', 'Mature'
  energy: number; // 0 to 100
  warmth: number; // 0 to 100
  authority: number; // 0 to 100
  emotionRange: string; // 'Restrained', 'Dynamic', 'Expressive'
  speakingSpeed: number; // default 1.0x
  clarity: number; // 0 to 100
  breathiness: number; // 0 to 100
  roughness: number; // 0 to 100
  narrationStyle: string; // 'Documentary', 'Educational', 'Storytelling'
  bestUse: string;
  avoidedUses?: string;
  pronunciationProfile: string;
}

export interface VoiceMetadata {
  model?: string;
  prompt?: string;
  expireTime?: string;
  liveGoogleVoice?: boolean;
  isProductionPreset?: boolean;
  presetName?: string;
  referenceTarget?: {
    provider: string; // 'ElevenLabs', 'Clipchamp', etc.
    status: string;
    rightsStatus: 'Reference Only' | 'Authorized' | 'User-Owned' | 'Unknown';
    referenceAudioUrl?: string;
    referenceAudioName?: string;
    originalVoiceId?: string;
    notes?: string;
  };
  replicatedMetadata?: {
    originalFilename?: string;
    consentStatus: string;
    consentConfirmedText?: string;
    hasReferenceAudio?: boolean;
    referenceAudioData?: string;
  };
  productionPreset?: {
    presetName: string;
    pace: number;
    historicalIdentity: string;
    styleInstruction?: string;
    notes?: string;
  };
  acousticDna?: VoiceDNA;
  [key: string]: any;
}

export interface Voice {
  id: string;
  provider: VoiceProvider;
  providerVoiceId: string;
  name: string;
  type: VoiceType;
  languageCode: string;
  gender: GenderPresentation;
  description: string;
  sampleAudio?: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  status: VoiceStatus;
  metadata?: VoiceMetadata;

  // Compatibility fields for existing UI components
  language?: string;
  accent?: string;
  pitch?: string;
  persona?: string;
  bestUse?: string;
  avoidedUses?: string;
  sampleAudioUrl?: string;
  sampleText?: string;
  dnaProfile?: VoiceDNA;
  referenceMetadata?: any;
}

export interface VoicePreset {
  id: string;
  voiceId: string;
  name: string;
  provider: VoiceProvider;
  speed: number; // e.g. 1.0, 1.25, 1.5
  style: string;
  emotion: string;
  pitch: string;
  language: string;
  pronunciationProfileId?: string;
  pauseProfile: 'natural' | 'tight' | 'dramatic' | 'instructional';
  energy: 'low' | 'medium' | 'high';
  useCase: string;
  notes: string;
  isBuiltIn?: boolean;
}

export type ModelProfileMode = 'AUTO' | 'MAXIMUM_QUALITY' | 'BALANCED' | 'FAST';

export interface SpeechRequest {
  text: string;
  voiceId: string;
  providerVoiceId: string;
  model: string;
  style?: string;
  emotion?: string;
  language?: string;
  speed?: number;
  pitch?: string;
  isMultiSpeaker?: boolean;
  speakers?: Array<{
    speaker: string;
    voiceName: string;
    style?: string;
  }>;
}

export interface SpeechResult {
  audioBase64: string; // Base64 PCM or WAV
  mimeType: string;
  sampleRate: number;
  durationSeconds: number;
  modelUsed: string;
  provider: VoiceProvider;
  latencyMs: number;
}

export interface TtsProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  generateSpeech(req: SpeechRequest): Promise<SpeechResult>;
  listVoices(): Promise<Voice[]>;
  getVoice(id: string): Promise<Voice | null>;
  createVoice(params: {
    name: string;
    description: string;
    language: string;
    gender: GenderPresentation;
    useCase: string;
    customAcousticDescription?: string;
  }): Promise<Voice>;
  replicateVoice(params: {
    name: string;
    audioBase64: string;
    originalFilename: string;
    consentGiven: boolean;
    language: string;
  }): Promise<Voice>;
  deleteVoice(id: string): Promise<boolean>;
  previewVoice(voiceId: string, sampleText?: string): Promise<SpeechResult>;
}
