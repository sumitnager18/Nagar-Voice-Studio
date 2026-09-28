import { AudioMasteringConfig } from '../../types/audio';

export class AudioProcessor {
  private static audioCtx: AudioContext | null = null;

  public static getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Decodes an ArrayBuffer or base64 WAV/PCM into an AudioBuffer
   */
  public static async decodeAudio(data: ArrayBuffer | string): Promise<AudioBuffer> {
    const ctx = this.getAudioContext();
    let buffer: ArrayBuffer;

    if (typeof data === 'string') {
      const binaryString = atob(data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      buffer = bytes.buffer;
    } else {
      buffer = data;
    }

    return await ctx.decodeAudioData(buffer.slice(0));
  }

  /**
   * Converts AudioBuffer to 16-bit PCM WAV Blob
   */
  public static audioBufferToWavBlob(audioBuffer: AudioBuffer, targetSampleRate?: number): Blob {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = targetSampleRate || audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;

    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);

    // Write RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM subchunk
    view.setUint16(20, 1, true); // format: 1 (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // bits per sample
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write interleaved 16-bit samples
    let offset = 44;
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channels[ch][i];
        // Clip
        sample = Math.max(-1, Math.min(1, sample));
        // Scale to 16-bit signed integer
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  private static writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Applies audio mastering (silence trim, gentle compressor, limiter, loudness normalization)
   */
  public static async applyMastering(
    inputBuffer: AudioBuffer,
    config: AudioMasteringConfig
  ): Promise<AudioBuffer> {
    if (config.preset === 'OFF') {
      return inputBuffer;
    }

    const sampleRate = inputBuffer.sampleRate;
    const channelData = inputBuffer.getChannelData(0);

    // 1. Silence trimming if enabled
    let startIdx = 0;
    let endIdx = channelData.length - 1;

    if (config.trimSilence) {
      const threshold = Math.pow(10, config.silenceThresholdDb / 20); // -45dB ~ 0.0056
      while (startIdx < endIdx && Math.abs(channelData[startIdx]) < threshold) {
        startIdx++;
      }
      while (endIdx > startIdx && Math.abs(channelData[endIdx]) < threshold) {
        endIdx--;
      }
      // Add small safety padding (50ms)
      const pad = Math.floor(sampleRate * 0.05);
      startIdx = Math.max(0, startIdx - pad);
      endIdx = Math.min(channelData.length - 1, endIdx + pad);
    }

    const trimmedLength = Math.max(1, endIdx - startIdx + 1);

    // 2. Offline audio rendering for dynamic processing (compression & limiter)
    const offlineCtx = new OfflineAudioContext(1, trimmedLength, sampleRate);
    const source = offlineCtx.createBufferSource();

    // Create trimmed source buffer
    const trimmedBuffer = offlineCtx.createBuffer(1, trimmedLength, sampleRate);
    const targetData = trimmedBuffer.getChannelData(0);
    for (let i = 0; i < trimmedLength; i++) {
      targetData[i] = channelData[startIdx + i];
    }
    source.buffer = trimmedBuffer;

    let lastNode: AudioNode = source;

    if (config.preset === 'LIGHT') {
      // Gentle subtle compressor to even out transients
      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, 0);
      compressor.knee.setValueAtTime(12, 0);
      compressor.ratio.setValueAtTime(2.0, 0);
      compressor.attack.setValueAtTime(0.015, 0);
      compressor.release.setValueAtTime(0.1, 0);

      lastNode.connect(compressor);
      lastNode = compressor;
    } else if (config.preset === 'VOICEOVER') {
      // Warm presence voiceover preset
      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(75, 0); // cut rumble

      const presence = offlineCtx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.setValueAtTime(3200, 0);
      presence.gain.setValueAtTime(1.5, 0); // clarity boost

      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-22, 0);
      compressor.knee.setValueAtTime(10, 0);
      compressor.ratio.setValueAtTime(2.5, 0);
      compressor.attack.setValueAtTime(0.01, 0);
      compressor.release.setValueAtTime(0.08, 0);

      lastNode.connect(filter);
      filter.connect(presence);
      presence.connect(compressor);
      lastNode = compressor;
    } else if (config.preset === 'BROADCAST') {
      // Full broadcast master
      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, 0);
      compressor.knee.setValueAtTime(6, 0);
      compressor.ratio.setValueAtTime(3.5, 0);
      compressor.attack.setValueAtTime(0.005, 0);
      compressor.release.setValueAtTime(0.06, 0);

      lastNode.connect(compressor);
      lastNode = compressor;
    }

    lastNode.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();

    // 3. Peak normalization to -1.0 dBFS (approx 0.89 amplitude)
    if (config.normalizeLoudness) {
      const renderedChannel = rendered.getChannelData(0);
      let peak = 0;
      for (let i = 0; i < renderedChannel.length; i++) {
        const absVal = Math.abs(renderedChannel[i]);
        if (absVal > peak) peak = absVal;
      }
      if (peak > 0.0001) {
        const targetPeak = 0.891; // -1 dB
        const gain = targetPeak / peak;
        for (let i = 0; i < renderedChannel.length; i++) {
          renderedChannel[i] = renderedChannel[i] * gain;
        }
      }
    }

    return rendered;
  }
}
