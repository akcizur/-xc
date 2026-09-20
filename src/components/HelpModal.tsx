import React from 'react';
import { X, Smartphone, Monitor } from 'lucide-react';
import { playClickSound } from '../audio';

interface HelpModalProps {
  isOpen: boolean;
  soundEnabled: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, soundEnabled, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[rgba(20,20,22,0.95)] border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-white font-bold text-lg">Ovládání Byldr Studio</h3>
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Proportions and scale */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-xs text-blue-200/90 leading-relaxed">
          <strong className="text-white block mb-0.5">Realistické proporce k hráči:</strong>
          Výška pohledu je 1.6 m (reálná lidská postava). Základní kostka 1×1 (3005) má 50×50 cm a výšku 60 cm. 3 kostky na sobě odpovídají výšce dospělého člověka (1.8 m).
        </div>

        {/* Mobile touch controls */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <Smartphone className="w-4 h-4" />
            <span>Mobil / Dotykové ovládání</span>
          </div>
          <ul className="text-xs text-white/80 space-y-1.5 list-disc list-inside bg-white/5 p-3 rounded-xl border border-white/10">
            <li><strong>Levá polovina obrazovky:</strong> Virtuální joystick pro pohyb dopředu, dozadu a do stran</li>
            <li><strong>Pravá polovina obrazovky:</strong> Potažením prstu se rozhlížíte (kamera)</li>
            <li><strong>Velké modré/červené tlačítko:</strong> Položit nebo smazat kostku</li>
            <li><strong>Horní lišta:</strong> Krok zpět a rotace kostky o 90°</li>
          </ul>
        </div>

        {/* Desktop controls */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
            <Monitor className="w-4 h-4" />
            <span>Počítač (Klávesnice & Myš)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-white/80 bg-white/5 p-3 rounded-xl border border-white/10 font-mono">
            <div><span className="text-white font-bold bg-white/15 px-1.5 py-0.5 rounded">W A S D</span> Pohyb</div>
            <div><span className="text-white font-bold bg-white/15 px-1.5 py-0.5 rounded">Myš</span> Rozhlížení</div>
            <div><span className="text-white font-bold bg-white/15 px-1.5 py-0.5 rounded">Space</span> Akce</div>
            <div><span className="text-white font-bold bg-white/15 px-1.5 py-0.5 rounded">R</span> Otočit</div>
            <div><span className="text-white font-bold bg-white/15 px-1.5 py-0.5 rounded">Z</span> Zpět</div>
            <div><span className="text-white font-bold bg-white/15 px-1.5 py-0.5 rounded">B / E / X</span> Stavět / Mazat</div>
            <div><span className="text-white font-bold bg-white/15 px-1.5 py-0.5 rounded">PgUp/PgDn</span> Výška pohledu</div>
            <div><span className="text-white font-bold bg-white/15 px-1.5 py-0.5 rounded">✨ Vzory</span> Hotové stavby</div>
          </div>
        </div>

        <button
          onClick={() => {
            playClickSound(soundEnabled);
            onClose();
          }}
          className="w-full bg-[#007aff] hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          Rozumím
        </button>
      </div>
    </div>
  );
};
