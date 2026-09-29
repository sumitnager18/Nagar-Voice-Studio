import { GenderPresentation, SpeechRequest, SpeechResult, TtsProvider, Voice } from '../../types/tts';
import { LocalWorkerClient } from '../../core/localWorker';

export class LocalTtsProvider implements TtsProvider {
  public id = 'local';
  public name = 'Local TTS Engine';
  private readonly worker = new LocalWorkerClient();

  public async isAvailable(): Promise<boolean> {
    return this.worker.health();
  }

  public async generateSpeech(req: SpeechRequest): Promise<SpeechResult> {
    const started = Date.now();
    if (!(await this.worker.health())) {
      throw new Error(
        `Local TTS worker is unavailable at ${this.worker.endpoint}. Start a compatible local worker exposing /health, /capabilities and /v1/audio/speech.`
      );
    }

    const result = await this.worker.speech({
      text: req.text,
      voice: req.providerVoiceId || req.voiceId,
      model: req.model,
      language: req.language,
      speed: req.speed,
      style: req.style,
      emotion: req.emotion,
    });

    if (!result.audioBase64) {
      throw new Error('Local TTS worker returned no audio data.');
    }

    return {
      ...result,
      provider: 'local',
      latencyMs: result.latencyMs ?? Date.now() - started,
    };
  }

  public async listVoices(): Promise<Voice[]> {
    try {
      if (!(await this.worker.health())) return [];
      const capabilities = await this.worker.capabilities();
      const voices: Voice[] = [];
      for (const engine of capabilities.engines || []) {
        if (engine.status === 'unavailable') continue;
        for (const language of engine.languages || ['auto']) {
          voices.push({
            id: `local-${engine.id}-${language}`,
            provider: 'local',
            providerVoiceId: engine.id,
            name: `Local — ${engine.name}${language !== 'auto' ? ` (${language})` : ''}`,
            type: 'prebuilt',
            languageCode: language,
            gender: 'neutral',
            description: `Verified local worker engine: ${engine.name}`,
            favorite: false,
            status: 'available',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            language,
            accent: 'Detected by worker',
            persona: engine.name,
            bestUse: 'Offline/local narration',
            metadata: {
              engineId: engine.id,
              backend: engine.backend,
              models: engine.models,
              workerEndpoint: this.worker.endpoint,
              capabilityStatus: engine.status,
            },
          });
        }
      }
      return voices;
    } catch {
      return [];
    }
  }

  public async getVoice(id: string): Promise<Voice | null> {
    return (await this.listVoices()).find((voice) => voice.id === id) || null;
  }

  public async createVoice(_params: {
    name: string;
    description: string;
    language: string;
    gender: GenderPresentation;
    useCase: string;
  }): Promise<Voice> {
    throw new Error('Local voice training is not implemented by the worker contract yet.');
  }

  public async replicateVoice(_params: {
    name: string;
    audioBase64: string;
    originalFilename: string;
    consentGiven: boolean;
    language: string;
  }): Promise<Voice> {
    throw new Error('Local voice replication is not implemented by the worker contract yet.');
  }

  public async deleteVoice(_id: string): Promise<boolean> {
    return false;
  }

  public async previewVoice(voiceId: string, sampleText = 'This is a local voice test.') {
    return this.generateSpeech({
      text: sampleText,
      voiceId,
      providerVoiceId: voiceId,
      model: 'auto',
    });
  }
}
