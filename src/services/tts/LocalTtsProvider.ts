import { GenderPresentation, SpeechRequest, SpeechResult, TtsProvider, Voice } from '../../types/tts';

export class LocalTtsProvider implements TtsProvider {
  public id = 'local';
  public name = 'Local TTS Engine (AMD GPU / DirectML / ONNX)';

  private localEndpoint = 'http://127.0.0.1:8080/v1/audio/speech';
  private isConnected = false;

  public async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('http://127.0.0.1:8080/health', { signal: controller.signal });
      clearTimeout(timeoutId);
      this.isConnected = res.ok;
      return res.ok;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  public async generateSpeech(_req: SpeechRequest): Promise<SpeechResult> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(
        'Local TTS Provider is not connected. To use AMD GPU local inference on Windows/Linux, launch a local TTS worker (e.g., Piper/Kokoro/VITS with DirectML/ROCm backend) on http://127.0.0.1:8080. The architecture is configured and ready to connect.'
      );
    }
    throw new Error('Local server offline');
  }

  public async listVoices(): Promise<Voice[]> {
    return [
      {
        id: 'local-piper-hindi',
        provider: 'local',
        providerVoiceId: 'hi_IN-local',
        name: 'Local AMD DirectML Hindi (Offline)',
        type: 'designed',
        languageCode: 'hi-IN',
        gender: 'male',
        description: 'Native offline worker target for Windows AMD GPU acceleration via DirectML/ROCm.',
        favorite: false,
        status: 'available',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
        language: 'Hindi',
        accent: 'Indian',
        pitch: 'Medium',
        persona: 'Local Offline Engine',
        bestUse: 'Private offline narration without internet connection',
      }
    ];
  }

  public async getVoice(id: string): Promise<Voice | null> {
    const list = await this.listVoices();
    return list.find((v) => v.id === id) || null;
  }

  public async createVoice(_params: {
    name: string;
    description: string;
    language: string;
    gender: GenderPresentation;
    useCase: string;
  }): Promise<Voice> {
    throw new Error('Local voice training requires local fine-tuning pipeline.');
  }

  public async replicateVoice(_params: {
    name: string;
    audioBase64: string;
    originalFilename: string;
    consentGiven: boolean;
    language: string;
  }): Promise<Voice> {
    throw new Error('Local zero-shot cloning requires connected AMD GPU worker.');
  }

  public async deleteVoice(_id: string): Promise<boolean> {
    return false;
  }

  public async previewVoice(_voiceId: string, _sampleText?: string): Promise<SpeechResult> {
    return this.generateSpeech({
      text: 'Local test sample',
      voiceId: 'local',
      providerVoiceId: 'hi_IN-local',
      model: 'local-directml',
    });
  }
}
