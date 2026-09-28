import { AudioAsset } from '../../types/audio';
import { PronunciationEntry } from '../../types/nlp';
import { Project, ProjectVersion } from '../../types/project';
import { Voice, VoicePreset } from '../../types/tts';
import { DEFAULT_PRONUNCIATION_ENTRIES } from '../nlp/PronunciationManager';
import { INITIAL_VOICE_PRESETS, INITIAL_VOICES } from '../tts/VoiceLibraryRepository';

const STORAGE_KEYS = {
  PROJECTS: 'nagar_voice_projects',
  ACTIVE_PROJECT_ID: 'nagar_voice_active_project_id',
  VOICES: 'nagar_voice_custom_voices',
  PRESETS: 'nagar_voice_custom_presets',
  PRONUNCIATION: 'nagar_voice_pronunciation',
  AUDIO_ASSETS: 'nagar_voice_audio_assets',
  SETTINGS: 'nagar_voice_settings',
  FIRST_RUN_DONE: 'nagar_voice_first_run_completed'
};

export interface AppSettings {
  defaultLanguage: 'AUTO' | 'HINDI' | 'ENGLISH' | 'HINGLISH';
  defaultModelMode: 'AUTO' | 'MAXIMUM_QUALITY' | 'BALANCED' | 'FAST';
  defaultVoiceId: string;
  defaultSpeed: number;
  pauseBetweenChunksMs: number;
  exportFormat: 'WAV' | 'MP3';
  exportSampleRate: 24000 | 44100 | 48000;
  mp3BitrateKbps: number;
  masteringPreset: 'OFF' | 'LIGHT' | 'VOICEOVER' | 'BROADCAST';
  theme: 'dark';
  enableOfflineCache: boolean;
  developerDiagnostics: boolean;
  privacyAck: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultLanguage: 'AUTO',
  defaultModelMode: 'BALANCED',
  defaultVoiceId: 'voice-cgh-arjun',
  defaultSpeed: 1.0,
  pauseBetweenChunksMs: 400,
  exportFormat: 'WAV',
  exportSampleRate: 24000,
  mp3BitrateKbps: 192,
  masteringPreset: 'VOICEOVER',
  theme: 'dark',
  enableOfflineCache: true,
  developerDiagnostics: true,
  privacyAck: false,
};

