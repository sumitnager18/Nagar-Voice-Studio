export interface LocalWorkerCapabilities {
  worker: string;
  version?: string;
  engines: Array<{
    id: string;
    name: string;
    status: 'verified' | 'available' | 'unavailable';
    backend?: string;
    models?: string[];
    languages?: string[];
  }>;
  hardware?: {
    gpu?: string;
    backend?: string;
    vramBytes?: number;
  };
}

export interface LocalSpeechRequest {
  text: string;
  voice?: string;
  model?: string;
  language?: string;
  speed?: number;
  style?: string;
  emotion?: string;
}

export interface LocalSpeechResponse {
  audioBase64: string;
  mimeType: string;
  sampleRate: number;
  durationSeconds: number;
  modelUsed: string;
  provider: 'local';
  latencyMs?: number;
}

export class LocalWorkerClient {
  constructor(
    private readonly baseUrl = 'http://127.0.0.1:8080'
  ) {}

  private async request<T>(path: string, init?: RequestInit, timeoutMs = 2000): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, { ...init, signal: controller.signal });
      const body = await response.text();
      let parsed: unknown = null;
      try { parsed = body ? JSON.parse(body) : null; } catch { parsed = body; }
      if (!response.ok) {
        const message = typeof parsed === 'object' && parsed && 'error' in parsed
          ? String((parsed as { error: unknown }).error)
          : `Worker returned HTTP ${response.status}`;
        throw new Error(message);
      }
      return parsed as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async health(): Promise<boolean> {
    try { await this.request('/health', undefined, 1200); return true; } catch { return false; }
  }

  async capabilities(): Promise<LocalWorkerCapabilities> {
    return this.request<LocalWorkerCapabilities>('/capabilities', undefined, 2500);
  }

  async speech(request: LocalSpeechRequest): Promise<LocalSpeechResponse> {
    return this.request<LocalSpeechResponse>('/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }, 120000);
  }

  get endpoint(): string {
    return this.baseUrl;
  }
}
