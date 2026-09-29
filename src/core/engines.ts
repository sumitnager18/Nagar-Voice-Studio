export type EngineKind = 'tts' | 'audio' | 'lipsync' | 'story' | 'export';

export type EngineStatus = 'verified' | 'available' | 'configured' | 'unavailable' | 'simulated';

export interface EngineDescriptor {
  id: string;
  name: string;
  kind: EngineKind;
  status: EngineStatus;
  version?: string;
  endpoint?: string;
  capabilities: string[];
  details?: Record<string, unknown>;
}

export interface EngineRegistrySnapshot {
  generatedAt: string;
  engines: EngineDescriptor[];
}

export class EngineRegistry {
  private engines = new Map<string, EngineDescriptor>();

  register(engine: EngineDescriptor): void {
    this.engines.set(engine.id, engine);
  }

  get(id: string): EngineDescriptor | undefined {
    return this.engines.get(id);
  }

  list(): EngineDescriptor[] {
    return [...this.engines.values()];
  }

  snapshot(): EngineRegistrySnapshot {
    return { generatedAt: new Date().toISOString(), engines: this.list() };
  }
}