export class LocalDatabase {
  /**
   * Initializes default database state if empty
   */
  public static init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.PRONUNCIATION)) {
      localStorage.setItem(STORAGE_KEYS.PRONUNCIATION, JSON.stringify(DEFAULT_PRONUNCIATION_ENTRIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      const initialProject: Project = {
        id: 'proj-cgh-ai-intro',
        title: 'ComputerGuruHub — AI & Python Narration',
        productionMode: 'computerguruhub',
        originalScript: `Welcome to ComputerGuruHub. आज हम Python programming और Artificial Intelligence के basic architecture को detail में explore करेंगे।

Python एक high-level programming language है, जिसका उपयोग automation, data analysis और machine learning में किया जाता है। इसकी simplicity और huge library ecosystem इसे beginners और experts दोनों के लिए best choice बनाती है।

अगले chapter में, हम neural networks और GPU acceleration के concepts को code examples के साथ समझेंगे।`,
        processedScript: '',
        language: 'HINGLISH',
        voiceId: 'voice-cgh-arjun',
        voicePresetId: 'preset-cgh-arjun-yt-doc',
        provider: 'clipchamp_ref',
        modelMode: 'BALANCED',
        resolvedModel: 'gemini-3.8-flash-lite-tts',
        style: 'CGH Hindi presenter/narrator voice. Educational authority with clear pronunciation of technical terms.',
        emotion: 'Authoritative',
        speed: 1.5,
        pitch: 'Medium',
        narratorIdentityLock: true,
        chunks: [],
        currentVersion: 1,
        versions: [],
        generationStatus: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([initialProject]));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, initialProject.id);
    }
  }

  // --- Projects ---
  public static getProjects(): Project[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static saveProjects(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  public static getProject(id: string): Project | undefined {
    const list = this.getProjects();
    return list.find((p) => p.id === id);
  }

  public static saveProject(project: Project): void {
    const list = this.getProjects();
    const idx = list.findIndex((p) => p.id === project.id);
    project.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      list[idx] = project;
    } else {
      list.unshift(project);
    }
    this.saveProjects(list);
  }

  public static deleteProject(id: string): boolean {
    const list = this.getProjects();
    const updated = list.filter((p) => p.id !== id);
    if (updated.length !== list.length) {
      this.saveProjects(updated);
      return true;
    }
    return false;
  }

  public static getActiveProjectId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
  }

  public static setActiveProjectId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, id);
  }

  // --- Versions ---
  public static createNewVersion(project: Project): ProjectVersion {
    const newVerNum = (project.currentVersion || 1) + 1;
    const versionRecord: ProjectVersion = {
      versionNumber: newVerNum,
      createdAt: new Date().toISOString(),
      title: `${project.title} (v${newVerNum})`,
      originalScript: project.originalScript,
      processedScript: project.processedScript,
      voiceId: project.voiceId,
      voicePresetId: project.voicePresetId,
      speed: project.speed,
      style: project.style,
      emotion: project.emotion,
      language: project.language,
      masterAudioUrl: project.masterAudioUrl,
      masterDuration: project.masterAudioDuration,
      chunks: JSON.parse(JSON.stringify(project.chunks)),
    };

    project.versions = project.versions || [];
    project.versions.push(versionRecord);
    project.currentVersion = newVerNum;
    this.saveProject(project);
    return versionRecord;
  }

  // --- Pronunciation ---
  public static getPronunciationEntries(): PronunciationEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PRONUNCIATION);
      return raw ? JSON.parse(raw) : DEFAULT_PRONUNCIATION_ENTRIES;
    } catch {
      return DEFAULT_PRONUNCIATION_ENTRIES;
    }
  }

  public static savePronunciationEntries(entries: PronunciationEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.PRONUNCIATION, JSON.stringify(entries));
  }

  // --- Settings ---
  public static getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // --- Audio Assets ---
  public static getAudioAssets(): AudioAsset[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUDIO_ASSETS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static saveAudioAssets(assets: AudioAsset[]): void {
    localStorage.setItem(STORAGE_KEYS.AUDIO_ASSETS, JSON.stringify(assets));
  }

  public static addAudioAsset(asset: AudioAsset): void {
    const list = this.getAudioAssets();
    list.unshift(asset);
    this.saveAudioAssets(list.slice(0, 50)); // keep last 50
  }

  // --- Project JSON Export / Import ---
  public static exportProjectPackage(project: Project): string {
    const dictionary = this.getPronunciationEntries().filter(
      (e) => e.scope === 'global' || e.projectId === project.id
    );
    const pkg = {
      product: 'Nagar Voice Studio',
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      project: {
        ...project,
        // Chunks are included without bloated base64 if wanted, but included for complete offline package
      },
      pronunciationRules: dictionary,
    };
    return JSON.stringify(pkg, null, 2);
  }

  public static importProjectPackage(jsonStr: string): { project: Project; message: string } {
    const data = JSON.parse(jsonStr);
    if (!data.project || !data.project.title) {
      throw new Error('Invalid Nagar Voice Studio project package file.');
    }
    const newId = `proj-imported-${Date.now()}`;
    const importedProject: Project = {
      ...data.project,
      id: newId,
      title: `${data.project.title} (Imported)`,
      updatedAt: new Date().toISOString(),
    };
    this.saveProject(importedProject);
    this.setActiveProjectId(newId);

    if (Array.isArray(data.pronunciationRules)) {
      const existing = this.getPronunciationEntries();
      for (const rule of data.pronunciationRules) {
        if (!existing.some((e) => e.sourceText.toLowerCase() === rule.sourceText.toLowerCase())) {
          existing.push({ ...rule, id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, projectId: newId });
        }
      }
      this.savePronunciationEntries(existing);
    }

    return { project: importedProject, message: 'Project imported successfully.' };
  }

  public static isFirstRunDone(): boolean {
    return localStorage.getItem(STORAGE_KEYS.FIRST_RUN_DONE) === 'true';
  }

  public static setFirstRunDone(): void {
    localStorage.setItem(STORAGE_KEYS.FIRST_RUN_DONE, 'true');
  }
}
