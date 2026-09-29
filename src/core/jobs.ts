export type MediaJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface MediaJob<T = unknown> {
  id: string;
  type: string;
  status: MediaJobStatus;
  createdAt: string;
  updatedAt: string;
  progress: number;
  message?: string;
  input?: T;
  output?: unknown;
  error?: string;
}

export class InMemoryJobStore {
  private jobs = new Map<string, MediaJob>();

  create<T>(type: string, input?: T): MediaJob<T> {
    const now = new Date().toISOString();
    const job: MediaJob<T> = {
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
      progress: 0,
      input,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  update(id: string, patch: Partial<MediaJob>): MediaJob | undefined {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;
    const next = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.jobs.set(id, next);
    return next;
  }

  get(id: string): MediaJob | undefined {
    return this.jobs.get(id);
  }

  list(): MediaJob[] {
    return [...this.jobs.values()].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }
}
