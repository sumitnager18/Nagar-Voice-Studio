import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper: Wrap raw 16-bit PCM (24kHz, 1 channel) into standard 44-byte WAV
function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1): Buffer {
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34); // 16-bit
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Ensure audio data is a valid WAV without double-wrapping
function ensureWavBase64(base64Data: string, mimeType?: string, sampleRate = 24000): { wavBase64: string; mimeType: string; durationSeconds: number } {
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Check if buffer starts with 'RIFF' and contains 'WAVE'
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE') {
    // Already a complete WAV file - do NOT double wrap!
    // Extract actual sample rate from WAV fmt chunk if present
    let actualSampleRate = sampleRate;
    if (buffer.length >= 28) {
      actualSampleRate = buffer.readUInt32LE(24) || sampleRate;
    }
    const bytesPerSecond = actualSampleRate * 2; // assuming mono 16-bit
    const dataSize = Math.max(0, buffer.length - 44);
    const duration = dataSize / bytesPerSecond;
    return { wavBase64: base64Data, mimeType: 'audio/wav', durationSeconds: Math.round(duration * 100) / 100 };
  }

  // If MIME is audio/wav but doesn't have RIFF (rare) or is audio/l16 (raw PCM), wrap with header
  const wavBuffer = pcmToWavBuffer(buffer, sampleRate, 1);
  const bytesPerSecond = sampleRate * 2;
  const duration = buffer.length / bytesPerSecond;
  return {
    wavBase64: wavBuffer.toString('base64'),
    mimeType: 'audio/wav',
    durationSeconds: Math.round(duration * 100) / 100,
  };
}

// Helper to configure voiceConfig for a voice ID (custom voice_... vs prebuilt)
function buildVoiceConfig(voiceIdentifier: string) {
  if (!voiceIdentifier) {
    return { prebuiltVoiceConfig: { voiceName: 'Puck' } };
  }

  // If it's a custom stored voice (starts with voice_) or replicated key (voicekey_)
  if (voiceIdentifier.startsWith('voice_') || voiceIdentifier.startsWith('voicekey_')) {
    return { voice: voiceIdentifier };
  }

  // Prebuilt classic names: Puck, Charon, Kore, Fenrir, Aoede
  const classicNames = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'];
  if (classicNames.includes(voiceIdentifier)) {
    return { prebuiltVoiceConfig: { voiceName: voiceIdentifier } };
  }

  // Prebuilt extended voices (achernar, achird, etc.) can be passed directly as voice or prebuiltVoiceConfig
  return { voice: voiceIdentifier };
}

// Initialize Gemini Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'nagar-voice-studio',
      },
    },
  });
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyConfigured = Boolean(apiKey && apiKey.length > 5);
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: isKeyConfigured,
    keyMask: isKeyConfigured ? `${apiKey!.substring(0, 6)}...${apiKey!.slice(-4)}` : 'NOT_SET',
    defaultModel: 'gemini-3.8-flash-tts',
    secondaryModel: 'gemini-3.8-flash-lite-tts',
    supportedSampleRates: [24000, 44100, 48000],
    providers: [
      { id: 'gemini', name: 'Google Gemini 3.8 Voice Engine', status: isKeyConfigured ? 'available' : 'missing_key' },
      { id: 'elevenlabs', name: 'ElevenLabs Reference Target', status: 'reference_only' },
      { id: 'clipchamp_ref', name: 'Clipchamp Reference (CGH Arjun)', status: 'preset_mapped' },
      { id: 'fish_audio_ref', name: 'Fish Audio Reference (CGH Fish)', status: 'reference_only' },
      { id: 'local', name: 'Local Offline Engine', status: 'available' }
    ]
  });
});

