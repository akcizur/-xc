import React from 'react';

interface LoaderScreenProps {
  statusText?: string;
  subText?: string;
}

export const LoaderScreen: React.FC<LoaderScreenProps> = ({
  statusText = 'NAČÍTÁNÍ MODELU...',
  subText = 'bb3005.glb',
}) => {
  return (
    <div
      id="loader-screen"
      className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center select-none"
    >
      <div className="relative mb-8 flex items-center justify-center">
        {/* Animated brick stud ring */}
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 animate-pulse flex items-center justify-center shadow-lg shadow-blue-500/20">
          <div className="w-8 h-8 rounded-full border-2 border-blue-400 animate-spin border-t-transparent" />
        </div>
      </div>

      <h2
        id="load-status"
        className="text-white font-extralight tracking-[0.25em] text-lg sm:text-xl uppercase text-center px-4"
      >
        {statusText}
      </h2>
      <p className="text-white/50 text-xs font-mono mt-2 tracking-wider">
        {subText}
      </p>

      <div className="mt-8 flex items-center gap-2 text-white/30 text-xs tracking-widest uppercase">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
        Byldr Studio Engine
      </div>
    </div>
  );
};
