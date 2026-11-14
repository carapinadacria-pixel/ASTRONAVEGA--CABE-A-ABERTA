import React from 'react';
import { useGameStore } from '../store';
import { ArrowUp, DoorClosed, Eye, Camera, Zap, Wind } from 'lucide-react';
import { UI_TEXT } from '../utils/i18n';

export function MobileActionControls() {
  const language = useGameStore((state) => state.language);
  const t = UI_TEXT[language];
  const setMobileJump = useGameStore((state) => state.setMobileJump);
  const mobileSprint = useGameStore((state) => state.mobileSprint);
  const setMobileSprint = useGameStore((state) => state.setMobileSprint);
  const toggleHabitatDoor = useGameStore((state) => state.toggleHabitatDoor);
  const toggleOxygenChamber = useGameStore((state) => state.toggleOxygenChamber);
  const isOxygenChamberOpen = useGameStore((state) => state.isOxygenChamberOpen);
  const toggleCameraMode = useGameStore((state) => state.toggleCameraMode);
  const visorMode = useGameStore((state) => state.visorMode);
  const setVisorMode = useGameStore((state) => state.setVisorMode);
  const isNearVAB = useGameStore((state) => state.isNearVAB);
  const isHabitatDoorOpen = useGameStore((state) => state.isHabitatDoorOpen);
  const scene = useGameStore((state) => state.scene);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const isSpace = scene === 'space';

  return (
    <div
      className="flex flex-col items-end gap-3 pointer-events-auto select-none touch-none pb-2 pr-1"
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Top Arc: Utility Controls (Camera, Visor) */}
      <div className="flex items-center gap-2 mr-1">

        {/* Camera Perspective Toggle */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCameraMode();
          }}
          onClick={() => toggleCameraMode()}
          className="w-10 h-10 rounded-2xl bg-slate-900/85 hover:bg-slate-800 border border-white/20 text-slate-200 backdrop-blur-xl flex items-center justify-center transition-all active:scale-90 shadow-lg cursor-pointer"
          title={t.toggleCameraTitle}
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
          title={t.visorLabel}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Main Action Diamond / Cluster */}
      <div className="flex items-end gap-2.5">
        {/* Left Sub-column: Door (Earth) or Oxygen Chamber (Off-Earth) & Sprint Buttons */}
        <div className="flex flex-col gap-2">
          {!isSpace && (
            planetIndex === 0 ? (
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
                title={t.doorLabel}
              >
                <DoorClosed className="w-4 h-4" />
                <span className="text-[7.5px] font-bold uppercase tracking-tighter mt-0.5">
                  {isNearVAB ? (isHabitatDoorOpen ? t.closeShort : t.openShort) : t.doorMobileShort}
                </span>
              </button>
            ) : (
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleOxygenChamber();
                }}
                onClick={() => toggleOxygenChamber()}
                className={`w-12 h-12 rounded-2xl backdrop-blur-xl border-2 flex flex-col items-center justify-center transition-all active:scale-90 cursor-pointer ${
                  isOxygenChamberOpen
                    ? 'bg-cyan-950/90 hover:bg-cyan-900/90 border-cyan-400/80 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.45)]'
                    : 'bg-red-950/95 hover:bg-red-900/95 border-red-400 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.75)] animate-pulse'
                }`}
                title={t.o2ChamberLabel}
              >
                <Wind className={`w-4 h-4 ${isOxygenChamberOpen ? 'text-cyan-300' : 'text-red-300'}`} />
                <span className="text-[7px] font-extrabold uppercase tracking-tighter mt-0.5 leading-none">
                  {isOxygenChamberOpen ? t.closeO2Short : t.openO2Short}
                </span>
              </button>
            )
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
            title={mobileSprint ? t.runningModeActive : t.clickToRun}
          >
            <Zap className={`w-5 h-5 ${mobileSprint ? 'text-white fill-white' : 'text-amber-400'}`} />
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 font-mono drop-shadow">
              {mobileSprint ? t.runningMobileShort : t.runMobileShort}
            </span>
          </button>
        </div>

        {/* Space Thruster Button (Surface Jump/Swim button hidden on mobile per user request) */}
        {isSpace && (
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
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl backdrop-blur-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xl cursor-pointer bg-gradient-to-tr from-amber-600 via-orange-600 to-red-500 border-amber-300 text-white shadow-[0_0_26px_rgba(245,158,11,0.7)]"
          >
            <ArrowUp className="w-7 h-7" />
            <span className="text-[9px] font-black uppercase tracking-widest font-mono mt-0.5 drop-shadow">
              {t.thrustMobileShort}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
