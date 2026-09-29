import React from 'react';
import { Sliders, Mic, FolderArchive, Music, Settings, Activity } from 'lucide-react';

export type NavTab = 'studio' | 'story' | 'lipsync' | 'voices' | 'projects' | 'audio' | 'suite' | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingQueueCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  pendingQueueCount = 0,
}) => {
  const navItems = [
    { id: 'studio' as NavTab, label: 'Voice Studio', icon: Sliders, badge: pendingQueueCount > 0 ? `${pendingQueueCount}` : null },
    { id: 'story' as NavTab, label: 'Story', icon: Activity, badge: null },
    { id: 'lipsync' as NavTab, label: 'LipSync', icon: Activity, badge: null },
    { id: 'voices' as NavTab, label: 'Voice Library', icon: Mic, badge: null },
    { id: 'projects' as NavTab, label: 'Projects', icon: FolderArchive, badge: null },
    { id: 'audio' as NavTab, label: 'Audio Library', icon: Music, badge: null },
    { id: 'suite' as NavTab, label: 'Media Suite', icon: Activity, badge: null },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <>
      {/* Desktop Sub-Header Navigation */}
      <nav className="hidden md:flex items-center px-6 h-11 border-b border-[#22242a] bg-[#141519] select-none gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#22242b] text-amber-300 shadow-sm border border-[#2f323a]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1c21]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Android Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121316] border-t border-[#26282e] flex items-center justify-around px-2 py-1 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-colors relative ${
                isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 text-[9px] font-mono px-1 bg-amber-500 text-black font-semibold rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
