import React, { useState, useEffect, useRef, Suspense, memo, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { Player } from './Player';
import { PlanetEnvironment } from './PlanetEnvironment';
import { Rocket } from './Rocket';
import { SpaceScene } from './SpaceScene';
import { useGameStore, PLANETS, GameMusicTrack } from '../store';
import { Joystick } from './Joystick';
import { MobileActionControls } from './MobileActionControls';
import {
  initAudio,
  updateAudio,
  toggleAudio,
  playRefuelPumpSound,
  setAudioEnvironment,
  stopMissionVoice,
  setMusicMode,
  setMusicVolumeLevel,
  setSfxVolumeLevel,
} from '../audio';
import { initGameDatabase, saveGameStateToDB, loadGameStateFromDB, getDatabaseStatus } from '../utils/gameDatabase';
import { ModeSelectionScreen, StoryVideoPlayerScreen, StoryMissionHUD, StoryTopRightActionButtons } from './StoryModeOverlays';
import { UI_TEXT, getPlanetName } from '../utils/i18n';
import { RESOURCE_DEFINITIONS, getLocalizedResourceDef } from '../utils/nasaData';
import {
  Crosshair,
  Shield,
  Activity,
  Droplets,
  Zap,
  Camera,
  Footprints,
  Settings,
  User,
  Eye,
  Sparkles,
  Sun,
  Gauge,
  Database,
  CheckCircle2,
  X,
  Briefcase,
  RefreshCw,
  AlertTriangle,
  Monitor,
  BookOpen,
  Fuel,
  Scale,
  Wind,
  Languages,
  Music,
  VolumeX,
  Volume2,
} from 'lucide-react';
import { InventoryModal } from './InventoryModal';
import { ComputerBookLibraryModal } from './ComputerBookLibraryModal';

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'sprint', keys: ['ShiftLeft', 'ShiftRight'] },
];

// Dedicated power-saving 20 FPS / 30 FPS / 40 FPS governor (Mounts when 20, 30, or 40 FPS is chosen; 60 runs on native hardware vsync)
function ThrottledRenderer({ targetFps }: { targetFps: 20 | 30 | 40 }) {
  const accumulatedTime = useRef(0);
  const targetInterval = 1 / targetFps; // 0.05s for 20 FPS, 0.0333s for 30 FPS, 0.025s for 40 FPS

  useFrame(({ gl, scene, camera }, delta) => {
    // Clamp delta to prevent huge jumps or lag accumulation
    const safeDelta = Math.min(0.08, delta);
    accumulatedTime.current += safeDelta;
    if (accumulatedTime.current >= targetInterval - 0.002) {
      gl.render(scene, camera);
      accumulatedTime.current = accumulatedTime.current % targetInterval;
    }
  }, 1);

  return null;
}

// Memoized Base Station Rigids
const BasesList = memo(function BasesList() {
  const bases = useGameStore((state) => state.bases);
  return (
    <>
      {bases.map((base) => {
        if (!base || base.x === undefined) return null;
        return (
          <RigidBody key={base.id} type="fixed" position={[base.x, 2, base.z]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[8, 4, 8]} />
              <meshStandardMaterial color="#4a5568" metalness={0.8} roughness={0.3} />
              <mesh position={[0, 2.5, 0]}>
                <sphereGeometry args={[2, 16, 16]} />
                <meshStandardMaterial color="#90cdf4" transparent opacity={0.5} roughness={0.1} />
              </mesh>
            </mesh>
          </RigidBody>
        );
      })}
    </>
  );
});

const isMobileOrLowRAM = typeof navigator !== 'undefined' && (
  /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
  Boolean((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4)
);

// Visual Mission-Control fallback screen with direct force-start button
interface WebGLFallbackScreenProps {
  errorMessage?: string;
  onRetry?: () => void;
}

const WebGLFallbackScreen = memo(function WebGLFallbackScreen({
  errorMessage,
  onRetry,
}: WebGLFallbackScreenProps) {
  const [showDetails, setShowDetails] = useState(false);
  const language = useGameStore((s) => s.language);
  const isEn = language === 'en';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#040814] text-white select-none overflow-y-auto">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-black pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl border border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 text-center">
        {/* Top Badges / Logos */}
        <div className="flex items-center justify-center gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <img src="/ggpen_logo.jpg" alt="GGPEN" className="h-7 w-auto object-contain rounded" />
            <span className="text-xs font-bold tracking-wider text-slate-200">GGPEN</span>
          </div>
          <div className="h-4 w-[1px] bg-white/20" />
          <div className="flex items-center gap-2">
            <img
              src="/cabeca_aberta_logo.png"
              alt="Cabeça Aberta"
              className="h-7 w-auto object-contain rounded shadow-sm"
            />
            <span className="text-xs font-bold tracking-wider text-slate-200">Cabeça Aberta</span>
          </div>
        </div>

        {/* Status Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-3xl bg-blue-500/15 border border-blue-400/40 text-blue-400 shadow-lg shadow-blue-500/20">
            <Monitor className="w-10 h-10" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-cyan-400">
            {isEn ? 'Angolan Space Simulator' : 'Simulador Espacial Angolano'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isEn
              ? 'If hardware acceleration is active in your browser, tap below to load the 3D environment, hangar, spacecraft, and planetary surfaces.'
              : 'Se a aceleração gráfica já estiver ativada no Chrome, toque no botão abaixo para carregar imediatamente o ambiente 3D, hangar, cápsula e superfícies planetárias.'}
          </p>
        </div>

        {/* Primary Action Button: Direct Force Start */}
        <div className="flex flex-col gap-3 pt-1">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-98 text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/30 cursor-pointer"
            >
              <RefreshCw className="w-5 h-5 animate-spin-reverse" />
              <span>{isEn ? 'Start 3D Simulation Now' : 'Iniciar Simulação 3D Agora'}</span>
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-300 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isEn ? 'Reload Page' : 'Recarregar Página'}</span>
          </button>
        </div>

        {/* Diagnostic Guide */}
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 text-left flex flex-col gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-bold text-blue-300 uppercase tracking-wider text-[11px]">
            <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{isEn ? 'Graphics System Info' : 'Informações do Sistema Gráfico'}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isEn
              ? 'Hardware acceleration enables smooth planetary exploration. Tap Start 3D Simulation to proceed.'
              : 'A aceleração por hardware permite alto desempenho na exploração dos planetas. Toque em "Iniciar Simulação 3D Agora" para prosseguir.'}
          </p>
        </div>

        {/* Technical Details Accordion */}
        {errorMessage && (
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 w-full cursor-pointer"
            >
              <span>
                {showDetails
                  ? isEn
                    ? 'Hide Technical Details'
                    : 'Ocultar Detalhes Técnicos'
                  : isEn
                  ? 'View Error Details'
                  : 'Ver Detalhes do Erro'}
              </span>
            </button>
            {showDetails && (
              <div className="mt-2 p-3 bg-black/60 rounded-xl border border-rose-500/30 text-left font-mono text-[10px] text-rose-300 break-words max-h-32 overflow-y-auto">
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// React Error Boundary specifically isolating 3D Canvas crashes
interface WebGLErrorBoundaryProps {
  children: React.ReactNode;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class WebGLErrorBoundary extends React.Component<WebGLErrorBoundaryProps, WebGLErrorBoundaryState> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: any): WebGLErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erro ao inicializar o motor gráfico 3D.',
    };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[WebGLErrorBoundary] Capturado erro no canvas 3D:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <WebGLFallbackScreen
          errorMessage={this.state.errorMessage}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

// Decoupled 3D Canvas - strictly isolated from high-frequency 2D UI re-renders
interface GameCanvasProps {
  actionRequested: string | null;
  handleAction: (action: string) => void;
}

const GameCanvas = memo(function GameCanvas({ actionRequested, handleAction }: GameCanvasProps) {
  const scene = useGameStore((state) => state.scene);
  const gravity = useGameStore((state) => state.gravity);
  const targetFps = useGameStore((state) => state.targetFps);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const currentPlanet = PLANETS[planetIndex] || PLANETS[0];

  const bgSkyColor = useMemo(() => {
    if (scene !== 'surface') return '#02040a';
    switch (currentPlanet.type) {
      case 'earth':
        return '#7dd3fc';
      case 'moon':
        return '#02040a';
      case 'mercury':
        return '#020307';
      case 'venus':
        return '#92400e';
      case 'mars':
        return '#7c2d12';
      case 'titan':
        return '#92400e';
      case 'jupiter':
        return '#78350f';
      case 'saturn':
        return '#854d0e';
      case 'uranus':
        return '#0284c7';
      case 'neptune':
        return '#1e3a8a';
      case 'exoplanet':
        return '#1e112a';
      default:
        return '#02040a';
    }
  }, [scene, currentPlanet.type]);

// Test if WebGL context can be created without triggering Three.js error listeners
function canCreateWebGLContext(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const testCanvas = document.createElement('canvas');
    const gl =
      testCanvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false, powerPreference: 'default' }) ||
      testCanvas.getContext('webgl', { failIfMajorPerformanceCaveat: false, powerPreference: 'default' }) ||
      testCanvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

// Fallback dummy renderer satisfying R3F interface without requiring GPU/WebGL
function createDummyRenderer(canvas: HTMLCanvasElement): any {
  return {
    domElement: canvas,
    render: () => {},
    setSize: () => {},
    setPixelRatio: () => {},
    getPixelRatio: () => 1,
    getSize: (target: any) => {
      if (target) {
        target.width = canvas.width || 800;
        target.height = canvas.height || 600;
        return target;
      }
      return { width: canvas.width || 800, height: canvas.height || 600 };
    },
    setClearColor: () => {},
    getClearColor: (target: any) => target || new THREE.Color(0x000000),
    getClearAlpha: () => 1,
    setClearAlpha: () => {},
    clear: () => {},
    clearColor: () => {},
    clearDepth: () => {},
    clearStencil: () => {},
    dispose: () => {},
    toneMapping: THREE.NoToneMapping,
    toneMappingExposure: 1,
    outputColorSpace: THREE.SRGBColorSpace,
    shadowMap: {
      enabled: false,
      type: THREE.PCFSoftShadowMap,
      needsUpdate: false,
    },
    xr: {
      enabled: false,
      isPresenting: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      setAnimationLoop: () => {},
    },
    capabilities: {
      isWebGL2: false,
      maxTextures: 16,
      maxVertexTextures: 16,
      maxTextureSize: 2048,
      maxCubemapSize: 2048,
      maxAttributes: 16,
      maxVertexUniforms: 256,
      maxVaryings: 16,
      maxFragmentUniforms: 256,
      vertexTextures: true,
      floatFragmentTextures: false,
      floatVertexTextures: false,
      getMaxAnisotropy: () => 1,
      getMaxPrecision: () => 'highp',
    },
    extensions: {
      has: () => false,
      get: () => null,
    },
    properties: {
      get: () => ({}),
      remove: () => {},
      update: () => {},
      dispose: () => {},
    },
    info: {
      render: { calls: 0, frame: 0, lines: 0, points: 0, triangles: 0 },
      memory: { geometries: 0, textures: 0 },
      programs: [],
      autoReset: true,
      reset: () => {},
    },
    state: {
      reset: () => {},
    },
    setAnimationLoop: () => {},
    setRenderTarget: () => {},
    getRenderTarget: () => null,
    setScissor: () => {},
    setScissorTest: () => {},
    setViewport: () => {},
    getViewport: (target: any) => target || new THREE.Vector4(0, 0, canvas.width || 800, canvas.height || 600),
    getScissor: (target: any) => target || new THREE.Vector4(0, 0, canvas.width || 800, canvas.height || 600),
    getScissorTest: () => false,
  };
}

  // Resilient WebGL renderer factory: checks WebGL context capability first.
  // In GPU-disabled sandboxes / test runners, returns dummyRenderer directly without invoking
  // THREE.WebGLRenderer and triggering onContextCreationError.
  const createSafeRenderer = useCallback((defaultProps: any) => {
    const canvas: HTMLCanvasElement = defaultProps.canvas;

    if (canCreateWebGLContext()) {
      const origConsoleError = console.error;
      try {
        console.error = (...args: any[]) => {
          const msg = String(args[0] || '');
          if (
            msg.includes('WebGLRenderer') ||
            msg.includes('WebGL context') ||
            msg.includes('BindToCurrentSequence')
          ) {
            console.warn('[WebGL Notice]', ...args);
            return;
          }
          origConsoleError.apply(console, args);
        };

        const renderer = new THREE.WebGLRenderer({
          ...defaultProps,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
          antialias: false,
          alpha: true,
          depth: true,
          stencil: false,
          preserveDrawingBuffer: false,
        });

        useGameStore.getState().setIsWebGLActive(true);
        return renderer;
      } catch (err: any) {
        console.warn('[WebGL] Instanciação falhou, a ativar renderizador seguro:', err?.message || err);
      } finally {
        console.error = origConsoleError;
      }
    }

    useGameStore.getState().setIsWebGLActive(false);
    return createDummyRenderer(canvas);
  }, []);

  return (
    <WebGLErrorBoundary>
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows={false}
          dpr={[1, isMobileOrLowRAM ? 1.0 : 1.25]}
          gl={createSafeRenderer}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 0.85;
            const canvas = gl.domElement;
            if (canvas && typeof canvas.addEventListener === 'function') {
              canvas.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                console.warn('[WebGL] Context lost - prevented default');
              });
              canvas.addEventListener('webglcontextrestored', () => {
                console.info('[WebGL] Context restored successfully');
              });
            }
          }}
          camera={{ fov: 65, near: 0.2, far: scene === 'surface' ? 3500 : 180000 }}
        >
          <color attach="background" args={[bgSkyColor]} />
          <Suspense fallback={null}>
            {(targetFps === 20 || targetFps === 30 || targetFps === 40) && <ThrottledRenderer targetFps={targetFps} />}
            {scene === 'surface' ? (
              <Physics gravity={[0, -gravity, 0]} timeStep={1 / 60} interpolate={true}>
                <PlanetEnvironment />
                <Rocket />
                <BasesList />
                <Player onAction={handleAction} actionRequested={actionRequested} />
              </Physics>
            ) : (
              <SpaceScene />
            )}
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </WebGLErrorBoundary>
  );
});

