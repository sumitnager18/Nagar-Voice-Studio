import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Sparkles,
  Layers,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Users,
  Download,
  ShieldCheck,
  Disc3,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ProductionMode, Project, ScriptChunk, SpeakerTurn } from '../../types/project';
import { ModelProfileMode, Voice, VoicePreset } from '../../types/tts';
import { NLPTokenHighlight, ScriptStats, SupportedLanguage } from '../../types/nlp';
import { AudioMasteringConfig, QAQualityReport } from '../../types/audio';

import { ScriptEditor } from './ScriptEditor';
import { ProductionModeSelector } from './ProductionModeSelector';
import { VoiceControlsPanel } from './VoiceControlsPanel';
import { DialogueEditor } from './DialogueEditor';
import { ChunkProgressQueue } from './ChunkProgressQueue';
import { WaveformPlayer } from './WaveformPlayer';
import { SpeechQAModal } from './SpeechQAModal';

import { TextAnalyzer } from '../../services/nlp/TextAnalyzer';
import { TextNormalizer } from '../../services/nlp/TextNormalizer';
import { LanguageDetector } from '../../services/nlp/LanguageDetector';
import { SentenceSegmenter } from '../../services/nlp/SentenceSegmenter';
import { PronunciationManager } from '../../services/nlp/PronunciationManager';
import { AudioProcessor } from '../../services/audio/AudioProcessor';
import { AudioAssembler } from '../../services/audio/AudioAssembler';
import { AudioExporter } from '../../services/audio/AudioExporter';
import { SpeechQAService } from '../../services/audio/SpeechQAService';
import { LocalDatabase } from '../../services/storage/LocalDatabase';

interface StudioScreenProps {
  project: Project;
  voices: Voice[];
  presets: VoicePreset[];
  pronunciationManager: PronunciationManager;
  onUpdateProject: (updated: Project) => void;
  onSaveNewVersion: () => void;
  onOpenVoiceDna: (voiceId: string) => void;
}

