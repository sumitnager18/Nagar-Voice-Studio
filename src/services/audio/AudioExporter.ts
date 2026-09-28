import { Mp3Encoder } from 'lamejs';
import { ExportFormat, ExportOptions } from '../../types/audio';
import { AudioProcessor } from './AudioProcessor';

export class AudioExporter {
  /**
   * Generates clean studio filename adhering to spec format:
   * e.g. "CGH_AI_Chapter_01_Arjun_001.wav" or "NagarVoice_YouTubeDoc_Kore_Master.mp3"
   */
  public static generateFilename(
    projectTitle: string,
    voiceName: string,
    chunkIndex?: number,
    format: ExportFormat = 'WAV'
  ): string {
    const cleanTitle = (projectTitle || 'Untitled')
      .replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 32);

    const cleanVoice = (voiceName || 'Voice')
      .replace(/[^a-zA-Z0-9]/g, '');

    const ext = format.toLowerCase();

    if (chunkIndex !== undefined && chunkIndex !== null) {
      const padIndex = String(chunkIndex + 1).padStart(3, '0');
      return `${cleanTitle}_${cleanVoice}_${padIndex}.${ext}`;
    }

    return `${cleanTitle}_${cleanVoice}_Master.${ext}`;
  }

  /**
   * Resamples an AudioBuffer if target sample rate differs from original
   */
  public static async resampleBuffer(
    buffer: AudioBuffer,
    targetSampleRate: number
  ): Promise<AudioBuffer> {
    if (buffer.sampleRate === targetSampleRate) {
      return buffer;
    }

    const duration = buffer.duration;
    const targetLength = Math.round(duration * targetSampleRate);
    const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, targetLength, targetSampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    return await offlineCtx.startRendering();
  }

  /**
   * Encodes AudioBuffer into MP3 Blob using LAME MP3 Encoder
   */
  public static encodeToMp3(
    audioBuffer: AudioBuffer,
    bitrateKbps = 192
  ): Blob {
    const channels = 1; // mono voice
    const sampleRate = audioBuffer.sampleRate;
    const mp3encoder = new Mp3Encoder(channels, sampleRate, bitrateKbps);
    const mp3Data: any[] = [];

    const floatSamples = audioBuffer.getChannelData(0);
    const sampleBlockSize = 1152;
    const int16Samples = new Int16Array(floatSamples.length);

    // Convert Float32 to Int16
    for (let i = 0; i < floatSamples.length; i++) {
      let s = Math.max(-1, Math.min(1, floatSamples[i]));
      int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Process blocks
    for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
      const sampleChunk = int16Samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
    }

    // Flush encoder
    const endBuf = mp3encoder.flush();
    if (endBuf.length > 0) {
      mp3Data.push(new Uint8Array(endBuf));
    }

    return new Blob(mp3Data as BlobPart[], { type: 'audio/mp3' });
  }

  /**
   * Exports AudioBuffer into WAV or MP3 with optional sample rate conversion
   */
  public static async exportAudio(
    audioBuffer: AudioBuffer,
    options: ExportOptions
  ): Promise<{ blob: Blob; url: string; mimeType: string }> {
    const resampled = await this.resampleBuffer(audioBuffer, options.sampleRate);

    let blob: Blob;
    let mimeType: string;

    if (options.format === 'MP3') {
      blob = this.encodeToMp3(resampled, options.bitrateKbps || 192);
      mimeType = 'audio/mp3';
    } else {
      blob = AudioProcessor.audioBufferToWavBlob(resampled, options.sampleRate);
      mimeType = 'audio/wav';
    }

    const url = URL.createObjectURL(blob);
    return { blob, url, mimeType };
  }

  /**
   * Triggers client browser file download
   */
  public static triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  }
}
