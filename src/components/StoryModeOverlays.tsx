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
  Settings,
  Gauge,
  Music,
  Users,
  User,
  X,
} from 'lucide-react';
import { useGameStore, GameMusicTrack } from '../store';
import {
  initAudio,
  speakMissionTip,
  stopMissionVoice,
  playSuitEquipSound,
  playFlagPlantSound,
  setMusicMode,
  setMusicVolumeLevel,
  setSfxVolumeLevel,
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
  const menuMusicTrack = useGameStore((s) => s.menuMusicTrack);
  const setMenuMusicTrack = useGameStore((s) => s.setMenuMusicTrack);
  const targetFps = useGameStore((s) => s.targetFps);
  const setTargetFps = useGameStore((s) => s.setTargetFps);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const setMusicVolume = useGameStore((s) => s.setMusicVolume);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const setSfxVolume = useGameStore((s) => s.setSfxVolume);
  const explorationWithCompanion = useGameStore((s) => s.explorationWithCompanion);
  const setExplorationWithCompanion = useGameStore((s) => s.setExplorationWithCompanion);

  const [selectedHero, setSelectedHero] = useState<'male' | 'female'>(initialGender);
  const [mobileModeTab, setMobileModeTab] = useState<'story' | 'exploration'>('story');
  const [menuAudioOn, setMenuAudioOn] = useState(() => isAudioActive());
  const [showModeSettings, setShowModeSettings] = useState(false);

  const t = UI_TEXT[language];

  const getActiveMenuTrackLabel = (track: GameMusicTrack) => {
    switch (track) {
      case 'beethoven_op68':
        return t.menuSuspenseAudio;
      case 'epic':
        return t.musicTrackEpic;
      case 'tactical':
        return t.musicTrackTactical;
      case 'orbital':
        return t.musicTrackOrbital;
      case 'none':
        return t.musicTrackNone;
    }
  };

  // Start selected opening/menu soundtrack in Mode Selection (unlocks immediately on first pointer/key gesture)
  useEffect(() => {
    const activeTrack = menuMusicTrack === 'none' ? 'silent' : menuMusicTrack;
    setMusicMode(activeTrack);
    initAudio();

    const unlockMenuAudio = () => {
      const st = useGameStore.getState();
      if (st.appStage !== 'mode_select') return;
      initAudio();
      setMusicMode(st.menuMusicTrack === 'none' ? 'silent' : st.menuMusicTrack);
    };
    window.addEventListener('pointerdown', unlockMenuAudio, { once: true });
    window.addEventListener('keydown', unlockMenuAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockMenuAudio);
      window.removeEventListener('keydown', unlockMenuAudio);
    };
  }, [menuMusicTrack]);

  return (
    <div className="fixed inset-0 z-50 bg-[#060911] text-slate-100 flex flex-col items-center justify-start md:justify-center px-3 pt-3 pb-4 sm:p-6 md:p-8 overflow-y-auto select-none">
      {/* Subtle deep-space ambient gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 20% 15%, rgba(30, 64, 175, 0.24), transparent 45%), radial-gradient(circle at 80% 85%, rgba(180, 83, 9, 0.16), transparent 45%)',
        }}
      />

      <div className="relative z-10 w-full max-w-4xl flex flex-col gap-3 sm:gap-5 md:my-auto">
        {/* Institutional Header (Compact on mobile so nothing clips, full on desktop) */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4 border-b border-white/10 pb-3 sm:pb-4">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/ggpen_logo.jpg"
                alt="GGPEN"
                className="h-8 sm:h-10 w-auto rounded-lg object-contain border border-white/15 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[11px] font-mono uppercase tracking-[0.18em] sm:tracking-[0.22em] text-amber-400 font-bold truncate">
                  {t.nationalProgram}
                </p>
                <h1 className="text-base sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight truncate">
                  {t.simTitle}
                </h1>
              </div>
            </div>

            {/* Mobile Quick Language Toggle beside title */}
            <div className="flex md:hidden items-center gap-0.5 bg-slate-900/90 border border-white/15 rounded-xl p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setLanguage('pt')}
                className={`min-h-[36px] px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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
                className={`min-h-[36px] px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 sm:gap-2.5">
            {/* Cabeça Aberta Brand Mark */}
            <div className="flex items-center gap-2 bg-slate-900/75 border border-white/10 rounded-xl px-2.5 py-1.5">
              <img
                src="/cabeca_aberta_logo.png"
                alt="Cabeça Aberta"
                className="h-5 sm:h-7 w-auto rounded object-contain shrink-0"
              />
              <div className="text-left">
                <p className="text-[11px] sm:text-xs font-bold text-slate-100 leading-tight whitespace-nowrap">
                  Cabeça Aberta
                </p>
                <p className="text-[9px] sm:text-[10px] font-mono tabular-nums text-slate-400 whitespace-nowrap">
                  {targetFps} FPS · {t.brandSubtitle}
                </p>
              </div>
            </div>

            {/* Desktop Language Selector */}
            <div className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-white/15 rounded-xl p-1">
              <Languages className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-0.5" />
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

            <div className="flex items-center gap-2">
              {/* Menu Opening Music Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = toggleAudio();
                  setMenuAudioOn(next);
                  if (next) {
                    setMusicMode(menuMusicTrack === 'none' ? 'silent' : menuMusicTrack);
                    initAudio();
                  }
                }}
                className={`min-h-[38px] sm:min-h-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  menuAudioOn && menuMusicTrack !== 'none'
                    ? 'bg-amber-500/15 border-amber-400/40 text-amber-200 hover:bg-amber-500/25'
                    : 'bg-slate-900/90 border-white/15 text-slate-400 hover:text-white'
                }`}
              >
                {menuAudioOn && menuMusicTrack !== 'none' ? (
                  <Volume2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="truncate max-w-[95px] sm:max-w-[125px]">
                  {menuAudioOn ? getActiveMenuTrackLabel(menuMusicTrack) : t.menuMutedAudio}
                </span>
              </button>

              {/* Scoped Mode Select Settings Button */}
              <button
                type="button"
                onClick={() => setShowModeSettings(true)}
                className="min-h-[38px] sm:min-h-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/35 text-cyan-200 text-[11px] font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                title={t.modeSettingsTitle}
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{t.modeSettingsBtn}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Mode Switcher Tabs (< 768px): keeps mobile Mode Selection cleanly within 1 screen */}
        <div
          role="tablist"
          className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/95 border border-white/15 rounded-2xl md:hidden"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileModeTab === 'story'}
            onClick={() => setMobileModeTab('story')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              mobileModeTab === 'story'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Rocket className="w-4 h-4 shrink-0" />
            <span className="truncate">{t.storyModeTitle}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileModeTab === 'exploration'}
            onClick={() => setMobileModeTab('exploration')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              mobileModeTab === 'exploration'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span className="truncate">{t.explorationModeTitle}</span>
          </button>
        </div>

        {/* Mode Cards Grid (Single Active Tab on Mobile, 2 Side-by-Side Columns on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Card 1: Story Mode */}
          <section
            className={`${
              mobileModeTab === 'story' ? 'flex' : 'hidden md:flex'
            } bg-[#0b1120] border border-amber-500/40 rounded-2xl p-4 sm:p-6 flex-col justify-between gap-4 sm:gap-5 shadow-2xl`}
          >
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 sm:p-3 rounded-xl bg-amber-500/15 border border-amber-400/35 text-amber-300 shrink-0">
                    <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                    {t.storyModeTitle}
                  </h2>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 shrink-0">
                  {t.officialCampaign}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t.storyModeDescPrefix}
                <strong className="text-amber-300">{t.storyModeHighlight}</strong>
                {t.storyModeDescSuffix}
              </p>

              {/* Protagonist Selector */}
              <div className="flex flex-col gap-1.5 sm:gap-2 pt-0.5">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  {t.chooseHero}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedHero('male')}
                    className={`min-h-[60px] p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedHero === 'male'
                        ? 'bg-blue-600/25 border-blue-400 text-white'
                        : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] font-mono uppercase text-blue-300 font-bold">{t.commander}</span>
                      {selectedHero === 'male' && <UserCheck className="w-3.5 h-3.5 text-blue-300" />}
                    </div>
                    <p className="text-xs sm:text-sm font-bold mt-0.5 truncate">Tenente Manuel</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{t.anaFollows}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedHero('female')}
                    className={`min-h-[60px] p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedHero === 'female'
                        ? 'bg-cyan-600/25 border-cyan-400 text-white'
                        : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] font-mono uppercase text-cyan-300 font-bold">{t.specialist}</span>
                      {selectedHero === 'female' && <UserCheck className="w-3.5 h-3.5 text-cyan-300" />}
                    </div>
                    <p className="text-xs sm:text-sm font-bold mt-0.5 truncate">Ana Mequiese</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{t.manuelFollows}</p>
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
              className="w-full min-h-[46px] py-3 sm:py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{t.startStoryBtn}</span>
            </button>
          </section>

          {/* Card 2: Exploration Mode */}
          <section
            className={`${
              mobileModeTab === 'exploration' ? 'flex' : 'hidden md:flex'
            } bg-[#0b1120] border border-cyan-500/30 rounded-2xl p-4 sm:p-6 flex-col justify-between gap-4 sm:gap-5 shadow-2xl`}
          >
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 sm:p-3 rounded-xl bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 shrink-0">
                    <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                    {t.explorationModeTitle}
                  </h2>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 shrink-0">
                  {t.freeSandbox}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t.explorationModeDesc}
              </p>

              <div className="bg-slate-900/80 border border-white/10 rounded-xl p-2.5 sm:p-3.5 flex flex-col gap-1 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-cyan-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t.immediateAccessTitle}</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-6 leading-snug">
                  {t.immediateAccessSub}
                </p>
              </div>

              {/* Companion vs Solo Toggle */}
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  {t.explorationCompanionLabel}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExplorationWithCompanion(true)}
                    className={`min-h-[60px] p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      explorationWithCompanion
                        ? 'bg-cyan-600/25 border-cyan-400 text-white'
                        : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Users className={`w-4 h-4 ${explorationWithCompanion ? 'text-cyan-300' : 'text-slate-400'}`} />
                      {explorationWithCompanion && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />}
                    </div>
                    <p className="text-xs font-bold mt-1">{t.withCompanionBtn}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{t.withCompanionSub}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExplorationWithCompanion(false)}
                    className={`min-h-[60px] p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !explorationWithCompanion
                        ? 'bg-amber-600/25 border-amber-400 text-white'
                        : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <User className={`w-4 h-4 ${!explorationWithCompanion ? 'text-amber-300' : 'text-slate-400'}`} />
                      {!explorationWithCompanion && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
                    </div>
                    <p className="text-xs font-bold mt-1">{t.soloExploreBtn}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{t.soloExploreSub}</p>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                initAudio();
                startExplorationMode();
              }}
              className="w-full min-h-[46px] py-3 sm:py-3.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Compass className="w-4 h-4" />
              <span>{t.startExplorationBtn}</span>
            </button>
          </section>
        </div>
      </div>

      {/* Scoped Mode Select Settings Modal: strictly FPS, Opening/Menu Music, and Volume Mix */}
      {showModeSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setShowModeSettings(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900/95 p-5 rounded-3xl backdrop-blur-2xl border border-cyan-500/40 text-white w-full max-w-sm flex flex-col gap-4 shadow-2xl max-h-[88vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                    {t.modeSettingsTitle}
                  </h3>
                  <span className="text-[10px] text-cyan-300 font-mono">{t.modeSettingsSub}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModeSettings(false)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                title={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Frame Rate Selection (20, 30, 40, 60 FPS) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">{t.frameRateLabel}</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold tabular-nums bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/30">
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
                {(
                  [
                    { fps: 20, sub: t.maxBattery, active: 'bg-rose-600/40 border-rose-400 text-white font-bold shadow-md shadow-rose-500/20', subColor: 'text-rose-300' },
                    { fps: 30, sub: t.economical, active: 'bg-amber-600/40 border-amber-400 text-white font-bold shadow-md shadow-amber-500/20', subColor: 'text-amber-300' },
                    { fps: 40, sub: t.balanced, active: 'bg-cyan-600/40 border-cyan-400 text-white font-bold shadow-md shadow-cyan-500/20', subColor: 'text-cyan-300' },
                    { fps: 60, sub: t.smooth, active: 'bg-emerald-600/40 border-emerald-400 text-white font-bold shadow-md shadow-emerald-500/20', subColor: 'text-emerald-300' },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.fps}
                    type="button"
                    onClick={() => setTargetFps(preset.fps)}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center cursor-pointer ${
                      targetFps === preset.fps
                        ? preset.active
                        : 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold tabular-nums">{preset.fps} FPS</span>
                    <span className={`text-[9px] ${preset.subColor} font-medium`}>{preset.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Opening & Menu Music Selector (5 tracks including Beethoven Op. 68) */}
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.menuMusicLabel}</span>
              </span>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: 'beethoven_op68',
                      label: t.musicTrackBeethovenOp68,
                      sub: t.musicTrackBeethovenOp68Sub,
                      activeClass: 'bg-amber-600/35 border-amber-400 text-white shadow-md shadow-amber-500/20',
                      spanFull: true,
                    },
                    {
                      id: 'epic',
                      label: t.musicTrackEpic,
                      sub: t.musicTrackEpicSub,
                      activeClass: 'bg-cyan-600/35 border-cyan-400 text-white shadow-md shadow-cyan-500/20',
                      spanFull: false,
                    },
                    {
                      id: 'tactical',
                      label: t.musicTrackTactical,
                      sub: t.musicTrackTacticalSub,
                      activeClass: 'bg-orange-600/35 border-orange-400 text-white shadow-md shadow-orange-500/20',
                      spanFull: false,
                    },
                    {
                      id: 'orbital',
                      label: t.musicTrackOrbital,
                      sub: t.musicTrackOrbitalSub,
                      activeClass: 'bg-indigo-600/35 border-indigo-400 text-white shadow-md shadow-indigo-500/20',
                      spanFull: false,
                    },
                    {
                      id: 'none',
                      label: t.musicTrackNone,
                      sub: t.musicTrackNoneSub,
                      activeClass: 'bg-rose-600/35 border-rose-400 text-white shadow-md shadow-rose-500/20',
                      spanFull: false,
                    },
                  ] as const
                ).map((opt) => {
                  const isSelected = menuMusicTrack === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        initAudio();
                        setMenuMusicTrack(opt.id as GameMusicTrack);
                        setMusicMode(opt.id === 'none' ? 'silent' : opt.id);
                        setMenuAudioOn(isAudioActive());
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

            {/* Audio Mix Sliders */}
            <div className="flex flex-col gap-2.5 bg-slate-800/60 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.audioVolumesLabel}</span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">{t.musicVolumeLabel}</span>
                  <span className="font-mono font-bold tabular-nums text-cyan-300">{Math.round(musicVolume * 100)}%</span>
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

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">{t.sfxVolumeLabel}</span>
                  <span className="font-mono font-bold tabular-nums text-emerald-300">{Math.round(sfxVolume * 100)}%</span>
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

            <button
              type="button"
              onClick={() => setShowModeSettings(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              {t.closeSettings}
            </button>
          </div>
        </div>
      )}
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
  const isControlsTutorialOpen = useGameStore((s) => s.isControlsTutorialOpen);
  const isUiModalOpen = useGameStore((s) => s.isUiModalOpen);
  const language = useGameStore((s) => s.language);
  const t = UI_TEXT[language];

  const lastSpokenKeyRef = useRef<string | null>(null);
  const prevPlantedRef = useRef<boolean>(false);

  // Trigger localized voice tip on every Story Mode stage transition (wait until initial tutorial closes)
  useEffect(() => {
    if (appStage !== 'playing' || gameMode !== 'story') {
      lastSpokenKeyRef.current = null;
      return;
    }
    if (isControlsTutorialOpen || isUiModalOpen) {
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
  }, [appStage, gameMode, storyStep, language, isControlsTutorialOpen, isUiModalOpen]);

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
        if (st.isUiModalOpen || st.isControlsTutorialOpen) return;
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
  const hideOnMissionComplete = storyStep === 'mission_complete';

  return (
    <>
      {/* Mobile: Top-Left above Backpack/Joystick; Desktop: Top-Center */}
      {!hideBannerOnSpaceStaging && !hideOnMissionComplete && currentObj && (
        <div className="fixed top-[74px] left-2.5 sm:top-[84px] sm:left-4 z-30 w-[calc(100vw-214px)] max-w-[260px] sm:max-w-sm lg:top-3 lg:left-1/2 lg:-translate-x-1/2 lg:w-[calc(100%-24px)] lg:max-w-md pointer-events-none select-none">
          <div className="pointer-events-auto bg-slate-950/90 border border-amber-400/50 rounded-2xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-xl flex items-center justify-between gap-2 sm:gap-3">
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
