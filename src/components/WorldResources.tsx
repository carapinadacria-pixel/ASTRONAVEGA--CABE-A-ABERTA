import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Group, Mesh } from 'three';
import { Html } from '@react-three/drei';
import { useGameStore, PLANETS } from '../store';
import {
  RESOURCE_DEFINITIONS,
  ResourceDefinition,
  WorldResourceNode,
  getSurfaceResourceNodes,
  getLocalizedResourceDef,
} from '../utils/nasaData';
import { playPickupChimeSound, playBackpackLimitSound } from '../audio';
import { Hand, AlertTriangle, Shield } from 'lucide-react';

export const WorldResources = React.memo(function WorldResources() {
  const collectedNodeIds = useGameStore((state) => state.collectedWorldNodeIds);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const planetaryApiVersion = useGameStore((state) => state.planetaryApiVersion);
  const scene = useGameStore((state) => state.scene);
  const language = useGameStore((state) => state.language);
  const addInventoryItem = useGameStore((state) => state.addInventoryItem);
  const markNodeCollected = useGameStore((state) => state.markNodeCollected);

  const currentPlanet = PLANETS[planetIndex] || PLANETS[0];
  const nodes = useMemo(() => getSurfaceResourceNodes(currentPlanet), [currentPlanet, planetaryApiVersion]);

  const [nearestNode, setNearestNode] = useState<{ node: WorldResourceNode; dist: number } | null>(null);
  const nearestNodeRef = useRef<{ node: WorldResourceNode; dist: number } | null>(null);
  const nearestNodeIdRef = useRef<string | null>(null);
  const hazardReportTimerRef = useRef<number>(0);

  // Proximity check for collection AND hazard exposure across ALL planetary surfaces
  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.scene !== 'surface') {
      if (store.activeHazard) store.setActiveHazard(null);
      if (nearestNodeIdRef.current !== null) {
        nearestNodeIdRef.current = null;
        nearestNodeRef.current = null;
        setNearestNode(null);
      }
      return;
    }

    const px = store.playerPosition[0];
    const py = store.playerPosition[1];
    const pz = store.playerPosition[2];
    const collected = store.collectedWorldNodeIds;

    let closest: { node: WorldResourceNode; dist: number } | null = null;
    let minDist = 3.8; // Interactive collection radius (meters)

    let nearestHazard: { type: 'radiation' | 'toxic'; name: string; distance: number } | null = null;
    let minHazardDist = 5.2; // Exposure radius (meters)

    for (const node of nodes) {
      if (collected.includes(node.id)) continue;
      const dx = px - node.position[0];
      const dy = py - node.position[1];
      const dz = pz - node.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < minDist) {
        minDist = dist;
        closest = { node, dist };
      }

      const def = RESOURCE_DEFINITIONS[node.resourceId];
      if (def?.effectType === 'hazard_radiation' || def?.effectType === 'hazard_toxic') {
        if (dist < minHazardDist) {
          minHazardDist = dist;
          const localized = getLocalizedResourceDef(def, store.language);
          nearestHazard = {
            type: def.effectType === 'hazard_radiation' ? 'radiation' : 'toxic',
            name: localized.name,
            distance: dist,
          };
        }
      }
    }

    const nextNearestId = closest?.node.id ?? null;
    nearestNodeRef.current = closest;
    if (nextNearestId !== nearestNodeIdRef.current) {
      nearestNodeIdRef.current = nextNearestId;
      setNearestNode(closest);
    }

    // Apply Suit Protection (health) & Water/O2 (oxygen) drain when near or touching hazard resource
    if (nearestHazard) {
      const clampedDt = Math.min(delta, 0.1);
      const isDirectTouch = nearestHazard.distance < 1.65;
      const intensity = isDirectTouch ? 2.4 : Math.max(0.4, 1 - nearestHazard.distance / 5.2);
      if (nearestHazard.type === 'radiation') {
        store.applyHazardDrain(clampedDt * 9.5 * intensity, clampedDt * 7.5 * intensity);
      } else {
        store.applyHazardDrain(clampedDt * 7.5 * intensity, clampedDt * 9.5 * intensity);
      }

      hazardReportTimerRef.current += clampedDt;
      if (!store.activeHazard || store.activeHazard.type !== nearestHazard.type || hazardReportTimerRef.current > 0.15) {
        hazardReportTimerRef.current = 0;
        store.setActiveHazard(nearestHazard);
      }
    } else if (store.activeHazard) {
      hazardReportTimerRef.current = 0;
      store.setActiveHazard(null);
    }
  });

  const handleCollect = (node: WorldResourceNode) => {
    const store = useGameStore.getState();
    if (store.collectedWorldNodeIds.includes(node.id)) return;

    const added = addInventoryItem(node.resourceId, node.yieldAmount);
    if (!added) {
      playBackpackLimitSound();
      return;
    }
    markNodeCollected(node.id);
    playPickupChimeSound();

    // Immediate field protection / hydration / O2 boost when collecting beneficial resources,
    // or immediate heavy toxic/radiation hit when collecting hazardous deposits!
    if (node.resourceId === 'suit_nanopolymer') {
      store.applyLifeSupportBoost(35, 10, 150);
    } else if (node.resourceId === 'ggpen_composite') {
      store.applyLifeSupportBoost(25, 0, 150);
    } else if (node.resourceId === 'exo_superdense_alloy') {
      store.applyLifeSupportBoost(25, 0, 150);
    } else if (node.resourceId === 'titanium_alloy') {
      store.applyLifeSupportBoost(15, 0);
    } else if (
      node.resourceId === 'pure_water' ||
      node.resourceId === 'lunar_ice' ||
      node.resourceId === 'cryo_water_ice' ||
      node.resourceId === 'exo_cryo_ice'
    ) {
      store.applyLifeSupportBoost(5, 25);
    } else if (node.resourceId === 'oxygen_canister') {
      store.applyLifeSupportBoost(0, 45);
    } else if (node.resourceId === 'co2_ice') {
      store.applyLifeSupportBoost(0, 35);
    } else if (node.resourceId === 'uranium_ore') {
      store.applyToxicHit(38, 30);
      store.setActiveHazard(null);
    } else if (node.resourceId === 'toxic_sulfur' || node.resourceId === 'sulfuric_vapor') {
      store.applyToxicHit(34, 38);
      store.setActiveHazard(null);
    }

    if (nearestNodeIdRef.current === node.id) {
      nearestNodeIdRef.current = null;
      nearestNodeRef.current = null;
      setNearestNode(null);
    }
  };

  // Keyboard 'B' AND HUD/Mobile custom collect event
  useEffect(() => {
    const collectNearest = () => {
      if (nearestNodeRef.current) {
        handleCollect(nearestNodeRef.current.node);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B') {
        collectNearest();
      }
    };
    const handleCustomCollect = () => {
      collectNearest();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('astronavega-collect', handleCustomCollect);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('astronavega-collect', handleCustomCollect);
    };
  }, [nodes]);

  if (scene !== 'surface') return null;

  return (
    <group>
      {nodes.map((node) => {
        if (collectedNodeIds.includes(node.id)) return null;
        const def = RESOURCE_DEFINITIONS[node.resourceId] || RESOURCE_DEFINITIONS.quartz;
        const isNearby = nearestNode?.node.id === node.id;

        return (
          <ResourceNode3D
            key={node.id}
            node={node}
            def={def}
            language={language}
            isNearby={isNearby}
            onCollect={() => handleCollect(node)}
          />
        );
      })}
    </group>
  );
});

