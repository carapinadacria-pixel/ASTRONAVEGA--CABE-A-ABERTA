import React, { useEffect, useRef, useState } from 'react';
import {
  Rocket,
  Compass,
  Play,
  SkipForward,
  Volume2,
  VolumeX,
  ShieldCheck,
  Flag,
  Award,
  CheckCircle2,
  UserCheck,
  Languages,
} from 'lucide-react';
import { useGameStore } from '../store';
import {
  initAudio,
  speakMissionTip,
  stopMissionVoice,
  playSuitEquipSound,
  playFlagPlantSound,
  setMusicMode,
  toggleAudio,
  isAudioActive,
} from '../audio';
import { STORY_OBJECTIVES_I18N, UI_TEXT } from '../utils/i18n';

const STORY_VIDEO_SRC = '/assets/aistudio/fbb4fbaf-5d79-4640-842e-9610084828e1_e8ce97fc.mp4';

export function ModeSelectionScreen() {
  const startExplorationMode = useGameStore((s) => s.startExplorationMode);
  const startStoryVideo = useGameStore((s) => s.startStoryVideo);
  const initialGender = useGameStore((s) => s.characterGender);
  const language = useGameStore((s) => s.language);
  const setLanguage = useGameStore((s) => s.setLanguage);
  const [selectedHero, setSelectedHero] = useState<'male' | 'female'>(initialGender);
  const [menuAudioOn, setMenuAudioOn] = useState(() => isAudioActive());

  const t = UI_TEXT[language];

  // Start menu suspense soundtrack exclusively in Mode Selection (unlocks immediately on first pointer/key gesture)
  useEffect(() => {
    setMusicMode('menu_suspense');
    initAudio();

    const unlockSuspense = () => {
      if (useGameStore.getState().appStage !== 'mode_select') return;
      initAudio();
      setMusicMode('menu_suspense');
    };
    window.addEventListener('pointerdown', unlockSuspense, { once: true });
    window.addEventListener('keydown', unlockSuspense, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockSuspense);
      window.removeEventListener('keydown', unlockSuspense);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#060911] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto select-none">
      {/* Subtle deep-space ambient gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 20% 15%, rgba(30, 64, 175, 0.24), transparent 45%), radial-gradient(circle at 80% 85%, rgba(180, 83, 9, 0.16), transparent 45%)',
        }}
      />

      <div className="relative z-10 w-full max-w-4xl flex flex-col gap-6 my-auto">
        {/* Institutional Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <img src="/ggpen_logo.jpg" alt="GGPEN" className="h-10 w-auto rounded-lg object-contain border border-white/15" />
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-amber-400 font-bold">
                {t.nationalProgram}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {t.simTitle}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
            {/* Cabeça Aberta Brand Mark */}
            <div className="flex items-center gap-2.5 bg-slate-900/75 border border-white/10 rounded-xl px-3 py-1.5">
              <img
                src="/cabeca_aberta_logo.png"
                alt="Cabeça Aberta"
                className="h-7 w-auto rounded object-contain"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-100 leading-tight">Cabeça Aberta</p>
                <p className="text-[10px] font-mono text-slate-400">{t.brandSubtitle}</p>
              </div>
            </div>

            {/* Language Selector (Português / English) */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-white/15 rounded-xl p-1">
              <Languages className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-0.5 hidden sm:inline" />
              <button
                type="button"
                onClick={() => setLanguage('pt')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  language === 'pt'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                PT
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {/* Menu Suspense Music Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = toggleAudio();
                setMenuAudioOn(next);
                if (next) {
                  setMusicMode('menu_suspense');
                  initAudio();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                menuAudioOn
                  ? 'bg-amber-500/15 border-amber-400/40 text-amber-200 hover:bg-amber-500/25'
                  : 'bg-slate-900/90 border-white/15 text-slate-400 hover:text-white'
              }`}
            >
              {menuAudioOn ? <Volume2 className="w-3.5 h-3.5 text-amber-300" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span>{menuAudioOn ? t.menuSuspenseAudio : t.menuMutedAudio}</span>
            </button>
          </div>
        </header>

        {/* Mode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Story Mode */}
          <section className="bg-[#0b1120] border border-amber-500/40 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-2xl">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/35 text-amber-300">
                  <Rocket className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">
                  {t.officialCampaign}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-white tracking-tight">{t.storyModeTitle}</h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  {t.storyModeDescPrefix}
                  <strong className="text-amber-300">{t.storyModeHighlight}</strong>
                  {t.storyModeDescSuffix}
                </p>
              </div>

              {/* Protagonist Selector */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  {t.chooseHero}
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedHero('male')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedHero === 'male'
                        ? 'bg-blue-600/25 border-blue-400 text-white'
                        : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-blue-300 font-bold">{t.commander}</span>
                      {selectedHero === 'male' && <UserCheck className="w-3.5 h-3.5 text-blue-300" />}
                    </div>
                    <p className="text-sm font-bold mt-0.5">Tenente Manuel</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.anaFollows}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedHero('female')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedHero === 'female'
                        ? 'bg-cyan-600/25 border-cyan-400 text-white'
                        : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold">{t.specialist}</span>
                      {selectedHero === 'female' && <UserCheck className="w-3.5 h-3.5 text-cyan-300" />}
                    </div>
                    <p className="text-sm font-bold mt-0.5">Ana Mequiese</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.manuelFollows}</p>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMusicMode('silent');
                startStoryVideo(selectedHero);
              }}
              className="w-full py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{t.startStoryBtn}</span>
            </button>
          </section>

          {/* Card 2: Exploration Mode */}
          <section className="bg-[#0b1120] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-2xl">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-400/35 text-cyan-300">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                  {t.freeSandbox}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-white tracking-tight">{t.explorationModeTitle}</h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  {t.explorationModeDesc}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3.5 flex flex-col gap-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-cyan-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t.immediateAccessTitle}</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-6">
                  {t.immediateAccessSub}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                initAudio();
                startExplorationMode();
              }}
              className="w-full py-3.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Compass className="w-4 h-4" />
              <span>{t.startExplorationBtn}</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