export const StudioScreen: React.FC<StudioScreenProps> = ({
  project,
  voices,
  presets,
  pronunciationManager,
  onUpdateProject,
  onSaveNewVersion,
  onOpenVoiceDna,
}) => {
  // Master audio & buffer state
  const [masterAudioBuffer, setMasterAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingChunkId, setCurrentGeneratingChunkId] = useState<string | null>(null);
  const [cancelRequested, setCancelRequested] = useState(false);

  // NLP & Highlights
  const [highlights, setHighlights] = useState<NLPTokenHighlight[]>([]);
  const [qaReport, setQaReport] = useState<QAQualityReport | null>(null);
  const [isQaOpen, setIsQaOpen] = useState(false);

  // Mastering config state
  const [masteringConfig, setMasteringConfig] = useState<AudioMasteringConfig>({
    preset: project.masterMasteringPreset || 'VOICEOVER',
    trimSilence: true,
    silenceThresholdDb: -45,
    normalizeLoudness: true,
    compression: true,
    limiter: true,
    interChunkPauseMs: 400,
    crossfadeMs: 12,
  });

  // Calculate live stats
  const stats: ScriptStats = useMemo(() => {
    return TextAnalyzer.analyze(project.originalScript, project.speed);
  }, [project.originalScript, project.speed]);

  // Run NLP Analysis
  const runNlpAnalysis = () => {
    const forcedLang = project.language;
    const detected = forcedLang === 'AUTO' ? LanguageDetector.detect(project.originalScript) : forcedLang;

    const { processedText, highlights: newHighlights } = TextNormalizer.normalize(
      project.originalScript,
      detected,
      pronunciationManager,
      project.id,
      project.voicePresetId
    );

    setHighlights(newHighlights);
    onUpdateProject({
      ...project,
      processedScript: processedText,
      language: forcedLang === 'AUTO' ? detected : forcedLang,
    });
  };

  // Run initial NLP analysis on mount if processed script is missing
  useEffect(() => {
    if (!project.processedScript && project.originalScript) {
      runNlpAnalysis();
    }
  }, [project.id]);

  // Load sample texts (Sections 83)
  const handleLoadSample = (key: 'english' | 'hindi' | 'hinglish' | 'computerguruhub') => {
    let text = '';
    let mode: ProductionMode = project.productionMode;
    let lang: SupportedLanguage = project.language;

    switch (key) {
      case 'computerguruhub':
        text = `Welcome to ComputerGuruHub. Python एक high-level programming language है, जिसका उपयोग automation, data analysis और artificial intelligence में किया जाता है।

आज के lesson में हम समझेंगे कि GPU acceleration और neural networks कैसे बड़े machine learning models को train करते हैं।`;
        mode = 'computerguruhub';
        lang = 'HINGLISH';
        break;
      case 'hinglish':
        text = 'आज हम artificial intelligence और machine learning के basic concepts को समझेंगे। ये concepts modern web development और robotics में बहुत important हैं।';
        mode = 'standard';
        lang = 'HINGLISH';
        break;
      case 'hindi':
        text = 'नमस्ते। आज हम जानेंगे कि कृत्रिम बुद्धिमत्ता हमारे सीखने के तरीके को कैसे बदल रही है। ज्ञान और विज्ञान का यह संगम एक नई क्रांति ला रहा है।';
        mode = 'story';
        lang = 'HINDI';
        break;
      case 'english':
        text = 'Welcome to Nagar Voice Studio. Today we are going to explore how artificial intelligence is changing the way we learn and produce professional media.';
        mode = 'standard';
        lang = 'ENGLISH';
        break;
    }

    onUpdateProject({
      ...project,
      originalScript: text,
      productionMode: mode,
      language: lang,
    });
  };

  // Switch Production Mode
  const handleSelectMode = (mode: ProductionMode) => {
    let defaultPreset = project.voicePresetId;
    let defaultStyle = project.style;
    let defaultSpeed = project.speed;

    if (mode === 'computerguruhub') {
      defaultPreset = 'preset-cgh-arjun-yt-doc';
      defaultStyle = 'CGH Hindi presenter/narrator voice. Educational authority with clear pronunciation.';
      defaultSpeed = 1.5;
    } else if (mode === 'youtube') {
      defaultPreset = 'preset-cgh-arjun-yt-doc';
      defaultStyle = 'Authoritative documentary tone, clear technical emphasis.';
      defaultSpeed = 1.25;
    } else if (mode === 'story') {
      defaultPreset = 'preset-cgh-arjun-story';
      defaultStyle = 'Dramatic narrative timing with subtle emotional dynamics.';
      defaultSpeed = 1.0;
    }

    onUpdateProject({
      ...project,
      productionMode: mode,
      voicePresetId: defaultPreset,
      style: defaultStyle,
      speed: defaultSpeed,
    });
  };

  // Prepare Chunks
  const handlePrepareChunks = () => {
    runNlpAnalysis();
    const sourceText = project.processedScript || project.originalScript;

    if (project.productionMode === 'dialogue' && project.dialogueTurns && project.dialogueTurns.length > 0) {
      // Chunk from dialogue turns
      const chunks: ScriptChunk[] = project.dialogueTurns.map((turn, idx) => ({
        id: `chunk-${Date.now()}-${idx}`,
        sequence: idx,
        originalText: turn.text,
        processedText: turn.text,
        speaker: turn.speaker,
        voiceId: turn.voiceId,
        provider: 'gemini',
        model: project.resolvedModel || 'gemini-3.8-flash-tts',
        style: turn.style || project.style,
        speed: project.speed,
        status: 'waiting',
        progressPercent: 0,
      }));

      onUpdateProject({ ...project, chunks });
      return chunks;
    }

    // Standard long-form text chunking
    const activeVoice = voices.find((v) => v.id === project.voiceId) || voices[0];
    const textSegments = SentenceSegmenter.chunkText(sourceText, 550);
    const chunks: ScriptChunk[] = textSegments.map((segment, idx) => ({
      id: `chunk-${Date.now()}-${idx}`,
      sequence: idx,
      originalText: segment,
      processedText: segment,
      voiceId: project.voiceId,
      providerVoiceId: activeVoice?.providerVoiceId || 'Puck',
      voiceType: activeVoice?.type || 'designed',
      provider: project.provider,
      model: project.resolvedModel || 'gemini-3.8-flash-tts',
      style: project.style,
      speed: project.speed,
      status: 'waiting',
      progressPercent: 0,
      generationDate: new Date().toISOString(),
    }));

    onUpdateProject({
      ...project,
      chunks,
      providerVoiceId: activeVoice?.providerVoiceId,
      voiceType: activeVoice?.type,
      generationDate: new Date().toISOString(),
    });
    return chunks;
  };

  // Generate a single chunk with retry and backoff (Sections 29, 30)
  const generateChunkSpeech = async (
    chunk: ScriptChunk,
    currentVoice: Voice
  ): Promise<{ audioBase64: string; durationSeconds: number; latencyMs: number }> => {
    // Section 30: Always preserve and reuse the chunk's providerVoiceId
    const effectiveVoiceId = chunk.providerVoiceId || currentVoice.providerVoiceId || project.providerVoiceId || 'Puck';

    let composedStyle = chunk.style || project.style || '';
    if (project.emotion) {
      composedStyle += ` Emotion: ${project.emotion}.`;
    }
    if (project.speed && project.speed !== 1.0) {
      composedStyle += ` Pace: approximately ${project.speed}x.`;
    }

    const payload = {
      text: chunk.processedText || chunk.originalText,
      voiceId: effectiveVoiceId,
      voiceName: effectiveVoiceId,
      model: chunk.model || project.resolvedModel || 'gemini-3.8-flash-tts',
      style: composedStyle.trim(),
    };

    const res = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return await res.json();
  };

  // Main Speech Generation Trigger (Sequential queue with cancellation support)
  const handleGenerateAll = async () => {
    let currentChunks = project.chunks;
    if (!currentChunks || currentChunks.length === 0) {
      currentChunks = handlePrepareChunks();
    }

    if (!currentChunks || currentChunks.length === 0) {
      alert('Please enter a script before generating audio.');
      return;
    }

    setIsGenerating(true);
    setCancelRequested(false);

    const activeVoice = voices.find((v) => v.id === project.voiceId) || voices[0];
    const updatedChunks = [...currentChunks];

    for (let i = 0; i < updatedChunks.length; i++) {
      if (cancelRequested) {
        break;
      }

      const chunk = updatedChunks[i];
      if (chunk.status === 'complete' && chunk.audioBase64) {
        continue; // preserve already completed chunks
      }

      setCurrentGeneratingChunkId(chunk.id);
      chunk.status = 'generating';
      chunk.progressPercent = 30;
      onUpdateProject({ ...project, chunks: [...updatedChunks], generationStatus: 'in_progress' });

      try {
        const result = await generateChunkSpeech(chunk, activeVoice);
        chunk.status = 'complete';
        chunk.progressPercent = 100;
        chunk.audioBase64 = result.audioBase64;
        chunk.durationSeconds = result.durationSeconds;
        chunk.latencyMs = result.latencyMs;
        chunk.error = undefined;
      } catch (err: any) {
        console.error(`Chunk ${i + 1} generation failed:`, err);
        chunk.status = 'failed';
        chunk.error = err.message || 'Generation failed';
        chunk.retryCount = (chunk.retryCount || 0) + 1;
      }

      onUpdateProject({ ...project, chunks: [...updatedChunks] });

      // Small delay between calls to prevent rate limiting
      await new Promise((r) => setTimeout(r, 200));
    }

    setIsGenerating(false);
    setCurrentGeneratingChunkId(null);

    // Assemble completed chunks into Master Audio
    await assembleMasterAudio(updatedChunks);
  };

  // Assemble Master Audio
  const assembleMasterAudio = async (chunkList: ScriptChunk[]) => {
    const completed = chunkList.filter((c) => c.status === 'complete' && c.audioBase64);
    if (completed.length === 0) return;

    try {
      const audioBuffers: AudioBuffer[] = [];
      for (const c of completed) {
        const buf = await AudioProcessor.decodeAudio(c.audioBase64!);
        audioBuffers.push(buf);
      }

      const assembled = await AudioAssembler.assemble(
        audioBuffers,
        masteringConfig.interChunkPauseMs,
        masteringConfig.crossfadeMs
      );

      setMasterAudioBuffer(assembled);

      // Create a master WAV blob and URL
      const masterBlob = AudioProcessor.audioBufferToWavBlob(assembled);
      const masterUrl = URL.createObjectURL(masterBlob);

      onUpdateProject({
        ...project,
        masterAudioUrl: masterUrl,
        masterAudioDuration: assembled.duration,
        generationStatus: 'completed',
      });

      // Save as AudioAsset in local database
      const activeVoice = voices.find((v) => v.id === project.voiceId) || voices[0];
      const filename = AudioExporter.generateFilename(project.title, activeVoice.name, undefined, 'WAV');
      LocalDatabase.addAudioAsset({
        id: `asset-${Date.now()}`,
        filename,
        projectId: project.id,
        projectTitle: project.title,
        voiceId: activeVoice.id,
        voiceName: activeVoice.name,
        provider: project.provider,
        model: project.resolvedModel,
        format: 'WAV',
        sampleRate: assembled.sampleRate,
        durationSeconds: assembled.duration,
        fileSizeBytes: masterBlob.size,
        createdAt: new Date().toISOString(),
        audioUrl: masterUrl,
      });
    } catch (err) {
      console.error('Master audio assembly error:', err);
    }
  };

  // Retry single chunk
  const handleRetryChunk = async (chunkId: string) => {
    const activeVoice = voices.find((v) => v.id === project.voiceId) || voices[0];
    const updatedChunks = [...project.chunks];
    const chunk = updatedChunks.find((c) => c.id === chunkId);
    if (!chunk) return;

    chunk.status = 'generating';
    onUpdateProject({ ...project, chunks: [...updatedChunks] });

    try {
      const result = await generateChunkSpeech(chunk, activeVoice);
      chunk.status = 'complete';
      chunk.audioBase64 = result.audioBase64;
      chunk.durationSeconds = result.durationSeconds;
      chunk.latencyMs = result.latencyMs;
      chunk.error = undefined;
    } catch (err: any) {
      chunk.status = 'failed';
      chunk.error = err.message || 'Retry failed';
    }

    onUpdateProject({ ...project, chunks: [...updatedChunks] });
    await assembleMasterAudio(updatedChunks);
  };

  // Run Speech QA
  const handleRunQA = () => {
    const report = SpeechQAService.evaluate(
      project.chunks,
      masterAudioBuffer,
      project.targetDurationSeconds
    );
    setQaReport(report);
    setIsQaOpen(true);
  };

  const activeVoice = voices.find((v) => v.id === project.voiceId) || voices[0];

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Top Project Bar & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#25272e] pb-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={project.title}
            onChange={(e) => onUpdateProject({ ...project, title: e.target.value })}
            className="text-base font-bold text-slate-100 bg-transparent border-b border-transparent hover:border-[#353742] focus:border-amber-400 focus:outline-none px-1 py-0.5"
          />
          <span className="text-[11px] font-mono text-slate-400">
            Version {project.currentVersion || 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Generate New Version without overwriting (Section 37) */}
          <button
            onClick={onSaveNewVersion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202228] hover:bg-[#282b33] text-slate-200 text-xs font-medium border border-[#2d3038] transition-colors"
            title="Create a new version snapshot"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>+ New Version</span>
          </button>

          {/* Primary Generate Audio Action Button */}
          <button
            onClick={handleGenerateAll}
            disabled={isGenerating || !project.originalScript.trim()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold shadow-md shadow-amber-950/40 disabled:opacity-40 transition-transform active:scale-95"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Speech...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Generate Audio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Production Mode Tabs */}
      <ProductionModeSelector
        currentMode={project.productionMode}
        onSelectMode={handleSelectMode}
      />

      {/* Interrupted Generation Recovery Banner (Section 90) */}
      {project.generationStatus === 'interrupted' && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Generation interrupted during previous session. You can resume or restart.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAll}
              className="px-3 py-1 rounded bg-amber-500 text-black font-semibold text-xs"
            >
              Resume Generation
            </button>
            <button
              onClick={() => onUpdateProject({ ...project, generationStatus: 'idle' })}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Grid: Editor (Left) & Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Script Editor & Dialogue (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ScriptEditor
            originalText={project.originalScript}
            processedText={project.processedScript}
            highlights={highlights}
            stats={stats}
            detectedLanguage={project.language}
            onChangeOriginal={(val) => onUpdateProject({ ...project, originalScript: val })}
            onAnalyze={runNlpAnalysis}
            onLoadSample={handleLoadSample}
            disabled={isGenerating}
          />

          {/* Dialogue Mode Editor */}
          {project.productionMode === 'dialogue' && (
            <DialogueEditor
              turns={project.dialogueTurns || []}
              voices={voices}
              onChangeTurns={(turns) => onUpdateProject({ ...project, dialogueTurns: turns })}
            />
          )}

          {/* Long Script Chunk Progress Queue */}
          {project.chunks && project.chunks.length > 0 && (
            <ChunkProgressQueue
              chunks={project.chunks}
              isGenerating={isGenerating}
              onRetryChunk={handleRetryChunk}
              onRetryFailed={() => {
                const failedChunk = project.chunks.find((c) => c.status === 'failed');
                if (failedChunk) handleRetryChunk(failedChunk.id);
              }}
              onRetryAll={handleGenerateAll}
              onCancelGeneration={() => setCancelRequested(true)}
              onPlayChunkAudio={async (chunk) => {
                if (chunk.audioBase64) {
                  const buf = await AudioProcessor.decodeAudio(chunk.audioBase64);
                  setMasterAudioBuffer(buf);
                }
              }}
            />
          )}
        </div>

        {/* Right Column: Voice & Parameters Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <VoiceControlsPanel
            voices={voices}
            presets={presets}
            selectedVoiceId={project.voiceId}
            selectedPresetId={project.voicePresetId}
            selectedLanguage={project.language}
            selectedStyle={project.style}
            selectedEmotion={project.emotion}
            speed={project.speed}
            pitch={project.pitch}
            modelMode={project.modelMode}
            onSelectVoice={(vId) => onUpdateProject({ ...project, voiceId: vId })}
            onSelectPreset={(pId) => {
              const preset = presets.find((p) => p.id === pId);
              if (preset) {
                onUpdateProject({
                  ...project,
                  voicePresetId: preset.id,
                  voiceId: preset.voiceId,
                  speed: preset.speed,
                  style: preset.style,
                  emotion: preset.emotion,
                });
              }
            }}
            onSelectLanguage={(lang) => onUpdateProject({ ...project, language: lang })}
            onSelectStyle={(st) => onUpdateProject({ ...project, style: st })}
            onSelectEmotion={(em) => onUpdateProject({ ...project, emotion: em })}
            onChangeSpeed={(spd) => onUpdateProject({ ...project, speed: spd })}
            onChangePitch={(p) => onUpdateProject({ ...project, pitch: p })}
            onChangeModelMode={(mm) => {
              const resolved = mm === 'MAXIMUM_QUALITY' ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts';
              onUpdateProject({ ...project, modelMode: mm, resolvedModel: resolved });
            }}
            onOpenVoiceDna={onOpenVoiceDna}
          />
        </div>
      </div>

      {/* Bottom Master Waveform Player */}
      <WaveformPlayer
        masterBuffer={masterAudioBuffer}
        projectTitle={project.title}
        voiceName={activeVoice.name}
        onRunQA={handleRunQA}
        masteringConfig={masteringConfig}
        onChangeMasteringPreset={(preset) => {
          setMasteringConfig((prev) => ({ ...prev, preset }));
          onUpdateProject({ ...project, masterMasteringPreset: preset });
        }}
      />

      {/* Speech QA Report Modal */}
      <SpeechQAModal
        report={qaReport}
        isOpen={isQaOpen}
        onClose={() => setIsQaOpen(false)}
      />
    </div>
  );
};
