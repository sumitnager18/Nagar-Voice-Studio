import React from 'react';
import { Youtube, Terminal, BookOpen, Users, Disc3 } from 'lucide-react';
import { ProductionMode } from '../../types/project';

interface ProductionModeSelectorProps {
  currentMode: ProductionMode;
  onSelectMode: (mode: ProductionMode) => void;
}

export const ProductionModeSelector: React.FC<ProductionModeSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const modes: Array<{
    id: ProductionMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }> = [
    {
      id: 'standard',
      label: 'Standard',
      icon: Disc3,
      description: 'Standard TTS narration with full custom style parameters',
    },
    {
      id: 'youtube',
      label: 'YouTube Narration',
      icon: Youtube,
      description: 'Pacing optimized for YouTube videos with target duration metrics',
    },
    {
      id: 'computerguruhub',
      label: 'ComputerGuruHub',
      icon: Terminal,
      description: 'Educational authority, protected CS/programming terminology in Hinglish',
    },
    {
      id: 'story',
      label: 'Storytelling',
      icon: BookOpen,
      description: 'Mystery, horror, suspense, emotional & mythological storytelling',
    },
    {
      id: 'dialogue',
      label: 'Dialogue',
      icon: Users,
      description: 'Multi-speaker turn-based script with character voice assignment',
    },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            title={mode.description}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'bg-[#18191e] hover:bg-[#202228] text-slate-300 border border-[#272930]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};
