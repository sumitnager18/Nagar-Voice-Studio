import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { QAQualityReport } from '../../types/audio';

interface SpeechQAModalProps {
  report: QAQualityReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SpeechQAModal: React.FC<SpeechQAModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !report) return null;

  const getStatusIcon = (status: 'PASS' | 'WARNING' | 'FAIL') => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'FAIL':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#16171d] border border-[#2b2d35] rounded-xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262830] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Speech Quality Assurance (QA) Verification
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overall Status Banner */}
        <div
          className={`p-3 rounded-lg border flex items-center justify-between ${
            report.overallStatus === 'PASS'
              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
              : report.overallStatus === 'WARNING'
              ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
              : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {getStatusIcon(report.overallStatus)}
            <div>
              <div className="font-semibold text-xs tracking-wider uppercase">
                Overall Result: {report.overallStatus}
              </div>
              <div className="text-[11px] opacity-80">
                {report.chunkCount} chunks evaluated · Master duration: {report.totalDurationSeconds}s
              </div>
            </div>
          </div>
        </div>

        {/* Individual Verification Items */}
        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          {report.checks.map((check) => (
            <div
              key={check.id}
              className="p-2.5 rounded-lg bg-[#1a1c22] border border-[#252830] text-xs flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  {getStatusIcon(check.status)}
                  <span>{check.title}</span>
                </div>
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                    check.status === 'PASS'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : check.status === 'WARNING'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {check.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                {check.details}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#262830]">
          <span className="text-[10px] font-mono text-slate-400">
            Checked at {new Date(report.checkedAt).toLocaleTimeString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
