import React from 'react';
import { BuildMode, COLORS } from '../types';
import { playClickSound } from '../audio';

interface BottomControlsProps {
  mode: BuildMode;
  colorIdx: number;
  soundEnabled: boolean;
  onAction: () => void;
  onToggleInventory: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  mode,
  colorIdx,
  soundEnabled,
  onAction,
  onToggleInventory,
}) => {
  const activeColor = COLORS[colorIdx]?.css || '#007aff';

  return (
    <div className="bottom-right fixed bottom-6 right-5 z-20 flex flex-col items-end gap-3 pointer-events-none">
      {/* Big Action Circle Button */}
      <button
        id="btn-action"
        onClick={() => {
          onAction();
        }}
        title={mode === 'BUILD' ? 'Položit kostku (Mezerník / Klik)' : 'Smazat zaměřenou kostku'}
        aria-label={mode === 'BUILD' ? 'Položit' : 'Smazat'}
        className={`w-20 h-20 rounded-full flex items-center justify-center pointer-events-auto transition-all transform active:scale-95 shadow-2xl cursor-pointer ${
          mode === 'BUILD'
            ? 'bg-[#007aff] hover:bg-blue-600 shadow-blue-500/50 text-white'
            : 'bg-[#ff3b30] hover:bg-red-600 shadow-red-500/50 text-white'
        }`}
      >
        {mode === 'BUILD' ? (
          <svg
            className="w-8 h-8 fill-none stroke-current"
            style={{ strokeWidth: 3.5 }}
            viewBox="0 0 24 24"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        ) : (
          <svg
            className="w-8 h-8 fill-none stroke-current"
            style={{ strokeWidth: 3.5 }}
            viewBox="0 0 24 24"
          >
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>

      {/* Color Preview & Inventory Toggle Panel */}
      <div className="panel panel-glass p-2 rounded-2xl flex items-center gap-2.5 pointer-events-auto border border-white/15">
        {/* Active Color Preview */}
        <div
          id="active-color-preview"
          onClick={() => {
            playClickSound(soundEnabled);
            onToggleInventory();
          }}
          title="Klikněte pro výběr barvy"
          style={{ backgroundColor: activeColor }}
          className="w-12 h-12 rounded-xl border-[3px] border-white shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        />

        {/* Inventory Button */}
        <button
          id="btn-inventory"
          onClick={() => {
            playClickSound(soundEnabled);
            onToggleInventory();
          }}
          title="Otevřít paletu a kostky (C / I)"
          aria-label="Paleta"
          className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
        >
          <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};