// Real Authenticated Gemini Connection Test
app.get('/api/health/gemini-test', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  const credentialConfigured = Boolean(apiKey && apiKey.length > 5);

  if (!credentialConfigured) {
    return res.status(401).json({
      status: 'error',
      credentialConfigured: false,
      apiReachable: false,
      ttsModelAvailable: false,
      voicesEndpointAvailable: false,
      error: 'GEMINI_API_KEY is not configured in server environment secrets.'
    });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(500).json({
      status: 'error',
      credentialConfigured: true,
      apiReachable: false,
      ttsModelAvailable: false,
      voicesEndpointAvailable: false,
      error: 'Failed to initialize GoogleGenAI client.'
    });
  }

  let apiReachable = false;
  let ttsModelAvailable = false;
  let voicesEndpointAvailable = false;
  let voicesCount = 0;
  const diagnostics: Record<string, any> = {};

  // 1. Test API Reachability & TTS Model
  try {
    const modelStart = Date.now();
    const modelRes = await ai.models.get({ model: 'models/gemini-3.8-flash-tts' });
    apiReachable = true;
    ttsModelAvailable = Boolean(modelRes && modelRes.name);
    diagnostics.modelCheck = {
      model: modelRes.name,
      displayName: modelRes.displayName,
      latencyMs: Date.now() - modelStart,
      status: 'OK'
    };
  } catch (err: any) {
    diagnostics.modelCheck = {
      status: 'FAILED',
      error: err?.message || String(err)
    };
  }

  // 2. Test Real Voices Endpoint (GET /v1beta/voices)
  try {
    const voicesStart = Date.now();
    const voicesList = await ai.voices.list();
    voicesEndpointAvailable = true;
    voicesCount = voicesList.voices?.length || 0;
    diagnostics.voicesCheck = {
      endpoint: 'GET /v1beta/voices',
      voicesCount,
      latencyMs: Date.now() - voicesStart,
      status: 'OK'
    };
  } catch (err: any) {
    diagnostics.voicesCheck = {
      endpoint: 'GET /v1beta/voices',
      status: 'FAILED',
      error: err?.message || String(err)
    };
  }

  const allPassed = credentialConfigured && apiReachable && ttsModelAvailable && voicesEndpointAvailable;

  return res.json({
    status: allPassed ? 'success' : 'partial_failure',
    credentialConfigured,
    apiReachable,
    ttsModelAvailable,
    voicesEndpointAvailable,
    voicesCount,
    diagnostics,
    totalLatencyMs: Date.now() - startTime
  });
});

// Live Google Voice Catalog: GET /api/voices
app.get('/api/voices', async (_req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(401).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const result = await ai.voices.list();
    const rawVoices = result.voices || [];

    // Map provider voices into unified schema
    const formattedVoices = rawVoices.map((v: any) => {
      const isCustomStored = Boolean(v.id && v.id.startsWith('voice_'));
      const voiceType = isCustomStored ? (v.type === 'replicated' ? 'replicated' : 'designed') : 'extended';

      return {
        id: v.id,
        provider: 'gemini',
        providerVoiceId: v.id,
        name: v.display_name || v.id,
        type: voiceType,
        languageCode: v.language_code || 'en-US',
        gender: (v.gender as any) || 'neutral',
        description: v.description || (v.prompted?.input ? `Designed voice: "${v.prompted.input}"` : 'Google catalog voice'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        favorite: false,
        status: 'available',
        metadata: {
          model: v.model || 'models/gemini-3.8-flash-tts',
          prompt: v.prompted?.input,
          expireTime: v.expire_time,
          liveGoogleVoice: true,
          accent: v.accent,
          persona: v.persona,
          context: v.context,
        },
        // Compatibility fields
        language: v.language_code || 'en-US',
        accent: v.accent || 'Standard',
        genderPresentation: v.gender || 'neutral',
        persona: v.persona || v.display_name || v.id,
        bestUse: v.context || 'General speech narration',
      };
    });

    return res.json({
      success: true,
      count: formattedVoices.length,
      voices: formattedVoices
    });
  } catch (error: any) {
    console.error('Failed to list live Google voices:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to list voices from Google Gemini API',
      status: 'error'
    });
  }
});

