import React from 'react';
import { useGameStore } from '../store';
import { ArrowUp, DoorClosed, Eye, Camera, Waves, Zap, BookOpen } from 'lucide-react';

export function MobileActionControls() {
  const setMobileJump = useGameStore((state) => state.setMobileJump);
  const mobileSprint = useGameStore((state) => state.mobileSprint);
  const setMobileSprint = useGameStore((state) => state.setMobileSprint);
  const toggleHabitatDoor = useGameStore((state) => state.toggleHabitatDoor);
  const toggleCameraMode = useGameStore((state) => state.toggleCameraMode);
  const visorMode = useGameStore((state) => state.visorMode);
  const setVisorMode = useGameStore((state) => state.setVisorMode);
  const isPlayerInWater = useGameStore((state) => state.isPlayerInWater);
  const isNearVAB = useGameStore((state) => state.isNearVAB);
  const isHabitatDoorOpen = useGameStore((state) => state.isHabitatDoorOpen);
  const isNearComputer = useGameStore((state) => state.isNearComputer);
  const setComputerLibraryOpen = useGameStore((state) => state.setComputerLibraryOpen);
  const scene = useGameStore((state) => state.scene);
  const isSpace = scene === 'space';

  return (
    <div
      className="flex flex-col items-end gap-3 pointer-events-auto select-none touch-none pb-2 pr-1"
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Top Arc: Utility Controls (Camera, Visor, Books) */}
      <div className="flex items-center gap-2 mr-1">
        {isNearComputer && !isSpace && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setComputerLibraryOpen(true);
            }}
            onClick={() => setComputerLibraryOpen(true)}
            className="px-2.5 h-10 rounded-2xl bg-cyan-600/85 hover:bg-cyan-500 border-2 border-cyan-300 text-white backdrop-blur-xl flex items-center gap-1.5 justify-center transition-all active:scale-90 shadow-[0_0_16px_rgba(6,182,212,0.7)] animate-pulse cursor-pointer"
            title="Abrir Biblioteca de Livros do Computador"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-wider font-mono">LIVROS</span>
          </button>
        )}

        {/* Camera Perspective Toggle */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCameraMode();
          }}
          onClick={() => toggleCameraMode()}
          className="w-10 h-10 rounded-2xl bg-slate-900/85 hover:bg-slate-800 border border-white/20 text-slate-200 backdrop-blur-xl flex items-center justify-center transition-all active:scale-90 shadow-lg cursor-pointer"
          title="Alternar Câmera"
        >
          <Camera className="w-4 h-4 text-blue-300" />
        </button>

        {/* Visor Toggle (24K Gold Solar vs Transparent Optical) */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setVisorMode(visorMode === 'transparent' ? 'gold' : 'transparent');
          }}
          onClick={() => setVisorMode(visorMode === 'transparent' ? 'gold' : 'transparent')}
          className={`w-10 h-10 rounded-2xl backdrop-blur-xl border flex items-center justify-center transition-all active:scale-90 shadow-lg cursor-pointer ${
            visorMode === 'gold'
              ? 'bg-amber-500/35 border-amber-400 text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.5)]'
              : 'bg-slate-900/85 border-white/20 text-slate-300'
          }`}
          title="Alternar Viseira"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Main Action Diamond / Cluster */}
      <div className="flex items-end gap-2.5">
        {/* Left Sub-column: Door & Sprint Buttons */}
        <div className="flex flex-col gap-2">
          {!isSpace && (
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleHabitatDoor();
              }}
              onClick={() => toggleHabitatDoor()}
              className={`w-12 h-12 rounded-2xl backdrop-blur-xl border-2 flex flex-col items-center justify-center transition-all active:scale-90 shadow-xl cursor-pointer ${
                isNearVAB
                  ? 'bg-cyan-600/70 border-cyan-300 text-white shadow-[0_0_18px_rgba(6,182,212,0.6)] animate-pulse'
                  : 'bg-slate-900/85 border-slate-700/80 text-slate-300'
              }`}
              title="Portão do Hangar / Interagir"
            >
              <DoorClosed className="w-4 h-4" />
              <span className="text-[7.5px] font-bold uppercase tracking-tighter mt-0.5">
                {isNearVAB ? (isHabitatDoorOpen ? 'FECHAR' : 'ABRIR') : 'PORTÃO'}
              </span>
            </button>
          )}

          {/* Dedicated Run / Sprint / Boost Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileSprint(!mobileSprint);
            }}
            onClick={() => setMobileSprint(!mobileSprint)}
            className={`w-14 h-14 rounded-2xl backdrop-blur-xl border-2 flex flex-col items-center justify-center transition-all active:scale-90 shadow-xl cursor-pointer ${
              mobileSprint
                ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 border-yellow-200 text-white shadow-[0_0_24px_rgba(245,158,11,0.9)] scale-105 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            }`}
            title="Botão de Correr (Toque para Ativar/Desativar Corrida)"
          >
            <Zap className={`w-5 h-5 ${mobileSprint ? 'text-white fill-white' : 'text-amber-400'}`} />
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 font-mono drop-shadow">
              {mobileSprint ? 'CORRENDO' : 'CORRER'}
            </span>
          </button>
        </div>

        {/* Primary Jump / Swim Paddle / Space Thruster Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMobileJump(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMobileJump(false);
          }}
          onMouseDown={() => setMobileJump(true)}
          onMouseUp={() => setMobileJump(false)}
          onMouseLeave={() => setMobileJump(false)}
          className={`w-16 h-16 sm:w-18 sm:h-18 rounded-3xl backdrop-blur-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xl cursor-pointer ${
            isSpace
              ? 'bg-gradient-to-tr from-amber-600 via-orange-600 to-red-500 border-amber-300 text-white shadow-[0_0_26px_rgba(245,158,11,0.7)]'
              : isPlayerInWater
              ? 'bg-gradient-to-tr from-cyan-600 via-teal-600 to-blue-500 border-cyan-200 text-white shadow-[0_0_24px_rgba(6,182,212,0.7)]'
              : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 border-blue-300 text-white shadow-[0_0_22px_rgba(59,130,246,0.6)]'
          }`}
        >
          {isPlayerInWater && !isSpace ? (
            <Waves className="w-7 h-7 animate-pulse" />
          ) : (
            <ArrowUp className="w-7 h-7" />
          )}
          <span className="text-[9px] font-black uppercase tracking-widest font-mono mt-0.5 drop-shadow">
            {isSpace ? 'IMPULSO' : isPlayerInWater ? 'NADAR' : 'PULAR'}
          </span>
        </button>
      </div>
    </div>
  );
}
