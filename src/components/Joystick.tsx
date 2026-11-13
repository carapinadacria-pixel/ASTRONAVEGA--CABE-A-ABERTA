import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store';

export function Joystick() {
  const drivingCarId = useGameStore((state) => state.drivingCarId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  // State for directional arrow cross when driving a vehicle on mobile
  const [pressedDirs, setPressedDirs] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const dirStateRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  // Directly update store state without React re-render lag
  const updateGlobalJoystick = useCallback((normX: number, normY: number) => {
    const store = useGameStore.getState();
    store.setJoystick({ x: normX, y: normY });
  }, []);

  const syncDirectionalCrossToStore = useCallback(() => {
    const d = dirStateRef.current;
    const x = (d.right ? 1 : 0) - (d.left ? 1 : 0);
    const y = (d.up ? 1 : 0) - (d.down ? 1 : 0);
    updateGlobalJoystick(x, y);
  }, [updateGlobalJoystick]);

  // Reset directional buttons & analog stick whenever switching between walking and driving
  useEffect(() => {
    dirStateRef.current = { up: false, down: false, left: false, right: false };
    setPressedDirs({ up: false, down: false, left: false, right: false });
    pointerIdRef.current = null;
    setActive(false);
    setPosition({ x: 0, y: 0 });
    updateGlobalJoystick(0, 0);
  }, [drivingCarId, updateGlobalJoystick]);

  const setDirPressed = (dir: 'up' | 'down' | 'left' | 'right', isDown: boolean) => {
    if (dirStateRef.current[dir] === isDown) return;
    dirStateRef.current[dir] = isDown;
    setPressedDirs({ ...dirStateRef.current });
    syncDirectionalCrossToStore();
  };

  const handlePointerCoord = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxDistance = rect.width / 2 - 10;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxDistance) {
        dx = (dx / dist) * maxDistance;
        dy = (dy / dist) * maxDistance;
      }

      setPosition({ x: dx, y: dy });

      // Smooth soft-deadzone mapping with ergonomic power curve (ultra-fine walking control & brisk sprint)
      const deadzone = 0.04;
      const rawMag = Math.min(1.0, dist / maxDistance);

      if (rawMag <= deadzone) {
        updateGlobalJoystick(0, 0);
      } else {
        const normalized = Math.min(1.0, (rawMag - deadzone) / (1.0 - deadzone));
        const response = Math.pow(normalized, 1.25);
        const dirX = dx / (dist || 1);
        const dirY = dy / (dist || 1);
        updateGlobalJoystick(dirX * response, -dirY * response);
      }
    },
    [updateGlobalJoystick]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    pointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setActive(true);
    handlePointerCoord(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!active || pointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    handlePointerCoord(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current === e.pointerId) {
      e.preventDefault();
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      pointerIdRef.current = null;
      setActive(false);
      setPosition({ x: 0, y: 0 });
      updateGlobalJoystick(0, 0);
    }
  };

  // Global window listeners guarantee analog resets if touch leaves screen boundaries
  useEffect(() => {
    const handleGlobalUp = (e: PointerEvent) => {
      if (pointerIdRef.current !== null && e.pointerId === pointerIdRef.current) {
        pointerIdRef.current = null;
        setActive(false);
        setPosition({ x: 0, y: 0 });
        updateGlobalJoystick(0, 0);
      }
    };

    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('pointercancel', handleGlobalUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointercancel', handleGlobalUp);
    };
  }, [updateGlobalJoystick]);

  // WHEN DRIVING A CAR ON MOBILE: Render the 4-Arrow Directional Cross (Cima, Baixo, Esquerda, Direita)
  if (drivingCarId) {
    const bindDirBtn = (dir: 'up' | 'down' | 'left' | 'right') => ({
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
        setDirPressed(dir, true);
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
        setDirPressed(dir, false);
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDirPressed(dir, false);
      },
      onPointerLeave: () => {
        setDirPressed(dir, false);
      },
    });

    const btnBase =
      'w-10 h-10 sm:w-11 sm:h-11 rounded-xl border backdrop-blur-xl flex items-center justify-center touch-none select-none cursor-pointer transition-all';
    const btnActive =
      'bg-cyan-500/85 border-cyan-300 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.7)] scale-95 font-black';
    const btnIdle =
      'bg-slate-950/85 border-slate-600/80 text-cyan-200 hover:border-cyan-400/70 shadow-lg font-bold';

    return (
      <div className="w-32 h-32 sm:w-36 sm:h-36 relative flex items-center justify-center touch-none select-none">
        {/* CIMA (Accelerate Forward) */}
        <button
          type="button"
          aria-label="Cima - Acelerar"
          {...bindDirBtn('up')}
          className={`absolute top-0 left-1/2 -translate-x-1/2 ${btnBase} ${
            pressedDirs.up ? btnActive : btnIdle
          }`}
        >
          <span className="text-base sm:text-lg leading-none">▲</span>
        </button>

        {/* BAIXO (Brake / Reverse) */}
        <button
          type="button"
          aria-label="Baixo - Travar / Marcha-atrás"
          {...bindDirBtn('down')}
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${btnBase} ${
            pressedDirs.down ? btnActive : btnIdle
          }`}
        >
          <span className="text-base sm:text-lg leading-none">▼</span>
        </button>

        {/* ESQUERDA (Steer Left) */}
        <button
          type="button"
          aria-label="Esquerda - Virar à Esquerda"
          {...bindDirBtn('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 ${btnBase} ${
            pressedDirs.left ? btnActive : btnIdle
          }`}
        >
          <span className="text-base sm:text-lg leading-none">◀</span>
        </button>

        {/* DIREITA (Steer Right) */}
        <button
          type="button"
          aria-label="Direita - Virar à Direita"
          {...bindDirBtn('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 ${btnBase} ${
            pressedDirs.right ? btnActive : btnIdle
          }`}
        >
          <span className="text-base sm:text-lg leading-none">▶</span>
        </button>

        {/* Center Hub Accent */}
        <div className="w-7 h-7 rounded-lg bg-slate-900/90 border border-white/15 flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-cyan-400/70" />
        </div>
      </div>
    );
  }

  // WHEN ON FOOT / SWIMMING / FLYING: Render the Virtual Analog Joystick
  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-colors duration-150 backdrop-blur-xl flex items-center justify-center relative touch-none select-none cursor-pointer ${
        active
          ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.55)]'
          : 'bg-slate-950/70 border-slate-700/60 shadow-2xl hover:border-slate-500/80'
      }`}
    >
      {/* Outer Tactical Crosshair Markers */}
      <div className={`absolute top-1.5 w-1 h-2.5 rounded-full transition-colors ${active ? 'bg-cyan-400' : 'bg-slate-500/60'}`} />
      <div className={`absolute bottom-1.5 w-1 h-2.5 rounded-full transition-colors ${active ? 'bg-cyan-400' : 'bg-slate-500/60'}`} />
      <div className={`absolute left-1.5 w-2.5 h-1 rounded-full transition-colors ${active ? 'bg-cyan-400' : 'bg-slate-500/60'}`} />
      <div className={`absolute right-1.5 w-2.5 h-1 rounded-full transition-colors ${active ? 'bg-cyan-400' : 'bg-slate-500/60'}`} />

      {/* Guide Outer Ring */}
      <div className="w-24 h-24 rounded-full border border-slate-700/40 pointer-events-none" />

      {/* Inner Range Ring */}
      <div className="w-16 h-16 rounded-full border border-slate-600/40 pointer-events-none" />

      {/* Ergonomic Thumb Nub */}
      <div
        className={`w-14 h-14 rounded-full absolute pointer-events-none flex items-center justify-center ${
          active
            ? 'bg-gradient-to-br from-cyan-600 via-slate-800 to-slate-900 border-2 border-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.6)] scale-105'
            : 'bg-gradient-to-br from-slate-700/90 to-slate-800/95 border border-slate-500/70 shadow-lg'
        }`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: active ? 'none' : 'transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div
          className={`w-4 h-4 rounded-full transition-colors ${
            active ? 'bg-cyan-300 shadow-[0_0_8px_#67e8f9]' : 'bg-slate-400/80'
          }`}
        />
      </div>
    </div>
  );
}
