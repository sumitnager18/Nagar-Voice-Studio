import React, { useEffect, useState } from 'react';
import { Activity, Play, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

export const LipSyncWorkspaceScreen: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [status, setStatus] = useState('Checking lip-sync engine…');
  const [job, setJob] = useState<any>(null);
  const baseUrl = 'http://127.0.0.1:8000';

  const probe = async () => {
    try {
      const r = await fetch(`${baseUrl}/api/capabilities`);
      const data = await r.json();
      setCapabilities(data);
      setStatus(r.ok ? 'Engine reachable' : 'Engine returned an error');
    } catch (e) {
      setCapabilities(null);
      setStatus('Lip-sync service unavailable');
    }
  };

  useEffect(() => { probe(); }, []);

  const generate = async () => {
    if (!image || !audio) return;
    setStatus('Submitting…');
    const form = new FormData();
    form.append('image', image);
    form.append('audio', audio);
    form.append('engine_id', 'wav2lip_onnx');
    form.append('output_format', 'both');
    form.append('resolution', 'original');
    form.append('fps', '25');

    try {
      const r = await fetch(`${baseUrl}/api/generate`, { method: 'POST', body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || data.error || 'Generation failed');
      setJob(data);
      setStatus('Queued');
    } catch (e: any) {
      setStatus(e.message || 'Generation failed');
    }
  };

  useEffect(() => {
    if (!job?.jobId) return;
    const timer = window.setInterval(async () => {
      try {
        const r = await fetch(`${baseUrl}/api/jobs/${job.jobId}`);
        const data = await r.json();
        setJob(data);
        setStatus(data.status || 'Processing');
        if (['completed','failed','cancelled'].includes(data.status)) window.clearInterval(timer);
      } catch {}
    }, 1000);
    return () => window.clearInterval(timer);
  }, [job?.jobId]);

  const wav2lip = capabilities?.engines?.find((e: any) => e.id === 'wav2lip_onnx');

  return (
    <section className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div><div className="text-xs uppercase tracking-widest text-amber-400">LipSync Studio</div><h1 className="text-2xl font-semibold text-white">Local Neural LipSync</h1><p className="text-sm text-slate-400 mt-1">Wav2Lip is the primary verified production path; MuseTalk remains experimental.</p></div>
        <button onClick={probe} className="px-3 py-2 rounded bg-[#252832] text-slate-200 text-sm flex items-center gap-2"><Activity className="w-4 h-4"/> {status}</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <label className="rounded-xl border border-[#292c33] bg-[#15171c] p-5 cursor-pointer">
          <Upload className="w-5 h-5 text-amber-400 mb-3"/>
          <div className="text-sm text-white">Character image</div>
          <div className="text-xs text-slate-500 mt-1">{image?.name || 'PNG, JPG or WebP'}</div>
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => setImage(e.target.files?.[0] || null)} />
        </label>
        <label className="rounded-xl border border-[#292c33] bg-[#15171c] p-5 cursor-pointer">
          <Upload className="w-5 h-5 text-amber-400 mb-3"/>
          <div className="text-sm text-white">Speech audio</div>
          <div className="text-xs text-slate-500 mt-1">{audio?.name || 'WAV, MP3, M4A, FLAC or OGG'}</div>
          <input type="file" accept="audio/*" className="hidden" onChange={e => setAudio(e.target.files?.[0] || null)} />
        </label>
        <div className="rounded-xl border border-[#292c33] bg-[#15171c] p-5">
          <div className="text-sm text-white">Runtime</div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            {wav2lip?.status === 'available' ? <CheckCircle2 className="w-4 h-4 text-emerald-400"/> : <AlertTriangle className="w-4 h-4 text-amber-400"/>}
            <span className="text-slate-300">{wav2lip?.status || 'not verified'}</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">{wav2lip?.backend || 'No backend reported'}</div>
          <button disabled={!image || !audio || wav2lip?.status !== 'available'} onClick={generate} className="mt-5 w-full px-3 py-2 rounded bg-amber-500 disabled:opacity-40 text-black font-medium text-sm flex items-center justify-center gap-2"><Play className="w-4 h-4"/> Generate</button>
        </div>
      </div>

      {job && <div className="mt-5 rounded-xl border border-[#292c33] bg-[#15171c] p-5">
        <div className="flex justify-between"><div className="text-sm text-white">Job {job.jobId || job.id}</div><div className="text-xs text-slate-400">{job.status}</div></div>
        <div className="mt-3 h-2 rounded bg-[#252832] overflow-hidden"><div className="h-full bg-amber-400 transition-all" style={{width: `${Math.max(0, Math.min(100, job.progress || 0))}%`}}/></div>
        {job.message && <div className="text-xs text-slate-500 mt-2">{job.message}</div>}
        {job.result && <pre className="mt-3 text-xs text-slate-400 whitespace-pre-wrap">{JSON.stringify(job.result, null, 2)}</pre>}
      </div>}
    </section>
  );
};
