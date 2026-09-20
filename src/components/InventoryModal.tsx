import React from 'react';
import { BRICK_TYPES, COLORS } from '../types';
import { playClickSound } from '../audio';
import { X, Layers } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  selectedColorIdx: number;
  selectedBrickTypeId: string;
  soundEnabled: boolean;
  onSelectColor: (idx: number) => void;
  onSelectBrickType: (id: string) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  selectedColorIdx,
  selectedBrickTypeId,
  soundEnabled,
  onSelectColor,
  onSelectBrickType,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="inventory"
      className="fixed inset-x-0 bottom-0 z-40 bg-[rgba(20,20,22,0.92)] backdrop-blur-2xl border-t border-white/20 pb-8 pt-5 px-4 shadow-2xl transition-transform duration-300 max-h-[85vh] overflow-y-auto"
    >
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold text-lg tracking-wide">
              Paleta & Typy kostek
            </h3>
          </div>
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brick Type Selector */}
        <div>
          <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2.5 block">
            Typ kostky / model
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BRICK_TYPES.map((type) => {
              const isSelected = type.id === selectedBrickTypeId;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    playClickSound(soundEnabled);
                    onSelectBrickType(type.id);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    isSelected
                      ? 'bg-blue-600/30 border-blue-500 shadow-md shadow-blue-500/20 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-semibold">{type.name}</span>
                  <span className="text-[10px] font-mono text-white/40">
                    {type.studsX}×{type.studsZ} studs ({Math.round(type.w * 100)}×{Math.round(type.l * 100)} cm)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs uppercase tracking-wider text-white/50 font-medium">
              Výběr barvy ({COLORS[selectedColorIdx]?.label || 'Modrá'})
            </label>
            <span className="text-xs font-mono text-blue-400">
              {COLORS[selectedColorIdx]?.css.toUpperCase()}
            </span>
          </div>

          <div className="color-grid grid grid-cols-5 sm:grid-cols-8 gap-3.5 p-2 bg-white/5 rounded-2xl border border-white/10">
            {COLORS.map((color, idx) => {
              const isActive = idx === selectedColorIdx;
              return (
                <button
                  key={color.hex}
                  onClick={() => {
                    playClickSound(soundEnabled);
                    onSelectColor(idx);
                  }}
                  title={color.label}
                  aria-label={color.label}
                  className={`color-dot aspect-square rounded-full transition-transform duration-150 cursor-pointer ${
                    isActive
                      ? 'ring-4 ring-white scale-110 shadow-lg'
                      : 'ring-2 ring-white/20 hover:scale-105 active:scale-95'
                  }`}
                  style={{ backgroundColor: color.css }}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom Close Button matching original ZAVŘÍT */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              onClose();
            }}
            className="w-full sm:w-auto bg-[#007aff] hover:bg-blue-600 active:scale-95 text-white py-3 px-12 rounded-2xl font-bold tracking-wider transition-all shadow-lg shadow-blue-500/30"
          >
            ZAVŘÍT
          </button>
        </div>
      </div>
    </div>
  );
};
