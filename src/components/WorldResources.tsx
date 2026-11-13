import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';
import { Html } from '@react-three/drei';
import { useGameStore } from '../store';
import { RESOURCE_DEFINITIONS, ResourceDefinition } from '../utils/nasaData';
import { Hand, AlertTriangle, Shield } from 'lucide-react';

interface WorldNode {
  id: string;
  resourceId: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  yieldAmount: number;
}

// Distributed Terrestrial Resources: Mineral, Protective, and Hazardous Deposits
const EARTH_RESOURCE_NODES: WorldNode[] = [
  // Beach & Coastal Dunes: Quartz & Silica Minerals
  {
    id: 'node-quartz-beach-1',
    resourceId: 'quartz',
    position: [-27, 0.4, 15],
    rotation: [0.1, 0.4, -0.2],
    scale: 1.1,
    yieldAmount: 3,
  },
  {
    id: 'node-quartz-beach-2',
    resourceId: 'quartz',
    position: [-31, 0.2, -45],
    rotation: [-0.1, 1.2, 0.15],
    scale: 0.9,
    yieldAmount: 2,
  },
  {
    id: 'node-silica-dunes-1',
    resourceId: 'silicon',
    position: [-22, 0.3, -15],
    rotation: [0, 0.8, 0],
    scale: 1.0,
    yieldAmount: 4,
  },
  {
    id: 'node-silica-dunes-2',
    resourceId: 'silicon',
    position: [-25, 0.25, 75],
    rotation: [0.1, 2.1, -0.1],
    scale: 1.2,
    yieldAmount: 5,
  },

  // Natural Freshwater Coastal Springs (Restores Water & Oxygen)
  {
    id: 'node-water-spring-1',
    resourceId: 'pure_water',
    position: [-16, 0.15, -60],
    scale: 1.0,
    yieldAmount: 2,
  },
  {
    id: 'node-water-spring-2',
    resourceId: 'pure_water',
    position: [-14, 0.15, 38],
    scale: 1.0,
    yieldAmount: 3,
  },

  // Cryogenic O2 Supply Canister near Coastal Road
  {
    id: 'node-oxygen-canister-1',
    resourceId: 'oxygen_canister',
    position: [15, 0.35, 32],
    rotation: [0, 0.4, 0],
    scale: 1.05,
    yieldAmount: 2,
  },

  // Protective Suit Armor Nanopolymer Kits (Increases Suit Protection + Max Shield)
  {
    id: 'node-suit-nanopolymer-1',
    resourceId: 'suit_nanopolymer',
    position: [18, 0.4, -18],
    rotation: [0, 0.5, 0],
    scale: 1.05,
    yieldAmount: 1,
  },
  {
    id: 'node-suit-nanopolymer-2',
    resourceId: 'suit_nanopolymer',
    position: [155, 0.4, -28],
    rotation: [0, 1.2, 0],
    scale: 1.05,
    yieldAmount: 1,
  },

  // Inland Savanna Plains: Iron Hematite Boulders & Lithium Pegmatites
  {
    id: 'node-iron-plain-1',
    resourceId: 'iron_ore',
    position: [48, 0.6, -32],
    rotation: [0.2, 0.6, -0.1],
    scale: 1.3,
    yieldAmount: 5,
  },
  {
    id: 'node-iron-plain-2',
    resourceId: 'iron_ore',
    position: [88, 0.7, 52],
    rotation: [-0.15, 1.4, 0.2],
    scale: 1.4,
    yieldAmount: 6,
  },
  {
    id: 'node-iron-plain-3',
    resourceId: 'iron_ore',
    position: [135, 0.6, -75],
    rotation: [0.3, 2.5, 0],
    scale: 1.2,
    yieldAmount: 4,
  },
  {
    id: 'node-lithium-deposit-1',
    resourceId: 'lithium',
    position: [65, 0.5, 88],
    rotation: [0, 0.5, 0.2],
    scale: 1.1,
    yieldAmount: 3,
  },
  {
    id: 'node-lithium-deposit-2',
    resourceId: 'lithium',
    position: [142, 0.5, -118],
    rotation: [0.2, 1.8, -0.15],
    scale: 1.0,
    yieldAmount: 3,
  },

  // Hazardous Radioactive & Toxic Deposits (Strictly away from Rocket Runway X:10..235, Z:-25..25)
  {
    id: 'node-uranium-hazard-1',
    resourceId: 'uranium_ore',
    position: [56, 0.45, 62],
    rotation: [0.1, 0.9, 0],
    scale: 1.25,
    yieldAmount: 1,
  },
  {
    id: 'node-uranium-hazard-2',
    resourceId: 'uranium_ore',
    position: [122, 0.45, 68],
    rotation: [-0.1, 1.7, 0.1],
    scale: 1.25,
    yieldAmount: 1,
  },
  {
    id: 'node-toxic-sulfur-1',
    resourceId: 'toxic_sulfur',
    position: [64, 0.35, -72],
    rotation: [0, 0.6, 0],
    scale: 1.2,
    yieldAmount: 2,
  },
  {
    id: 'node-toxic-sulfur-2',
    resourceId: 'toxic_sulfur',
    position: [138, 0.4, -60],
    rotation: [0.1, 2.2, 0],
    scale: 1.2,
    yieldAmount: 2,
  },

  // Rare Extraterrestrial Nickel-Iron Meteorites on Earth Terrain
  {
    id: 'node-meteorite-1',
    resourceId: 'meteorite_shard',
    position: [98, 0.45, -105],
    rotation: [0.4, 0.7, 0.3],
    scale: 1.2,
    yieldAmount: 2,
  },
  {
    id: 'node-meteorite-2',
    resourceId: 'meteorite_shard',
    position: [165, 0.5, 115],
    rotation: [-0.3, 2.1, 0.4],
    scale: 1.3,
    yieldAmount: 2,
  },

  // Aerospace Launch & VAB Hangar Vicinity: Advanced Tech Canisters
  {
    id: 'node-ggpen-composite-1',
    resourceId: 'ggpen_composite',
    position: [238, 0.4, -22],
    rotation: [0, 0.3, 0],
    scale: 1.0,
    yieldAmount: 2,
  },
  {
    id: 'node-plasma-core-1',
    resourceId: 'plasma_core',
    position: [214, 0.4, -48],
    rotation: [0, 1.1, 0],
    scale: 1.0,
    yieldAmount: 1,
  },
  {
    id: 'node-titanium-alloy-1',
    resourceId: 'titanium_alloy',
    position: [195, 0.35, 45],
    rotation: [0, 0.9, 0],
    scale: 1.0,
    yieldAmount: 3,
  },
];