export function StoryVideoPlayerScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishStoryVideo = useGameStore((s) => s.finishStoryVideo);
  const language = useGameStore((s) => s.language);
  const t = UI_TEXT[language];
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    stopMissionVoice();
    setMusicMode('silent');
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = false;
    const playPromise = vid.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Browser blocked unmuted autoplay: fall back to muted playback so video starts immediately
        vid.muted = true;
        setIsMuted(true);
        vid.play().catch(() => {});
      });
    }
  }, []);

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none">
      <video
        ref={videoRef}
        src={STORY_VIDEO_SRC}
        autoPlay
        playsInline
        onEnded={() => finishStoryVideo()}
        className="w-full h-full object-contain bg-black"
      />

      {/* Top Controls Bar */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleMute}
          className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          title={isMuted ? t.unmuteVideo : t.muteVideoTitle}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
          <span>{isMuted ? t.unmuteVideo : t.soundLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => finishStoryVideo()}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg"
        >
          <span>{t.skipVideo}</span>
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Top-Right Mission Action Buttons rendered directly below Life Support HUD
 * so mobile touch controls at the bottom remain 100% unobstructed.
 */
export function StoryTopRightActionButtons() {
  const appStage = useGameStore((s) => s.appStage);
  const gameMode = useGameStore((s) => s.gameMode);
  const scene = useGameStore((s) => s.scene);
  const planetIndex = useGameStore((s) => s.planetIndex);
  const hasSpacesuit = useGameStore((s) => s.hasSpacesuit);
  const isNearSuitTable = useGameStore((s) => s.isNearSuitTable);
  const isNearFlagSpot = useGameStore((s) => s.isNearFlagSpot);
  const isFlagPlantedOnMoon = useGameStore((s) => s.isFlagPlantedOnMoon);
  const equipSpacesuitsAtTable = useGameStore((s) => s.equipSpacesuitsAtTable);
  const plantAngolaFlagOnMoon = useGameStore((s) => s.plantAngolaFlagOnMoon);
  const language = useGameStore((s) => s.language);
  const t = UI_TEXT[language];

  if (appStage !== 'playing' || gameMode !== 'story' || scene !== 'surface') return null;

  const canEquipSuit = planetIndex === 0 && !hasSpacesuit && isNearSuitTable;
  const canPlantFlag = planetIndex === 1 && !isFlagPlantedOnMoon && isNearFlagSpot;

  if (!canEquipSuit && !canPlantFlag) return null;

  return (
    <div className="w-full pointer-events-auto flex flex-col gap-1.5 animate-in fade-in duration-200">
      {canEquipSuit && (
        <button
          type="button"
          onClick={() => {
            initAudio();
            playSuitEquipSound();
            equipSpacesuitsAtTable();
          }}
          className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg border border-emerald-200 flex items-center justify-between gap-2 cursor-pointer"
        >
          <span className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">{t.equipSuitAction}</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-950/20 font-mono text-[10px] shrink-0 hidden lg:inline">
            F
          </span>
        </button>
      )}

      {canPlantFlag && (
        <button
          type="button"
          onClick={() => {
            initAudio();
            plantAngolaFlagOnMoon();
          }}
          className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg border border-amber-200 flex items-center justify-between gap-2 cursor-pointer"
        >
          <span className="flex items-center gap-1.5 truncate">
            <Flag className="w-4 h-4 shrink-0" />
            <span className="truncate">{t.plantFlagAction}</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-950/20 font-mono text-[10px] shrink-0 hidden lg:inline">
            F
          </span>
        </button>
      )}
    </div>
  );
}

