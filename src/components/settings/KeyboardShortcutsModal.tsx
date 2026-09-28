import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + Enter', description: 'Trigger Speech Generation on current script' },
    { key: 'Space', description: 'Play / Pause master audio monitor' },
    { key: 'Ctrl + S', description: 'Save current project & version snapshot' },
    { key: 'Ctrl + N', description: 'Create new project from scratch' },
    { key: 'Ctrl + Z', description: 'Undo script text edits' },
    { key: 'Ctrl + Shift + Z', description: 'Redo script text edits' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#16171d] border border-[#2b2d35] rounded-xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#262830] pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Desktop Keyboard Shortcuts
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xs p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2 rounded-lg bg-[#181a20] border border-[#252830] text-xs"
            >
              <span className="text-slate-300">{sc.description}</span>
              <kbd className="px-2 py-1 rounded bg-[#101115] border border-[#2b2d37] font-mono text-[11px] text-amber-400 font-semibold shadow-inner">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#262830]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#24262e] hover:bg-[#2d303a] text-slate-200 text-xs font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
