import React, { useMemo, useState } from 'react';
import { Plus, Scissors, Trash2 } from 'lucide-react';
import { StoryProject } from './storyTypes';
import { reflowScenes, resizeScene, splitClip } from './timelineEngine';

const initial: StoryProject = {
  id: 'story-main',
  title: 'ComputerGuruHub Story Project',
  script: '',
  scenes: [{
    id: 'scene-1', sceneNumber: 1, title: 'Scene 01', scriptText: '',
    duration: 6
  }],
  clips: [],
  duration: 15
};

export const StoryWorkspaceScreen: React.FC = () => {
  const [project, setProject] = useState<StoryProject>(() => {
    const flow = reflowScenes(initial.scenes, initial.clips);
    return { ...initial, ...flow };
  });
  const [selectedScene, setSelectedScene] = useState(project.scenes[0].id);

  const total = useMemo(() => project.duration.toFixed(2), [project.duration]);

  const addScene = () => {
    const n = project.scenes.length + 1;
    const scene = { id: `scene-${Date.now()}`, sceneNumber: n, title: `Scene ${String(n).padStart(2,'0')}`, scriptText: '', duration: 6 };
    const scenes = [...project.scenes, scene];
    const flow = reflowScenes(scenes, project.clips);
    setProject({ ...project, scenes, ...flow });
    setSelectedScene(scene.id);
  };

  const updateDuration = (duration: number) => {
    const flow = resizeScene(project.scenes, project.clips, selectedScene, duration);
    setProject({ ...project, ...flow });
  };

  const updateScript = (value: string) => {
    const scenes = project.scenes.map(s => s.id === selectedScene ? { ...s, scriptText: value } : s);
    setProject({ ...project, scenes });
  };

  const splitSelectedNarration = () => {
    const clip = project.clips.find(c => c.sceneId === selectedScene && c.trackId === 'narration');
    if (!clip) return;
    setProject({ ...project, clips: splitClip(project.clips, clip.id, clip.start + clip.duration / 2) });
  };

  const deleteSelectedScene = () => {
    if (project.scenes.length <= 1) return;
    const scenes = project.scenes.filter(s => s.id !== selectedScene).map((s,i) => ({ ...s, sceneNumber: i+1 }));
    const flow = reflowScenes(scenes, project.clips.filter(c => c.sceneId !== selectedScene));
    setProject({ ...project, scenes, ...flow });
    setSelectedScene(scenes[0].id);
  };

  const selected = project.scenes.find(s => s.id === selectedScene) || project.scenes[0];

  return (
    <div className="p-5 md:p-7 max-w-[1500px] mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-xs uppercase tracking-widest text-amber-400">Story Studio</div><h1 className="text-2xl font-semibold text-white">{project.title}</h1></div>
        <div className="flex gap-2">
          <button onClick={addScene} className="px-3 py-2 rounded bg-amber-500 text-black text-sm flex items-center gap-2"><Plus className="w-4 h-4"/>Scene</button>
          <button onClick={deleteSelectedScene} className="px-3 py-2 rounded bg-[#252832] text-slate-200 text-sm flex items-center gap-2"><Trash2 className="w-4 h-4"/>Delete</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr_330px] gap-4">
        <aside className="rounded-xl border border-[#292c33] bg-[#15171c] p-3">
          <div className="text-xs uppercase tracking-wider text-slate-500 px-2 pb-2">Scenes</div>
          {project.scenes.map(scene => (
            <button key={scene.id} onClick={() => setSelectedScene(scene.id)}
              className={`w-full text-left p-3 rounded-lg mb-1 ${scene.id === selectedScene ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-[#20232a]'}`}>
              <div className="text-xs text-slate-500">SCENE {String(scene.sceneNumber).padStart(2,'0')}</div>
              <div className="text-sm text-white truncate">{scene.title}</div>
              <div className="text-xs text-slate-500 mt-1">{scene.duration.toFixed(2)}s</div>
            </button>
          ))}
        </aside>

        <section className="rounded-xl border border-[#292c33] bg-[#111318] p-4 min-h-[500px]">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">Timeline • {total}s</div>
          <div className="space-y-2">
            {(['scene','visuals','narration'] as const).map(track => (
              <div key={track}>
                <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">{track}</div>
                <div className="relative h-12 rounded bg-[#191c22] overflow-hidden">
                  {project.clips.filter(c => c.trackId === track).map(clip => (
                    <button key={clip.id} onClick={() => setSelectedScene(clip.sceneId || selectedScene)}
                      className="absolute top-1 bottom-1 rounded bg-[#2a2e38] border border-[#3a3f4c] px-2 text-[10px] text-slate-200 text-left truncate"
                      style={{ left: `${(clip.start / Math.max(project.duration,1))*100}%`, width: `${(clip.duration / Math.max(project.duration,1))*100}%` }}>
                      {clip.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 rounded-lg border border-[#292c33] bg-[#15171c] text-xs text-slate-500">
            Timeline coordinates are derived from scene duration and reflowed atomically. This workspace does not use simulated generation.
          </div>
        </section>

        <aside className="rounded-xl border border-[#292c33] bg-[#15171c] p-4 space-y-4">
          <div><div className="text-xs uppercase tracking-wider text-slate-500">Inspector</div><div className="text-lg text-white mt-1">{selected.title}</div></div>
          <textarea value={selected.scriptText} onChange={e => updateScript(e.target.value)} className="w-full h-40 rounded-lg bg-[#0f1116] border border-[#292c33] p-3 text-sm text-slate-200 outline-none" placeholder="Scene narration / direction…" />
          <label className="block text-xs text-slate-400">Duration
            <input type="number" min="2" step="0.1" value={selected.duration} onChange={e => updateDuration(Number(e.target.value))} className="mt-2 w-full rounded-lg bg-[#0f1116] border border-[#292c33] p-2 text-sm text-white" />
          </label>
          <button onClick={splitSelectedNarration} className="w-full px-3 py-2 rounded bg-[#252832] text-slate-200 text-sm flex items-center justify-center gap-2"><Scissors className="w-4 h-4"/>Split narration</button>
        </aside>
      </div>
    </div>
  );
};