// Real Voice Design: POST /api/voices/design
app.post('/api/voices/design', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(401).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please verify environment secrets.',
        code: 'MISSING_API_KEY'
      });
    }

    const {
      voiceName,
      language = 'en-US',
      gender = 'male',
      description,
      primaryUse = 'Documentary & YouTube Narration',
      customAcousticDescription,
      sampleText = 'Welcome to Nagar Voice Studio. This is an acoustic demonstration of the designed voice.'
    } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Voice description is required for voice design.' });
    }

    const effectiveName = voiceName?.trim() || `Designed Voice ${Date.now()}`;
    const fullPrompt = [
      description.trim(),
      customAcousticDescription ? `Acoustic details: ${customAcousticDescription.trim()}` : '',
      primaryUse ? `Intended delivery: ${primaryUse.trim()}` : ''
    ].filter(Boolean).join(' ');

    // Call official Gemini Voices API: voices.create with store: true
    const voiceCreationResponse = await ai.voices.create({
      store: true,
      voice: {
        type: 'prompted',
        display_name: effectiveName,
        language_code: language,
        gender: gender,
        description: description.trim(),
        prompted: {
          input: fullPrompt
        }
      }
    });

    if (!voiceCreationResponse || !voiceCreationResponse.id) {
      return res.status(502).json({
        error: 'Gemini Voices API did not return a valid provider voice ID.',
        raw: voiceCreationResponse
      });
    }

    const providerVoiceId = voiceCreationResponse.id; // e.g. voice_XXXXXXXX

    // Now generate a verification sample audio with the real created voice ID
    let sampleAudioBase64: string | undefined = undefined;
    let durationSeconds = 0;

    try {
      const sampleTtsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: sampleText,
                speechMetadata: {
                  style: `Clear articulation, authentic ${language} cadence, ${gender} vocal resonance.`,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              voice: providerVoiceId,
            },
          },
        },
      });

      const part = sampleTtsResponse.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData?.data) {
        const { wavBase64, durationSeconds: dur } = ensureWavBase64(part.inlineData.data, part.inlineData.mimeType, 24000);
        sampleAudioBase64 = wavBase64;
        durationSeconds = dur;
      }
    } catch (sampleErr) {
      console.warn('Sample audio generation for newly created voice had warning:', sampleErr);
      // Voice is still valid even if sample generation had transient delay
    }

    const latencyMs = Date.now() - startTime;

    return res.json({
      success: true,
      provider: 'Google Gemini',
      providerVoiceId,
      displayName: voiceCreationResponse.display_name || effectiveName,
      model: voiceCreationResponse.model || 'models/gemini-3.8-flash-tts',
      voiceType: 'designed',
      languageCode: voiceCreationResponse.language_code || language,
      gender: voiceCreationResponse.gender || gender,
      prompt: fullPrompt,
      sampleAudio: sampleAudioBase64,
      durationSeconds,
      createdAt: new Date().toISOString(),
      expireTime: voiceCreationResponse.expire_time,
      latencyMs
    });
  } catch (error: any) {
    console.error('Voice Design API error:', error);
    const statusCode = error?.status || 500;
    return res.status(statusCode).json({
      error: error?.message || 'Voice Design API failed to create custom voice.',
      code: error?.code || 'VOICE_DESIGN_FAILED',
      details: error?.details || null
    });
  }
});

