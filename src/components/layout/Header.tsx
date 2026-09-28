import React from 'react';
import { Volume2, Sparkles, Sliders, Keyboard, Play, RefreshCw, Layers } from 'lucide-react';
import { Project } from '../../types/project';

interface HeaderProps {
  currentProject: Project | null;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onOpenShortcuts: () => void;
  activeNav: string;
  onNavigate: (nav: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  projects,
  onSelectProject,
  onNewProject,
  onOpenShortcuts,
  activeNav,
  onNavigate,
}) => {
  return (
    <header className="h-14 border-b border-[#26282e] bg-[#121316] px-4 md:px-6 flex items-center justify-between select-none z-30 sticky top-0">
      {/* Brand & Project Selector */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('studio')}
          className="flex items-center gap-2.5 group text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm shadow-amber-950/40 text-black font-bold">
            <Volume2 className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-slate-100 group-hover:text-amber-400 transition-colors">
                NAGAR VOICE STUDIO
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400/90 font-medium">
                PRO NLP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              NLP Text-to-Speech & Voice Production
            </p>
          </div>
        </button>

        {/* Vertical divider */}
        <div className="h-5 w-[1px] bg-[#26282e] hidden md:block" />

        {/* Project Switcher */}
        {currentProject && (
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-slate-400">Project:</span>
            <select
              value={currentProject.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-[#18191e] border border-[#2d3037] text-slate-200 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-amber-500/60 max-w-[200px] truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            <span className="text-xs text-slate-400">
              v{currentProject.currentVersion || 1}
            </span>
          </div>
        )}
      </div>

      {/* Action shortcuts & quick links */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick New Project */}
        <button
          onClick={onNewProject}
          title="New Project (Ctrl+N)"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-slate-100 bg-[#18191e] hover:bg-[#202227] border border-[#2a2c33] rounded-md transition-colors"
        >
          <span>+ New Project</span>
        </button>

        {/* Keyboard Shortcuts Trigger */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1e2025] rounded-md transition-colors"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-[#26282e]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Gemini Engine Ready
          </span>
        </div>
      </div>
    </header>
  );
};
