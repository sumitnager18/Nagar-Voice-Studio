import { StoryClip, StoryScene } from './storyTypes';

export const MIN_SCENE_DURATION = 2;

export function reflowScenes(scenes: StoryScene[], clips: StoryClip[]): { clips: StoryClip[]; duration: number } {
  let cursor = 0;
  const byScene = new Map<string, StoryClip[]>();
  const independent: StoryClip[] = [];

  for (const clip of clips) {
    if (!clip.sceneId) independent.push(clip);
    else {
      const list = byScene.get(clip.sceneId) || [];
      list.push(clip);
      byScene.set(clip.sceneId, list);
    }
  }

  const result: StoryClip[] = [];
  for (const scene of scenes) {
    const duration = Math.max(MIN_SCENE_DURATION, Number(scene.duration.toFixed(2)));
    const existing = (byScene.get(scene.id) || []).sort((a,b) => a.start - b.start);
    const sceneClip = existing.find(c => c.trackId === 'scene') || {
      id: `scene-${scene.id}`, trackId: 'scene' as const, sceneId: scene.id,
      title: scene.title, start: cursor, duration, sourceIn: 0, sourceOut: duration
    };
    result.push({ ...sceneClip, start: cursor, duration, sourceIn: 0, sourceOut: duration });

    const visual = existing.find(c => c.trackId === 'visuals');
    result.push(visual
      ? { ...visual, start: cursor, duration, sourceIn: 0, sourceOut: duration }
      : { id: `visual-${scene.id}`, trackId: 'visuals', sceneId: scene.id, title: scene.title, start: cursor, duration, sourceIn: 0, sourceOut: duration });

    const narration = existing.filter(c => c.trackId === 'narration');
    if (narration.length) {
      let subCursor = cursor;
      for (const clip of narration) {
        result.push({ ...clip, start: subCursor });
        subCursor += clip.duration;
      }
    } else {
      result.push({
        id: `narration-${scene.id}`, trackId: 'narration', sceneId: scene.id,
        title: `VO — ${scene.title}`, start: cursor, duration,
        sourceIn: 0, sourceOut: duration
      });
    }
    cursor += duration;
  }

  const independentEnd = independent.reduce((m,c) => Math.max(m, c.start + c.duration), 0);
  return { clips: [...result, ...independent], duration: Math.max(15, Number(Math.max(cursor, independentEnd).toFixed(2))) };
}

export function resizeScene(scenes: StoryScene[], clips: StoryClip[], sceneId: string, duration: number) {
  const nextScenes = scenes.map(scene => scene.id === sceneId
    ? { ...scene, duration: Math.max(MIN_SCENE_DURATION, Number(duration.toFixed(2))) }
    : scene);
  const reflow = reflowScenes(nextScenes, clips);
  return { scenes: nextScenes, ...reflow };
}

export function splitClip(clips: StoryClip[], clipId: string, at: number): StoryClip[] {
  const target = clips.find(c => c.id === clipId);
  if (!target || at <= target.start + 0.2 || at >= target.start + target.duration - 0.2) return clips;
  const firstDuration = Number((at - target.start).toFixed(2));
  const secondDuration = Number((target.duration - firstDuration).toFixed(2));
  const splitSource = Number((target.sourceIn + firstDuration).toFixed(2));
  const first = { ...target, duration: firstDuration, sourceOut: splitSource };
  const second = {
    ...target,
    id: `${target.id}-part2-${Date.now()}`,
    title: `${target.title} (Part 2)`,
    start: Number(at.toFixed(2)),
    duration: secondDuration,
    sourceIn: splitSource
  };
  return clips.flatMap(c => c.id === clipId ? [first, second] : [c]);
}
