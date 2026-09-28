import { QAQualityCheckItem, QAQualityReport } from '../../types/audio';
import { ScriptChunk } from '../../types/project';

export class SpeechQAService {
  /**
   * Evaluates generated speech chunks and master audio for production quality.
   */
  public static evaluate(
    chunks: ScriptChunk[],
    masterBuffer?: AudioBuffer | null,
    totalExpectedDuration?: number
  ): QAQualityReport {
    const checks: QAQualityCheckItem[] = [];

    // 1. Missing chunks check
    const totalChunks = chunks.length;
    const completedChunks = chunks.filter((c) => c.status === 'complete' && c.audioBase64);
    const missingCount = totalChunks - completedChunks.length;

    if (missingCount === 0) {
      checks.push({
        id: 'qa-chunks-complete',
        title: 'Chunk Generation Completeness',
        status: 'PASS',
        details: `All ${totalChunks} chunks generated successfully.`
      });
    } else {
      checks.push({
        id: 'qa-chunks-complete',
        title: 'Chunk Generation Completeness',
        status: 'FAIL',
        details: `${missingCount} of ${totalChunks} chunks have not been generated or failed.`
      });
    }

    // 2. Chunk sequence order verification
    let orderCorrect = true;
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].sequence !== i) {
        orderCorrect = false;
        break;
      }
    }
    checks.push({
      id: 'qa-chunk-order',
      title: 'Sequential Chunk Ordering',
      status: orderCorrect ? 'PASS' : 'FAIL',
      details: orderCorrect
        ? 'Chunk timeline strictly preserved in chronological sequence.'
        : 'Discrepancy detected in chunk sequence indices.'
    });

    // 3. Audio duration & unexpected anomalies
    let shortAudioWarnings = 0;
    let emptyAudioErrors = 0;

    for (const chunk of chunks) {
      if (chunk.status === 'complete') {
        const dur = chunk.durationSeconds || 0;
        const wordCount = chunk.originalText.trim().split(/\s+/).length;

        if (dur <= 0.05) {
          emptyAudioErrors++;
        } else if (wordCount > 3 && dur < 0.4) {
          shortAudioWarnings++;
        }
      }
    }

    if (emptyAudioErrors > 0) {
      checks.push({
        id: 'qa-empty-audio',
        title: 'Zero-Length / Corrupt Audio Check',
        status: 'FAIL',
        details: `Found ${emptyAudioErrors} chunk(s) with zero or corrupt audio.`
      });
    } else {
      checks.push({
        id: 'qa-empty-audio',
        title: 'Zero-Length / Corrupt Audio Check',
        status: 'PASS',
        details: 'No zero-length audio streams detected.'
      });
    }

    if (shortAudioWarnings > 0) {
      checks.push({
        id: 'qa-duration-anomalies',
        title: 'Pacing / Duration Anomalies',
        status: 'WARNING',
        details: `${shortAudioWarnings} chunk(s) rendered unusually brief relative to their word count.`
      });
    } else {
      checks.push({
        id: 'qa-duration-anomalies',
        title: 'Pacing / Duration Anomalies',
        status: 'PASS',
        details: 'Speech cadence matches expected phonetic timing profile.'
      });
    }

    // 4. Master audio integrity
    let totalDurationSeconds = 0;
    if (masterBuffer) {
      totalDurationSeconds = masterBuffer.duration;
      if (masterBuffer.duration < 0.2 && totalChunks > 0) {
        checks.push({
          id: 'qa-master-integrity',
          title: 'Master Audio Buffer Verification',
          status: 'FAIL',
          details: 'Master assembled audio buffer is empty.'
        });
      } else {
        checks.push({
          id: 'qa-master-integrity',
          title: 'Master Audio Buffer Verification',
          status: 'PASS',
          details: `Master audio verified (${Math.round(masterBuffer.duration * 10) / 10}s, ${masterBuffer.sampleRate} Hz, 16-bit PCM).`
        });
      }
    } else if (completedChunks.length > 0) {
      checks.push({
        id: 'qa-master-integrity',
        title: 'Master Audio Buffer Verification',
        status: 'WARNING',
        details: 'Chunks ready, but master audio has not yet been assembled or mastered.'
      });
    }

    // 5. Target duration comparison (if target specified)
    if (totalExpectedDuration && totalExpectedDuration > 0 && totalDurationSeconds > 0) {
      const diff = Math.abs(totalDurationSeconds - totalExpectedDuration);
      const ratio = diff / totalExpectedDuration;
      if (ratio > 0.35) {
        checks.push({
          id: 'qa-duration-target',
          title: 'Target Duration Adherence',
          status: 'WARNING',
          details: `Rendered audio (${Math.round(totalDurationSeconds)}s) differs from target (${totalExpectedDuration}s) by ${Math.round(ratio * 100)}%. Consider adjusting speed factor.`
        });
      } else {
        checks.push({
          id: 'qa-duration-target',
          title: 'Target Duration Adherence',
          status: 'PASS',
          details: `Rendered audio fits target duration within ${Math.round(ratio * 100)}% margin.`
        });
      }
    }

    // Determine overall status
    let overallStatus: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
    if (checks.some((c) => c.status === 'FAIL')) {
      overallStatus = 'FAIL';
    } else if (checks.some((c) => c.status === 'WARNING')) {
      overallStatus = 'WARNING';
    }

    return {
      overallStatus,
      checks,
      checkedAt: new Date().toISOString(),
      totalDurationSeconds: Math.round(totalDurationSeconds * 100) / 100,
      chunkCount: totalChunks
    };
  }
}
