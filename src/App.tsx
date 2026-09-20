/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BrickEngine } from './engine';
import { BuildMode } from './types';
import { LoaderScreen } from './components/LoaderScreen';
import { TouchJoystick } from './components/TouchJoystick';
import { TopBar } from './components/TopBar';
import { SideBar } from './components/SideBar';
import { BottomControls } from './components/BottomControls';
import { InventoryModal } from './components/InventoryModal';
import { HelpModal } from './components/HelpModal';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BrickEngine | null>(null);

  const [engineStatus, setEngineStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [statusText, setStatusText] = useState('NAČÍTÁNÍ MODELU...');
  const [mode, setMode] = useState<BuildMode>('BUILD');
  const [colorIdx, setColorIdx] = useState(1); // 1 = Blue (#007aff)
  const [rotation, setRotation] = useState(0);
  const [brickTypeId, setBrickTypeId] = useState('bb3005');
  const [brickCount, setBrickCount] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [playerHeight, setPlayerHeight] = useState(1.6);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new BrickEngine(containerRef.current, {
      onBrickCountChange: (count) => setBrickCount(count),
      onCanUndoChange: (can) => setCanUndo(can),
      onStatusChange: (status, text) => {
        setEngineStatus(status);
        if (text) setStatusText(text);
      },
      onHeightChange: (h) => setPlayerHeight(h),
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleSetMode = (m: BuildMode) => {
    setMode(m);
    engineRef.current?.setMode(m);
  };

  const handleSelectColor = (idx: number) => {
    setColorIdx(idx);
    engineRef.current?.setColorIdx(idx);
  };

  const handleSelectBrickType = (id: string) => {
    setBrickTypeId(id);
    engineRef.current?.setBrickType(id);
  };

  const handleRotate = () => {
    engineRef.current?.rotate();
    if (engineRef.current) {
      setRotation(engineRef.current.rotation);
    }
  };

  const handleUndo = () => {
    engineRef.current?.undo();
  };

  const handleClearScene = () => {
    engineRef.current?.clearAll();
  };

  const handleResetCamera = () => {
    engineRef.current?.resetCamera();
  };

  const handleElevate = (delta: number) => {
    engineRef.current?.elevate(delta);
  };

  const handleLoadPreset = (name: 'tower' | 'pyramid' | 'house') => {
    engineRef.current?.loadPreset(name);
  };

  const handleAction = () => {
    engineRef.current?.performAction();
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.soundEnabled = next;
      }
      return next;
    });
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none touch-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-crosshair"
      />

      {/* Crosshair in the exact center */}
      {engineStatus === 'ready' && <div className="crosshair" />}

      {/* Loading Screen */}
      {engineStatus === 'loading' && (
        <LoaderScreen statusText={statusText} subText="bb3005.glb" />
      )}

      {/* In-Game UI Overlay */}
      {engineStatus === 'ready' && (
        <div id="ui" className="absolute inset-0 pointer-events-none">
          {/* Virtual Joystick for Touch */}
          <TouchJoystick engine={engineRef.current} />

          {/* Top Panel Controls */}
          <TopBar
            canUndo={canUndo}
            brickCount={brickCount}
            rotation={rotation}
            soundEnabled={soundEnabled}
            playerHeight={playerHeight}
            onUndo={handleUndo}
            onRotate={handleRotate}
            onToggleSound={handleToggleSound}
            onResetCamera={handleResetCamera}
            onClearScene={handleClearScene}
            onOpenHelp={() => setHelpOpen(true)}
            onElevate={handleElevate}
            onLoadPreset={handleLoadPreset}
          />

          {/* Side Mode Selector */}
          <SideBar
            mode={mode}
            soundEnabled={soundEnabled}
            onSetMode={handleSetMode}
          />

          {/* Bottom Right Action & Color Pill */}
          <BottomControls
            mode={mode}
            colorIdx={colorIdx}
            soundEnabled={soundEnabled}
            onAction={handleAction}
            onToggleInventory={() => setInvOpen((prev) => !prev)}
          />

          {/* Inventory & Color Palette Drawer */}
          <InventoryModal
            isOpen={invOpen}
            selectedColorIdx={colorIdx}
            selectedBrickTypeId={brickTypeId}
            soundEnabled={soundEnabled}
            onSelectColor={handleSelectColor}
            onSelectBrickType={handleSelectBrickType}
            onClose={() => setInvOpen(false)}
          />

          {/* Help / Controls modal */}
          <HelpModal
            isOpen={helpOpen}
            soundEnabled={soundEnabled}
            onClose={() => setHelpOpen(false)}
          />
        </div>
      )}
    </main>
  );
}
