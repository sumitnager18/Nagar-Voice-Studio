import { AudioProcessor } from './AudioProcessor';

export type PlayerState = 'stopped' | 'playing' | 'paused';

export interface PlayerTimeUpdate {
  currentTime: number;
  duration: number;
  progressPercent: number;
}

export class AudioPlayerManager {
  private static instance: AudioPlayerManager | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private currentAudioBuffer: AudioBuffer | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private startTime = 0;
  private pauseOffset = 0;
  private isBufferPlayback = false;
  private playbackState: PlayerState = 'stopped';
  private playbackRate = 1.0;
  private volume = 1.0;
  private timeListeners: ((update: PlayerTimeUpdate) => void)[] = [];
  private stateListeners: ((state: PlayerState) => void)[] = [];
  private animFrameId: number | null = null;

  public static getInstance(): AudioPlayerManager {
    if (!this.instance) {
      this.instance = new AudioPlayerManager();
    }
    return this.instance;
  }

  public subscribeTime(cb: (update: PlayerTimeUpdate) => void): () => void {
    this.timeListeners.push(cb);
    return () => {
      this.timeListeners = this.timeListeners.filter((l) => l !== cb);
    };
  }

  public subscribeState(cb: (state: PlayerState) => void): () => void {
    this.stateListeners.push(cb);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== cb);
    };
  }

  private notifyState(state: PlayerState) {
    this.playbackState = state;
    this.stateListeners.forEach((l) => l(state));
  }

  private notifyTime(currentTime: number, duration: number) {
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    this.timeListeners.forEach((l) => l({ currentTime, duration, progressPercent }));
  }

  /**
   * Load audio via URL or Blob
   */
  public async loadUrl(url: string): Promise<number> {
    this.stop();
    this.isBufferPlayback = false;

    if (!this.currentAudioElement) {
      this.currentAudioElement = new Audio();
    }

    this.currentAudioElement.src = url;
    this.currentAudioElement.playbackRate = this.playbackRate;
    this.currentAudioElement.volume = this.volume;

    return new Promise((resolve) => {
      if (!this.currentAudioElement) return resolve(0);

      this.currentAudioElement.onloadedmetadata = () => {
        resolve(this.currentAudioElement?.duration || 0);
      };

      this.currentAudioElement.ontimeupdate = () => {
        if (this.currentAudioElement) {
          this.notifyTime(this.currentAudioElement.currentTime, this.currentAudioElement.duration || 0);
        }
      };

      this.currentAudioElement.onended = () => {
        this.notifyState('stopped');
        this.notifyTime(0, this.currentAudioElement?.duration || 0);
      };
    });
  }

  /**
   * Load audio via AudioBuffer directly
   */
  public loadBuffer(buffer: AudioBuffer): number {
    this.stop();
    this.isBufferPlayback = true;
    this.currentAudioBuffer = buffer;
    this.pauseOffset = 0;
    this.notifyTime(0, buffer.duration);
    return buffer.duration;
  }

  public async play(): Promise<void> {
    if (this.isBufferPlayback && this.currentAudioBuffer) {
      const ctx = AudioProcessor.getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();

      if (this.currentSourceNode) {
        try { this.currentSourceNode.stop(); } catch {}
      }

      const source = ctx.createBufferSource();
      source.buffer = this.currentAudioBuffer;
      source.playbackRate.value = this.playbackRate;

      const gain = ctx.createGain();
      gain.gain.value = this.volume;
      source.connect(gain);
      gain.connect(ctx.destination);

      this.startTime = ctx.currentTime - (this.pauseOffset / this.playbackRate);
      source.start(0, this.pauseOffset);
      this.currentSourceNode = source;

      source.onended = () => {
        const elapsed = (ctx.currentTime - this.startTime) * this.playbackRate;
        if (this.currentAudioBuffer && elapsed >= this.currentAudioBuffer.duration - 0.05) {
          this.stop();
        }
      };

      this.notifyState('playing');
      this.startBufferTracking();
    } else if (this.currentAudioElement) {
      try {
        await this.currentAudioElement.play();
        this.notifyState('playing');
      } catch (err) {
        console.error('Audio play error:', err);
      }
    }
  }

  public pause(): void {
    if (this.isBufferPlayback && this.currentAudioBuffer) {
      const ctx = AudioProcessor.getAudioContext();
      if (this.playbackState === 'playing') {
        this.pauseOffset = (ctx.currentTime - this.startTime) * this.playbackRate;
        if (this.currentSourceNode) {
          try { this.currentSourceNode.stop(); } catch {}
          this.currentSourceNode = null;
        }
      }
      this.stopBufferTracking();
      this.notifyState('paused');
    } else if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.notifyState('paused');
    }
  }

  public stop(): void {
    if (this.isBufferPlayback) {
      if (this.currentSourceNode) {
        try { this.currentSourceNode.stop(); } catch {}
        this.currentSourceNode = null;
      }
      this.pauseOffset = 0;
      this.stopBufferTracking();
      this.notifyState('stopped');
      if (this.currentAudioBuffer) {
        this.notifyTime(0, this.currentAudioBuffer.duration);
      }
    } else if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.notifyState('stopped');
      this.notifyTime(0, this.currentAudioElement.duration || 0);
    }
  }

  public seek(seconds: number): void {
    if (this.isBufferPlayback && this.currentAudioBuffer) {
      const dur = this.currentAudioBuffer.duration;
      const target = Math.max(0, Math.min(dur, seconds));
      this.pauseOffset = target;
      if (this.playbackState === 'playing') {
        this.play();
      } else {
        this.notifyTime(target, dur);
      }
    } else if (this.currentAudioElement) {
      const dur = this.currentAudioElement.duration || 0;
      const target = Math.max(0, Math.min(dur, seconds));
      this.currentAudioElement.currentTime = target;
      this.notifyTime(target, dur);
    }
  }

  public skip(deltaSeconds: number): void {
    if (this.isBufferPlayback && this.currentAudioBuffer) {
      const current = this.pauseOffset;
      this.seek(current + deltaSeconds);
    } else if (this.currentAudioElement) {
      const current = this.currentAudioElement.currentTime;
      this.seek(current + deltaSeconds);
    }
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    if (this.currentAudioElement) {
      this.currentAudioElement.playbackRate = rate;
    }
    if (this.isBufferPlayback && this.currentSourceNode) {
      this.currentSourceNode.playbackRate.value = rate;
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = this.volume;
    }
  }

  public getState(): PlayerState {
    return this.playbackState;
  }

  private startBufferTracking() {
    this.stopBufferTracking();
    const track = () => {
      if (this.playbackState === 'playing' && this.currentAudioBuffer) {
        const ctx = AudioProcessor.getAudioContext();
        const current = (ctx.currentTime - this.startTime) * this.playbackRate;
        const dur = this.currentAudioBuffer.duration;
        this.notifyTime(Math.min(current, dur), dur);
        this.animFrameId = requestAnimationFrame(track);
      }
    };
    this.animFrameId = requestAnimationFrame(track);
  }

  private stopBufferTracking() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /**
   * Generates peak array for rendering waveforms
   */
  public static extractWaveformData(buffer: AudioBuffer, peakCount = 140): number[] {
    const channel = buffer.getChannelData(0);
    const blockSize = Math.floor(channel.length / peakCount);
    const peaks: number[] = [];

    for (let i = 0; i < peakCount; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(channel[start + j] || 0);
        if (val > max) max = val;
      }
      peaks.push(Math.min(1.0, max));
    }

    return peaks;
  }
}