// ---------------------------------------------------------------------------
// ISOLATED 2D UI OVERLAYS (STRICT SELECTORS TO PREVENT CANVASES/SCENE RE-RENDERS)
// ---------------------------------------------------------------------------

const CrosshairOverlay = memo(function CrosshairOverlay() {
  const scene = useGameStore((state) => state.scene);
  const cameraMode = useGameStore((state) => state.cameraMode);

  if (scene !== 'surface' || cameraMode !== 'first') return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
      <Crosshair className="w-6 h-6 text-white" />
    </div>
  );
});

const HUDHeader = memo(function HUDHeader() {
  const scene = useGameStore((state) => state.scene);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const language = useGameStore((state) => state.language);
  const t = UI_TEXT[language];
  const currentPlanet = PLANETS[planetIndex] || PLANETS[0];

  if (scene !== 'surface') return null;

  return (
    <div className="absolute top-5 left-4 sm:top-6 sm:left-6 text-white pointer-events-none drop-shadow-lg flex flex-col gap-1.5 z-20">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
        {getPlanetName(currentPlanet.id, currentPlanet.name, language)}
      </h1>
      <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-gray-200">
        <Activity className="w-4 h-4 text-blue-400" />
        <span>
          {t.gravityLabel}: {currentPlanet.gravity.toFixed(2)} m/s² ({(currentPlanet.gravity / 9.8).toFixed(2)} G)
        </span>
      </div>

      {currentPlanet.type === 'exoplanet' && (
        <div className="flex flex-col gap-2 w-64 sm:w-72 bg-blue-900/40 p-3 rounded-xl backdrop-blur-md border border-blue-400/30 pointer-events-auto mt-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 border-b border-blue-400/30 pb-1 mb-1">
            NASA Exoplanet Archive
          </h3>
          <div className="text-[11px] text-blue-100 flex justify-between">
            <span>{t.distanceLabel}:</span> <span>{currentPlanet.distance ? currentPlanet.distance.toFixed(1) + ' parsecs' : t.unknown}</span>
          </div>
          <div className="text-[11px] text-blue-100 flex justify-between">
            <span>{t.massLabel}:</span> <span>{currentPlanet.mass ? currentPlanet.mass.toFixed(2) : t.estimated}</span>
          </div>
          <div className="text-[11px] text-blue-100 flex justify-between">
            <span>{t.radiusLabel}:</span> <span>{currentPlanet.radius ? currentPlanet.radius.toFixed(2) : t.estimatedMasc}</span>
          </div>
          <div className="text-[11px] text-blue-100 flex justify-between">
            <span>{t.discoveryLabel}:</span> <span>{currentPlanet.discoveryYear || 'N/A'} ({currentPlanet.discoveryMethod})</span>
          </div>
          <div className="text-[11px] text-blue-100 flex justify-between">
            <span>{t.eqTempLabel}:</span> <span>{currentPlanet.temperature ? currentPlanet.temperature.toFixed(0) + ' K' : t.unknown}</span>
          </div>
          <a
            href="https://exoplanetarchive.ipac.caltech.edu/"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-blue-400 text-center hover:underline mt-1"
          >
            {t.nasaCaltechSource}
          </a>
        </div>
      )}
    </div>
  );
});

// Real-time 2D Space Flight & Educational Staging HUD (Desencapsulamento de 8s com legendas explicativas)
const SpaceFlightHUD = memo(function SpaceFlightHUD() {
  const scene = useGameStore((state) => state.scene);
  const spaceFlightData = useGameStore((state) => state.spaceFlightData);
  const gameMode = useGameStore((state) => state.gameMode);
  const storyStep = useGameStore((state) => state.storyStep);
  const language = useGameStore((state) => state.language);
  const t = UI_TEXT[language];
  const { speed, target, distKm, stagingProgress, solarHeatPct, isEvaporating } = spaceFlightData;

  if (scene !== 'space') return null;

  const isStoryAuto = gameMode === 'story' && storyStep === 'autopilot_to_moon';
  const isStaging = stagingProgress < 1.0;
  const stagePercent = Math.round(stagingProgress * 100);

  return (
    <div className="absolute top-4 inset-x-0 mx-auto max-w-xl px-3 sm:px-4 pointer-events-none z-30 flex flex-col items-center gap-2 select-none animate-in fade-in duration-300">
      {/* Solar Evaporation & Thermal Proximity Banner */}
      {isEvaporating ? (
        <div className="w-full bg-red-950/95 backdrop-blur-2xl border-2 border-orange-400 rounded-2xl px-4 py-3 shadow-[0_0_32px_rgba(249,115,22,0.7)] flex items-center justify-center gap-2 text-orange-100 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-orange-300 shrink-0" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-center">
            {t.evaporatedMsg}
          </span>
        </div>
      ) : solarHeatPct > 0 ? (
        <div className="w-full bg-orange-950/95 backdrop-blur-2xl border border-amber-400/90 rounded-2xl px-3.5 py-2 shadow-[0_0_24px_rgba(245,158,11,0.5)] flex items-center justify-between gap-3 text-amber-100 animate-pulse">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wide">
              {t.extremeSolarHeat} ({solarHeatPct}%) — {t.stayAwayFromSun}
            </span>
          </div>
          <div className="w-20 bg-black/50 rounded-full h-1.5 overflow-hidden border border-amber-400/40 shrink-0">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full"
              style={{ width: `${Math.min(100, solarHeatPct)}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Educational Staging Banner (Desencapsulamento de 8s) */}
      {isStaging ? (
        <div className="w-full bg-slate-900/95 backdrop-blur-2xl border-2 border-amber-400/80 rounded-3xl p-3.5 sm:p-4 shadow-2xl flex flex-col gap-2.5 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300 font-mono">
                {t.stagingHeader} ({stagePercent}%)
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-200/90 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/30">
              {stagingProgress < 0.25
                ? `${t.stageWord} 1/4`
                : stagingProgress < 0.55
                ? `${t.stageWord} 2/4`
                : stagingProgress < 0.80
                ? `${t.stageWord} 3/4`
                : `${t.stageWord} 4/4`}
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-950/90 rounded-full h-2.5 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 h-full rounded-full transition-all duration-150 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${Math.max(5, stagePercent)}%` }}
            />
          </div>

          {/* Phase Detailed Description */}
          <div className="flex flex-col gap-1 text-left bg-black/40 p-2.5 rounded-2xl border border-white/5">
            {stagingProgress < 0.25 ? (
              <>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>⚡</span> {t.stage1Title}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-300 leading-snug">
                  {t.stage1Desc}
                </span>
              </>
            ) : stagingProgress < 0.55 ? (
              <>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🚀</span> {t.stage2Title}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-300 leading-snug">
                  {t.stage2Desc}
                </span>
              </>
            ) : stagingProgress < 0.80 ? (
              <>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>☀️</span> {t.stage3Title}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-300 leading-snug">
                  {t.stage3Desc}
                </span>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>✨</span> {t.stage4Title}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-300 leading-snug">
                  {t.stage4Desc}
                </span>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Active Flight Telemetry HUD */
        <div className="bg-slate-900/90 backdrop-blur-xl border border-blue-500/40 rounded-2xl px-4 py-2 sm:py-2.5 shadow-2xl flex items-center gap-3 sm:gap-6 text-white pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">{t.speedLabel}</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-cyan-300">{speed} km/h</span>
            </div>
          </div>

          <div className="w-px h-6 bg-white/15" />

          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">{t.targetPlanetLabel}</span>
            <span className="text-xs sm:text-sm font-bold text-amber-300">{target.toUpperCase()}</span>
          </div>

          <div className="w-px h-6 bg-white/15" />

          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">{t.distanceLabel}</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-emerald-300">{distKm} km</span>
          </div>
        </div>
      )}

      {/* Flight Control Reminder */}
      <div className="bg-black/65 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[9px] sm:text-[10px] font-mono text-slate-300 flex items-center gap-1.5 shadow-md">
        <span>{isStoryAuto ? '🛰️' : '🎮'}</span>
        <span>{isStoryAuto ? t.storyAutopilotNote : t.manualFlightNote}</span>
      </div>
    </div>
  );
});

// Real-time Earth Rocket Launch HUD: Compact on Mobile Screens, showing 5 to 0 Countdown, Fuel %, Rocket Weight (t) & Speed (KM/H)
const EarthLaunchHUD = memo(function EarthLaunchHUD() {
  const scene = useGameStore((state) => state.scene);
  const launchTelemetry = useGameStore((state) => state.launchTelemetry);
  const language = useGameStore((state) => state.language);
  const t = UI_TEXT[language];

  if (scene !== 'surface' || launchTelemetry.status === 'idle') return null;

  const isCountdown = launchTelemetry.status === 'countdown';
  const isFlameout = launchTelemetry.status === 'flameout';
  const isCrashed = launchTelemetry.status === 'crashed';
  const countVal = launchTelemetry.countdown ?? 0;

  return (
    <div className="w-full sm:fixed sm:top-24 sm:left-6 sm:right-auto sm:w-72 pointer-events-none z-30 flex flex-col gap-1.5 select-none animate-in fade-in duration-200">
      <div
        className={`w-full bg-slate-950/92 backdrop-blur-2xl rounded-2xl p-2 sm:p-3.5 flex flex-col gap-1.5 sm:gap-2 text-white border ${
          isFlameout || isCrashed
            ? 'border-red-500 shadow-[0_0_26px_rgba(239,68,68,0.45)]'
            : 'border-amber-400/80 shadow-[0_0_24px_rgba(245,158,11,0.28)]'
        }`}
      >
        {/* Compact Header & Countdown Badge */}
        <div className="flex items-center justify-between border-b border-white/15 pb-1 sm:pb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isFlameout || isCrashed
                  ? 'bg-red-500 animate-ping'
                  : isCountdown
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span
              className={`text-[9px] sm:text-xs font-black uppercase tracking-wider font-mono ${
                isFlameout || isCrashed ? 'text-red-300' : 'text-amber-300'
              }`}
            >
              {isCrashed
                ? t.seaImpact
                : isFlameout
                ? t.noFuelStatus
                : isCountdown
                ? t.launchCountdown
                : t.rocketInFlight}
            </span>
          </div>
          <span className="text-[8px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/40">
            PAD 39A
          </span>
        </div>

        {/* Compact 5 to 0 Countdown Row */}
        <div className="flex items-center justify-between bg-slate-900/90 rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 border border-white/10">
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] uppercase font-mono tracking-wider text-slate-400">
              {isCountdown ? t.ignitionIn : isFlameout || isCrashed ? t.emergency : t.propulsion}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-100 leading-tight">
              {isCrashed
                ? t.fellInOcean
                : isFlameout
                ? t.freefallActive
                : isCountdown
                ? countVal > 2
                  ? t.towerRetracting
                  : t.preIgnition
                : t.orbitalAscent}
            </span>
          </div>
          <div
            className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-xl font-mono font-black text-sm sm:text-xl border shadow-md ${
              isFlameout || isCrashed
                ? 'bg-red-500/25 border-red-400 text-red-300 animate-pulse'
                : isCountdown
                ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                : 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
            }`}
          >
            {isCrashed ? t.crashBadge : isFlameout ? t.failBadge : isCountdown ? `T-${countVal}s` : t.flyingBadge}
          </div>
        </div>

        {/* Fuel %, Velocity (KM/H) & Rocket Weight (t) */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {/* Fuel Gauge */}
          <div className="bg-slate-900/80 rounded-xl p-1.5 sm:p-2 border border-white/10 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-mono uppercase text-slate-400">
              <span>{t.fuelShort}</span>
              <span className={`font-bold text-[9px] sm:text-xs ${launchTelemetry.fuel < 25 ? 'text-red-400' : 'text-amber-300'}`}>
                {launchTelemetry.fuel}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 sm:h-2 overflow-hidden border border-amber-500/30">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  launchTelemetry.fuel < 25
                    ? 'bg-gradient-to-r from-red-600 to-rose-400'
                    : 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, launchTelemetry.fuel))}%` }}
              />
            </div>
          </div>

          {/* Velocity (KM/H) & Altitude Readout */}
          <div className="bg-slate-900/80 rounded-xl p-1.5 sm:p-2 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-mono uppercase text-slate-400">
              <span>{t.velShort}</span>
              <span className="text-[8px] sm:text-[9px] text-cyan-400 font-bold">{launchTelemetry.altitude}m</span>
            </div>
            <div className="text-xs sm:text-base font-black font-mono text-cyan-300 leading-none">
              {launchTelemetry.speed} <span className="text-[8px] sm:text-[10px] font-bold text-cyan-400">km/h</span>
            </div>
          </div>
        </div>

        {/* Rocket Mass / Weight Readout */}
        <div className="bg-slate-900/80 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 border border-white/10 flex items-center justify-between text-[9px] sm:text-[11px] font-mono">
          <span className="flex items-center gap-1 text-slate-400 uppercase">
            <Scale className="w-3 h-3 text-amber-400" />
            <span>{t.rocketWeight}</span>
          </span>
          <span className="font-black text-amber-200">
            {launchTelemetry.weightTons.toLocaleString(language === 'en' ? 'en-US' : 'pt-PT')} t
          </span>
        </div>
      </div>
    </div>
  );
});