export function StoryMissionHUD() {
  const appStage = useGameStore((s) => s.appStage);
  const gameMode = useGameStore((s) => s.gameMode);
  const storyStep = useGameStore((s) => s.storyStep);
  const scene = useGameStore((s) => s.scene);
  const isFlagPlantedOnMoon = useGameStore((s) => s.isFlagPlantedOnMoon);
  const showMissionCompleteBanner = useGameStore((s) => s.showMissionCompleteBanner);
  const dismissMissionCompleteBanner = useGameStore((s) => s.dismissMissionCompleteBanner);
  const language = useGameStore((s) => s.language);
  const t = UI_TEXT[language];

  const lastSpokenKeyRef = useRef<string | null>(null);
  const prevPlantedRef = useRef<boolean>(false);

  // Trigger localized voice tip on every Story Mode stage transition (or language switch)
  useEffect(() => {
    if (appStage !== 'playing' || gameMode !== 'story') {
      lastSpokenKeyRef.current = null;
      return;
    }
    const speakKey = `${storyStep}-${language}`;
    if (lastSpokenKeyRef.current !== speakKey) {
      lastSpokenKeyRef.current = speakKey;
      const tip = STORY_OBJECTIVES_I18N[language][storyStep]?.voiceTip;
      if (tip) {
        const timer = setTimeout(() => {
          speakMissionTip(tip, language);
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [appStage, gameMode, storyStep, language]);

  // Play lunar anchor & mission victory chord once when the flag is planted
  useEffect(() => {
    if (isFlagPlantedOnMoon && !prevPlantedRef.current) {
      playFlagPlantSound();
    }
    prevPlantedRef.current = isFlagPlantedOnMoon;
  }, [isFlagPlantedOnMoon]);

  // Keyboard [F] shortcut for Suit Table and Moon Flag Stand
  useEffect(() => {
    if (appStage !== 'playing' || gameMode !== 'story') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        const st = useGameStore.getState();
        if (st.planetIndex === 0 && !st.hasSpacesuit && st.isNearSuitTable) {
          playSuitEquipSound();
          st.equipSpacesuitsAtTable();
        } else if (st.planetIndex === 1 && !st.isFlagPlantedOnMoon && st.isNearFlagSpot) {
          st.plantAngolaFlagOnMoon();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [appStage, gameMode]);

  if (appStage !== 'playing' || gameMode !== 'story') return null;

  const currentObj = STORY_OBJECTIVES_I18N[language][storyStep];
  const hideBannerOnSpaceStaging = scene === 'space' && storyStep === 'autopilot_to_moon';

  return (
    <>
      {/* Top-Center Mission Objective Banner + Voice Replay Button */}
      {!hideBannerOnSpaceStaging && currentObj && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-24px)] max-w-md pointer-events-none select-none">
          <div className="pointer-events-auto bg-slate-950/90 border border-amber-400/50 rounded-2xl px-3.5 py-2.5 shadow-xl flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-amber-400">
                {currentObj.badge}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white leading-snug">
                {currentObj.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                initAudio();
                speakMissionTip(currentObj.voiceTip, language);
              }}
              className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-amber-300 shrink-0 cursor-pointer active:scale-95"
              title={t.hearVoiceTipTitle}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mission 1 Complete Celebration Modal */}
      {showMissionCompleteBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 pointer-events-auto">
          <div className="w-full max-w-md bg-[#0b1120] border-2 border-amber-400/75 rounded-2xl p-6 text-center text-white shadow-2xl flex flex-col items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-300">
              <Award className="w-9 h-9" />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-amber-400">
                {t.plaqueTitle}
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white">{t.missionCompleteTitle}</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t.missionCompleteDescPrefix}
                <strong className="text-amber-300">{t.missionCompleteFlagName}</strong>
                {t.missionCompleteDescSuffix}
              </p>
            </div>

            <button
              type="button"
              onClick={() => dismissMissionCompleteBanner()}
              className="w-full py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer transition-all"
            >
              {t.continueFreeExplore}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
