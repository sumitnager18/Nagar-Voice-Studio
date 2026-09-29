export interface LipSyncCapabilities {
  status: string;
  engines?: Array<{
    id: string;
    name: string;
    status: string;
    backend?: string;
    providers?: string[];
  }>;
  hardware?: Record<string, unknown>;
  models?: Array<Record<string, unknown>>;
  onnxruntime?: Record<string, unknown>;
}

export interface LipSyncJobRequest {
  image: Blob;
  audio: Blob;
  engineId?: string;
  outputFormat?: 'mp4' | 'gif' | 'both';
  resolution?: 'original' | '720p' | '1080p';
  fps?: number;
}

export class LipSyncClient {
  constructor(private readonly baseUrl = 'http://127.0.0.1:8000') {}

  async capabilities(): Promise<LipSyncCapabilities> {
    const response = await fetch(`${this.baseUrl}/api/capabilities`);
    if (!response.ok) throw new Error(`Lip-sync service unavailable (HTTP ${response.status}).`);
    return response.json();
  }

  async generate(request: LipSyncJobRequest): Promise<{ jobId: string; status: string }> {
    const form = new FormData();
    form.append('image', request.image, 'character.png');
    form.append('audio', request.audio, 'speech.wav');
    form.append('engine_id', request.engineId || 'wav2lip_onnx');
    form.append('output_format', request.outputFormat || 'both');
    form.append('resolution', request.resolution || 'original');
    form.append('fps', String(request.fps || 25));

    const response = await fetch(`${this.baseUrl}/api/generate`, { method: 'POST', body: form });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Lip-sync generation failed (HTTP ${response.status}).`);
    }
    return response.json();
  }

  async job(jobId: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${encodeURIComponent(jobId)}`);
    if (!response.ok) throw new Error(`Lip-sync job lookup failed (HTTP ${response.status}).`);
    return response.json();
  }
}
