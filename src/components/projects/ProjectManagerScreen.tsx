import React, { useRef, useState } from 'react';
import {
  FolderArchive,
  Plus,
  Download,
  Upload,
  Trash2,
  Copy,
  Clock,
  CheckCircle2,
  Layers,
  FileJson,
  ExternalLink
} from 'lucide-react';
import { Project } from '../../types/project';
import { LocalDatabase } from '../../services/storage/LocalDatabase';

interface ProjectManagerScreenProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onImportProject: (jsonStr: string) => void;
}

export const ProjectManagerScreen: React.FC<ProjectManagerScreenProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onDuplicateProject,
  onImportProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedVersionProject, setSelectedVersionProject] = useState<Project | null>(null);

  const handleExportProject = (project: Project) => {
    const jsonStr = LocalDatabase.exportProjectPackage(project);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_package.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) onImportProject(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#25272e] pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Project Management</span>
            <span className="text-xs font-mono font-normal text-amber-400">
              ({projects.length} Saved)
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Persistent local projects, version history (v1, v2, v3), and complete JSON packages
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202228] hover:bg-[#282b33] text-slate-200 text-xs font-medium border border-[#2d3038] transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Import Project</span>
          </button>

          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
          <FolderArchive className="w-10 h-10 text-slate-600 mb-2" />
          <p className="font-medium text-slate-300">No projects found</p>
          <button
            onClick={onNewProject}
            className="mt-3 px-3 py-1.5 rounded bg-amber-500 text-black text-xs font-semibold"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const isActive = project.id === activeProjectId;
            const wordCount = project.originalScript.trim().split(/\s+/).filter(Boolean).length;
            const chunkCount = project.chunks?.length || 0;

            return (
              <div
                key={project.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all select-none ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-950/20'
                    : 'bg-[#16171d] hover:bg-[#1a1c23] border-[#25272e]'
                }`}
              >
                <div>
                  {/* Top line: Active badge & Mode */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold">
                      {project.productionMode} MODE
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      v{project.currentVersion || 1}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => onSelectProject(project.id)}
                    className="text-sm font-semibold text-slate-100 hover:text-amber-300 transition-colors cursor-pointer truncate mb-1"
                  >
                    {project.title}
                  </h3>

                  {/* Script Excerpt */}
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {project.originalScript || 'Empty script...'}
                  </p>

                  {/* Metadata unboxed text */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-4">
                    <span>{wordCount} words</span>
                    <span>·</span>
                    <span>{chunkCount} chunks</span>
                    <span>·</span>
                    <span>{project.language}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-[#23252c] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-amber-500 text-black'
                          : 'bg-[#22242c] hover:bg-[#2c2f3a] text-slate-200'
                      }`}
                    >
                      {isActive ? 'Active' : 'Open'}
                    </button>

                    {/* Versions viewer */}
                    {project.versions && project.versions.length > 0 && (
                      <button
                        onClick={() => setSelectedVersionProject(project)}
                        className="px-2 py-1 rounded bg-[#202228] hover:bg-[#282b33] text-slate-300 text-xs flex items-center gap-1"
                        title="View Version History"
                      >
                        <Layers className="w-3 h-3 text-amber-400" />
                        <span>{project.versions.length} versions</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleExportProject(project)}
                      className="p-1.5 rounded hover:bg-[#23252c] text-slate-400 hover:text-amber-400 transition-colors"
                      title="Export Package (JSON)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDuplicateProject(project.id)}
                      className="p-1.5 rounded hover:bg-[#23252c] text-slate-400 hover:text-slate-200 transition-colors"
                      title="Duplicate Project"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {projects.length > 1 && (
                      <button
                        onClick={() => onDeleteProject(project.id)}
                        className="p-1.5 rounded hover:bg-[#23252c] text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Version History Modal */}
      {selectedVersionProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#16171d] border border-[#2b2d35] rounded-xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#262830] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Version History: {selectedVersionProject.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedVersionProject(null)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {selectedVersionProject.versions.map((ver) => (
                <div
                  key={ver.versionNumber}
                  className="p-3 rounded-lg bg-[#181a20] border border-[#252830] text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-semibold text-amber-300">
                      Version {ver.versionNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {new Date(ver.createdAt).toLocaleString()}
                    </span>
                    <p className="text-[11px] text-slate-300 line-clamp-1 mt-1">
                      {ver.originalScript}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {ver.chunks.length} chunks
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#262830]">
              <button
                onClick={() => setSelectedVersionProject(null)}
                className="px-4 py-1.5 rounded-lg bg-[#24262e] text-slate-200 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