// Single 3D Collectible World Node
function ResourceNode3D({
  node,
  def,
  language,
  isNearby,
  onCollect,
}: {
  node: WorldResourceNode;
  def: ResourceDefinition;
  language: 'pt' | 'en';
  isNearby: boolean;
  onCollect: () => void;
}) {
  const groupRef = useRef<Group>(null);
  const beaconRef = useRef<Mesh>(null);
  const rarityHaloRef = useRef<Mesh>(null);
  const rarityHaloOuterRef = useRef<Mesh>(null);
  const isHazard = def.effectType === 'hazard_radiation' || def.effectType === 'hazard_toxic';
  const isProtective = def.effectType === 'boost_protection' || def.effectType === 'boost_oxygen' || def.effectType === 'boost_both';
  const isRare = def.rarity === 'rare';
  const isEpic = def.rarity === 'epic';
  const isLegendary = def.rarity === 'legendary';
  const hasRarityGlow = isRare || isEpic || isLegendary;
  const rarityGlowColor = isLegendary ? '#fde047' : isEpic ? '#c084fc' : def.glowColor;
  const loc = getLocalizedResourceDef(def, language);

  // Subtle floating, beacon pulse & rotating rarity halo animations
  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.05);
    if (groupRef.current) {
      const t = state.clock.elapsedTime + node.position[0];
      groupRef.current.position.y = node.position[1] + Math.sin(t * 1.5) * 0.05;
    }
    if (beaconRef.current) {
      const t = state.clock.elapsedTime * (isHazard ? 4.0 : hasRarityGlow ? 3.2 : 2.5) + node.position[2];
      const scale = (hasRarityGlow ? 1.18 : 1.0) + Math.sin(t) * (isLegendary ? 0.28 : 0.18);
      beaconRef.current.scale.set(scale, scale, scale);
    }
    if (rarityHaloRef.current) {
      rarityHaloRef.current.rotation.z += safeDelta * (isLegendary ? 1.8 : 1.1);
      rarityHaloRef.current.rotation.x += safeDelta * 0.55;
    }
    if (rarityHaloOuterRef.current) {
      rarityHaloOuterRef.current.rotation.z -= safeDelta * 1.4;
      rarityHaloOuterRef.current.rotation.y += safeDelta * 0.85;
    }
  });

  const renderMineralGeometry = () => {
    switch (node.resourceId) {
      case 'quartz':
      case 'exo_silicate_crystal':
      case 'sodium_silicate':
      case 'ilmenite':
      case 'diamond_hail': {
        const isDiamond = node.resourceId === 'diamond_hail';
        const isExo = node.resourceId === 'exo_silicate_crystal';
        const isSodium = node.resourceId === 'sodium_silicate';
        const c1 = isDiamond ? '#f8fafc' : isExo ? '#c084fc' : isSodium ? '#fde047' : node.resourceId === 'ilmenite' ? '#38bdf8' : '#e0f2fe';
        const c2 = isDiamond ? '#e0f2fe' : isExo ? '#a855f7' : isSodium ? '#facc15' : node.resourceId === 'ilmenite' ? '#60a5fa' : '#bae6fd';
        return (
          <group>
            <mesh position={[0, 0.45, 0]} rotation={[0.1, 0.3, 0.2]} castShadow>
              <cylinderGeometry args={[0.08, 0.18, 0.9, 6]} />
              <meshPhysicalMaterial color={c1} transmission={0.82} roughness={0.1} metalness={0.1} ior={1.54} />
            </mesh>
            <mesh position={[0.2, 0.3, 0.1]} rotation={[-0.3, 0.8, -0.4]} castShadow>
              <cylinderGeometry args={[0.06, 0.14, 0.65, 6]} />
              <meshPhysicalMaterial color={c2} transmission={0.84} roughness={0.12} metalness={0.1} />
            </mesh>
            <mesh position={[-0.18, 0.28, -0.1]} rotation={[0.4, -0.5, 0.3]} castShadow>
              <cylinderGeometry args={[0.05, 0.12, 0.55, 6]} />
              <meshPhysicalMaterial color={c1} transmission={0.82} roughness={0.1} metalness={0.1} />
            </mesh>
            <mesh position={[0, 0.1, 0]} castShadow>
              <dodecahedronGeometry args={[0.35, 1]} />
              <meshStandardMaterial color={isExo ? '#4c1d95' : '#475569'} roughness={0.88} />
            </mesh>
          </group>
        );
      }

      case 'iron_ore':
      case 'mars_hematite':
      case 'metallic_iron':
      case 'basalt_sulfur':
      case 'lunar_regolith':
      case 'exo_superdense_alloy': {
        const primary =
          node.resourceId === 'mars_hematite'
            ? '#ea580c'
            : node.resourceId === 'metallic_iron'
            ? '#f59e0b'
            : node.resourceId === 'basalt_sulfur'
            ? '#b45309'
            : node.resourceId === 'lunar_regolith'
            ? '#94a3b8'
            : node.resourceId === 'exo_superdense_alloy'
            ? '#9333ea'
            : '#7f1d1d';
        const secondary =
          node.resourceId === 'lunar_regolith'
            ? '#cbd5e1'
            : node.resourceId === 'exo_superdense_alloy'
            ? '#e9d5ff'
            : '#334155';
        return (
          <group>
            <mesh position={[0, 0.45, 0]} castShadow>
              <dodecahedronGeometry args={[0.55, 2]} />
              <meshStandardMaterial color={primary} metalness={0.78} roughness={0.42} />
            </mesh>
            <mesh position={[0.25, 0.3, 0.15]} castShadow>
              <dodecahedronGeometry args={[0.32, 1]} />
              <meshStandardMaterial color={secondary} metalness={0.85} roughness={0.35} />
            </mesh>
          </group>
        );
      }

      case 'lithium':
        return (
          <group>
            <mesh position={[0, 0.4, 0]} rotation={[0.2, 0.5, -0.2]} castShadow>
              <cylinderGeometry args={[0.06, 0.16, 0.8, 5]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.45} roughness={0.2} />
            </mesh>
            <mesh position={[-0.15, 0.3, 0.15]} rotation={[-0.3, -0.4, 0.3]} castShadow>
              <cylinderGeometry args={[0.05, 0.12, 0.6, 5]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.12, 0]} castShadow>
              <dodecahedronGeometry args={[0.38, 1]} />
              <meshStandardMaterial color="#64748b" roughness={0.85} />
            </mesh>
          </group>
        );

      case 'meteorite_shard':
        return (
          <group>
            <mesh position={[0, 0.4, 0]} castShadow>
              <dodecahedronGeometry args={[0.42, 2]} />
              <meshStandardMaterial color="#1c1917" metalness={0.92} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.45, 0.85, 24]} />
              <meshStandardMaterial color="#292524" roughness={0.98} />
            </mesh>
          </group>
        );

      case 'silicon':
        return (
          <group>
            <mesh position={[0, 0.35, 0]} rotation={[0, 0.4, 0.2]} castShadow>
              <octahedronGeometry args={[0.36, 1]} />
              <meshStandardMaterial color="#fef08a" metalness={0.3} roughness={0.2} />
            </mesh>
            <mesh position={[0.18, 0.25, -0.1]} castShadow>
              <octahedronGeometry args={[0.22, 1]} />
              <meshStandardMaterial color="#fef9c3" metalness={0.35} roughness={0.15} />
            </mesh>
          </group>
        );

      case 'titanium_alloy':
        return (
          <group>
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[0.55, 0.42, 0.35]} />
              <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.18} />
            </mesh>
            <mesh position={[0, 0.65, 0]}>
              <torusGeometry args={[0.2, 0.03, 12, 24]} />
              <meshBasicMaterial color="#67e8f9" />
            </mesh>
          </group>
        );

      case 'uranium_ore':
        return (
          <group>
            <mesh position={[0, 0.48, 0]} rotation={[0.1, 0.3, 0.1]} castShadow>
              <cylinderGeometry args={[0.1, 0.24, 0.95, 6]} />
              <meshStandardMaterial color="#84cc16" emissive="#65a30d" emissiveIntensity={1.6} roughness={0.25} />
            </mesh>
            <mesh position={[0.24, 0.32, 0.14]} rotation={[-0.35, 0.5, -0.35]} castShadow>
              <cylinderGeometry args={[0.07, 0.16, 0.65, 6]} />
              <meshStandardMaterial color="#bef264" emissive="#84cc16" emissiveIntensity={1.4} roughness={0.3} />
            </mesh>
            <mesh position={[-0.22, 0.28, -0.14]} rotation={[0.35, -0.6, 0.3]} castShadow>
              <cylinderGeometry args={[0.07, 0.16, 0.6, 6]} />
              <meshStandardMaterial color="#a3e635" emissive="#65a30d" emissiveIntensity={1.4} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.1, 0]} castShadow>
              <dodecahedronGeometry args={[0.42, 1]} />
              <meshStandardMaterial color="#1f2937" roughness={0.9} />
            </mesh>
          </group>
        );

      default:
        return (
          <mesh position={[0, 0.42, 0]} castShadow>
            <dodecahedronGeometry args={[0.45, 1]} />
            <meshStandardMaterial color={def.color} metalness={0.65} roughness={0.3} />
          </mesh>
        );
    }
  };

  const renderChemicalGeometry = () => {
    switch (node.resourceId) {
      case 'pure_water':
      case 'liquid_methane': {
        const poolColor = node.resourceId === 'liquid_methane' ? '#0369a1' : '#0284c7';
        const orbColor = node.resourceId === 'liquid_methane' ? '#0ea5e9' : '#38bdf8';
        return (
          <group>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.85, 32]} />
              <meshStandardMaterial color={poolColor} roughness={0.08} metalness={0.2} transparent opacity={0.88} />
            </mesh>
            <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.2, 0.65, 32]} />
              <meshBasicMaterial color={orbColor} transparent opacity={0.5} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow>
              <sphereGeometry args={[0.22, 24, 24]} />
              <meshPhysicalMaterial color={orbColor} transmission={0.92} roughness={0.05} ior={1.33} />
            </mesh>
          </group>
        );
      }

      case 'lunar_ice':
      case 'co2_ice':
      case 'cryo_water_ice':
      case 'exo_cryo_ice':
      case 'ammonia_crystal': {
        const iceCol =
          node.resourceId === 'co2_ice'
            ? '#e0f2fe'
            : node.resourceId === 'ammonia_crystal'
            ? '#a5f3fc'
            : '#22d3ee';
        return (
          <group>
            <mesh position={[0, 0.4, 0]} rotation={[0.15, 0.4, -0.15]} castShadow>
              <octahedronGeometry args={[0.46, 0]} />
              <meshPhysicalMaterial color={iceCol} transmission={0.82} roughness={0.12} ior={1.31} />
            </mesh>
            <mesh position={[0.26, 0.25, 0.16]} rotation={[-0.2, 0.9, 0.2]} castShadow>
              <octahedronGeometry args={[0.26, 0]} />
              <meshPhysicalMaterial color="#cffafe" transmission={0.85} roughness={0.1} ior={1.31} />
            </mesh>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.72, 24]} />
              <meshBasicMaterial color={iceCol} transparent opacity={0.35} />
            </mesh>
          </group>
        );
      }

      case 'oxygen_canister':
        return (
          <group>
            <mesh position={[0, 0.46, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.2, 0.72, 24]} />
              <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.86, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.16, 0.12, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.46, 0]}>
              <torusGeometry args={[0.22, 0.02, 12, 24]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>
        );

      case 'toxic_sulfur':
      case 'sulfuric_vapor':
        return (
          <group>
            <mesh position={[0, 0.25, 0]} castShadow>
              <coneGeometry args={[0.55, 0.5, 16]} />
              <meshStandardMaterial color="#854d0e" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.48, 0]} castShadow>
              <dodecahedronGeometry args={[0.26, 1]} />
              <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={1.2} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.85, 0]}>
              <sphereGeometry args={[0.45, 16, 16]} />
              <meshBasicMaterial color="#fde047" transparent opacity={0.24} />
            </mesh>
          </group>
        );

      case 'perchlorate':
      case 'tholin_organics':
      default:
        return (
          <group>
            <mesh position={[0, 0.34, 0]} castShadow>
              <dodecahedronGeometry args={[0.38, 1]} />
              <meshStandardMaterial color={def.color} roughness={0.5} metalness={0.25} />
            </mesh>
            <mesh position={[0.22, 0.24, -0.1]} castShadow>
              <octahedronGeometry args={[0.22, 0]} />
              <meshStandardMaterial color={def.glowColor} roughness={0.35} />
            </mesh>
          </group>
        );
    }
  };

  return (
    <group ref={groupRef} position={node.position} rotation={node.rotation || [0, 0, 0]}>
      {/* 3D Geometry Based on Resource Category */}
      {def.category === 'minerals' && <group scale={node.scale || 1.0}>{renderMineralGeometry()}</group>}

      {def.category === 'chemicals' && <group scale={node.scale || 1.0}>{renderChemicalGeometry()}</group>}

      {def.category === 'tech' && (
        node.resourceId === 'orbital_cargo_expander' ? (
          <group scale={node.scale || 1.0}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.34, 0.62, 6]} />
              <meshStandardMaterial color="#065f46" metalness={0.85} roughness={0.22} />
            </mesh>
            <mesh position={[0, 0.46, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.35, 0.035, 10, 24]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
            {[-0.28, 0.28].map((ox, i) => (
              <mesh key={`exp-side-${i}`} position={[ox, 0.42, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.09, 0.48, 12]} />
                <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
              </mesh>
            ))}
            <mesh position={[0, 0.8, 0]}>
              <octahedronGeometry args={[0.14, 0]} />
              <meshBasicMaterial color="#6ee7b7" />
            </mesh>
          </group>
        ) : (
          <group scale={node.scale || 1.0}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.7, 24]} />
              <meshStandardMaterial
                color={
                  node.resourceId === 'plasma_core' || node.resourceId === 'exo_plasma_flare'
                    ? '#701a75'
                    : node.resourceId === 'suit_nanopolymer' || node.resourceId === 'helium3'
                    ? '#065f46'
                    : node.resourceId === 'metallic_hydrogen'
                    ? '#0c4a6e'
                    : '#1e293b'
                }
                metalness={0.85}
                roughness={0.25}
              />
            </mesh>
            {[-0.32, 0.32].map((y, i) => (
              <mesh key={`cap-${i}`} position={[0, 0.45 + y, 0]} castShadow>
                <cylinderGeometry args={[0.24, 0.24, 0.08, 24]} />
                <meshStandardMaterial
                  color={
                    node.resourceId === 'suit_nanopolymer' || node.resourceId === 'helium3'
                      ? '#34d399'
                      : node.resourceId === 'exo_plasma_flare'
                      ? '#f43f5e'
                      : '#eab308'
                  }
                  metalness={0.95}
                  roughness={0.2}
                />
              </mesh>
            ))}
            <mesh position={[0, 0.45, 0]}>
              <torusGeometry args={[0.23, 0.025, 12, 24]} />
              <meshBasicMaterial color={def.color} />
            </mesh>
          </group>
        )
      )}

      {/* Ground Marker Ring (Wider 5m Warning Ring for Hazards + Concentric Rarity Rings) */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[isHazard ? 4.3 : 0.65, isHazard ? 4.6 : 0.85, 48]} />
        <meshBasicMaterial color={def.color} transparent opacity={isHazard ? 0.45 : isNearby ? 0.85 : hasRarityGlow ? 0.65 : 0.36} />
      </mesh>
      {hasRarityGlow && (
        <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[isLegendary ? 1.15 : 0.95, isLegendary ? 1.42 : 1.15, 48]} />
          <meshBasicMaterial color={rarityGlowColor} transparent opacity={isLegendary ? 0.68 : 0.46} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
      {isHazard && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.65, 0.85, 32]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.85} />
        </mesh>
      )}

      {/* Tiered Rarity Shimmer Aura, Orbiting Halo Rings & Light Spire ("Brilho de Raridade") */}
      {hasRarityGlow && (
        <group>
          {/* Radiant Aura Sphere enveloping the mineral */}
          <mesh position={[0, 0.52, 0]}>
            <sphereGeometry args={[isLegendary ? 0.78 : isEpic ? 0.66 : 0.54, 20, 20]} />
            <meshBasicMaterial
              color={rarityGlowColor}
              transparent
              opacity={isLegendary ? 0.24 : isEpic ? 0.19 : 0.14}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Vertical Translucent Rarity Spire (spotted when exploring deep sectors) */}
          <mesh position={[0, isLegendary ? 2.4 : isEpic ? 1.8 : 1.25, 0]}>
            <cylinderGeometry args={[0.04, isLegendary ? 0.46 : 0.34, isLegendary ? 4.6 : isEpic ? 3.4 : 2.2, 16, 1, true]} />
            <meshBasicMaterial
              color={rarityGlowColor}
              transparent
              opacity={isLegendary ? 0.34 : isEpic ? 0.26 : 0.18}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Rotating Orbital Rarity Halo(s) */}
          {(isEpic || isLegendary) && (
            <mesh ref={rarityHaloRef} position={[0, 0.55, 0]} rotation={[Math.PI / 3, 0.3, 0]}>
              <torusGeometry args={[isLegendary ? 0.72 : 0.60, 0.028, 10, 36]} />
              <meshBasicMaterial color={rarityGlowColor} transparent opacity={0.85} blending={AdditiveBlending} depthWrite={false} />
            </mesh>
          )}
          {isLegendary && (
            <mesh ref={rarityHaloOuterRef} position={[0, 0.55, 0]} rotation={[-Math.PI / 3, -0.4, 0]}>
              <torusGeometry args={[0.88, 0.022, 10, 36]} />
              <meshBasicMaterial color={def.glowColor} transparent opacity={0.75} blending={AdditiveBlending} depthWrite={false} />
            </mesh>
          )}
        </group>
      )}

      {/* Floating Sparkle / Beacon */}
      <mesh ref={beaconRef} position={[0, hasRarityGlow ? 1.48 : 1.25, 0]}>
        <sphereGeometry args={[isHazard ? 0.1 : isLegendary ? 0.13 : hasRarityGlow ? 0.1 : 0.07, 12, 12]} />
        <meshBasicMaterial color={hasRarityGlow ? rarityGlowColor : def.color} />
      </mesh>

      {/* Proximity Interactive Action Card */}
      {isNearby && (
        <Html position={[0, 1.6, 0]} center distanceFactor={12}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onCollect();
            }}
            className={`flex flex-col items-center gap-1 bg-slate-900/95 backdrop-blur-xl p-2.5 rounded-2xl shadow-2xl text-white select-none cursor-pointer active:scale-95 transition-transform min-w-[185px] border ${
              isHazard
                ? 'border-red-400/80'
                : isProtective
                ? 'border-emerald-400/70'
                : 'border-cyan-400/60'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 text-xs font-bold ${
                isHazard ? 'text-red-300' : isProtective ? 'text-emerald-300' : 'text-cyan-300'
              }`}
            >
              <span
                className={`p-1 rounded-lg border ${
                  isHazard
                    ? 'bg-red-500/20 text-red-400 border-red-400/40'
                    : isProtective
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40'
                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40'
                }`}
              >
                {isHazard ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : isProtective ? (
                  <Shield className="w-3.5 h-3.5" />
                ) : (
                  <Hand className="w-3.5 h-3.5" />
                )}
              </span>
              <span>
                {language === 'en'
                  ? isHazard
                    ? '[B] / Tap: Gather & Neutralize'
                    : '[B] / Tap: Collect'
                  : isHazard
                  ? '[B] / Toque: Recolher & Neutralizar'
                  : '[B] / Toque: Coletar'}
              </span>
            </div>
            <div className="text-[11px] font-semibold text-slate-100 flex items-center gap-1">
              <span>{loc.name}</span>
              <span className="font-mono text-[10px] text-amber-400 font-bold">+{node.yieldAmount}</span>
            </div>
            {loc.effectLabel && (
              <span
                className={`text-[9px] font-mono font-bold text-center ${
                  isHazard ? 'text-red-300' : 'text-emerald-300'
                }`}
              >
                {loc.effectLabel}
              </span>
            )}
            <span className="text-[9px] font-mono text-slate-400">
              {def.formula} • {loc.rarityLabel.toUpperCase()}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
