export type TrackType = 'scene' | 'narration' | 'visuals' | 'music' | 'sfx';

export interface StoryScene {
  id: string;
  sceneNumber: number;
  title: string;
  scriptText: string;
  duration: number;
}

export interface StoryClip {
  id: string;
  trackId: TrackType;
  sceneId?: string;
  title: string;
  start: number;
  duration: number;
  sourceIn: number;
  sourceOut: number;
}

export interface StoryProject {
  id: string;
  title: string;
  script: string;
  scenes: StoryScene[];
  clips: StoryClip[];
  duration: number;
}
