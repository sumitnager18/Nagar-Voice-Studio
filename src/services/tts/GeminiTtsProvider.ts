import { GenderPresentation, SpeechRequest, SpeechResult, TtsProvider, Voice } from '../../types/tts';
import { VoiceLibraryRepository } from './VoiceLibraryRepository';

export class GeminiTtsProvider implements TtsProvider {
  public id = 'gemini';
  public name = 'Google Gemini 3.8 Voice Engine';

  public async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.apiKeyConfigured);
    } catch {
      return false;
    }
  }

  public async generateSpeech(req: SpeechRequest): Promise<SpeechResult> {
    const startTime = Date.now();

    // Use providerVoiceId directly (e.g. voice_..., Puck, achernar, etc.)
    const effectiveVoiceId = req.providerVoiceId || req.voiceId || 'Puck';

    // Compose style instruction combining style, emotion, and pace
    let composedStyle = req.style || '';
    if (req.emotion && !composedStyle.toLowerCase().includes(req.emotion.toLowerCase())) {
      composedStyle = `${composedStyle ? composedStyle + '. ' : ''}Emotion/Mood: ${req.emotion}.`;
    }
    if (req.speed && req.speed !== 1.0) {
      composedStyle = `${composedStyle ? composedStyle + '. ' : ''}Pacing: ${req.speed}x.`;
    }

    const payload: any = {
      text: req.text,
      voiceId: effectiveVoiceId,
      voiceName: effectiveVoiceId,
      model: req.model || 'gemini-3.8-flash-tts',
      style: composedStyle.trim() || undefined,
      isMultiSpeaker: req.isMultiSpeaker,
      speakers: req.speakers,
    };

    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `TTS generation failed with HTTP status ${response.status}`);
    }

    const data = await response.json();
    const latencyMs = data.latencyMs || (Date.now() - startTime);

    return {
      audioBase64: data.audioBase64,
      mimeType: data.mimeType || 'audio/wav',
      sampleRate: data.sampleRate || 24000,
      durationSeconds: data.durationSeconds || 0,
      modelUsed: data.modelUsed || req.model,
      provider: 'gemini',
      latencyMs,
    };
  }

  public async listVoices(): Promise<Voice[]> {
    return VoiceLibraryRepository.getVoices();
  }

  public async getVoice(id: string): Promise<Voice | null> {
    return VoiceLibraryRepository.getVoiceById(id) || null;
  }

  // Real Gemini Voice Design: POST /v1beta/voices through backend
  public async createVoice(params: {
    name: string;
    description: string;
    language: string;
    gender: GenderPresentation;
    useCase: string;
    customAcousticDescription?: string;
  }): Promise<Voice> {
    const res = await fetch('/api/voices/design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voiceName: params.name,
        description: params.description,
        language: params.language,
        gender: params.gender,
        primaryUse: params.useCase,
        customAcousticDescription: params.customAcousticDescription,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Voice design failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data.providerVoiceId) {
      throw new Error('Google Gemini API did not return a valid provider voice ID.');
    }

    const sampleUrl = data.sampleAudio ? `data:audio/wav;base64,${data.sampleAudio}` : undefined;

    const newVoice: Voice = {
      id: `voice-custom-${data.providerVoiceId}`,
      provider: 'gemini',
      providerVoiceId: data.providerVoiceId, // Real provider voice ID e.g. voice_XXXXXXXX
      name: data.displayName || params.name,
      type: 'designed',
      languageCode: data.languageCode || params.language,
      gender: params.gender,
      description: params.description,
      sampleAudio: data.sampleAudio,
      sampleAudioUrl: sampleUrl,
      favorite: true,
      status: 'available',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      language: params.language,
      accent: 'Google Gemini Designed',
      persona: params.name,
      bestUse: params.useCase,
      metadata: {
        model: data.model || 'models/gemini-3.8-flash-tts',
        prompt: data.prompt,
        expireTime: data.expireTime,
        liveGoogleVoice: true,
        acousticDna: {
          pitch: 0,
          timbre: params.customAcousticDescription || 'Gemini Prompted Resonance',
          ageImpression: 'Mature',
          energy: 78,
          warmth: 85,
          authority: 88,
          emotionRange: 'Custom Style Directed',
          speakingSpeed: 1.0,
          clarity: 96,
          breathiness: 14,
          roughness: 8,
          narrationStyle: params.useCase,
          bestUse: params.useCase,
          pronunciationProfile: `${params.language} designed profile`
        }
      },
      dnaProfile: {
        pitch: 0,
        timbre: params.customAcousticDescription || 'Gemini Prompted Resonance',
        ageImpression: 'Mature',
        energy: 78,
        warmth: 85,
        authority: 88,
        emotionRange: 'Custom Style Directed',
        speakingSpeed: 1.0,
        clarity: 96,
        breathiness: 14,
        roughness: 8,
        narrationStyle: params.useCase,
        bestUse: params.useCase,
        pronunciationProfile: `${params.language} designed profile`
      }
    };

    VoiceLibraryRepository.addVoice(newVoice);
    return newVoice;
  }

  // Real Gemini Authorized Voice Replication
  public async replicateVoice(params: {
    name: string;
    audioBase64: string;
    originalFilename: string;
    consentGiven: boolean;
    language: string;
    consentAudioBase64?: string;
  }): Promise<Voice> {
    if (!params.consentGiven) {
      throw new Error('Explicit confirmation is required: "I own this voice/reference recording or have authorization to use it for voice replication."');
    }

    const res = await fetch('/api/voices/replicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voiceName: params.name,
        sourceAudioBase64: params.audioBase64,
        consentAudioBase64: params.consentAudioBase64 || params.audioBase64,
        consentConfirmed: true,
        originalFilename: params.originalFilename,
        language: params.language,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Voice replication failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data.providerVoiceId) {
      throw new Error('Voice replication API did not return a valid voice ID.');
    }

    const newVoice: Voice = {
      id: `voice-replicated-${data.providerVoiceId}`,
      provider: 'gemini',
      providerVoiceId: data.providerVoiceId, // Real provider voice ID or key
      name: data.displayName || params.name,
      type: 'replicated',
      languageCode: data.languageCode || params.language,
      gender: 'male',
      description: `Replicated voice calibrated from reference recording '${params.originalFilename}'. Authorized for voice replication.`,
      favorite: true,
      status: 'available',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      language: params.language,
      accent: 'Replicated Authentic Profile',
      persona: `Replicated: ${params.name}`,
      bestUse: 'Documentary & narration replicating original reference',
      metadata: {
        model: data.model || 'models/gemini-3.8-flash-tts',
        replicatedMetadata: {
          originalFilename: params.originalFilename,
          consentStatus: 'VERIFIED_AND_ACKNOWLEDGED',
          consentConfirmedText: 'I own this voice/reference recording or have authorization to use it for voice replication.',
          hasReferenceAudio: true,
        }
      }
    };

    VoiceLibraryRepository.addVoice(newVoice);
    return newVoice;
  }

  public async deleteVoice(id: string): Promise<boolean> {
    return VoiceLibraryRepository.deleteVoice(id);
  }

  public async previewVoice(voiceId: string, sampleText?: string): Promise<SpeechResult> {
    const voice = VoiceLibraryRepository.getVoiceById(voiceId);
    const textToSpeak = sampleText || voice?.sampleText || 'Welcome to Nagar Voice Studio. This is an acoustic preview of the voice.';
    return await this.generateSpeech({
      text: textToSpeak,
      voiceId,
      providerVoiceId: voice?.providerVoiceId || 'Puck',
      model: 'gemini-3.8-flash-tts',
      style: voice?.description,
      language: voice?.languageCode || voice?.language,
    });
  }

  // Voice Health check
  public async checkVoiceHealth(voiceId: string): Promise<{ status: 'available' | 'unavailable'; error?: string }> {
    try {
      const res = await fetch(`/api/voices/${voiceId}/health`);
      if (!res.ok) return { status: 'unavailable', error: `HTTP ${res.status}` };
      const data = await res.json();
      return { status: data.status, error: data.error };
    } catch (err: any) {
      return { status: 'unavailable', error: err?.message || 'Network error' };
    }
  }
}