// Interactive 2D Mission Control Dashboard for environments without WebGL/GPU
const MissionControlCenterView = memo(function MissionControlCenterView() {
  const isWebGLActive = useGameStore((state) => state.isWebGLActive);
  const setIsWebGLActive = useGameStore((state) => state.setIsWebGLActive);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const setPlanet = useGameStore((state) => state.setPlanet);
  const scene = useGameStore((state) => state.scene);
  const setScene = useGameStore((state) => state.setScene);
  const gravity = useGameStore((state) => state.gravity);
  const health = useGameStore((state) => state.health);
  const oxygen = useGameStore((state) => state.oxygen);
  const language = useGameStore((state) => state.language);
  const isEn = language === 'en';
  const t = UI_TEXT[language];
  const currentPlanet = PLANETS[planetIndex] || PLANETS[0];

  if (isWebGLActive) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-3 sm:p-6 bg-[#040814]/90 text-white select-none pointer-events-auto overflow-y-auto">
      <div className="relative z-10 w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl border border-blue-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4 text-center my-auto">
        {/* Top Badges */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <img src="/ggpen_logo.jpg" alt="GGPEN" className="h-6 sm:h-7 w-auto object-contain rounded" />
            <span className="text-xs font-bold tracking-wider text-slate-200">GGPEN</span>
          </div>
          <div className="text-[10px] uppercase font-mono text-cyan-300 font-bold bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-500/40">
            {isEn ? '2D Control Center' : 'Centro de Controlo 2D'}
          </div>
          <div className="flex items-center gap-2">
            <img src="/cabeca_aberta_logo.png" alt="Cabeça Aberta" className="h-6 sm:h-7 w-auto object-contain rounded shadow-sm" />
            <span className="text-xs font-bold tracking-wider text-slate-200 hidden sm:inline">Cabeça Aberta</span>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-cyan-300">
            {getPlanetName(currentPlanet.id, currentPlanet.name, language)} •{' '}
            {scene === 'surface'
              ? isEn
                ? 'Surface Base'
                : 'Base Terrestre'
              : isEn
              ? 'Orbital Space'
              : 'Espaço Orbital'}
          </h2>
          <p className="text-xs text-slate-300">
            {t.gravityLabel}: {currentPlanet.gravity.toFixed(2)} m/s² ({(currentPlanet.gravity / 9.8).toFixed(2)} G)
          </p>
        </div>

        {/* Mission Telemetry Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-white/10 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono">{isEn ? 'Mode' : 'Modo'}</span>
            <span className="font-bold text-cyan-300 capitalize">
              {scene === 'surface' ? (isEn ? 'Surface' : 'Superfície') : isEn ? 'Orbital' : 'Orbital'}
            </span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-white/10 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono">{t.gravityLabel}</span>
            <span className="font-bold text-emerald-300">{gravity} m/s²</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-white/10 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono">{t.suitLabel}</span>
            <span className="font-bold text-amber-300">{health}%</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-white/10 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono">O₂</span>
            <span className="font-bold text-blue-300">{oxygen.toFixed(0)}%</span>
          </div>
        </div>

        {/* Space Flight / Ground Switch */}
        <div className="flex gap-2">
          <button
            onClick={() => setScene('surface')}
            className={`flex-1 py-2.5 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              scene === 'surface'
                ? 'bg-blue-600/70 border-blue-400 text-white shadow-lg shadow-blue-500/25'
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {isEn ? 'Surface Base' : 'Base Terrestre'}
          </button>
          <button
            onClick={() => setScene('space')}
            className={`flex-1 py-2.5 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              scene === 'space'
                ? 'bg-indigo-600/70 border-indigo-400 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {isEn ? 'Orbital Flight' : 'Voo Orbital'}
          </button>
        </div>

        {/* Planetary Selector */}
        <div className="flex flex-col gap-1.5 text-left">
          <span className="text-[11px] font-bold text-slate-300 uppercase font-mono">
            {isEn ? 'Available Worlds:' : 'Planetas Disponíveis:'}
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-32 overflow-y-auto">
            {PLANETS.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setPlanet(idx)}
                className={`p-2 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                  planetIndex === idx
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold'
                    : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {getPlanetName(p.id, p.name, language)}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Force-Start / Retry Button */}
        <button
          onClick={() => {
            setIsWebGLActive(true);
            window.location.reload();
          }}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-98 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{isEn ? 'Enable 3D Mode / Retry' : 'Ativar Modo 3D / Tentar Novamente'}</span>
        </button>
      </div>
    </div>
  );
});

// Discreet small resources pill at bottom-right (User confirmed: Pequeno cartao discreto no canto inferior direito)
const DiscreetResourcesCard = memo(function DiscreetResourcesCard() {
  const resources = useGameStore((state) => state.resources);
  const scene = useGameStore((state) => state.scene);

  if (scene !== 'surface') return null;

  return (
    <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 flex items-center gap-3 text-xs shadow-xl pointer-events-auto select-none">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Fe</span>
        <span className="font-mono font-bold text-slate-100">{resources.iron}</span>
      </div>
      <div className="w-px h-3.5 bg-white/15" />
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-blue-400 uppercase">Ti</span>
        <span className="font-mono font-bold text-blue-200">{resources.titanium}</span>
      </div>
      <div className="w-px h-3.5 bg-white/15" />
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-purple-400 uppercase">Pl</span>
        <span className="font-mono font-bold text-purple-200">{resources.plasma}</span>
      </div>
    </div>
  );
});

const DesktopActionButtons = memo(function DesktopActionButtons({
  onAction,
}: {
  onAction: (action: string) => void;
}) {
  const visorMode = useGameStore((state) => state.visorMode);
  const setVisorMode = useGameStore((state) => state.setVisorMode);
  const toggleCameraMode = useGameStore((state) => state.toggleCameraMode);
  const mobileSprint = useGameStore((state) => state.mobileSprint);
  const setMobileSprint = useGameStore((state) => state.setMobileSprint);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const isOxygenChamberOpen = useGameStore((state) => state.isOxygenChamberOpen);
  const toggleOxygenChamber = useGameStore((state) => state.toggleOxygenChamber);
  const language = useGameStore((state) => state.language);
  const t = UI_TEXT[language];

  return (
    <div className="hidden lg:flex gap-3 justify-end pointer-events-auto">
      <button
        onClick={() => setVisorMode(visorMode === 'transparent' ? 'gold' : 'transparent')}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center active:scale-95 transition-all backdrop-blur-md border group cursor-pointer ${
          visorMode === 'gold'
            ? 'bg-amber-500/25 hover:bg-amber-500/40 border-amber-400/60 text-amber-300 shadow-lg shadow-amber-500/25'
            : 'bg-white/10 hover:bg-white/20 border-white/20 text-blue-300'
        }`}
        title={`${t.visorLabel}: ${visorMode === 'gold' ? t.goldVisor : t.transparent} [V]`}
      >
        {visorMode === 'gold' ? (
          <Sun className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
        ) : (
          <Eye className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
        )}
      </button>

      <button
        onClick={toggleCameraMode}
        className="bg-white/10 hover:bg-white/20 text-white w-14 h-14 rounded-2xl flex items-center justify-center active:scale-95 transition-all backdrop-blur-md border border-white/20 group cursor-pointer"
        title={t.toggleCameraTitle}
      >
        <Camera className="w-6 h-6 group-hover:text-blue-400 transition-colors" />
      </button>

      <button
        onClick={() => onAction('collect')}
        className="bg-white/10 hover:bg-white/20 text-white w-14 h-14 rounded-2xl flex items-center justify-center active:scale-95 transition-all backdrop-blur-md border border-white/20 group cursor-pointer"
        title={t.collectResourcesTitle}
      >
        <Zap className="w-6 h-6 group-hover:text-yellow-400 transition-colors" />
      </button>

      {planetIndex !== 0 && (
        <button
          onClick={() => toggleOxygenChamber()}
          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all backdrop-blur-md border group cursor-pointer ${
            isOxygenChamberOpen
              ? 'bg-cyan-500/25 hover:bg-cyan-500/40 text-cyan-200 border-cyan-400/70 shadow-lg shadow-cyan-500/25'
              : 'bg-red-950/90 hover:bg-red-900/90 text-red-200 border-red-400 shadow-lg shadow-red-500/45 animate-pulse'
          }`}
          title={`${t.o2ChamberLabel} (${isOxygenChamberOpen ? t.closeShort : t.openShort}) [E]`}
        >
          <Wind className={`w-5 h-5 group-hover:scale-110 transition-transform ${isOxygenChamberOpen ? 'text-cyan-300' : 'text-red-300'}`} />
          <span className={`text-[9px] font-mono font-black leading-none mt-0.5 ${isOxygenChamberOpen ? 'text-cyan-200' : 'text-red-200'}`}>
            {isOxygenChamberOpen ? 'O₂' : t.openO2Short}
          </span>
        </button>
      )}

      {/* Run / Sprint Button replacing the Hammer icon */}
      <button
        onClick={() => setMobileSprint(!mobileSprint)}
        className={`px-4 h-14 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all backdrop-blur-md border group cursor-pointer ${
          mobileSprint
            ? 'bg-emerald-500/35 hover:bg-emerald-500/50 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-500/25'
            : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
        }`}
        title={mobileSprint ? t.runningModeActive : t.clickToRun}
      >
        <Footprints
          className={`w-6 h-6 transition-transform group-hover:scale-110 ${
            mobileSprint ? 'text-emerald-300' : 'text-slate-200 group-hover:text-emerald-400'
          }`}
        />
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
          {mobileSprint ? t.runningShort : t.runShort}
        </span>
      </button>
    </div>
  );
});

interface CharacterCustomizationModalProps {
  onClose: () => void;
}

const CharacterCustomizationModal = memo(function CharacterCustomizationModal({
  onClose,
}: CharacterCustomizationModalProps) {
  const characterGender = useGameStore((state) => state.characterGender);
  const setCharacterGender = useGameStore((state) => state.setCharacterGender);
  const visorMode = useGameStore((state) => state.visorMode);
  const setVisorMode = useGameStore((state) => state.setVisorMode);
  const suitStyle = useGameStore((state) => state.suitStyle);
  const setSuitStyle = useGameStore((state) => state.setSuitStyle);
  const language = useGameStore((state) => state.language);
  const t = UI_TEXT[language];

  return (
    <div className="bg-slate-900/95 p-5 rounded-3xl backdrop-blur-2xl border border-blue-500/40 text-white w-full max-w-sm flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">{t.suitAndCharacter}</h3>
            <span className="text-[10px] text-blue-300 font-mono">{t.angolanAstronaut}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          title={t.close}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* GGPEN & Cabeça Aberta Logos */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-800/90 border border-blue-500/30">
        <div className="flex items-center gap-2">
          <img src="/ggpen_logo.jpg" alt="GGPEN" className="h-6 w-auto object-contain rounded" />
          <span className="text-[11px] font-bold text-slate-200">GGPEN</span>
        </div>
        <div className="h-5 w-[1px] bg-slate-700" />
        <div className="flex items-center gap-2">
          <img
            src="/cabeca_aberta_logo.png"
            alt="Cabeça Aberta"
            className="h-6 w-auto object-contain rounded shadow-sm"
          />
          <span className="text-[11px] font-bold text-slate-200">Cabeça Aberta</span>
        </div>
      </div>

      {/* Astronaut Gender */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300">{t.astronautRoleLabel}</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCharacterGender('male')}
            className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-xs font-medium cursor-pointer ${
              characterGender === 'male'
                ? 'bg-blue-600/40 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="text-2xl mb-1">👨</span>
            <span className="font-bold text-sm">{t.maleLabel}</span>
            <span className="text-[10px] text-slate-400">{t.commander}</span>
          </button>

          <button
            onClick={() => setCharacterGender('female')}
            className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-xs font-medium cursor-pointer ${
              characterGender === 'female'
                ? 'bg-blue-600/40 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="text-2xl mb-1">👩</span>
            <span className="font-bold text-sm">{t.femaleLabel}</span>
            <span className="text-[10px] text-slate-400">{t.specialist}</span>
          </button>
        </div>
      </div>

      {/* Visor Mode */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-yellow-400" />
          {t.helmetVisor}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setVisorMode('transparent')}
            className={`p-3 rounded-2xl border text-xs text-left transition-all cursor-pointer ${
              visorMode === 'transparent'
                ? 'bg-blue-600/35 border-blue-400 text-white shadow-md'
                : 'bg-slate-800/50 border-white/10 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="font-bold text-slate-200">{t.transparent}</div>
            <div className="text-[10px] text-slate-400">{t.seeHumanFace}</div>
          </button>

          <button
            onClick={() => setVisorMode('gold')}
            className={`p-3 rounded-2xl border text-xs text-left transition-all cursor-pointer ${
              visorMode === 'gold'
                ? 'bg-amber-600/35 border-amber-400 text-white shadow-md'
                : 'bg-slate-800/50 border-white/10 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="font-bold text-slate-200">{t.goldVisor}</div>
            <div className="text-[10px] text-slate-400">{t.mirroredReflection}</div>
          </button>
        </div>
      </div>

      {/* Suit Style */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          {t.spacesuitStyle}
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setSuitStyle('white')}
            className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
              suitStyle === 'white'
                ? 'bg-slate-200/25 border-white text-white font-bold shadow-md'
                : 'bg-slate-800/50 border-white/10 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 inline-block shadow-sm" />
            <span className="text-[11px]">{t.evaClassic}</span>
          </button>

          <button
            onClick={() => setSuitStyle('orange')}
            className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
              suitStyle === 'orange'
                ? 'bg-orange-600/35 border-orange-400 text-white font-bold shadow-md'
                : 'bg-slate-800/50 border-white/10 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-orange-500 border border-orange-300 inline-block shadow-sm" />
            <span className="text-[11px]">{t.orionFlight}</span>
          </button>

          <button
            onClick={() => setSuitStyle('carbon')}
            className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
              suitStyle === 'carbon'
                ? 'bg-zinc-800 border-zinc-400 text-white font-bold shadow-md'
                : 'bg-slate-800/50 border-white/10 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-600 inline-block shadow-sm" />
            <span className="text-[11px]">{t.carbonSuit}</span>
          </button>
        </div>
      </div>

      {/* Confirm Button */}
      <button
        onClick={onClose}
        className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-98 shadow-lg shadow-blue-500/25 cursor-pointer"
      >
        {t.confirmReturnGame}
      </button>
    </div>
  );
});

// Compact Always-Visible Astronaut Life Support Card placed in Top-Right Stack directly below Settings (surface) or below Space Monitoring HUD (space, strictly hidden during orbital staging)
const AstronautLifeSupportHUD = memo(function AstronautLifeSupportHUD() {
  const scene = useGameStore((state) => state.scene);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const stagingProgress = useGameStore((state) => state.spaceFlightData.stagingProgress);
  const health = useGameStore((state) => state.health);
  const maxHealth = useGameStore((state) => state.maxHealth);
  const oxygen = useGameStore((state) => state.oxygen);
  const activeHazard = useGameStore((state) => state.activeHazard);
  const dehydrationSeconds = useGameStore((state) => state.dehydrationSeconds);
  const isOxygenChamberOpen = useGameStore((state) => state.isOxygenChamberOpen);
  const isDying = useGameStore((state) => state.isDying);
  const gameMode = useGameStore((state) => state.gameMode);
  const hasSpacesuit = useGameStore((state) => state.hasSpacesuit);
  const language = useGameStore((state) => state.language);
  const t = UI_TEXT[language];

  if (scene === 'space' && stagingProgress < 1.0) {
    return null;
  }

  const showSuitBar = gameMode !== 'story' || hasSpacesuit;
  const currentPlanet = PLANETS[planetIndex] || PLANETS[0];
  const isSolarProximityDrain =
    scene === 'surface' && (currentPlanet.type === 'mercury' || currentPlanet.type === 'venus');
  const isChamberClosed = scene === 'surface' && planetIndex !== 0 && !isOxygenChamberOpen;

  const statusBadge = isDying
    ? { text: t.diedBadge, cls: 'text-red-100 bg-red-700 border-red-300 animate-pulse' }
    : isChamberClosed
    ? { text: t.chamberClosedBadge, cls: 'text-red-200 bg-red-950/95 border-red-400 animate-pulse' }
    : activeHazard
    ? activeHazard.type === 'radiation'
      ? { text: t.radiationBadge, cls: 'text-lime-300 bg-lime-950/90 border-lime-400/60 animate-pulse' }
      : { text: t.toxicBadge, cls: 'text-amber-300 bg-amber-950/90 border-amber-400/60 animate-pulse' }
    : oxygen <= 0 && dehydrationSeconds >= 20
    ? { text: t.dehydrationBadge, cls: 'text-red-200 bg-red-900/95 border-red-400 animate-pulse' }
    : oxygen <= 0
    ? { text: t.hydrateBadge, cls: 'text-amber-200 bg-amber-900/95 border-amber-400 animate-pulse' }
    : (showSuitBar && health < 35) || oxygen < 30
    ? { text: t.alertBadge, cls: 'text-red-300 bg-red-950/90 border-red-400/50 animate-pulse' }
    : showSuitBar && maxHealth > 100
    ? { text: t.reinforcedBadge, cls: 'text-cyan-300 bg-cyan-950/90 border-cyan-400/40' }
    : { text: t.nominalBadge, cls: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30' };

  return (
    <div className="w-full pointer-events-none select-none">
      <div
        className={`bg-slate-950/85 backdrop-blur-xl rounded-2xl p-2 sm:p-2.5 shadow-xl flex flex-col gap-1.5 text-white border transition-colors ${
          isDying || isChamberClosed || activeHazard || oxygen <= 0
            ? 'border-red-500/80 shadow-red-500/30'
            : 'border-white/15'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-1">
          <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider text-slate-300">
            {t.lifeSupport}
          </span>
          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border ${statusBadge.cls}`}>
            {statusBadge.text}
          </span>
        </div>

        {/* Proteção do Traje (Hidden before suit equipped in Story Mode) */}
        {showSuitBar && (
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
              <span className="flex items-center gap-1 font-bold text-rose-300">
                <Shield className="w-3 h-3 text-rose-400" />
                <span>{t.suitLabel}</span>
              </span>
              <span className="font-mono font-bold text-rose-200">
                {Math.max(0, Math.round(health))}/{maxHealth}
              </span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-rose-500/25">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  maxHealth > 100 ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-gradient-to-r from-rose-500 to-red-400'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (health / maxHealth) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Quantidade de Água & Oxigénio */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
            <span className="flex items-center gap-1 font-bold text-cyan-300">
              <Droplets className="w-3 h-3 text-cyan-400" />
              <span>{t.waterO2Label}</span>
            </span>
            <span className="font-mono font-bold text-cyan-200">
              {Math.max(0, oxygen).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-cyan-500/25">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full rounded-full transition-all duration-150"
              style={{ width: `${Math.max(0, Math.min(100, oxygen))}%` }}
            />
          </div>
        </div>

        {isChamberClosed && (
          <div className="flex items-center justify-between text-[8px] font-mono text-red-200 bg-red-950/90 border border-red-400/70 rounded-lg px-1.5 py-0.5 animate-pulse">
            <span>{t.chamberO2Closed}</span>
            <span className="font-bold">-10% / 3s</span>
          </div>
        )}

        {isSolarProximityDrain && (
          <div className="flex items-center justify-between text-[8px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/30 rounded-lg px-1.5 py-0.5">
            <span>{t.extremeSolarHeat}</span>
            <span className="font-bold">-2% / 3m</span>
          </div>
        )}
      </div>
    </div>
  );
});

const HazardExposureAlert = memo(function HazardExposureAlert() {
  const activeHazard = useGameStore((state) => state.activeHazard);
  const scene = useGameStore((state) => state.scene);
  const language = useGameStore((state) => state.language);
  const t = UI_TEXT[language];

  if (!activeHazard || scene !== 'surface') return null;

  const isRadiation = activeHazard.type === 'radiation';

  return (
    <div className="fixed top-[68px] sm:top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none animate-in fade-in duration-150 px-3 max-w-[92vw]">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl backdrop-blur-xl border shadow-2xl ${
          isRadiation
            ? 'bg-lime-950/90 border-lime-400/70 text-lime-200'
            : 'bg-amber-950/90 border-amber-400/70 text-amber-200'
        }`}
      >
        <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 animate-bounce" />
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wide text-white">
            {isRadiation ? t.radiationExposure : t.toxicGasZone} • {activeHazard.name}
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono opacity-90">
            {t.hazardDrainMsg} ({activeHazard.distance.toFixed(1)}m) — {t.moveAway}
          </span>
        </div>
      </div>
    </div>
  );
});

const LifeSupportCriticalAlert = memo(function LifeSupportCriticalAlert() {
  const oxygen = useGameStore((state) => state.oxygen);
  const dehydrationSeconds = useGameStore((state) => state.dehydrationSeconds);
  const lastRespawnAt = useGameStore((state) => state.lastRespawnAt);
  const lastRespawnReason = useGameStore((state) => state.lastRespawnReason);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const launchFailureMsg = useGameStore((state) => state.launchFailureMsg);
  const setLaunchFailureMsg = useGameStore((state) => state.setLaunchFailureMsg);
  const isDying = useGameStore((state) => state.isDying);
  const dyingReason = useGameStore((state) => state.dyingReason);
  const scene = useGameStore((state) => state.scene);
  const language = useGameStore((state) => state.language);
  const t = UI_TEXT[language];
  const [showRespawnToast, setShowRespawnToast] = useState(false);

  useEffect(() => {
    if (!lastRespawnAt) return;
    setShowRespawnToast(true);
    const timer = setTimeout(() => setShowRespawnToast(false), 5000);
    return () => clearTimeout(timer);
  }, [lastRespawnAt]);

  useEffect(() => {
    if (!launchFailureMsg) return;
    const timer = setTimeout(() => setLaunchFailureMsg(null), 4500);
    return () => clearTimeout(timer);
  }, [launchFailureMsg, setLaunchFailureMsg]);

  if (scene !== 'surface') return null;

  const showDehydration = oxygen <= 0 && !isDying;
  if (!isDying && !showDehydration && !showRespawnToast && !launchFailureMsg) return null;

  const remainingGrace = Math.max(1, Math.ceil(20 - dehydrationSeconds));
  const drainingSuit = dehydrationSeconds >= 20;
  const rawPlanet = PLANETS[planetIndex] || PLANETS[0];
  const planetName = getPlanetName(rawPlanet.id, rawPlanet.name, language);
  const isDangerToast = lastRespawnReason === 'rocket_crash' || lastRespawnReason === 'oxygen_chamber';

  return (
    <div className="fixed top-[128px] sm:top-[152px] left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none flex flex-col items-center gap-1.5 px-3 max-w-[92vw]">
      {isDying && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-red-950/95 border-2 border-red-400 text-red-50 shadow-[0_0_32px_rgba(239,68,68,0.75)] backdrop-blur-xl animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-300 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              {t.astronautDied}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-red-200">
              {dyingReason === 'oxygen_chamber'
                ? `${t.chamberDepletedRespawn} ${planetName}...`
                : t.suitZeroRespawn}
            </span>
          </div>
        </div>
      )}

      {launchFailureMsg && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-red-950/95 border border-red-400/90 text-red-100 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-[10px] sm:text-xs font-bold">{launchFailureMsg}</span>
        </div>
      )}

      {showRespawnToast && (
        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in duration-200 border ${
            isDangerToast
              ? 'bg-red-950/95 border-red-400/85 text-red-100'
              : 'bg-slate-950/95 border-cyan-400/80 text-cyan-100'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDangerToast ? 'text-red-400' : 'text-cyan-400'}`} />
          <span className="text-[10px] sm:text-xs font-bold">
            {lastRespawnReason === 'rocket_crash'
              ? t.crashToastMsg
              : lastRespawnReason === 'oxygen_chamber'
              ? `${t.chamberDeathToastPrefix}${planetName}${t.chamberDeathToastSuffix}`
              : planetIndex !== 0
              ? `${t.offEarthRespawnPrefix}${planetName}!`
              : t.earthRespawnToast}
          </span>
        </div>
      )}

      {showDehydration && (
        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in fade-in duration-150 ${
            drainingSuit
              ? 'bg-red-950/95 border-red-400 text-red-100'
              : 'bg-amber-950/95 border-amber-400 text-amber-100'
          }`}
        >
          <Droplets className="w-4 h-4 shrink-0 text-cyan-300 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wide text-white">
              {drainingSuit ? t.criticalDehydrationTitle : t.waterO2DepletedTitle}
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono opacity-95">
              {drainingSuit
                ? t.criticalDehydrationDesc
                : `${t.waterO2DepletedDescPrefix}${remainingGrace}s`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal = memo(function SettingsModal({ onClose }: SettingsModalProps) {
  const targetFps = useGameStore((state) => state.targetFps);
  const setTargetFps = useGameStore((state) => state.setTargetFps);
  const language = useGameStore((state) => state.language);
  const setLanguage = useGameStore((state) => state.setLanguage);
  const gameMusicTrack = useGameStore((state) => state.gameMusicTrack);
  const setGameMusicTrack = useGameStore((state) => state.setGameMusicTrack);
  const musicVolume = useGameStore((state) => state.musicVolume);
  const setMusicVolume = useGameStore((state) => state.setMusicVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const setSfxVolume = useGameStore((state) => state.setSfxVolume);
  const t = UI_TEXT[language];

  return (
    <div className="bg-slate-900/95 p-5 rounded-3xl backdrop-blur-2xl border border-cyan-500/40 text-white w-full max-w-sm flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">{t.settingsTitle}</h3>
            <span className="text-[10px] text-cyan-300 font-mono">{t.mobileOptimizedMode}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          title={t.close}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Language Selector (Português / English) */}
      <div className="flex items-center justify-between bg-slate-800/70 border border-white/10 rounded-2xl p-2.5">
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Languages className="w-4 h-4 text-cyan-400" />
          <span>{t.languageLabel}</span>
        </span>
        <div className="flex items-center gap-1 bg-slate-950/80 border border-white/10 rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => setLanguage('pt')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              language === 'pt' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Português
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              language === 'en' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Frame Rate Selection (Strictly 20, 30, 40, and 60 FPS - Máx Hidden) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">{t.frameRateLabel}</span>
          <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/30">
            {targetFps === 20
              ? t.fps20
              : targetFps === 30
              ? t.fps30
              : targetFps === 40
              ? t.fps40
              : t.fps60}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTargetFps(20)}
            className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center cursor-pointer ${
              targetFps === 20
                ? 'bg-rose-600/40 border-rose-400 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xs font-bold">20 FPS</span>
            <span className="text-[9px] text-rose-300 font-medium">{t.maxBattery}</span>
          </button>

          <button
            onClick={() => setTargetFps(30)}
            className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center cursor-pointer ${
              targetFps === 30
                ? 'bg-amber-600/40 border-amber-400 text-white font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xs font-bold">30 FPS</span>
            <span className="text-[9px] text-amber-300 font-medium">{t.economical}</span>
          </button>

          <button
            onClick={() => setTargetFps(40)}
            className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center cursor-pointer ${
              targetFps === 40
                ? 'bg-cyan-600/40 border-cyan-400 text-white font-bold shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xs font-bold">40 FPS</span>
            <span className="text-[9px] text-cyan-300 font-medium">{t.balanced}</span>
          </button>

          <button
            onClick={() => setTargetFps(60)}
            className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center cursor-pointer ${
              targetFps === 60
                ? 'bg-emerald-600/40 border-emerald-400 text-white font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xs font-bold">60 FPS</span>
            <span className="text-[9px] text-emerald-300 font-medium">{t.smooth}</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-400 leading-tight mt-1">
          {t.fpsHelpText}
        </p>
      </div>

      {/* In-Game Music Selector (5 options including Beethoven Op. 68) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.musicLabel}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'beethoven_op68', label: t.musicTrackBeethovenOp68, sub: t.musicTrackBeethovenOp68Sub, activeClass: 'bg-amber-600/35 border-amber-400 text-white shadow-md shadow-amber-500/20', spanFull: true },
              { id: 'epic', label: t.musicTrackEpic, sub: t.musicTrackEpicSub, activeClass: 'bg-cyan-600/35 border-cyan-400 text-white shadow-md shadow-cyan-500/20', spanFull: false },
              { id: 'tactical', label: t.musicTrackTactical, sub: t.musicTrackTacticalSub, activeClass: 'bg-orange-600/35 border-orange-400 text-white shadow-md shadow-orange-500/20', spanFull: false },
              { id: 'orbital', label: t.musicTrackOrbital, sub: t.musicTrackOrbitalSub, activeClass: 'bg-indigo-600/35 border-indigo-400 text-white shadow-md shadow-indigo-500/20', spanFull: false },
              { id: 'none', label: t.musicTrackNone, sub: t.musicTrackNoneSub, activeClass: 'bg-rose-600/35 border-rose-400 text-white shadow-md shadow-rose-500/20', spanFull: false },
            ] as const
          ).map((opt) => {
            const isSelected = gameMusicTrack === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  initAudio();
                  setGameMusicTrack(opt.id as GameMusicTrack);
                }}
                className={`${opt.spanFull ? 'col-span-2' : ''} p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-0.5 cursor-pointer ${
                  isSelected
                    ? `${opt.activeClass} font-bold`
                    : 'bg-slate-800/60 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold flex items-center gap-1.5 leading-tight">
                  {opt.id === 'none' ? (
                    <VolumeX className="w-3.5 h-3.5 shrink-0 text-rose-300" />
                  ) : (
                    <Music className="w-3.5 h-3.5 shrink-0 text-cyan-300" />
                  )}
                  <span className="truncate">{opt.label}</span>
                </span>
                <span className="text-[9px] text-slate-400 font-medium pl-5 truncate">{opt.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio Mix Sliders (Music vs Game SFX/Ambience) */}
      <div className="flex flex-col gap-2.5 bg-slate-800/60 border border-white/10 rounded-2xl p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.audioVolumesLabel}</span>
        </div>

        {/* Music Volume Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300">{t.musicVolumeLabel}</span>
            <span className="font-mono font-bold text-cyan-300">{Math.round(musicVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(musicVolume * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              initAudio();
              setMusicVolume(v);
              setMusicVolumeLevel(v);
            }}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* SFX & Ambience Volume Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300">{t.sfxVolumeLabel}</span>
            <span className="font-mono font-bold text-emerald-300">{Math.round(sfxVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(sfxVolume * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              initAudio();
              setSfxVolume(v);
              setSfxVolumeLevel(v);
            }}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>
      </div>

      {/* Return to Mode Menu & Dismiss Buttons */}
      <div className="flex flex-col gap-2 mt-1">
        <button
          onClick={() => {
            stopMissionVoice();
            onClose();
            useGameStore.getState().returnToModeSelect();
          }}
          className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
        >
          {t.returnToMainMenu}
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
        >
          {t.closeSettings}
        </button>
      </div>
    </div>
  );
});

const WaterImmersionAlert = memo(function WaterImmersionAlert() {
  return null;
});

const VABDoorAlert = memo(function VABDoorAlert() {
  return null;
});

const DesktopControlsGuide = memo(function DesktopControlsGuide() {
  const scene = useGameStore((state) => state.scene);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const drivingCarId = useGameStore((state) => state.drivingCarId);
  const language = useGameStore((state) => state.language);
  const t = UI_TEXT[language];

  return (
    <div className="absolute bottom-6 left-24 hidden lg:flex flex-col gap-1 pointer-events-none text-white/60 font-mono text-xs uppercase tracking-widest bg-black/45 p-3.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
      {scene === 'surface' ? (
        drivingCarId ? (
          <>
            <p className="text-cyan-400 font-bold">{t.drivingModeActive}</p>
            <p>
              <strong className="text-white/90">W A S D / ARROWS</strong> {t.accelTurn}
            </p>
            <p>
              <strong className="text-white/90">SHIFT</strong> {t.turboBrake}
            </p>
            <p>
              <strong className="text-white/90">R</strong> {t.exitVehicle}
            </p>
          </>
        ) : (
          <>
            <p>
              <strong className="text-white/90">W A S D</strong> {t.walkRun}
            </p>
            <p>
              <strong className="text-white/90">R</strong> {t.boardCarRocket}
            </p>
            <p>
              <strong className="text-white/90">B</strong> {t.collectRecharge} • <strong className="text-white/90">E</strong> {planetIndex === 0 ? t.doorLabel : t.o2ChamberLabel}
            </p>
            <p>
              <strong className="text-white/90">I</strong> {t.backpackLabel} • <strong className="text-white/90">V</strong> {t.visorLabel}
            </p>
          </>
        )
      ) : (
        <>
          <p>
            <strong className="text-white/80">W A S D</strong> {t.steerShip}
          </p>
          <p>
            <strong className="text-white/80">SPACE</strong> {t.accelerateShip}
          </p>
          <p className="text-yellow-400/80 mt-1">{t.approachPlanetToLand}</p>
        </>
      )}
    </div>
  );
});

const VehicleDriveHUD = memo(function VehicleDriveHUD() {
  const scene = useGameStore((state) => state.scene);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const nearCarId = useGameStore((state) => state.nearCarId);
  const drivingCarId = useGameStore((state) => state.drivingCarId);
  const carSpeedKmh = useGameStore((state) => state.carSpeedKmh);
  const isNearRocket = useGameStore((state) => state.isNearRocket);
  const isLaunching = useGameStore((state) => state.isLaunching);
  const rocketFuel = useGameStore((state) => state.rocketFuel);
  const addRocketFuel = useGameStore((state) => state.addRocketFuel);
  const setLaunchFailureMsg = useGameStore((state) => state.setLaunchFailureMsg);
  const setLaunching = useGameStore((state) => state.setLaunching);
  const setLaunchTelemetry = useGameStore((state) => state.setLaunchTelemetry);
  const toggleDriveCar = useGameStore((state) => state.toggleDriveCar);
  const toggleCameraMode = useGameStore((state) => state.toggleCameraMode);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const carStates = useGameStore((state) => state.carStates);
  const language = useGameStore((state) => state.language);
  const t = UI_TEXT[language];

  const [isRefueling, setIsRefueling] = useState(false);

  useEffect(() => {
    if (!isRefueling || !isNearRocket || isLaunching || scene !== 'surface' || planetIndex !== 0) {
      return;
    }
    let lastSound = 0;
    const interval = setInterval(() => {
      const currFuel = useGameStore.getState().rocketFuel;
      if (currFuel >= 100) {
        setIsRefueling(false);
        return;
      }
      addRocketFuel(1.6);
      const now = performance.now();
      if (now - lastSound > 190) {
        lastSound = now;
        playRefuelPumpSound();
      }
    }, 55);
    return () => clearInterval(interval);
  }, [isRefueling, isNearRocket, isLaunching, scene, planetIndex, addRocketFuel]);

  if (scene !== 'surface') return null;

  const activeCar =
    planetIndex === 0
      ? drivingCarId
        ? carStates[drivingCarId]
        : nearCarId
        ? carStates[nearCarId]
        : null
      : null;

  const showRocketPrompt = isNearRocket && !isLaunching && !drivingCarId;
  if (!activeCar && !showRocketPrompt) return null;

  const maxKmh = activeCar?.type === 'supercar' ? 212 : 165;
  const speedPct = Math.min(100, Math.round((carSpeedKmh / maxKmh) * 100));
  const gearLabel =
    carSpeedKmh === 0
      ? 'N'
      : activeCar && activeCar.speed < -0.15
      ? 'R'
      : carSpeedKmh < 24
      ? '1'
      : carSpeedKmh < 52
      ? '2'
      : carSpeedKmh < 82
      ? '3'
      : carSpeedKmh < 115
      ? '4'
      : carSpeedKmh < 148
      ? '5'
      : '6';

  const handleBoardRocket = () => {
    if (!isLaunching && isNearRocket) {
      const st = useGameStore.getState();
      const lt = UI_TEXT[st.language];
      if (planetIndex === 0) {
        if (st.gameMode === 'story' && !st.hasSpacesuit) {
          setLaunchFailureMsg(lt.needSuitBeforeRocket);
          return;
        }
        const currentFuel = st.rocketFuel;
        if (currentFuel <= 0) {
          setLaunchFailureMsg(lt.noFuelHoldPanel);
          return;
        }
        setLaunchFailureMsg(null);
        setLaunchTelemetry({
          countdown: 5,
          fuel: Math.round(currentFuel),
          speed: 0,
          altitude: 0,
          weightTons: Math.round(420 + currentFuel * 25.5),
          status: 'countdown',
        });
      }
      setLaunching(true);
    }
  };

  const rocketFuelPct = Math.round(rocketFuel);
  const rocketWeightTons = Math.round(420 + rocketFuel * 25.5);

  return (
    <div className="w-full pointer-events-auto flex flex-col items-stretch gap-1.5 animate-in fade-in duration-200">
      {drivingCarId && activeCar ? (
        /* Compact Top-Right Speedometer & Cockpit HUD placed directly below Life Support */
        <div className="w-full flex flex-col gap-1.5 bg-slate-950/92 backdrop-blur-xl border border-cyan-400/75 p-2 sm:p-2.5 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-xl font-black font-mono text-cyan-300 leading-none">
                  {carSpeedKmh}
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 font-bold">
                  KM/H
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1 border border-cyan-500/30">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 transition-all duration-75"
                  style={{ width: `${Math.max(4, speedPct)}%` }}
                />
              </div>
            </div>
            {/* Gear Indicator Badge */}
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex flex-col items-center justify-center shrink-0">
              <span className="text-[7px] font-mono text-cyan-300 leading-none">G</span>
              <span className="text-[10px] font-black font-mono text-white leading-none">
                {gearLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick 1st/3rd Person Cockpit Camera Toggle */}
            <button
              onClick={() => toggleCameraMode()}
              className="flex-1 py-1 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-200 border border-cyan-400/30 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              title={t.toggleCameraTitle}
            >
              {cameraMode === 'first' ? t.thirdPerson : t.firstPerson}
            </button>

            {/* Exit Vehicle Button [R] */}
            <button
              onClick={() => toggleDriveCar()}
              className="py-1 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>{t.exitBtn}</span>
              <span className="px-1 py-0.2 rounded bg-black/40 text-[8px] border border-white/25">R</span>
            </button>
          </div>
        </div>
      ) : activeCar ? (
        <button
          onClick={() => toggleDriveCar()}
          className="w-full flex items-center justify-between gap-2 bg-slate-950/92 hover:bg-slate-900 backdrop-blur-xl border border-emerald-400/80 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl shadow-[0_0_16px_rgba(16,185,129,0.3)] text-white transition-all active:scale-95 cursor-pointer group"
        >
          <div className="flex flex-col text-left min-w-0">
            <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-400 font-bold leading-tight truncate">
              {activeCar.name}
            </span>
            <span className="text-[10px] sm:text-xs font-extrabold tracking-wide text-white group-hover:text-emerald-200 leading-tight">
              {t.enterCar}
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-mono text-[10px] font-black shadow-sm shrink-0">
            R
          </span>
        </button>
      ) : null}

      {showRocketPrompt && (
        <div className="w-full flex flex-col gap-1.5">
          {planetIndex === 0 && (
            <div className="w-full bg-slate-950/94 backdrop-blur-xl border border-amber-400/75 p-2 sm:p-2.5 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.28)] text-white flex flex-col gap-1.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-mono font-bold uppercase text-amber-300">
                  <Fuel className="w-3 h-3 text-amber-400" />
                  <span>{t.refuelPanel}</span>
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] font-mono font-black ${
                    rocketFuelPct >= 85
                      ? 'text-emerald-400'
                      : rocketFuelPct > 0
                      ? 'text-amber-300'
                      : 'text-red-400'
                  }`}
                >
                  {rocketFuelPct}%
                </span>
              </div>

              {/* Fuel Gauge with 85% Safe Orbit Threshold Marker */}
              <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/15">
                <div
                  className={`h-full transition-all duration-75 ${
                    rocketFuelPct >= 85
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : rocketFuelPct > 0
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, rocketFuel))}%` }}
                />
                {/* 85% Safe Orbit Threshold Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_#ffffff]"
                  style={{ left: '85%' }}
                  title={t.safeOrbitMinTitle}
                />
              </div>

              <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-300">
                <span className="flex items-center gap-1">
                  <Scale className="w-2.5 h-2.5 text-cyan-400" />
                  <span>{t.weightShort}: {rocketWeightTons.toLocaleString(language === 'en' ? 'en-US' : 'pt-PT')} t</span>
                </span>
                <span className={rocketFuelPct >= 85 ? 'text-emerald-400 font-bold' : rocketFuelPct > 0 ? 'text-amber-300 font-bold' : 'text-red-400 font-bold'}>
                  {rocketFuelPct >= 85 ? t.safeOrbit : rocketFuelPct > 0 ? t.fallUnder85 : t.empty}
                </span>
              </div>

              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  setIsRefueling(true);
                }}
                onPointerUp={() => setIsRefueling(false)}
                onPointerLeave={() => setIsRefueling(false)}
                onPointerCancel={() => setIsRefueling(false)}
                disabled={rocketFuelPct >= 100}
                className={`w-full py-1.5 px-2 rounded-xl font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                  rocketFuelPct >= 100
                    ? 'bg-emerald-600/40 border border-emerald-400/50 text-emerald-200 cursor-default'
                    : isRefueling
                    ? 'bg-amber-400 text-slate-950 border border-white scale-98 shadow-[0_0_16px_rgba(251,191,36,0.6)]'
                    : 'bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/80 text-amber-200 active:scale-95'
                }`}
              >
                <Fuel className={`w-3.5 h-3.5 ${isRefueling ? 'animate-bounce' : ''}`} />
                <span>
                  {rocketFuelPct >= 100
                    ? t.tankFull
                    : isRefueling
                    ? t.refueling
                    : t.holdToRefuel}
                </span>
              </button>
            </div>
          )}

          <button
            onClick={handleBoardRocket}
            className={`w-full flex items-center justify-between gap-2 bg-slate-950/92 hover:bg-slate-900 backdrop-blur-xl px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl text-white transition-all active:scale-95 cursor-pointer group border ${
              planetIndex === 0 && rocketFuelPct <= 0
                ? 'border-red-400/80 shadow-[0_0_14px_rgba(239,68,68,0.28)]'
                : 'border-amber-400/85 shadow-[0_0_18px_rgba(245,158,11,0.35)]'
            }`}
          >
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[8px] font-mono uppercase tracking-wider text-amber-400 font-bold leading-tight truncate">
                {planetIndex === 0 ? t.rocketPadName : t.capsuleName}
              </span>
              <span className="text-[10px] sm:text-xs font-extrabold tracking-wide text-white group-hover:text-amber-200 leading-tight">
                {t.boardRocket}
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono text-[10px] font-black shadow-sm shrink-0">
              R
            </span>
          </button>
        </div>
      )}
    </div>
  );
});

const TopRightComputerLibraryButton = memo(function TopRightComputerLibraryButton() {
  const scene = useGameStore((s) => s.scene);
  const isNearComputer = useGameStore((s) => s.isNearComputer);
  const isComputerLibraryOpen = useGameStore((s) => s.isComputerLibraryOpen);
  const setComputerLibraryOpen = useGameStore((s) => s.setComputerLibraryOpen);
  const drivingCarId = useGameStore((s) => s.drivingCarId);
  const language = useGameStore((s) => s.language);
  const t = UI_TEXT[language];

  if (scene !== 'surface' || !isNearComputer || isComputerLibraryOpen || drivingCarId) return null;

  return (
    <button
      onClick={() => setComputerLibraryOpen(true)}
      className="w-full pointer-events-auto flex items-center justify-between gap-2 bg-slate-950/92 hover:bg-slate-900 backdrop-blur-xl border border-cyan-400/85 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl shadow-[0_0_18px_rgba(6,182,212,0.38)] text-white transition-all active:scale-95 cursor-pointer group animate-in fade-in duration-200"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <BookOpen className="w-4 h-4 text-cyan-300 shrink-0" />
        <div className="flex flex-col text-left min-w-0">
          <span className="text-[8px] font-mono uppercase tracking-wider text-cyan-300 font-bold leading-tight truncate">
            {t.digitalLibrary}
          </span>
          <span className="text-[10px] sm:text-xs font-extrabold tracking-wide text-white group-hover:text-cyan-200 leading-tight truncate">
            {t.openLibrary}
          </span>
        </div>
      </div>
      <span className="px-1.5 py-0.5 rounded-md bg-cyan-400 text-slate-950 font-mono text-[10px] font-black shadow-sm shrink-0">
        C
      </span>
    </button>
  );
});

const TopRightHUDStack = memo(function TopRightHUDStack() {
  const scene = useGameStore((s) => s.scene);

  return (
    <div
      className={`fixed right-3 sm:right-6 z-30 flex flex-col items-end gap-2 w-48 sm:w-56 pointer-events-none ${
        scene === 'space' ? 'top-[132px] sm:top-[118px]' : 'top-[62px] sm:top-[82px]'
      }`}
    >
      <AstronautLifeSupportHUD />
      <StoryTopRightActionButtons />
      <VehicleDriveHUD />
      <TopRightComputerLibraryButton />
      <EarthLaunchHUD />
    </div>
  );
});

// ---------------------------------------------------------------------------
export function Game() {
  const [actionRequested, setActionRequested] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCharacterMenu, setShowCharacterMenu] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  const inventory = useGameStore((state) => state.inventory);
  const recentCollectedItem = useGameStore((state) => state.recentCollectedItem);
  const clearRecentCollectedItem = useGameStore((state) => state.clearRecentCollectedItem);
  const backpackLimitAlert = useGameStore((state) => state.backpackLimitAlert);
  const clearBackpackLimitAlert = useGameStore((state) => state.clearBackpackLimitAlert);

  const targetFps = useGameStore((state) => state.targetFps);
  const setTargetFps = useGameStore((state) => state.setTargetFps);
  const characterGender = useGameStore((state) => state.characterGender);
  const setCharacterGender = useGameStore((state) => state.setCharacterGender);
  const visorMode = useGameStore((state) => state.visorMode);
  const setVisorMode = useGameStore((state) => state.setVisorMode);
  const suitStyle = useGameStore((state) => state.suitStyle);
  const setSuitStyle = useGameStore((state) => state.setSuitStyle);
  const language = useGameStore((state) => state.language);
  const setLanguage = useGameStore((state) => state.setLanguage);
  const gameMusicTrack = useGameStore((state) => state.gameMusicTrack);
  const setGameMusicTrack = useGameStore((state) => state.setGameMusicTrack);
  const menuMusicTrack = useGameStore((state) => state.menuMusicTrack);
  const setMenuMusicTrack = useGameStore((state) => state.setMenuMusicTrack);
  const explorationWithCompanion = useGameStore((state) => state.explorationWithCompanion);
  const setExplorationWithCompanion = useGameStore((state) => state.setExplorationWithCompanion);
  const musicVolume = useGameStore((state) => state.musicVolume);
  const setMusicVolume = useGameStore((state) => state.setMusicVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const setSfxVolume = useGameStore((state) => state.setSfxVolume);
  const toggleHabitatDoor = useGameStore((state) => state.toggleHabitatDoor);

  const appStage = useGameStore((state) => state.appStage);
  const scene = useGameStore((state) => state.scene);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const currentPlanet = PLANETS[planetIndex] || PLANETS[0];
  const gravity = useGameStore((state) => state.gravity);
  const health = useGameStore((state) => state.health);
  const oxygen = useGameStore((state) => state.oxygen);

  const t = UI_TEXT[language];

  const [dbState, setDbState] = useState<{ isReady: boolean; storageType: string; lastSaved: string | null }>({
    isReady: false,
    storageType: 'indexeddb',
    lastSaved: null,
  });
  const [dbHydrated, setDbHydrated] = useState(false);

  const handleAction = useCallback((action: string) => {
    setActionRequested(action);
    if (action === 'collect') {
      window.dispatchEvent(new CustomEvent('astronavega-collect'));
    }
    setTimeout(() => setActionRequested(null), 100);
  }, []);

  // Initialize and hydrate state from client-side IndexedDB database (Apply 85% music / 5% SFX default migration once)
  useEffect(() => {
    initGameDatabase().then(async () => {
      const status = getDatabaseStatus();
      setDbState(status);
      const saved = await loadGameStateFromDB();
      if (saved) {
        if (saved.suitStyle) setSuitStyle(saved.suitStyle as 'white' | 'orange' | 'carbon');
        if (saved.characterGender) setCharacterGender(saved.characterGender as 'male' | 'female');
        if (saved.visorMode) setVisorMode(saved.visorMode as 'transparent' | 'gold');
        if (saved.language === 'pt' || saved.language === 'en') setLanguage(saved.language);
        if (saved.targetFps === 20 || saved.targetFps === 30 || saved.targetFps === 40 || saved.targetFps === 60) {
          setTargetFps(saved.targetFps);
        }
        if (typeof saved.explorationWithCompanion === 'boolean') {
          setExplorationWithCompanion(saved.explorationWithCompanion);
        }
        if (
          saved.menuMusicTrack === 'beethoven_op68' ||
          saved.menuMusicTrack === 'epic' ||
          saved.menuMusicTrack === 'orbital' ||
          saved.menuMusicTrack === 'tactical' ||
          saved.menuMusicTrack === 'none'
        ) {
          setMenuMusicTrack(saved.menuMusicTrack);
        }
        if (
          saved.gameMusicTrack === 'beethoven_op68' ||
          saved.gameMusicTrack === 'epic' ||
          saved.gameMusicTrack === 'orbital' ||
          saved.gameMusicTrack === 'tactical' ||
          saved.gameMusicTrack === 'none'
        ) {
          setGameMusicTrack(saved.gameMusicTrack);
        }
        if (saved.audioDefaultsVersion === 2) {
          if (typeof saved.musicVolume === 'number') {
            setMusicVolume(saved.musicVolume);
            setMusicVolumeLevel(saved.musicVolume);
          }
          if (typeof saved.sfxVolume === 'number') {
            setSfxVolume(saved.sfxVolume);
            setSfxVolumeLevel(saved.sfxVolume);
          }
        } else {
          // Enforce new 85% music / 5% SFX defaults for pre-existing saves
          setMusicVolume(0.85);
          setMusicVolumeLevel(0.85);
          setSfxVolume(0.05);
          setSfxVolumeLevel(0.05);
        }
      } else {
        setMusicVolumeLevel(0.85);
        setSfxVolumeLevel(0.05);
      }
      setDbHydrated(true);
    });
  }, [
    setSuitStyle,
    setCharacterGender,
    setVisorMode,
    setLanguage,
    setTargetFps,
    setExplorationWithCompanion,
    setMenuMusicTrack,
    setGameMusicTrack,
    setMusicVolume,
    setSfxVolume,
  ]);

  // Auto-save changes to client-side database quietly in background (after initial hydration completes)
  useEffect(() => {
    if (!dbHydrated) return;
    saveGameStateToDB({
      suitStyle,
      characterGender,
      visorMode,
      targetFps,
      planetIndex,
      language,
      menuMusicTrack,
      gameMusicTrack,
      explorationWithCompanion,
      musicVolume,
      sfxVolume,
      audioDefaultsVersion: 2,
    }).then(() => {
      setDbState(getDatabaseStatus());
    });
  }, [
    dbHydrated,
    suitStyle,
    characterGender,
    visorMode,
    targetFps,
    planetIndex,
    language,
    menuMusicTrack,
    gameMusicTrack,
    explorationWithCompanion,
    musicVolume,
    sfxVolume,
  ]);

  const handleManualSave = useCallback(async () => {
    await saveGameStateToDB({
      suitStyle,
      characterGender,
      visorMode,
      targetFps,
      planetIndex,
      language,
      menuMusicTrack,
      gameMusicTrack,
      explorationWithCompanion,
      musicVolume,
      sfxVolume,
      audioDefaultsVersion: 2,
      health,
      oxygen,
    });
    setDbState(getDatabaseStatus());
  }, [
    suitStyle,
    characterGender,
    visorMode,
    targetFps,
    planetIndex,
    language,
    menuMusicTrack,
    gameMusicTrack,
    explorationWithCompanion,
    musicVolume,
    sfxVolume,
    health,
    oxygen,
  ]);

  useEffect(() => {
    if (appStage !== 'playing') return;
    const isHostile = currentPlanet.type === 'mars' || currentPlanet.type === 'venus' || currentPlanet.type === 'exoplanet';
    updateAudio(isHostile, gravity);
  }, [appStage, planetIndex, gravity, currentPlanet.type]);

  // Silence all ocean, machinery, and ambient audio until playing stage starts (after video finishes or skips)
  useEffect(() => {
    if (appStage !== 'playing') {
      setAudioEnvironment('silent', 0);
      return;
    }
    setAudioEnvironment(scene, planetIndex);
  }, [appStage, scene, planetIndex]);

  // Switch between Opening/Menu Music, Story Video Silence, and In-Game Selected Music
  useEffect(() => {
    if (appStage === 'mode_select') {
      setMusicMode(menuMusicTrack === 'none' ? 'silent' : menuMusicTrack);
    } else if (appStage === 'story_video') {
      setMusicMode('silent');
    } else {
      setMusicMode(gameMusicTrack === 'none' ? 'silent' : gameMusicTrack);
    }
  }, [appStage, gameMusicTrack, menuMusicTrack]);

  // Auto-dismiss item pickup toast
  useEffect(() => {
    if (recentCollectedItem) {
      const timer = setTimeout(() => {
        clearRecentCollectedItem();
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [recentCollectedItem, clearRecentCollectedItem]);

  // Auto-dismiss backpack capacity/expansion toast
  useEffect(() => {
    if (backpackLimitAlert) {
      const timer = setTimeout(() => {
        clearBackpackLimitAlert();
      }, 3400);
      return () => clearTimeout(timer);
    }
  }, [backpackLimitAlert, clearBackpackLimitAlert]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.key === 'V') {
        const currentVisor = useGameStore.getState().visorMode;
        useGameStore.getState().setVisorMode(currentVisor === 'transparent' ? 'gold' : 'transparent');
      }
      // Key R: Enter/Exit Car OR Board Rocket when close to it!
      if (e.key === 'r' || e.key === 'R') {
        const state = useGameStore.getState();
        const lt = UI_TEXT[state.language];
        if (state.drivingCarId || state.nearCarId) {
          state.toggleDriveCar();
        } else if (state.isNearRocket && !state.isLaunching) {
          if (state.planetIndex === 0) {
            if (state.gameMode === 'story' && !state.hasSpacesuit) {
              state.setLaunchFailureMsg(lt.needSuitBeforeRocket);
              return;
            }
            if (state.rocketFuel <= 0) {
              state.setLaunchFailureMsg(lt.noFuelHoldPanel);
              return;
            }
            const f = state.rocketFuel;
            state.setLaunchFailureMsg(null);
            state.setLaunchTelemetry({
              countdown: 5,
              fuel: Math.round(f),
              speed: 0,
              altitude: 0,
              weightTons: Math.round(420 + f * 25.5),
              status: 'countdown',
            });
          }
          state.setLaunching(true);
        }
      }
      // Key B: Collect resources
      if (e.key === 'b' || e.key === 'B') {
        handleAction('collect');
      }
      // Key E: Toggle Hangar Door (Earth) or Oxygen Chamber (Other Planets)
      if (e.key === 'e' || e.key === 'E') {
        const st = useGameStore.getState();
        if (st.planetIndex === 0) {
          toggleHabitatDoor();
        } else {
          st.toggleOxygenChamber();
        }
      }
      // Key I: Toggle Survival Backpack Inventory
      if (e.key === 'i' || e.key === 'I') {
        setShowInventory((prev) => !prev);
      }
      // Key C: Open/Close Scientific Book Library when near Computer/Supercomputer (or toggle if already open)
      if (e.key === 'c' || e.key === 'C') {
        const state = useGameStore.getState();
        if (state.isComputerLibraryOpen) {
          state.setComputerLibraryOpen(false);
        } else if (state.isNearComputer) {
          state.setComputerLibraryOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleHabitatDoor, handleAction]);

  if (appStage === 'mode_select') {
    return <ModeSelectionScreen />;
  }

  if (appStage === 'story_video') {
    return <StoryVideoPlayerScreen />;
  }

  return (
    <div className="w-full h-screen relative bg-[#050505] overflow-hidden select-none" onClick={() => initAudio()}>
      {/* 3D Canvas completely isolated from 2D HUD state updates */}
      <GameCanvas actionRequested={actionRequested} handleAction={handleAction} />

      {/* 2D HUD overlays */}
      <CrosshairOverlay />
      <HUDHeader />
      <StoryMissionHUD />
      <SpaceFlightHUD />
      <HazardExposureAlert />
      <LifeSupportCriticalAlert />
      <MissionControlCenterView />
      <ComputerBookLibraryModal />

      {/* Action Buttons (Bottom Right) */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-4 pointer-events-none">
        <DesktopActionButtons onAction={handleAction} />
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 pointer-events-auto flex items-center gap-2 z-20">
        <button
          onClick={() => {
            setShowCharacterMenu(!showCharacterMenu);
            if (showSettings) setShowSettings(false);
          }}
          className={`p-2 sm:p-3 rounded-2xl backdrop-blur-md border transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer active:scale-95 ${
            showCharacterMenu
              ? 'bg-blue-600/80 border-blue-400 text-white shadow-lg shadow-blue-500/25'
              : 'bg-black/50 hover:bg-black/70 border-white/10 text-white'
          }`}
          title={t.astronautBtnTitle}
        >
          <User className="w-5 h-5 text-blue-400" />
          <span className="hidden sm:inline">{t.astronautBtn}</span>
        </button>

        <button
          onClick={() => {
            setShowSettings(!showSettings);
            if (showCharacterMenu) setShowCharacterMenu(false);
          }}
          className={`p-2 sm:p-3 rounded-2xl backdrop-blur-md border transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
            showSettings
              ? 'bg-cyan-600/80 border-cyan-400 text-white shadow-lg shadow-cyan-500/25'
              : 'bg-black/50 hover:bg-black/70 border-white/10 text-white'
          }`}
          title={t.settingsBtnTitle}
        >
          <Settings className="w-5 h-5 text-slate-200" />
          <span className="text-[11px] font-mono text-cyan-300 font-bold hidden sm:inline">
            {`${targetFps} FPS`}
          </span>
        </button>
      </div>

      {/* Top-Right Stack directly under Life Support on Surface, or cleanly below Capsule Monitoring HUD in Space */}
      <TopRightHUDStack />

      {/* Mobile-Optimized Fullscreen Modal Dialogs with Backdrop Blur */}
      {showCharacterMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto animate-in fade-in"
          onClick={() => setShowCharacterMenu(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <CharacterCustomizationModal onClose={() => setShowCharacterMenu(false)} />
          </div>
        </div>
      )}

      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto animate-in fade-in"
          onClick={() => setShowSettings(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <SettingsModal onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}

      {/* Inventory Survival Backpack Modal */}
      {showInventory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto animate-in fade-in"
          onClick={() => setShowInventory(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
            <InventoryModal onClose={() => setShowInventory(false)} />
          </div>
        </div>
      )}

      {/* Real-time Field Resource Collection Toast */}
      {recentCollectedItem && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 bg-slate-900/95 backdrop-blur-xl border border-amber-400/60 px-4 py-2.5 rounded-2xl shadow-2xl text-white">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
                {t.resourceCollected}
              </span>
              <span className="text-xs font-bold text-slate-100">
                +{recentCollectedItem.amount}{' '}
                {(() => {
                  const def = RESOURCE_DEFINITIONS[recentCollectedItem.id];
                  return def ? getLocalizedResourceDef(def, language).name : recentCollectedItem.name;
                })()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Backpack Capacity / Expansion Alert Toast */}
      {backpackLimitAlert && (
        <div className="fixed top-36 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-3 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-2xl border ${
              backpackLimitAlert.reason === 'expanded'
                ? 'bg-emerald-950/95 border-emerald-400/75 text-emerald-100'
                : 'bg-rose-950/95 border-rose-400/75 text-rose-100'
            }`}
          >
            {backpackLimitAlert.reason === 'expanded' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="text-xs font-bold">
              {backpackLimitAlert.reason === 'expanded'
                ? t.backpackExpandedToast
                : backpackLimitAlert.reason === 'weight'
                ? t.backpackLimitWeight
                : backpackLimitAlert.reason === 'slots'
                ? t.backpackLimitSlots
                : t.backpackLimitStack}
            </span>
          </div>
        </div>
      )}

      {/* Alert Notifications */}
      <WaterImmersionAlert />
      <VABDoorAlert />

      {/* Desktop Controls Guide */}
      <DesktopControlsGuide />

      {/* Tactical Survival Backpack Button (Above Left Joystick / Driving Pad on Mobile, Bottom-Left on PC) */}
      <div className="absolute bottom-[226px] left-5 sm:bottom-[246px] sm:left-9 lg:bottom-6 lg:left-6 z-30 pointer-events-auto select-none">
        <button
          onClick={() => {
            setShowInventory(!showInventory);
            if (showSettings) setShowSettings(false);
            if (showCharacterMenu) setShowCharacterMenu(false);
          }}
          className={`relative p-3.5 sm:p-4 rounded-2xl backdrop-blur-xl border transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xl group ${
            showInventory
              ? 'bg-amber-500/90 border-amber-300 text-slate-950 shadow-amber-500/40 ring-2 ring-amber-400'
              : 'bg-slate-900/85 hover:bg-slate-800/90 border-amber-400/50 hover:border-amber-400 text-amber-400 shadow-black/60'
          }`}
          title={t.survivalBackpack}
        >
          <Briefcase className={`w-6 h-6 transition-transform group-hover:scale-110 ${showInventory ? 'text-slate-950' : 'text-amber-400'}`} />
          
          {/* Badge showing total items in backpack */}
          {Object.values(inventory).some((v) => v > 0) && (
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-slate-950 border border-amber-200 shadow-md animate-in zoom-in">
              {Object.values(inventory).reduce((acc, curr) => acc + curr, 0)}
            </span>
          )}
          
          {/* Quick Tactical Tooltip on Desktop */}
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-white/10 text-[10px] font-mono text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:inline-block">
            {t.backpackTooltip}
          </span>
        </button>
      </div>

      {/* Ergonomic Flight & Surface Virtual Analog Joystick (Hidden on PC Mode via lg:hidden) */}
      <div className="absolute bottom-[72px] left-4 sm:bottom-[76px] sm:left-8 z-30 pointer-events-auto select-none lg:hidden">
        <Joystick />
      </div>

      {/* Ergonomic Touch Action Buttons: Jump/Swim, Doors, Run (Elevated ~74px from bottom to clear mobile browser bar) */}
      <div className="absolute bottom-[72px] right-4 sm:bottom-[76px] sm:right-8 z-30 pointer-events-auto select-none lg:hidden">
        <MobileActionControls />
      </div>
    </div>
  );
}
