import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, CircleAlert, RefreshCw } from 'lucide-react';

type SuiteResponse = {
  product: string;
  schemaVersion: string;
  timestamp: string;
  modules: Record<string, {
    status: string;
    endpoint?: string;
    probe?: { reachable?: boolean; error?: string; httpStatus?: number };
  }>;
};

export const MediaSuiteScreen: React.FC = () => {
  const [data, setData] = useState<SuiteResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/suite/capabilities');
      if (!response.ok) throw new Error('Capability endpoint unavailable');
      setData(await response.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <section className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400">Nagar Studio</p>
          <h1 className="text-2xl font-semibold text-white mt-1">Media Suite</h1>
          <p className="text-sm text-slate-400 mt-1">One control plane for Voice, Audio, LipSync and Story production.</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#202229] text-slate-200 hover:bg-[#292c35] text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {!data && !loading && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-200">
          Nagar Studio server is not responding. Start it with <code className="font-mono">npm run dev</code>.
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data.modules).map(([id, module]) => {
            const verified = module.status === 'verified';
            const configured = module.status === 'configured' || module.status === 'available';
            return (
              <div key={id} className="rounded-xl border border-[#292c33] bg-[#15171c] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white capitalize">{id.replace(/([A-Z])/g, ' $1')}</div>
                    {module.endpoint && <div className="text-[11px] font-mono text-slate-500 mt-1">{module.endpoint}</div>}
                  </div>
                  {verified ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                    configured ? <Activity className="w-5 h-5 text-amber-400" /> :
                    <CircleAlert className="w-5 h-5 text-red-400" />}
                </div>
                <div className="mt-4 text-xs font-mono uppercase tracking-wider text-slate-400">{module.status}</div>
                {module.probe?.error && <p className="mt-2 text-xs text-slate-500">{module.probe.error}</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-[#292c33] bg-[#121419] p-5 text-xs text-slate-400">
        <strong className="text-slate-200">Capability rule:</strong> a module is never shown as hardware-accelerated or model-ready merely because it is configured. Runtime verification is required.
      </div>
    </section>
  );
};
