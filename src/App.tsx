import React, { useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import { Navigation, NavTab } from './components/layout/Navigation';
import { StudioScreen } from './components/studio/StudioScreen';
import { VoiceLibraryScreen } from './components/voices/VoiceLibraryScreen';
import { ProjectManagerScreen } from './components/projects/ProjectManagerScreen';
import { AudioLibraryScreen } from './components/audio/AudioLibraryScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { KeyboardShortcutsModal } from './components/settings/KeyboardShortcutsModal';
import { FirstRunWizard } from './components/settings/FirstRunWizard';
import { VoiceDNAModal } from './components/voices/VoiceDNAModal';

import { Project } from './types/project';
import { Voice, VoicePreset } from './types/tts';
import { PronunciationEntry, SupportedLanguage } from './types/nlp';
import { AudioAsset } from './types/audio';

import { LocalDatabase, AppSettings } from './services/storage/LocalDatabase';
import { VoiceLibraryRepository } from './services/tts/VoiceLibraryRepository';
import { PronunciationManager } from './services/nlp/PronunciationManager';
import { AudioPlayerManager } from './services/audio/AudioPlayerManager';

export default function App() {
  // Initialize Database
  useEffect(() => {
    LocalDatabase.init();
  }, []);

  const [activeTab, setActiveTab] = useState<NavTab>('studio');
  const [projects, setProjects] = useState<Project[]>(() => LocalDatabase.getProjects());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => LocalDatabase.getActiveProjectId());
  const [voices, setVoices] = useState<Voice[]>(() => VoiceLibraryRepository.getVoices());
  const [presets, setPresets] = useState<VoicePreset[]>(() => VoiceLibraryRepository.getPresets());
  const [settings, setSettings] = useState<AppSettings>(() => LocalDatabase.getSettings());
  const [audioAssets, setAudioAssets] = useState<AudioAsset[]>(() => LocalDatabase.getAudioAssets());

  const [pronunciationManager] = useState(() => new PronunciationManager(LocalDatabase.getPronunciationEntries()));
  const [pronunciationEntries, setPronunciationEntries] = useState<PronunciationEntry[]>(() => pronunciationManager.getEntries());

  // Modals state
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [inspectDnaVoice, setInspectDnaVoice] = useState<Voice | null>(null);
  const [isFirstRunOpen, setIsFirstRunOpen] = useState(() => !LocalDatabase.isFirstRunDone());

  // Active project
  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  // Sync projects with database
  const handleUpdateProject = (updated: Project) => {
    LocalDatabase.saveProject(updated);
    setProjects(LocalDatabase.getProjects());
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    LocalDatabase.setActiveProjectId(projectId);
  };

  const handleNewProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title: `Untitled Narration Project ${projects.length + 1}`,
      productionMode: 'standard',
      originalScript: '',
      processedScript: '',
      language: settings.defaultLanguage,
      voiceId: settings.defaultVoiceId,
      voicePresetId: 'preset-cgh-arjun-yt-doc',
      provider: 'clipchamp_ref',
      modelMode: settings.defaultModelMode,
      resolvedModel: 'gemini-3.8-flash-lite-tts',
      style: 'Clear, engaging documentary narrator with natural pauses.',
      emotion: 'Authoritative',
      speed: 1.0,
      pitch: 'Medium',
      narratorIdentityLock: true,
      chunks: [],
      currentVersion: 1,
      versions: [],
      generationStatus: 'idle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    LocalDatabase.saveProject(newProj);
    setProjects(LocalDatabase.getProjects());
    setActiveProjectId(newProj.id);
    LocalDatabase.setActiveProjectId(newProj.id);
    setActiveTab('studio');
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      LocalDatabase.deleteProject(id);
      const remaining = LocalDatabase.getProjects();
      setProjects(remaining);
      if (activeProjectId === id && remaining.length > 0) {
        setActiveProjectId(remaining[0].id);
        LocalDatabase.setActiveProjectId(remaining[0].id);
      }
    }
  };

  const handleDuplicateProject = (id: string) => {
    const original = projects.find((p) => p.id === id);
    if (!original) return;
    const duplicated: Project = {
      ...JSON.parse(JSON.stringify(original)),
      id: `proj-${Date.now()}`,
      title: `${original.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    LocalDatabase.saveProject(duplicated);
    setProjects(LocalDatabase.getProjects());
  };

  const handleImportProject = (jsonStr: string) => {
    try {
      const { project, message } = LocalDatabase.importProjectPackage(jsonStr);
      setProjects(LocalDatabase.getProjects());
      setActiveProjectId(project.id);
      setActiveTab('studio');
      alert(message);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
  };

  const handleSaveNewVersion = () => {
    if (!currentProject) return;
    const ver = LocalDatabase.createNewVersion(currentProject);
    setProjects(LocalDatabase.getProjects());
    alert(`Created Version ${ver.versionNumber} snapshot.`);
  };

  // Voice favorite toggle & save
  const handleToggleFavoriteVoice = (voiceId: string) => {
    VoiceLibraryRepository.toggleFavorite(voiceId);
    setVoices([...VoiceLibraryRepository.getVoices()]);
  };

  const handleSaveNewVoice = (newVoice: Voice) => {
    VoiceLibraryRepository.addVoice(newVoice);
    setVoices([...VoiceLibraryRepository.getVoices()]);
  };

  // Pronunciation rules
  const handleAddPronunciation = (entry: Omit<PronunciationEntry, 'id'>) => {
    pronunciationManager.addEntry(entry);
    const updated = pronunciationManager.getEntries();
    LocalDatabase.savePronunciationEntries(updated);
    setPronunciationEntries([...updated]);
  };

  const handleDeletePronunciation = (id: string) => {
    pronunciationManager.deleteEntry(id);
    const updated = pronunciationManager.getEntries();
    LocalDatabase.savePronunciationEntries(updated);
    setPronunciationEntries([...updated]);
  };

  const handleTogglePronunciation = (id: string) => {
    pronunciationManager.toggleEntry(id);
    const updated = pronunciationManager.getEntries();
    LocalDatabase.savePronunciationEntries(updated);
    setPronunciationEntries([...updated]);
  };

  // Keyboard Shortcuts Listener (Section 62)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space toggles Play/Pause if not focused in textarea or input
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      if (e.code === 'Space' && !isInput) {
        e.preventDefault();
        const player = AudioPlayerManager.getInstance();
        if (player.getState() === 'playing') {
          player.pause();
        } else {
          player.play();
        }
      }

      // Ctrl + N = New project
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !isInput) {
        e.preventDefault();
        handleNewProject();
      }

      // Ctrl + S = Save Version
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (currentProject) {
          handleUpdateProject(currentProject);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject]);

  return (
    <div className="min-h-screen bg-[#0f1012] text-slate-100 flex flex-col font-sans pb-16 md:pb-6">
      {/* Top Header */}
      <Header
        currentProject={currentProject}
        projects={projects}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        activeNav={activeTab}
        onNavigate={(tab) => setActiveTab(tab as NavTab)}
      />

      {/* Main Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t)}
        pendingQueueCount={currentProject?.chunks?.filter((c) => c.status === 'generating' || c.status === 'waiting').length || 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-x-hidden">
        {activeTab === 'studio' && currentProject && (
          <StudioScreen
            project={currentProject}
            voices={voices}
            presets={presets}
            pronunciationManager={pronunciationManager}
            onUpdateProject={handleUpdateProject}
            onSaveNewVersion={handleSaveNewVersion}
            onOpenVoiceDna={(vId) => {
              const v = voices.find((item) => item.id === vId);
              if (v) setInspectDnaVoice(v);
            }}
          />
        )}

        {activeTab === 'voices' && (
          <VoiceLibraryScreen
            voices={voices}
            selectedVoiceId={currentProject?.voiceId || voices[0]?.id || ''}
            onSelectVoice={(vId) => {
              if (currentProject) {
                const matchedVoice = voices.find((v) => v.id === vId || v.providerVoiceId === vId);
                handleUpdateProject({
                  ...currentProject,
                  voiceId: vId,
                  providerVoiceId: matchedVoice?.providerVoiceId || vId,
                  voiceType: matchedVoice?.type,
                });
              }
            }}
            onToggleFavorite={handleToggleFavoriteVoice}
            onSaveNewVoice={handleSaveNewVoice}
            onRefreshLiveVoices={async () => {
              setVoices([...VoiceLibraryRepository.getVoices()]);
            }}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectManagerScreen
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={(id) => {
              handleSelectProject(id);
              setActiveTab('studio');
            }}
            onNewProject={handleNewProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onImportProject={handleImportProject}
          />
        )}

        {activeTab === 'audio' && (
          <AudioLibraryScreen
            assets={audioAssets}
            onDeleteAsset={(id) => {
              const updated = audioAssets.filter((a) => a.id !== id);
              LocalDatabase.saveAudioAssets(updated);
              setAudioAssets(updated);
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            pronunciationEntries={pronunciationEntries}
            onUpdateSettings={(newSettings) => {
              LocalDatabase.saveSettings(newSettings);
              setSettings(newSettings);
            }}
            onAddPronunciation={handleAddPronunciation}
            onDeletePronunciation={handleDeletePronunciation}
            onTogglePronunciation={handleTogglePronunciation}
            onImportPronunciation={(json) => {
              pronunciationManager.importFromJson(json);
              const updated = pronunciationManager.getEntries();
              LocalDatabase.savePronunciationEntries(updated);
              setPronunciationEntries([...updated]);
            }}
          />
        )}
      </main>

      {/* Global Modals */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <VoiceDNAModal
        voice={inspectDnaVoice}
        isOpen={Boolean(inspectDnaVoice)}
        onClose={() => setInspectDnaVoice(null)}
      />

      <FirstRunWizard
        isOpen={isFirstRunOpen}
        voices={voices}
        onComplete={({ language, defaultVoiceId }) => {
          LocalDatabase.setFirstRunDone();
          setIsFirstRunOpen(false);
          if (currentProject) {
            handleUpdateProject({
              ...currentProject,
              language,
              voiceId: defaultVoiceId,
            });
          }
        }}
        onSkip={() => {
          LocalDatabase.setFirstRunDone();
          setIsFirstRunOpen(false);
        }}
      />
    </div>
  );
}
