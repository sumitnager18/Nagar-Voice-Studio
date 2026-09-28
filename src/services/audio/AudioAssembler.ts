import { AudioProcessor } from './AudioProcessor';

export class AudioAssembler {
  /**
   * Assembles multiple chunk AudioBuffers in exact sequence.
   * Inserts intentional pauses between chunks (e.g. 400ms).
   * Applies micro-fade in/out (10ms) at chunk boundaries to eliminate clicks and phase pops.
   */
  public static async assemble(
    buffers: AudioBuffer[],
    interChunkPauseMs = 400,
    crossfadeMs = 12
  ): Promise<AudioBuffer> {
    if (!buffers || buffers.length === 0) {
      throw new Error('No audio buffers provided for assembly');
    }

    if (buffers.length === 1) {
      return buffers[0];
    }

    const sampleRate = buffers[0].sampleRate;
    const numChannels = buffers[0].numberOfChannels;
    const pauseSamples = Math.floor((interChunkPauseMs / 1000) * sampleRate);
    const fadeSamples = Math.floor((crossfadeMs / 1000) * sampleRate);

    // Calculate total sample count
    let totalSamples = 0;
    for (let i = 0; i < buffers.length; i++) {
      totalSamples += buffers[i].length;
      if (i < buffers.length - 1) {
        totalSamples += pauseSamples;
      }
    }

    const ctx = AudioProcessor.getAudioContext();
    const assembledBuffer = ctx.createBuffer(numChannels, totalSamples, sampleRate);

    for (let ch = 0; ch < numChannels; ch++) {
      const outData = assembledBuffer.getChannelData(ch);
      let writeOffset = 0;

      for (let bIndex = 0; bIndex < buffers.length; bIndex++) {
        const inBuffer = buffers[bIndex];
        const inData = inBuffer.getChannelData(Math.min(ch, inBuffer.numberOfChannels - 1));
        const len = inBuffer.length;

        for (let i = 0; i < len; i++) {
          let sample = inData[i];

          // Apply micro fade-in at the beginning of each chunk
          if (i < fadeSamples && fadeSamples > 0) {
            sample *= i / fadeSamples;
          }

          // Apply micro fade-out at the end of each chunk
          if (i >= len - fadeSamples && fadeSamples > 0) {
            sample *= (len - 1 - i) / fadeSamples;
          }

          outData[writeOffset + i] = sample;
        }

        writeOffset += len;

        // Insert silence pause (already 0.0 in initialized Float32Array)
        if (bIndex < buffers.length - 1) {
          writeOffset += pauseSamples;
        }
      }
    }

    return assembledBuffer;
  }
}