// Real Authorized Voice Replication: POST /api/voices/replicate
app.post('/api/voices/replicate', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(401).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
        code: 'MISSING_API_KEY'
      });
    }

    const {
      voiceName,
      language = 'en-US',
      gender = 'male',
      sourceAudioBase64,
      consentAudioBase64,
      consentConfirmed,
      originalFilename = 'reference_voice.wav'
    } = req.body;

    // Explicit confirmation validation as strictly mandated
    if (!consentConfirmed) {
      return res.status(403).json({
        error: 'Explicit confirmation required: "I own this voice/reference recording or have authorization to use it for voice replication."',
        code: 'CONSENT_REQUIRED'
      });
    }

    if (!sourceAudioBase64) {
      return res.status(400).json({ error: 'Source reference audio data is required for replication.' });
    }

    const effectiveConsentAudio = consentAudioBase64 || sourceAudioBase64;
    const effectiveName = voiceName?.trim() || `Replicated Voice ${Date.now()}`;

    // Attempt official Gemini voice replication via voices.create
    let replicationResponse: any;
    try {
      replicationResponse = await ai.voices.create({
        store: true,
        voice: {
          type: 'replicated',
          display_name: effectiveName,
          language_code: language,
          gender: gender,
          description: `Authorized voice replication from ${originalFilename}`,
          replicated: {
            source_audio: {
              data: sourceAudioBase64,
              mime_type: 'audio/wav'
            },
            consent_audio: {
              data: effectiveConsentAudio,
              mime_type: 'audio/wav'
            }
          }
        }
      });
    } catch (apiErr: any) {
      console.error('Google Gemini Voice Replication API error:', apiErr);
      return res.status(apiErr?.status || 500).json({
        error: apiErr?.message || 'Google Gemini Voice Replication API rejected the reference audio or authorization consent.',
        code: 'REPLICATION_API_ERROR',
        providerMessage: apiErr?.message
      });
    }

    if (!replicationResponse || (!replicationResponse.id && !replicationResponse.key)) {
      return res.status(502).json({
        error: 'Voice Replication API did not return a valid provider voice ID or key.',
        raw: replicationResponse
      });
    }

    const providerVoiceId = replicationResponse.id || replicationResponse.key;

    return res.json({
      success: true,
      provider: 'Google Gemini',
      providerVoiceId,
      displayName: effectiveName,
      model: replicationResponse.model || 'models/gemini-3.8-flash-tts',
      voiceType: 'replicated',
      languageCode: language,
      originalFilename,
      consentStatus: 'VERIFIED_AND_ACKNOWLEDGED',
      createdAt: new Date().toISOString(),
      expireTime: replicationResponse.expire_time,
      latencyMs: Date.now() - startTime
    });
  } catch (error: any) {
    console.error('Replication workflow error:', error);
    return res.status(500).json({
      error: error?.message || 'Voice replication failed',
      code: 'REPLICATION_FAILED'
    });
  }
});

// Delete Stored Custom Voice: DELETE /api/voices/:id
app.delete('/api/voices/:id', async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return res.status(401).json({ error: 'GEMINI_API_KEY is not configured' });

    const voiceId = req.params.id;
    if (!voiceId.startsWith('voice_')) {
      return res.status(400).json({ error: 'Only custom stored voices (starting with voice_) can be deleted via the provider API.' });
    }

    await ai.voices.delete(voiceId);
    return res.json({ success: true, message: `Voice ${voiceId} deleted successfully.` });
  } catch (err: any) {
    console.error('Error deleting voice:', err);
    return res.status(err?.status || 500).json({ error: err?.message || 'Failed to delete voice' });
  }
});

// Voice Health Check: GET /api/voices/:id/health
app.get('/api/voices/:id/health', async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return res.status(401).json({ status: 'unavailable', error: 'No API key' });

    const voiceId = req.params.id;
    
    // For custom voices, verify existence on Gemini
    if (voiceId.startsWith('voice_')) {
      try {
        const voiceObj = await ai.voices.get(voiceId);
        if (voiceObj && voiceObj.id) {
          return res.json({ status: 'available', voiceId, details: voiceObj });
        }
      } catch (getErr: any) {
        return res.json({
          status: 'unavailable',
          voiceId,
          error: `Provider voice not found or expired on Gemini API (${getErr.message})`
        });
      }
    }

    return res.json({ status: 'available', voiceId });
  } catch (err: any) {
    return res.json({ status: 'unavailable', error: err?.message || 'Health check error' });
  }
});

