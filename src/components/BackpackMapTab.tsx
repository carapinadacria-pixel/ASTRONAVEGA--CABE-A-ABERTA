import React, { useEffect, useMemo, useState } from 'react';
import { Compass, LocateFixed, Maximize2, MapPin, Navigation } from 'lucide-react';
import { useGameStore, PLANETS, livePlayerMotion } from '../store';
import { UI_TEXT } from '../utils/i18n';
import {
  RESOURCE_DEFINITIONS,
  getSurfaceResourceNodes,
  getLocalizedResourceDef,
} from '../utils/nasaData';
import { computeCosmicPlanetPositions } from '../utils/spaceCoordinates';

interface MapInspectorInfo {
  title: string;
  subtitle: string;
  distLabel: string;
  color: string;
}

export const BackpackMapTab = React.memo(function BackpackMapTab() {
  const scene = useGameStore((s) => s.scene);
  const planetIndex = useGameStore((s) => s.planetIndex);
  const planetaryApiVersion = useGameStore((s) => s.planetaryApiVersion);
  const collectedNodeIds = useGameStore((s) => s.collectedWorldNodeIds);
  const spaceFlightData = useGameStore((s) => s.spaceFlightData);
  const language = useGameStore((s) => s.language);
  const gameMode = useGameStore((s) => s.gameMode);
  const isFlagPlantedOnMoon = useGameStore((s) => s.isFlagPlantedOnMoon);

  const t = UI_TEXT[language];
  const currentPlanet = PLANETS[planetIndex] || PLANETS[0];

  // Poll live surface position & facing yaw smoothly while map tab is visible
  const [livePos, setLivePos] = useState<[number, number, number]>(
    () => useGameStore.getState().playerPosition
  );
  const [liveYaw, setLiveYaw] = useState<number>(() => livePlayerMotion.yaw);

  useEffect(() => {
    const id = window.setInterval(() => {
      const st = useGameStore.getState();
      setLivePos([...st.playerPosition] as [number, number, number]);
      setLiveYaw(livePlayerMotion.yaw);
    }, 220);
    return () => window.clearInterval(id);
  }, []);

  const [surfaceZoom, setSurfaceZoom] = useState<'overview' | 'follow'>('overview');
  const [spaceZoom, setSpaceZoom] = useState<'inner' | 'solar' | 'exo'>('solar');
  const [selectedMarker, setSelectedMarker] = useState<MapInspectorInfo | null>(null);

  const uncollectedNodes = useMemo(
    () =>
      getSurfaceResourceNodes(currentPlanet).filter(
        (n) => !collectedNodeIds.includes(n.id)
      ),
    [currentPlanet, collectedNodeIds, planetaryApiVersion]
  );

  const cosmicPlanets = useMemo(() => computeCosmicPlanetPositions(PLANETS), []);

  // ============================================================================
  // 1. SPACE ORBITAL RADAR (WHEN IN SPACE SCENE)
  // ============================================================================
  if (scene === 'space') {
    const viewSize = 360;
    const halfView = viewSize / 2;
    const rangeMeters = spaceZoom === 'inner' ? 10500 : spaceZoom === 'solar' ? 28000 : 40000;
    const scale = (halfView - 16) / rangeMeters;

    const shipX = spaceFlightData.shipPos?.[0] ?? 6200;
    const shipZ = spaceFlightData.shipPos?.[2] ?? 0;
    const shipYawDeg = ((spaceFlightData.shipYaw ?? 0) * 180) / Math.PI;

    const toSvg = (wx: number, wz: number): [number, number] => [
      halfView + wx * scale,
      halfView + wz * scale,
    ];

    const [sx, sy] = toSvg(shipX, shipZ);

    // Match closest target planet for dashed course line
    const targetCosmic = cosmicPlanets.reduce<(typeof cosmicPlanets)[number] | null>((best, p) => {
      if (!best) return p;
      const dBest = Math.hypot(best.pos.x - shipX, best.pos.z - shipZ);
      const dCur = Math.hypot(p.pos.x - shipX, p.pos.z - shipZ);
      return dCur < dBest ? p : best;
    }, null);
    const targetSvg = targetCosmic ? toSvg(targetCosmic.pos.x, targetCosmic.pos.z) : null;

    const orbitRadii = [3550, 5000, 6200, 8400, 14200, 18000, 22000, 25800];

    return (
      <div className="flex flex-col gap-2.5 text-xs">
        {/* Title & Zoom Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-100">{t.spaceRadarTitle}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-white/10">
            {(
              [
                { id: 'inner', label: t.innerSystemBtn },
                { id: 'solar', label: t.solarSystemBtn },
                { id: 'exo', label: t.fullRadarBtn },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setSpaceZoom(btn.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  spaceZoom === btn.id
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Orbital Radar SVG */}
        <div className="relative w-full aspect-square max-h-[250px] mx-auto rounded-2xl bg-[#030712] border border-cyan-500/35 overflow-hidden shadow-inner">
          <svg viewBox={`0 0 ${viewSize} ${viewSize}`} className="w-full h-full">
            <defs>
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
                <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Crosshairs */}
            <line x1={halfView} y1={8} x2={halfView} y2={viewSize - 8} stroke="rgba(56,189,248,0.14)" strokeDasharray="3 3" />
            <line x1={8} y1={halfView} x2={viewSize - 8} y2={halfView} stroke="rgba(56,189,248,0.14)" strokeDasharray="3 3" />

            {/* Cardinal N/S/E/W */}
            <text x={halfView} y={14} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">N</text>
            <text x={halfView} y={viewSize - 6} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">S</text>
            <text x={viewSize - 10} y={halfView + 3} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">E</text>
            <text x={10} y={halfView + 3} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">W</text>

            {/* Planetary Orbit Rings */}
            {orbitRadii.map((r) => {
              const rPx = r * scale;
              if (rPx > halfView + 40) return null;
              return (
                <circle
                  key={`orbit-${r}`}
                  cx={halfView}
                  cy={halfView}
                  r={rPx}
                  fill="none"
                  stroke="rgba(148,163,184,0.16)"
                  strokeWidth={0.8}
                  strokeDasharray="2 4"
                />
              );
            })}

            {/* Asteroid Belt (9,800..12,000m) */}
            {12000 * scale < halfView + 30 && (
              <circle
                cx={halfView}
                cy={halfView}
                r={10900 * scale}
                fill="none"
                stroke="rgba(168,162,158,0.22)"
                strokeWidth={Math.max(3, 2200 * scale)}
                strokeDasharray="1.5 3.5"
              />
            )}

            {/* Central Sun */}
            <circle
              cx={halfView}
              cy={halfView}
              r={Math.max(10, 2100 * scale)}
              fill="url(#sunGlow)"
              className="cursor-pointer"
              onClick={() =>
                setSelectedMarker({
                  title: language === 'en' ? 'Sun (Solar Core)' : 'Sol (Estrela Central)',
                  subtitle: '0 m • T ≈ 5,778 K',
                  distLabel: `${(Math.hypot(shipX, shipZ) / 100).toFixed(1)} km`,
                  color: '#facc15',
                })
              }
            />
            <circle cx={halfView} cy={halfView} r={4.5} fill="#fef08a" pointerEvents="none" />

            {/* Course Line to Closest / Target Planet */}
            {targetSvg && (
              <line
                x1={sx}
                y1={sy}
                x2={targetSvg[0]}
                y2={targetSvg[1]}
                stroke="#38bdf8"
                strokeWidth={1.1}
                strokeDasharray="4 3"
                opacity={0.65}
              />
            )}

            {/* Planets & NASA Exoplanets */}
            {cosmicPlanets.map((p) => {
              const [px, py] = toSvg(p.pos.x, p.pos.z);
              if (px < -10 || px > viewSize + 10 || py < -10 || py > viewSize + 10) return null;
              const dotR = p.type === 'jupiter' || p.type === 'saturn' ? 5.5 : p.type === 'moon' || p.type === 'titan' ? 2.6 : 3.8;
              const distKm = (Math.hypot(p.pos.x - shipX, p.pos.z - shipZ) / 100).toFixed(1);
              return (
                <g
                  key={`radar-planet-${p.id}`}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedMarker({
                      title: p.name,
                      subtitle: `g = ${p.gravity} m/s² • ${p.type.toUpperCase()}`,
                      distLabel: `${distKm} km`,
                      color: p.atmosphereColor,
                    })
                  }
                >
                  {p.hasRings && (
                    <ellipse
                      cx={px}
                      cy={py}
                      rx={dotR + 3.2}
                      ry={dotR * 0.6}
                      fill="none"
                      stroke={p.atmosphereColor}
                      strokeWidth={0.9}
                      opacity={0.75}
                    />
                  )}
                  <circle cx={px} cy={py} r={dotR + 4} fill="transparent" />
                  <circle
                    cx={px}
                    cy={py}
                    r={dotR}
                    fill={p.color || p.atmosphereColor}
                    stroke="#ffffff"
                    strokeWidth={0.7}
                  />
                  {p.type !== 'moon' && p.type !== 'titan' && (
                    <text
                      x={px}
                      y={py - dotR - 3}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="7.5"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {p.name.length > 11 ? `${p.name.slice(0, 10)}…` : p.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Live Spacecraft Directional Arrow */}
            <g transform={`translate(${sx}, ${sy}) rotate(${shipYawDeg})`}>
              <circle cx={0} cy={0} r={10} fill="rgba(34,211,238,0.18)" />
              <polygon
                points="0,-8 5.5,6 0,3 -5.5,6"
                fill="#22d3ee"
                stroke="#083344"
                strokeWidth={1.1}
              />
            </g>
          </svg>
        </div>

        {/* Selected Marker Inspector */}
        <div className="p-2.5 rounded-2xl bg-slate-800/75 border border-white/10 flex items-center justify-between gap-2">
          {selectedMarker ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedMarker.color }} />
                <div className="min-w-0">
                  <div className="font-bold text-slate-100 truncate">{selectedMarker.title}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">{selectedMarker.subtitle}</div>
                </div>
              </div>
              <div className="text-right shrink-0 font-mono">
                <span className="text-[9px] text-slate-400 block">{t.distFromYou}</span>
                <span className="text-xs font-bold text-cyan-300">{selectedMarker.distLabel}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-slate-400 w-full justify-center">
              <Navigation className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{t.tapMarkerHint}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. PLANETARY SURFACE TACTICAL RADAR (EARTH, MOON, MARS, GAS GIANTS, ETC.)
  // ============================================================================
  const svgW = 360;
  const svgH = 300;
  const isEarth = currentPlanet.type === 'earth';
  const isGasGiant = ['jupiter', 'saturn', 'uranus', 'neptune'].includes(currentPlanet.type);

  // Determine bounding box [minX, maxX, minZ, maxZ]
  let minX = -75;
  let maxX = 75;
  let minZ = -75;
  let maxZ = 75;

  if (surfaceZoom === 'follow') {
    const r = 85;
    minX = livePos[0] - r;
    maxX = livePos[0] + r;
    minZ = livePos[2] - r * (svgH / svgW);
    maxZ = livePos[2] + r * (svgH / svgW);
  } else if (isEarth) {
    minX = -65;
    maxX = 335;
    minZ = -215;
    maxZ = 265;
  } else if (isGasGiant) {
    minX = -108;
    maxX = 108;
    minZ = -108;
    maxZ = 108;
  } else {
    minX = -320;
    maxX = 320;
    minZ = -320;
    maxZ = 320;
  }

  const spanX = Math.max(1, maxX - minX);
  const spanZ = Math.max(1, maxZ - minZ);
  const scale = Math.min((svgW - 24) / spanX, (svgH - 24) / spanZ);
  const offsetX = (svgW - spanX * scale) / 2;
  const offsetY = (svgH - spanZ * scale) / 2;

  const toMapX = (wx: number) => offsetX + (wx - minX) * scale;
  const toMapY = (wz: number) => offsetY + (wz - minZ) * scale;

  const playerSvgX = toMapX(livePos[0]);
  const playerSvgY = toMapY(livePos[2]);
  const playerDeg = ((Math.PI - liveYaw) * 180) / Math.PI;

  const baseCoords: Record<string, [number, number]> = {
    moon: [24, -24],
    mercury: [26, 22],
    venus: [26, -22],
    mars: [26, -24],
    titan: [24, -24],
    jupiter: [0, -28],
    saturn: [0, -28],
    uranus: [0, -28],
    neptune: [0, -28],
    exoplanet: [24, -22],
  };
  const offworldBase = baseCoords[currentPlanet.type] || null;

  const landmarks = useMemo(() => {
    const items: Array<{
      id: string;
      label: string;
      x: number;
      z: number;
      color: string;
      kind: 'pad' | 'hangar' | 'lab' | 'cars' | 'flag' | 'base' | 'capsule';
    }> = [];

    if (isEarth) {
      items.push(
        { id: 'lm-pad', label: t.launchPadLabel, x: 0, z: 0, color: '#f97316', kind: 'pad' },
        { id: 'lm-hangar', label: t.hangarSuitLabel, x: 248, z: 12, color: '#eab308', kind: 'hangar' },
        { id: 'lm-lab', label: t.labLabel, x: 245, z: -85, color: '#38bdf8', kind: 'lab' },
        { id: 'lm-cars', label: t.carsLabel, x: 255, z: -135, color: '#a855f7', kind: 'cars' }
      );
    } else {
      items.push({ id: 'lm-capsule', label: t.capsuleMapLabel, x: 0, z: 0, color: '#38bdf8', kind: 'capsule' });
      if (offworldBase) {
        items.push({ id: 'lm-base', label: t.baseLabel, x: offworldBase[0], z: offworldBase[1], color: '#22c55e', kind: 'base' });
      }
      if (currentPlanet.type === 'moon' && gameMode === 'story' && !isFlagPlantedOnMoon) {
        items.push({ id: 'lm-flag', label: t.flagSpotLabel, x: 8, z: 16, color: '#facc15', kind: 'flag' });
      }
    }
    return items;
  }, [isEarth, currentPlanet.type, offworldBase, gameMode, isFlagPlantedOnMoon, t]);

  const terrainBg =
    currentPlanet.type === 'earth'
      ? '#0f291e'
      : currentPlanet.type === 'mars'
      ? '#2b1208'
      : currentPlanet.type === 'venus'
      ? '#261708'
      : currentPlanet.type === 'titan'
      ? '#241409'
      : isGasGiant
      ? '#091526'
      : currentPlanet.type === 'exoplanet'
      ? '#1a0b2e'
      : '#0f172a';

  return (
    <div className="flex flex-col gap-2.5 text-xs">
      {/* Header & Zoom Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-100">
            {t.surfaceMapTitle} • {currentPlanet.name}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setSurfaceZoom('overview')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
              surfaceZoom === 'overview' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3 h-3" />
            {t.zoomOverviewBtn}
          </button>
          <button
            type="button"
            onClick={() => setSurfaceZoom('follow')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
              surfaceZoom === 'follow' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LocateFixed className="w-3 h-3" />
            {t.zoomFollowBtn}
          </button>
        </div>
      </div>

      {/* Interactive Surface Map SVG */}
      <div
        className="relative w-full aspect-[6/5] max-h-[245px] mx-auto rounded-2xl border border-cyan-500/35 overflow-hidden shadow-inner"
        style={{ backgroundColor: terrainBg }}
      >
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((f) => (
            <g key={`grid-${f}`}>
              <line x1={svgW * f} y1={0} x2={svgW * f} y2={svgH} stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
              <line x1={0} y1={svgH * f} x2={svgW} y2={svgH * f} stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
            </g>
          ))}

          {/* Earth Specific Terrain Geography */}
          {isEarth && (
            <>
              {/* Atlantic Ocean X < -20 */}
              <rect
                x={0}
                y={0}
                width={Math.max(0, toMapX(-20))}
                height={svgH}
                fill="#0369a1"
                opacity={0.75}
              />
              {/* Coastal Beach Sand Strip X = -27..-16 */}
              <rect
                x={toMapX(-27)}
                y={0}
                width={Math.max(2, toMapX(-16) - toMapX(-27))}
                height={svgH}
                fill="#d6b87c"
                opacity={0.45}
              />
              {/* Crawlerway Road (X: 10..230, Z: -20..20) */}
              <rect
                x={toMapX(10)}
                y={toMapY(-20)}
                width={Math.max(4, toMapX(230) - toMapX(10))}
                height={Math.max(4, toMapY(20) - toMapY(-20))}
                fill="#44403c"
                stroke="#78716c"
                strokeWidth={0.8}
              />
              {/* VAB Hangar Building Footprint (X: 195..265, Z: -45..45) */}
              <rect
                x={toMapX(195)}
                y={toMapY(-45)}
                width={Math.max(6, toMapX(265) - toMapX(195))}
                height={Math.max(6, toMapY(45) - toMapY(-45))}
                fill="rgba(51,65,85,0.85)"
                stroke="#eab308"
                strokeWidth={1.1}
                rx={2}
              />
              {/* Laboratory Building Footprint (X: 215..275, Z: -105..-65) */}
              <rect
                x={toMapX(215)}
                y={toMapY(-105)}
                width={Math.max(6, toMapX(275) - toMapX(215))}
                height={Math.max(6, toMapY(-65) - toMapY(-105))}
                fill="rgba(14,116,144,0.45)"
                stroke="#38bdf8"
                strokeWidth={1.0}
                rx={2}
              />
              {/* Parking Lot (X: 215..296, Z: -160..-110) */}
              <rect
                x={toMapX(215)}
                y={toMapY(-160)}
                width={Math.max(6, toMapX(296) - toMapX(215))}
                height={Math.max(6, toMapY(-110) - toMapY(-160))}
                fill="rgba(30,41,59,0.8)"
                stroke="#a855f7"
                strokeWidth={0.8}
                rx={2}
              />
            </>
          )}

          {/* Titan Liquid Methane Lake [-50, 50] radius 45 */}
          {currentPlanet.type === 'titan' && (
            <circle
              cx={toMapX(-50)}
              cy={toMapY(50)}
              r={45 * scale}
              fill="#0284c7"
              opacity={0.55}
              stroke="#38bdf8"
              strokeWidth={1}
            />
          )}

          {/* Mars Greenhouse Dome [46, -24] */}
          {currentPlanet.type === 'mars' && (
            <circle
              cx={toMapX(46)}
              cy={toMapY(-24)}
              r={7.2 * scale}
              fill="rgba(34,197,94,0.35)"
              stroke="#4ade80"
              strokeWidth={1}
            />
          )}

          {/* Gas Giant Floating Gantry Deck Perimeter r = 98m */}
          {isGasGiant && (
            <circle
              cx={toMapX(0)}
              cy={toMapY(0)}
              r={98 * scale}
              fill="rgba(51,65,85,0.72)"
              stroke="#eab308"
              strokeWidth={1.5}
            />
          )}

          {/* Uncollected Resource Dots (Rare/Epic/Legendary revealed only within proximity sweep so exploration remains rewarding) */}
          {uncollectedNodes.map((node) => {
            const nx = toMapX(node.position[0]);
            const ny = toMapY(node.position[2]);
            if (nx < -8 || nx > svgW + 8 || ny < -8 || ny > svgH + 8) return null;
            const def = RESOURCE_DEFINITIONS[node.resourceId] || RESOURCE_DEFINITIONS.quartz;
            const loc = getLocalizedResourceDef(def, language);
            const isHaz = def.effectType === 'hazard_radiation' || def.effectType === 'hazard_toxic';
            const distM = Math.round(Math.hypot(livePos[0] - node.position[0], livePos[2] - node.position[2]));
            const isHighRarity = def.rarity === 'rare' || def.rarity === 'epic' || def.rarity === 'legendary';
            const rarityScanRange = isGasGiant ? 42 : 95;
            if (isHighRarity && distM > rarityScanRange) return null;

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onClick={() =>
                  setSelectedMarker({
                    title: `${loc.name} (+${node.yieldAmount})`,
                    subtitle: `X:${Math.round(node.position[0])}m  Z:${Math.round(node.position[2])}m • ${def.formula}`,
                    distLabel: `${distM} m`,
                    color: def.color,
                  })
                }
              >
                {isHaz && <circle cx={nx} cy={ny} r={6} fill="none" stroke="#ef4444" strokeWidth={0.9} opacity={0.8} />}
                {isHighRarity && (
                  <circle cx={nx} cy={ny} r={6.2} fill="none" stroke="#fde047" strokeWidth={1.0} opacity={0.85} />
                )}
                <circle cx={nx} cy={ny} r={7} fill="transparent" />
                <circle cx={nx} cy={ny} r={isHighRarity ? 3.8 : 3.1} fill={def.color} stroke="#020617" strokeWidth={0.9} />
              </g>
            );
          })}

          {/* Primary Landmarks (Launch Pad, Suit Table, Lab, Base, Flag) */}
          {landmarks.map((lm) => {
            const lx = toMapX(lm.x);
            const ly = toMapY(lm.z);
            const distM = Math.round(Math.hypot(livePos[0] - lm.x, livePos[2] - lm.z));
            return (
              <g
                key={lm.id}
                className="cursor-pointer"
                onClick={() =>
                  setSelectedMarker({
                    title: lm.label,
                    subtitle: `X:${Math.round(lm.x)}m  Z:${Math.round(lm.z)}m`,
                    distLabel: `${distM} m`,
                    color: lm.color,
                  })
                }
              >
                <rect x={lx - 5} y={ly - 5} width={10} height={10} rx={2.5} fill={lm.color} stroke="#0f172a" strokeWidth={1.2} />
                <text
                  x={lx}
                  y={ly - 7}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="8.5"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {lm.label}
                </text>
              </g>
            );
          })}

          {/* Live Player Directional Arrow */}
          <g transform={`translate(${playerSvgX}, ${playerSvgY}) rotate(${playerDeg})`}>
            <circle cx={0} cy={0} r={9} fill="rgba(56,189,248,0.22)" />
            <polygon points="0,-7.5 5,5.5 0,2.5 -5,5.5" fill="#22d3ee" stroke="#082f49" strokeWidth={1} />
          </g>

          {/* Compass Rose */}
          <text x={svgW / 2} y={12} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">N</text>
          <text x={svgW / 2} y={svgH - 4} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">S</text>
          <text x={svgW - 8} y={svgH / 2 + 3} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">E</text>
          <text x={8} y={svgH / 2 + 3} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">W</text>
        </svg>
      </div>

      {/* Legend + Tap-to-Inspect Footer */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-[10px] text-slate-300">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
          {t.youLabel} ({Math.round(livePos[0])}, {Math.round(livePos[2])})
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          {t.resourcesLabel}: {uncollectedNodes.length}
        </span>
      </div>

      <div className="p-2.5 rounded-2xl bg-slate-800/75 border border-white/10 flex items-center justify-between gap-2">
        {selectedMarker ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedMarker.color }} />
              <div className="min-w-0">
                <div className="font-bold text-slate-100 truncate">{selectedMarker.title}</div>
                <div className="text-[10px] font-mono text-slate-400 truncate">{selectedMarker.subtitle}</div>
              </div>
            </div>
            <div className="text-right shrink-0 font-mono">
              <span className="text-[9px] text-slate-400 block">{t.distFromYou}</span>
              <span className="text-xs font-bold text-emerald-300">{selectedMarker.distLabel}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-slate-400 w-full justify-center">
            <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{t.tapMarkerHint}</span>
          </div>
        )}
      </div>
    </div>
  );
});
