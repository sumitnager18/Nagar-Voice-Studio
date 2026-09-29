import { EngineRegistry } from './engines';
import { InMemoryJobStore } from './jobs';
import { LocalWorkerClient } from './localWorker';

export const mediaSuite = {
  engines: new EngineRegistry(),
  jobs: new InMemoryJobStore(),
  localWorker: new LocalWorkerClient(),
};

mediaSuite.engines.register({
  id: 'nagar-gemini-tts',
  name: 'Nagar Voice — Gemini TTS',
  kind: 'tts',
  status: 'configured',
  capabilities: ['speech-generation', 'voice-catalog', 'voice-design', 'authorized-replication'],
});

mediaSuite.engines.register({
  id: 'nagar-local-tts',
  name: 'Nagar Voice — Local Worker',
  kind: 'tts',
  status: 'available',
  endpoint: mediaSuite.localWorker.endpoint,
  capabilities: ['offline-speech', 'worker-capability-discovery'],
});

mediaSuite.engines.register({
  id: 'cgh-lipsync',
  name: 'CGH Local LipSync Studio',
  kind: 'lipsync',
  status: 'available',
  endpoint: 'http://127.0.0.1:8000',
  capabilities: ['wav2lip', 'musetalk-adapter', 'animation-verification', 'mp4', 'gif'],
});

mediaSuite.engines.register({
  id: 'cgh-story-studio',
  name: 'CGH Story Studio',
  kind: 'story',
  status: 'available',
  capabilities: ['projects', 'scenes', 'timeline', 'assets', 'audio-routing', 'export-adapter'],
});