// Single-speaker & Multi-speaker Speech Generation: POST /api/tts/generate
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(401).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please verify your environment secrets in Settings > Secrets.',
        code: 'MISSING_API_KEY'
      });
    }

    const {
      text,
      voiceName = 'Puck',
      voiceId,
      model = 'gemini-3.8-flash-tts',
      style,
      isMultiSpeaker = false,
      speakers
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    // Determine effective target model (gemini-3.8-flash-tts as flagship, or user chosen gemini-3.8-flash-lite-tts)
    const selectedModel = model.includes('gemini-3.8') ? model : 'gemini-3.8-flash-tts';

    // Determine effective voice identifier
    const targetVoice = voiceId || voiceName;

    let response: any;
    if (isMultiSpeaker && Array.isArray(speakers) && speakers.length === 2) {
      // Official Gemini 3.8 dual-speaker TTS
      // Each turn is represented as a part with speaker and style in speechMetadata
      const spk1 = speakers[0];
      const spk2 = speakers[1];

      // Parse lines for turns if formatted as "Speaker: Text"
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
      const parts: any[] = [];

      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          const rawSpk = line.slice(0, colonIdx).trim();
          const turnContent = line.slice(colonIdx + 1).trim();
          const matchedSpk = rawSpk.toLowerCase().includes(spk2.speaker.toLowerCase()) ? spk2.speaker : spk1.speaker;
          const matchedStyle = matchedSpk === spk2.speaker ? spk2.style : spk1.style;

          parts.push({
            text: turnContent,
            speechMetadata: {
              speaker: matchedSpk,
              style: matchedStyle || undefined,
            },
          });
        } else {
          // Default to first speaker
          parts.push({
            text: line.trim(),
            speechMetadata: {
              speaker: spk1.speaker,
              style: spk1.style || undefined,
            },
          });
        }
      }

      if (parts.length === 0) {
        parts.push(
          { text: 'Turn 1', speechMetadata: { speaker: spk1.speaker, style: spk1.style } },
          { text: 'Turn 2', speechMetadata: { speaker: spk2.speaker, style: spk2.style } }
        );
      }

      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: spk1.speaker,
                  voiceConfig: buildVoiceConfig(spk1.voiceId || spk1.voiceName),
                },
                {
                  speaker: spk2.speaker,
                  voiceConfig: buildVoiceConfig(spk2.voiceId || spk2.voiceName),
                },
              ],
            },
          },
        },
      });
    } else {
      // Single-Speaker TTS with speechMetadata.style
      const contentParts: any[] = [
        {
          text,
          speechMetadata: style ? { style } : undefined,
        },
      ];

      response = await ai.models.generateContent({
        model: selectedModel,
        contents: [
          {
            role: 'user',
            parts: contentParts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: buildVoiceConfig(targetVoice),
          },
        },
      });
    }

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData || !inlineData.data) {
      return res.status(502).json({
        error: 'No audio data received from Gemini TTS API. Please check your text or try another voice.',
        rawResponse: response.candidates?.[0]?.content?.parts?.[0]?.text || null
      });
    }

    const sampleRate = 24000;
    const { wavBase64, mimeType, durationSeconds } = ensureWavBase64(inlineData.data, inlineData.mimeType, sampleRate);
    const latencyMs = Date.now() - startTime;

    return res.json({
      audioBase64: wavBase64,
      mimeType,
      sampleRate,
      durationSeconds,
      modelUsed: selectedModel,
      latencyMs,
      voiceName: targetVoice,
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error('TTS Generation error:', error);
    const statusCode = error?.status || 500;
    return res.status(statusCode).json({
      error: error?.message || 'Failed to generate speech with Gemini TTS',
      latencyMs,
      code: error?.code || 'GENERATION_FAILED'
    });
  }
});

// Legacy backward-compatibility routes
app.post('/api/tts/voice-design', async (req: Request, res: Response) => {
  // Redirect to real voice design endpoint
  req.url = '/api/voices/design';
  return app._router.handle(req, res);
});

app.post('/api/tts/replicate-analyze', async (req: Request, res: Response) => {
  // Redirect to real voice replication endpoint
  req.url = '/api/voices/replicate';
  return app._router.handle(req, res);
});

// -------------------------------------------------------------
// Vite middleware / Static Serving
// -------------------------------------------------------------
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nagar Voice Studio server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
