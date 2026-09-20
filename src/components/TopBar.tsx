import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, Trash2, Eye, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { playClickSound } from '../audio';

interface TopBarProps {
  canUndo: boolean;
  brickCount: number;
  rotation: number;
  soundEnabled: boolean;
  playerHeight: number;
  onUndo: () => void;
  onRotate: () => void;
  onToggleSound: () => void;
  onResetCamera: () => void;
  onClearScene: () => void;
  onOpenHelp: () => void;
  onElevate: (delta: number) => void;
  onLoadPreset: (name: 'tower' | 'pyramid' | 'house') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  canUndo,
  brickCount,
  rotation,
  soundEnabled,
  playerHeight,
  onUndo,
  onRotate,
  onToggleSound,
  onResetCamera,
  onClearScene,
  onOpenHelp,
  onElevate,
  onLoadPreset,
}) => {
  const [presetOpen, setPresetOpen] = useState(false);

  return (
    <div className="top-center fixed top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
      <div className="panel panel-glass px-2.5 py-1.5 rounded-2xl flex items-center gap-2 pointer-events-auto border border-white/15">
        {/* Undo button */}
        <button
          id="btn-undo"
          onClick={() => {
            playClickSound(soundEnabled);
            onUndo();
          }}
          disabled={!canUndo}
          title="Zpět (Z / Ctrl+Z)"
          aria-label="Zpět"
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            canUndo
              ? 'bg-white/10 hover:bg-white/20 active:scale-95 text-white'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path d="M9 14L4 9l5-5" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
        </button>

        {/* Rotate button */}
        <button
          id="btn-rotate"
          onClick={() => {
            onRotate();
          }}
          title={`Otočit model (R) - ${rotation * 90}°`}
          aria-label="Otočit"
          className="relative w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
        >
          <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span className="absolute bottom-1 right-1 text-[9px] font-mono leading-none bg-blue-500/80 px-1 py-0.5 rounded text-white font-semibold">
            {rotation * 90}°
          </span>
        </button>

        <div className="w-[1px] h-6 bg-white/15 mx-0.5" />

        {/* Brick count & scale badge */}
        <div className="flex items-center gap-1.5">
          <div className="px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 text-xs font-medium text-white/90 flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>{brickCount} kostek</span>
          </div>
          <div
            title="Měřítko scény: 1 blok = 50 cm (hráč 1.6 m)"
            className="hidden sm:flex items-center px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-[11px] font-mono text-white/60 whitespace-nowrap"
          >
            1 mřížka = 0.5 m
          </div>
        </div>

        {/* Camera Height Elevation Controls */}
        <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5 text-xs text-white/90 font-mono">
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              onElevate(-0.4);
            }}
            title="Snížit výšku pohledu (PageDown / Q)"
            aria-label="Snížit výšku"
            className="p-1 hover:bg-white/10 rounded active:scale-90 text-white/70 hover:text-white"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-[11px] whitespace-nowrap" title="Aktuální výška očí hráče">
            {playerHeight.toFixed(1)}m
          </span>
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              onElevate(0.4);
            }}
            title="Zvýšit výšku pohledu / let (PageUp / E)"
            aria-label="Zvýšit výšku"
            className="p-1 hover:bg-white/10 rounded active:scale-90 text-white/70 hover:text-white"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-6 bg-white/15 mx-0.5" />

        {/* Presets Button */}
        <div className="relative">
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              setPresetOpen((p) => !p);
            }}
            title="Vzory staveb"
            aria-label="Vzory staveb"
            className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/30 active:scale-95 text-amber-300 flex items-center justify-center transition-all"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {presetOpen && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 w-48 panel panel-glass p-1.5 rounded-xl border border-white/20 shadow-2xl flex flex-col gap-1 z-30 pointer-events-auto">
              <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-white/40">
                Vzory staveb
              </div>
              <button
                onClick={() => {
                  playClickSound(soundEnabled);
                  onLoadPreset('tower');
                  setPresetOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/15 text-left text-xs text-white flex items-center gap-2 transition-colors"
              >
                <span>🏰</span>
                <div className="flex flex-col">
                  <span className="font-medium">Hradní věž</span>
                  <span className="text-[10px] text-white/50">4 patra (2.4 m)</span>
                </div>
              </button>
              <button
                onClick={() => {
                  playClickSound(soundEnabled);
                  onLoadPreset('pyramid');
                  setPresetOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/15 text-left text-xs text-white flex items-center gap-2 transition-colors"
              >
                <span>🔺</span>
                <div className="flex flex-col">
                  <span className="font-medium">Pyramida</span>
                  <span className="text-[10px] text-white/50">3 stupně</span>
                </div>
              </button>
              <button
                onClick={() => {
                  playClickSound(soundEnabled);
                  onLoadPreset('house');
                  setPresetOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/15 text-left text-xs text-white flex items-center gap-2 transition-colors"
              >
                <span>🏠</span>
                <div className="flex flex-col">
                  <span className="font-medium">Domek</span>
                  <span className="text-[10px] text-white/50">Stěny & střecha</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Reset Camera */}
        <button
          onClick={() => {
            playClickSound(soundEnabled);
            onResetCamera();
          }}
          title="Resetovat pohled kamery"
          aria-label="Pohled kamery"
          className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
        >
          <Eye className="w-5 h-5 text-white/80" />
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => {
            onToggleSound();
          }}
          title={soundEnabled ? 'Vypnout zvuky' : 'Zapnout zvuky'}
          aria-label="Zvuk"
          className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-blue-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-white/40" />
          )}
        </button>

        {/* Clear scene */}
        {brickCount > 0 && (
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              if (window.confirm('Opravdu chcete vyčistit všechny položené kostky?')) {
                onClearScene();
              }
            }}
            title="Smazat vše"
            aria-label="Smazat vše"
            className="w-11 h-11 rounded-xl bg-red-500/20 hover:bg-red-500/30 active:scale-95 text-red-400 flex items-center justify-center transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}

        {/* Help */}
        <button
          onClick={() => {
            playClickSound(soundEnabled);
            onOpenHelp();
          }}
          title="Nápověda k ovládání"
          aria-label="Nápověda"
          className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
        >
          <HelpCircle className="w-5 h-5 text-white/80" />
        </button>
      </div>
    </div>
  );
};
