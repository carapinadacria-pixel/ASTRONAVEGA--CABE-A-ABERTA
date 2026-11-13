import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store';

export function Joystick() {
  const drivingCarId = useGameStore((state) => state.drivingCarId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  // State for enlarged 6-button directional driving pad on mobile (↖, ▲, ↗ / ◀, ▼, ▶)
  type DriveButtonKey = 'upLeft' | 'up' | 'upRight' | 'left' | 'down' | 'right';
  const [pressedBtns, setPressedBtns] = useState<Record<DriveButtonKey, boolean>>({
    upLeft: false,
    up: false,
    upRight: false,
    left: false,
    down: false,
    right: false,
  });
  const btnStateRef = useRef<Record<DriveButtonKey, boolean>>({
    upLeft: false,
    up: false,
    upRight: false,
    left: false,
    down: false,
    right: false,
  });

  // Directly update store state without React re-render lag
  const updateGlobalJoystick = useCallback((normX: number, normY: number) => {
    const store = useGameStore.getState();
    store.setJoystick({ x: normX, y: normY });
  }, []);

  const syncDirectionalCrossToStore = useCallback(() => {
    const b = btnStateRef.current;
    const goUp = b.up || b.upLeft || b.upRight;
    const goDown = b.down;
    const goLeft = b.left || b.upLeft;
    const goRight = b.right || b.upRight;
    const x = (goRight ? 1 : 0) - (goLeft ? 1 : 0);
    const y = (goUp ? 1 : 0) - (goDown ? 1 : 0);
    updateGlobalJoystick(x, y);
  }, [updateGlobalJoystick]);

  // Reset directional buttons & analog stick whenever switching between walking and driving
  useEffect(() => {
    const empty: Record<DriveButtonKey, boolean> = {
      upLeft: false,
      up: false,
      upRight: false,
      left: false,
      down: false,
      right: false,
    };
    btnStateRef.current = { ...empty };
    setPressedBtns({ ...empty });
    pointerIdRef.current = null;
    setActive(false);
    setPosition({ x: 0, y: 0 });
    updateGlobalJoystick(0, 0);
  }, [drivingCarId, updateGlobalJoystick]);

  const setDirPressed = (btnKey: DriveButtonKey, isDown: boolean) => {
    if (btnStateRef.current[btnKey] === isDown) return;
    btnStateRef.current[btnKey] = isDown;
    setPressedBtns({ ...btnStateRef.current });
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

  // WHEN DRIVING A CAR ON MOBILE: Render the Enlarged 6-Button Precision Driving Pad (↖ ▲ ↗ / ◀ ▼ ▶)
  if (drivingCarId) {
    const bindDirBtn = (btnKey: DriveButtonKey) => ({
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
        setDirPressed(btnKey, true);
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
        setDirPressed(btnKey, false);
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDirPressed(btnKey, false);
      },
      onPointerLeave: () => {
        setDirPressed(btnKey, false);
      },
    });

    const btnBase =
      'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 backdrop-blur-xl flex items-center justify-center touch-none select-none cursor-pointer transition-all';
    const btnActive =
      'bg-cyan-500/90 border-cyan-200 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.85)] scale-95 font-black';
    const btnIdle =
      'bg-slate-950/90 border-slate-500/80 text-cyan-100 hover:border-cyan-400 shadow-xl font-bold';
    const btnAuxIdle =
      'bg-slate-900/90 border-cyan-500/45 text-cyan-300 hover:border-cyan-300 shadow-lg font-bold';

    return (
      <div className="grid grid-cols-3 gap-2 p-2 rounded-3xl bg-slate-950/55 border border-white/10 backdrop-blur-md touch-none select-none shadow-2xl">
        {/* TOP ROW: Auxiliary Forward-Left (↖), Accelerate Forward (▲), Auxiliary Forward-Right (↗) */}
        <button
          type="button"
          aria-label="Frente e Esquerda"
          title="Ir para Frente + Virar Esquerda"
          {...bindDirBtn('upLeft')}
          className={`${btnBase} ${pressedBtns.upLeft ? btnActive : btnAuxIdle}`}
        >
          <span className="text-xl sm:text-2xl leading-none">↖</span>
        </button>

        <button
          type="button"
          aria-label="Cima - Acelerar"
          title="Ir para Frente"
          {...bindDirBtn('up')}
          className={`${btnBase} ${pressedBtns.up ? btnActive : btnIdle}`}
        >
          <span className="text-xl sm:text-2xl leading-none">▲</span>
        </button>

        <button
          type="button"
          aria-label="Frente e Direita"
          title="Ir para Frente + Virar Direita"
          {...bindDirBtn('upRight')}
          className={`${btnBase} ${pressedBtns.upRight ? btnActive : btnAuxIdle}`}
        >
          <span className="text-xl sm:text-2xl leading-none">↗</span>
        </button>

        {/* BOTTOM ROW: Steer Left (◀), Brake/Reverse (▼), Steer Right (▶) */}
        <button
          type="button"
          aria-label="Esquerda - Virar à Esquerda"
          title="Virar Esquerda"
          {...bindDirBtn('left')}
          className={`${btnBase} ${pressedBtns.left ? btnActive : btnIdle}`}
        >
          <span className="text-xl sm:text-2xl leading-none">◀</span>
        </button>

        <button
          type="button"
          aria-label="Baixo - Travar / Marcha-atrás"
          title="Travar / Marcha-atrás"
          {...bindDirBtn('down')}
          className={`${btnBase} ${pressedBtns.down ? btnActive : btnIdle}`}
        >
          <span className="text-xl sm:text-2xl leading-none">▼</span>
        </button>

        <button
          type="button"
          aria-label="Direita - Virar à Direita"
          title="Virar Direita"
          {...bindDirBtn('right')}
          className={`${btnBase} ${pressedBtns.right ? btnActive : btnIdle}`}
        >
          <span className="text-xl sm:text-2xl leading-none">▶</span>
        </button>
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
