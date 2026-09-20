import React from 'react';
import { BuildMode } from '../types';
import { playClickSound } from '../audio';

interface SideBarProps {
  mode: BuildMode;
  soundEnabled: boolean;
  onSetMode: (mode: BuildMode) => void;
}

export const SideBar: React.FC<SideBarProps> = ({ mode, soundEnabled, onSetMode }) => {
  return (
    <div className="side-left fixed left-5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
      <div className="panel panel-glass p-2 rounded-2xl flex flex-col gap-2.5 pointer-events-auto border border-white/15">
        {/* Build Mode Button */}
        <button
          id="mode-build"
          onClick={() => {
            playClickSound(soundEnabled);
            onSetMode('BUILD');
          }}
          title="Režim stavění (B)"
          aria-label="Režim stavění"
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            mode === 'BUILD'
              ? 'bg-[#007aff] text-white shadow-lg shadow-blue-500/40 scale-105'
              : 'bg-white/10 hover:bg-white/20 text-white/70 active:scale-95'
          }`}
        >
          <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Erase Mode Button */}
        <button
          id="mode-erase"
          onClick={() => {
            playClickSound(soundEnabled);
            onSetMode('ERASE');
          }}
          title="Režim mazání (E)"
          aria-label="Režim mazání"
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            mode === 'ERASE'
              ? 'bg-[#ff3b30] text-white shadow-lg shadow-red-500/40 scale-105'
              : 'bg-white/10 hover:bg-white/20 text-white/70 active:scale-95'
          }`}
        >
          <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>
      </div>
    </div>
  );
};