// Procedural Web Audio Sound Generator for Item Pickup
function playPickupChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18);

    osc2.frequency.setValueAtTime(880.0, now);
    osc2.frequency.exponentialRampToValueAtTime(1760.0, now + 0.22);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch {
    // AudioContext blocked or not allowed yet
  }
}

export const WorldResources = React.memo(function WorldResources() {
  const collectedNodeIds = useGameStore((state) => state.collectedWorldNodeIds);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const scene = useGameStore((state) => state.scene);
  const addInventoryItem = useGameStore((state) => state.addInventoryItem);
  const markNodeCollected = useGameStore((state) => state.markNodeCollected);

  const [nearestNode, setNearestNode] = useState<{ node: WorldNode; dist: number } | null>(null);
  const nearestNodeIdRef = useRef<string | null>(null);
  const hazardReportTimerRef = useRef<number>(0);

  // Proximity check for collection AND hazard exposure ONLY when passing near radioactive/toxic nodes
  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.scene !== 'surface' || store.planetIndex !== 0) {
      if (store.activeHazard) store.setActiveHazard(null);
      if (nearestNodeIdRef.current !== null) {
        nearestNodeIdRef.current = null;
        setNearestNode(null);
      }
      return;
    }

    const px = store.playerPosition[0];
    const py = store.playerPosition[1];
    const pz = store.playerPosition[2];
    const collected = store.collectedWorldNodeIds;

    let closest: { node: WorldNode; dist: number } | null = null;
    let minDist = 3.8; // Interactive collection radius (meters)

    let nearestHazard: { type: 'radiation' | 'toxic'; name: string; distance: number } | null = null;
    let minHazardDist = 5.2; // Exposure radius (meters)

    for (const node of EARTH_RESOURCE_NODES) {
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
          nearestHazard = {
            type: def.effectType === 'hazard_radiation' ? 'radiation' : 'toxic',
            name: def.name,
            distance: dist,
          };
        }
      }
    }

    const nextNearestId = closest?.node.id ?? null;
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

  const handleCollect = (node: WorldNode) => {
    const store = useGameStore.getState();
    if (store.collectedWorldNodeIds.includes(node.id)) return;

    addInventoryItem(node.resourceId, node.yieldAmount);
    markNodeCollected(node.id);
    playPickupChime();

    // Immediate field protection / hydration / O2 boost when collecting beneficial resources,
    // or immediate heavy toxic/radiation hit when collecting hazardous deposits!
    if (node.resourceId === 'suit_nanopolymer') {
      store.applyLifeSupportBoost(35, 10, 150);
    } else if (node.resourceId === 'ggpen_composite') {
      store.applyLifeSupportBoost(25, 0, 150);
    } else if (node.resourceId === 'titanium_alloy') {
      store.applyLifeSupportBoost(15, 0);
    } else if (node.resourceId === 'pure_water') {
      store.applyLifeSupportBoost(5, 25);
    } else if (node.resourceId === 'oxygen_canister') {
      store.applyLifeSupportBoost(0, 45);
    } else if (node.resourceId === 'uranium_ore') {
      store.applyToxicHit(38, 30);
      store.setActiveHazard(null);
    } else if (node.resourceId === 'toxic_sulfur') {
      store.applyToxicHit(32, 36);
      store.setActiveHazard(null);
    }

    if (nearestNodeIdRef.current === node.id) {
      nearestNodeIdRef.current = null;
      setNearestNode(null);
    }
  };

  // Keyboard 'B' collection shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'b' || e.key === 'B') && nearestNode) {
        handleCollect(nearestNode.node);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nearestNode]);

  if (scene !== 'surface' || planetIndex !== 0) return null;

  return (
    <group>
      {EARTH_RESOURCE_NODES.map((node) => {
        if (collectedNodeIds.includes(node.id)) return null;
        const def = RESOURCE_DEFINITIONS[node.resourceId] || RESOURCE_DEFINITIONS.quartz;
        const isNearby = nearestNode?.node.id === node.id;

        return (
          <ResourceNode3D
            key={node.id}
            node={node}
            def={def}
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
  isNearby,
  onCollect,
}: {
  node: WorldNode;
  def: ResourceDefinition;
  isNearby: boolean;
  onCollect: () => void;
}) {
  const groupRef = useRef<Group>(null);
  const beaconRef = useRef<Mesh>(null);
  const isHazard = def.effectType === 'hazard_radiation' || def.effectType === 'hazard_toxic';
  const isProtective = def.effectType === 'boost_protection' || def.effectType === 'boost_oxygen' || def.effectType === 'boost_both';

  // Subtle floating and rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime + node.position[0];
      groupRef.current.position.y = node.position[1] + Math.sin(t * 1.5) * 0.05;
    }
    if (beaconRef.current) {
      const t = state.clock.elapsedTime * (isHazard ? 4.0 : 2.5) + node.position[2];
      const scale = 1 + Math.sin(t) * 0.16;
      beaconRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef} position={node.position} rotation={node.rotation || [0, 0, 0]}>
      {/* 3D Geometry Based on Resource Category */}
      {def.category === 'minerals' && (
        <group scale={node.scale || 1.0}>
          {node.resourceId === 'quartz' && (
            <group>
              <mesh position={[0, 0.45, 0]} rotation={[0.1, 0.3, 0.2]} castShadow>
                <cylinderGeometry args={[0.08, 0.18, 0.9, 6]} />
                <meshPhysicalMaterial color="#e0f2fe" transmission={0.85} roughness={0.1} metalness={0.05} ior={1.54} />
              </mesh>
              <mesh position={[0.2, 0.3, 0.1]} rotation={[-0.3, 0.8, -0.4]} castShadow>
                <cylinderGeometry args={[0.06, 0.14, 0.65, 6]} />
                <meshPhysicalMaterial color="#bae6fd" transmission={0.88} roughness={0.12} metalness={0.05} />
              </mesh>
              <mesh position={[-0.18, 0.28, -0.1]} rotation={[0.4, -0.5, 0.3]} castShadow>
                <cylinderGeometry args={[0.05, 0.12, 0.55, 6]} />
                <meshPhysicalMaterial color="#e0f2fe" transmission={0.85} roughness={0.1} metalness={0.05} />
              </mesh>
              <mesh position={[0, 0.1, 0]} castShadow>
                <dodecahedronGeometry args={[0.35, 1]} />
                <meshStandardMaterial color="#475569" roughness={0.9} />
              </mesh>
            </group>
          )}

          {node.resourceId === 'iron_ore' && (
            <group>
              <mesh position={[0, 0.45, 0]} castShadow>
                <dodecahedronGeometry args={[0.55, 2]} />
                <meshStandardMaterial color="#7f1d1d" metalness={0.78} roughness={0.42} />
              </mesh>
              <mesh position={[0.25, 0.3, 0.15]} castShadow>
                <dodecahedronGeometry args={[0.32, 1]} />
                <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.35} />
              </mesh>
            </group>
          )}

          {node.resourceId === 'lithium' && (
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
          )}

          {node.resourceId === 'meteorite_shard' && (
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
          )}

          {node.resourceId === 'silicon' && (
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
          )}

          {node.resourceId === 'titanium_alloy' && (
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
          )}

          {node.resourceId === 'uranium_ore' && (
            // Glowing Radioactive Uranium Crystal Cluster + 5m Warning Perimeter
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
          )}
        </group>
      )}

      {def.category === 'chemicals' && (
        <group scale={node.scale || 1.0}>
          {node.resourceId === 'pure_water' && (
            <group>
              <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.85, 32]} />
                <meshStandardMaterial color="#0284c7" roughness={0.08} metalness={0.15} transparent opacity={0.88} />
              </mesh>
              <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.2, 0.65, 32]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
              </mesh>
              <mesh position={[0, 0.5, 0]} castShadow>
                <sphereGeometry args={[0.22, 24, 24]} />
                <meshPhysicalMaterial color="#38bdf8" transmission={0.95} roughness={0.05} ior={1.33} />
              </mesh>
            </group>
          )}

          {node.resourceId === 'oxygen_canister' && (
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
          )}

          {node.resourceId === 'toxic_sulfur' && (
            // Toxic Yellow Sulfur Vent with Vapor Cloud
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
                <meshBasicMaterial color="#fde047" transparent opacity={0.22} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {def.category === 'tech' && (
        // High-Tech Aerospace Canister / Armor Kit
        <group scale={node.scale || 1.0}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.7, 24]} />
            <meshStandardMaterial
              color={
                node.resourceId === 'plasma_core'
                  ? '#701a75'
                  : node.resourceId === 'suit_nanopolymer'
                  ? '#065f46'
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
                color={node.resourceId === 'suit_nanopolymer' ? '#34d399' : '#eab308'}
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
      )}

      {/* Ground Marker Ring (Wider 5m Warning Ring for Hazards) */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[isHazard ? 4.3 : 0.65, isHazard ? 4.6 : 0.85, 48]} />
        <meshBasicMaterial color={def.color} transparent opacity={isHazard ? 0.45 : isNearby ? 0.85 : 0.4} />
      </mesh>
      {isHazard && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.65, 0.85, 32]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.85} />
        </mesh>
      )}

      {/* Floating Sparkle / Beacon */}
      <mesh ref={beaconRef} position={[0, 1.25, 0]}>
        <sphereGeometry args={[isHazard ? 0.1 : 0.07, 12, 12]} />
        <meshBasicMaterial color={def.color} />
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
              <span>{isHazard ? '[B] / Toque: Recolher & Neutralizar' : '[B] / Toque: Coletar'}</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-100 flex items-center gap-1">
              <span>{def.name}</span>
              <span className="font-mono text-[10px] text-amber-400 font-bold">+{node.yieldAmount}</span>
            </div>
            {def.effectLabel && (
              <span
                className={`text-[9px] font-mono font-bold text-center ${
                  isHazard ? 'text-red-300' : 'text-emerald-300'
                }`}
              >
                {def.effectLabel}
              </span>
            )}
            <span className="text-[9px] font-mono text-slate-400">
              {def.formula} • {def.rarityLabel.toUpperCase()}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
