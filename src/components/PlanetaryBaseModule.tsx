import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, DoubleSide } from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Html, Text } from '@react-three/drei';
import { Droplets, Shield, Wind, Hand, RefreshCw } from 'lucide-react';
import { useGameStore } from '../store';
import { RESOURCE_DEFINITIONS } from '../utils/nasaData';

export interface PlanetaryBaseModuleProps {
  planetId: string;
  baseTitle: string;
  position: [number, number, number];
  accentColor?: string;
  hullColor?: string;
  trimColor?: string;
  variant?: 'lunar' | 'mercury' | 'venus' | 'mars' | 'titan' | 'gas' | 'exo';
}

interface InternalPodDef {
  id: string;
  resourceId: 'pure_water' | 'oxygen_canister' | 'suit_nanopolymer';
  localPos: [number, number, number];
  yieldAmount: number;
}

function playBaseBeep(isRefill = false) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isRefill ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isRefill ? 523.25 : 659.25, now);
    osc.frequency.exponentialRampToValueAtTime(isRefill ? 1046.5 : 1318.5, now + 0.22);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    // Ignore blocked audio context
  }
}

export function PlanetaryBaseModule({
  planetId,
  baseTitle,
  position,
  accentColor = '#38bdf8',
  hullColor = '#e2e8f0',
  trimColor = '#eab308',
  variant = 'lunar',
}: PlanetaryBaseModuleProps) {
  const [bx, by, bz] = position;
  // Orient front doorway (+Z local) directly toward the capsule landing zone [0, 0, 0]
  const rotY = useMemo(() => Math.atan2(-bx, -bz), [bx, bz]);
  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);

  const toWorldXZ = (lx: number, lz: number): [number, number] => [
    bx + lx * cosR + lz * sinR,
    bz - lx * sinR + lz * cosR,
  ];

  const leftDoorRef = useRef<Group>(null);
  const rightDoorRef = useRef<Group>(null);
  const holoGlobeRef = useRef<Group>(null);

  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const isDoorOpenRef = useRef(false);
  const doorSlideRef = useRef(0); // 0 = closed, 1 = open

  const [nearRefill, setNearRefill] = useState(false);
  const nearRefillRef = useRef(false);
  const [refillFeedback, setRefillFeedback] = useState(false);

  const [nearestPodId, setNearestPodId] = useState<string | null>(null);
  const nearestPodRef = useRef<string | null>(null);

  const collectedNodeIds = useGameStore((s) => s.collectedWorldNodeIds);

  const internalPods = useMemo<InternalPodDef[]>(
    () => [
      {
        id: `base-${planetId}-water`,
        resourceId: 'pure_water',
        localPos: [4.3, 0.25, 2.0],
        yieldAmount: 2,
      },
      {
        id: `base-${planetId}-oxygen`,
        resourceId: 'oxygen_canister',
        localPos: [4.3, 0.25, -1.2],
        yieldAmount: 2,
      },
      {
        id: `base-${planetId}-armor`,
        resourceId: 'suit_nanopolymer',
        localPos: [-4.3, 0.25, -1.2],
        yieldAmount: 1,
      },
    ],
    [planetId]
  );

  // World positions for proximity triggers
  const doorWorld = useMemo(() => toWorldXZ(0, 6.6), [bx, bz, cosR, sinR]);
  const refillWorld = useMemo(() => toWorldXZ(-4.2, 2.1), [bx, bz, cosR, sinR]);
  const podWorlds = useMemo(
    () =>
      internalPods.map((pod) => ({
        pod,
        world: toWorldXZ(pod.localPos[0], pod.localPos[2]),
      })),
    [internalPods, bx, bz, cosR, sinR]
  );

  const triggerRefillStation = () => {
    const store = useGameStore.getState();
    store.applyLifeSupportBoost(store.maxHealth, 100);
    playBaseBeep(true);
    setRefillFeedback(true);
    setTimeout(() => setRefillFeedback(false), 1800);
  };

  const handleCollectPod = (pod: InternalPodDef) => {
    const store = useGameStore.getState();
    if (store.collectedWorldNodeIds.includes(pod.id)) return;
    store.addInventoryItem(pod.resourceId, pod.yieldAmount);
    store.markNodeCollected(pod.id);
    playBaseBeep(false);

    if (pod.resourceId === 'pure_water') {
      store.applyLifeSupportBoost(5, 25);
    } else if (pod.resourceId === 'oxygen_canister') {
      store.applyLifeSupportBoost(0, 45);
    } else if (pod.resourceId === 'suit_nanopolymer') {
      store.applyLifeSupportBoost(35, 10, 150);
    }

    if (nearestPodRef.current === pod.id) {
      nearestPodRef.current = null;
      setNearestPodId(null);
    }
  };

  // Keyboard [B] support inside the planetary base for Refill Station & Supply Pods
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'b' && e.key !== 'B') return;
      if (nearestPodRef.current) {
        const match = internalPods.find((p) => p.id === nearestPodRef.current);
        if (match) {
          handleCollectPod(match);
          return;
        }
      }
      if (nearRefillRef.current) {
        triggerRefillStation();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [internalPods]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const store = useGameStore.getState();
    const px = store.playerPosition[0];
    const py = store.playerPosition[1];
    const pz = store.playerPosition[2];

    // 1. Automatic Sliding Metal Door proximity check (opens smoothly within 8.2m)
    const doorDist = Math.hypot(px - doorWorld[0], pz - doorWorld[1]);
    const shouldOpen = doorDist < 8.2;
    if (shouldOpen !== isDoorOpenRef.current) {
      isDoorOpenRef.current = shouldOpen;
      setIsDoorOpen(shouldOpen);
    }
    const targetSlide = shouldOpen ? 1 : 0;
    doorSlideRef.current += (targetSlide - doorSlideRef.current) * Math.min(1, delta * 6.0);
    const slideOffset = doorSlideRef.current * 2.05;
    if (leftDoorRef.current) {
      leftDoorRef.current.position.x = -1.06 - slideOffset;
    }
    if (rightDoorRef.current) {
      rightDoorRef.current.position.x = 1.06 + slideOffset;
    }

    // 2. Holographic telemetry table animation
    if (holoGlobeRef.current) {
      holoGlobeRef.current.rotation.y += delta * 0.65;
      holoGlobeRef.current.position.y = 1.68 + Math.sin(state.clock.elapsedTime * 2.1) * 0.06;
    }

    // 3. Refill Station proximity check
    const refillDist = Math.hypot(px - refillWorld[0], pz - refillWorld[1]);
    const isNearRefillNow = refillDist < 3.1 && Math.abs(py - (by + 1.2)) < 3.5;
    if (isNearRefillNow !== nearRefillRef.current) {
      nearRefillRef.current = isNearRefillNow;
      setNearRefill(isNearRefillNow);
    }

    // 4. Collectible internal supply pods proximity check
    let closestId: string | null = null;
    let minPodDist = 2.85;
    for (let i = 0; i < podWorlds.length; i++) {
      const { pod, world } = podWorlds[i];
      if (store.collectedWorldNodeIds.includes(pod.id)) continue;
      const d = Math.hypot(px - world[0], pz - world[1]);
      if (d < minPodDist && Math.abs(py - (by + 1.2)) < 3.5) {
        minPodDist = d;
        closestId = pod.id;
      }
    }
    if (closestId !== nearestPodRef.current) {
      nearestPodRef.current = closestId;
      setNearestPodId(closestId);
    }
  });

  const roofAccent =
    variant === 'mercury'
      ? '#f59e0b'
      : variant === 'mars'
      ? '#22c55e'
      : variant === 'venus'
      ? '#fbbf24'
      : variant === 'exo'
      ? '#c084fc'
      : accentColor;

  return (
    <group position={[bx, by, bz]} rotation={[0, rotY, 0]}>
      {/* ============================================================== */}
      {/* 1. WALKABLE FLOOR DECK, ACCESS RAMP & PRESSURIZED WALLS        */}
      {/* ============================================================== */}
      <RigidBody type="fixed" colliders={false} friction={0.0}>
        {/* Main Pressurized Interior Floor (top at Y = 0.22m) */}
        <CuboidCollider args={[6.8, 0.14, 6.8]} position={[0, 0.08, 0]} friction={0.0} />
        {/* Smooth Front Entry Ramp from surface Y=0 to interior deck Y=0.22 */}
        <CuboidCollider
          args={[2.4, 0.08, 1.5]}
          position={[0, 0.08, 8.1]}
          rotation={[0.14, 0, 0]}
          friction={0.0}
        />

        {/* Back Wall (Z = -6.6) */}
        <CuboidCollider args={[6.8, 2.8, 0.25]} position={[0, 2.8, -6.6]} />
        {/* Left & Right Side Walls (X = ±6.6) */}
        <CuboidCollider args={[0.25, 2.8, 6.8]} position={[-6.6, 2.8, 0]} />
        <CuboidCollider args={[0.25, 2.8, 6.8]} position={[6.6, 2.8, 0]} />
        {/* Front Wall Flanks leaving wide 4.2m central doorway open */}
        <CuboidCollider args={[2.3, 2.8, 0.25]} position={[-4.5, 2.8, 6.6]} />
        <CuboidCollider args={[2.3, 2.8, 0.25]} position={[4.5, 2.8, 6.6]} />
        {/* Front Doorway Upper Lintel */}
        <CuboidCollider args={[2.2, 0.9, 0.25]} position={[0, 4.7, 6.6]} />
        {/* Central Hologram Pedestal Collider */}
        <CuboidCollider args={[1.05, 0.65, 1.05]} position={[0, 0.75, 0]} />
      </RigidBody>

      {/* Dynamic Door Collider: blocks entry only while the automatic metal doors are closed */}
      {!isDoorOpen && (
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[2.15, 1.85, 0.18]} position={[0, 2.0, 6.65]} />
        </RigidBody>
      )}

      {/* Visual Floor Plate & Glowing Corridor Guide Strips */}
      <mesh position={[0, 0.11, 0]} receiveShadow>
        <boxGeometry args={[13.6, 0.22, 13.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.225, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12.8, 12.8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.45} />
      </mesh>
      {[-1.55, 1.55].map((gx, gi) => (
        <mesh key={`floor-guide-${gi}`} position={[gx, 0.23, 3.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.09, 5.2]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>
      ))}

      {/* Front Access Ramp Mesh */}
      <mesh position={[0, 0.10, 8.1]} rotation={[0.14, 0, 0]} receiveShadow>
        <boxGeometry args={[4.8, 0.12, 3.0]} />
        <meshStandardMaterial color="#475569" metalness={0.82} roughness={0.28} />
      </mesh>

      {/* Exterior Structural Armor Walls */}
      {/* Back Wall */}
      <mesh position={[0, 2.8, -6.6]} castShadow receiveShadow>
        <boxGeometry args={[13.6, 5.4, 0.44]} />
        <meshStandardMaterial color={hullColor} metalness={0.72} roughness={0.28} />
      </mesh>
      {/* Left & Right Walls with Illuminated Panoramic Windows */}
      {[-6.6, 6.6].map((wx, wi) => (
        <group key={`base-sidewall-${wi}`} position={[wx, 2.8, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.44, 5.4, 13.6]} />
            <meshStandardMaterial color={hullColor} metalness={0.72} roughness={0.28} />
          </mesh>
          <mesh position={[wx < 0 ? 0.23 : -0.23, 0.2, 0]}>
            <boxGeometry args={[0.04, 1.8, 7.6]} />
            <meshPhysicalMaterial color={accentColor} transmission={0.6} transparent opacity={0.45} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Front Wall Flanks & Airlock Arch */}
      {[-4.5, 4.5].map((fx, fi) => (
        <mesh key={`base-front-flank-${fi}`} position={[fx, 2.8, 6.6]} castShadow receiveShadow>
          <boxGeometry args={[4.6, 5.4, 0.44]} />
          <meshStandardMaterial color={hullColor} metalness={0.72} roughness={0.28} />
        </mesh>
      ))}
      <mesh position={[0, 4.7, 6.6]} castShadow>
        <boxGeometry args={[4.4, 1.6, 0.56]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Airlock Portal Steel Frame & Status LEDs */}
      <group position={[0, 2.0, 6.65]}>
        <mesh position={[-2.18, 0, 0]} castShadow>
          <boxGeometry args={[0.24, 3.8, 0.68]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[2.18, 0, 0]} castShadow>
          <boxGeometry args={[0.24, 3.8, 0.68]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Automatic Door Status Indicator Bar */}
        <mesh position={[0, 1.86, 0.36]}>
          <boxGeometry args={[3.4, 0.12, 0.08]} />
          <meshBasicMaterial color={isDoorOpen ? '#10b981' : '#f59e0b'} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 2. AUTOMATIC SLIDING METAL BLAST DOORS                         */}
      {/* ============================================================== */}
      <group position={[0, 2.0, 6.65]}>
        {/* Left Sliding Metal Door Leaf */}
        <group ref={leftDoorRef} position={[-1.06, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.08, 3.55, 0.16]} />
            <meshStandardMaterial color="#64748b" metalness={0.92} roughness={0.22} />
          </mesh>
          <mesh position={[0.45, 0, 0.09]}>
            <boxGeometry args={[0.62, 2.9, 0.03]} />
            <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.3} />
          </mesh>
          <mesh position={[0, -1.45, 0.09]}>
            <boxGeometry args={[2.04, 0.22, 0.03]} />
            <meshStandardMaterial color={trimColor} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>

        {/* Right Sliding Metal Door Leaf */}
        <group ref={rightDoorRef} position={[1.06, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.08, 3.55, 0.16]} />
            <meshStandardMaterial color="#64748b" metalness={0.92} roughness={0.22} />
          </mesh>
          <mesh position={[-0.45, 0, 0.09]}>
            <boxGeometry args={[0.62, 2.9, 0.03]} />
            <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.3} />
          </mesh>
          <mesh position={[0, -1.45, 0.09]}>
            <boxGeometry args={[2.04, 0.22, 0.03]} />
            <meshStandardMaterial color={trimColor} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Base Identification Sign above Entrance */}
      <Text
        position={[0, 4.75, 6.96]}
        fontSize={0.38}
        color={accentColor}
        fontWeight="bold"
        anchorX="center"
        outlineWidth={0.03}
        outlineColor="#020617"
      >
        {baseTitle}
      </Text>
      <Text
        position={[0, 4.22, 6.96]}
        fontSize={0.20}
        color={isDoorOpen ? '#6ee7b7' : '#fde68a'}
        fontWeight="bold"
        anchorX="center"
      >
        {isDoorOpen ? 'PORTA METÁLICA ABERTA • ENTRE PARA RECARREGAR' : 'APROXIME-SE • PORTA AUTOMÁTICA'}
      </Text>

      {/* ============================================================== */}
      {/* 3. ROOF CANOPY, GEODESIC SKYLIGHT & PLANET-THEMED ARCHITECTURE */}
      {/* ============================================================== */}
      <group position={[0, 5.55, 0]}>
        {/* Outer Reinforced Roof Perimeter Ring */}
        <mesh position={[0, 0, -4.6]} castShadow>
          <boxGeometry args={[14.0, 0.32, 4.6]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0, 4.6]} castShadow>
          <boxGeometry args={[14.0, 0.32, 4.6]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.28} />
        </mesh>
        <mesh position={[-4.6, 0, 0]} castShadow>
          <boxGeometry args={[4.8, 0.32, 4.6]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.28} />
        </mesh>
        <mesh position={[4.6, 0, 0]} castShadow>
          <boxGeometry args={[4.8, 0.32, 4.6]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.28} />
        </mesh>

        {/* Central Translucent Aerospace Skylight Dome */}
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[3.4, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          <meshPhysicalMaterial
            color={roofAccent}
            metalness={0.25}
            roughness={0.1}
            transmission={0.68}
            transparent
            opacity={0.72}
            side={DoubleSide}
          />
        </mesh>

        {/* Roof High-Gain Comm Dish & Solar Wings */}
        <group position={[3.8, 1.4, -3.5]} rotation={[-0.35, 0.4, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.6, 0.25, 0.45, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
        {[-9.2, 9.2].map((sx, si) => (
          <mesh key={`base-solar-${si}`} position={[sx, -1.6, 0]} rotation={[0.35, 0, 0]} castShadow>
            <boxGeometry args={[4.2, 0.12, 7.2]} />
            <meshStandardMaterial color="#1e3a8a" metalness={0.85} roughness={0.18} />
          </mesh>
        ))}
      </group>

      {/* ============================================================== */}
      {/* 4. INTERIOR AEROSPACE TECHNOLOGIES & ILLUMINATION              */}
      {/* ============================================================== */}
      <pointLight position={[0, 4.6, 0]} color="#f8fafc" intensity={4.5} distance={22} />
      <pointLight position={[0, 2.4, 4.0]} color={accentColor} intensity={2.2} distance={14} />

      {/* Central Holographic Telemetry Table */}
      <group position={[0, 0.22, 0]}>
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.05, 1.25, 0.96, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.98, 0]}>
          <cylinderGeometry args={[0.92, 0.92, 0.06, 16]} />
          <meshBasicMaterial color="#0c4a6e" />
        </mesh>
        {/* Rotating Holographic Sphere & Orbital Ring */}
        <group ref={holoGlobeRef} position={[0, 1.68, 0]}>
          <mesh>
            <sphereGeometry args={[0.42, 18, 18]} />
            <meshBasicMaterial color={accentColor} wireframe transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[Math.PI / 3, 0.3, 0]}>
            <torusGeometry args={[0.62, 0.022, 8, 32]} />
            <meshBasicMaterial color={trimColor} />
          </mesh>
        </group>
      </group>

      {/* Rear Scientific Server Banks & Multi-Monitor Telemetry Consoles */}
      <group position={[0, 0.22, -5.2]}>
        {[-3.4, 0, 3.4].map((rx, ri) => (
          <group key={`tech-rack-${ri}`} position={[rx, 1.45, 0]}>
            <mesh castShadow>
              <boxGeometry args={[2.1, 2.8, 0.95]} />
              <meshStandardMaterial color="#0f172a" metalness={0.88} roughness={0.28} />
            </mesh>
            {/* Glowing Telemetry Screens */}
            <mesh position={[0, 0.45, 0.49]}>
              <planeGeometry args={[1.65, 0.92]} />
              <meshBasicMaterial color={ri === 1 ? '#0369a1' : '#065f46'} />
            </mesh>
            <mesh position={[0, -0.45, 0.49]}>
              <planeGeometry args={[1.65, 0.22]} />
              <meshBasicMaterial color={accentColor} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Cryogenic O2 Scrubber & Hydroponic Bio-Pod Columns */}
      {[-4.8, 4.8].map((cx, ci) => (
        <group key={`bio-scrubber-${ci}`} position={[cx, 0.22, -4.4]}>
          <mesh position={[0, 1.8, 0]} castShadow>
            <cylinderGeometry args={[0.65, 0.72, 3.6, 18]} />
            <meshPhysicalMaterial
              color={variant === 'mars' || ci === 0 ? '#10b981' : '#38bdf8'}
              transmission={0.65}
              transparent
              opacity={0.78}
              roughness={0.12}
            />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 3.2, 12]} />
            <meshBasicMaterial color={variant === 'mars' || ci === 0 ? '#34d399' : '#7dd3fc'} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.82, 0.88, 0.4, 18]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ============================================================== */}
      {/* 5. HYDRATION & SUIT PROTECTION REFILL STATION (INSIDE BASE)    */}
      {/* ============================================================== */}
      <group position={[-4.2, 0.22, 2.1]}>
        <mesh position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[1.45, 2.3, 0.85]} />
          <meshStandardMaterial color="#0f172a" metalness={0.86} roughness={0.25} />
        </mesh>
        {/* Glowing Blue Water Tank & Green Shield Unit */}
        <mesh position={[-0.34, 1.35, 0.44]}>
          <cylinderGeometry args={[0.22, 0.22, 1.15, 16]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
        <mesh position={[0.34, 1.35, 0.44]}>
          <boxGeometry args={[0.42, 1.1, 0.14]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.35, 32]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.65} />
        </mesh>
        <Text position={[0, 2.65, 0.2]} fontSize={0.22} color="#6ee7b7" fontWeight="bold" anchorX="center">
          HIDRATAÇÃO & PROTEÇÃO
        </Text>

        {nearRefill && (
          <Html position={[0, 2.1, 0.6]} center distanceFactor={10}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerRefillStation();
              }}
              className="flex flex-col items-center gap-1 bg-slate-950/95 border border-emerald-400/90 px-3.5 py-2.5 rounded-2xl shadow-2xl text-white cursor-pointer active:scale-95 transition-transform min-w-[205px]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>{refillFeedback ? 'Recarregado 100%!' : '[B] / Toque: Recarregar'}</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-200">
                Restaura Água, O₂ & Proteção do Traje
              </span>
            </button>
          </Html>
        )}
      </group>

      {/* ============================================================== */}
      {/* 6. COLLECTIBLE HYDRATION & ARMOR SUPPLY PODS FOR BACKPACK      */}
      {/* ============================================================== */}
      {internalPods.map((pod) => {
        if (collectedNodeIds.includes(pod.id)) return null;
        const def = RESOURCE_DEFINITIONS[pod.resourceId];
        const isNearby = nearestPodId === pod.id;
        const podColor =
          pod.resourceId === 'pure_water'
            ? '#06b6d4'
            : pod.resourceId === 'oxygen_canister'
            ? '#38bdf8'
            : '#10b981';

        return (
          <group key={pod.id} position={pod.localPos}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.24, 0.24, 0.72, 20]} />
              <meshStandardMaterial color={podColor} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.86, 0]}>
              <cylinderGeometry args={[0.1, 0.18, 0.14, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.18} />
            </mesh>
            <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.55, 0.74, 28]} />
              <meshBasicMaterial color={podColor} transparent opacity={isNearby ? 0.9 : 0.45} />
            </mesh>

            {isNearby && (
              <Html position={[0, 1.45, 0]} center distanceFactor={10}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCollectPod(pod);
                  }}
                  className="flex flex-col items-center gap-1 bg-slate-950/95 border border-cyan-400/85 px-3 py-2 rounded-2xl shadow-2xl text-white cursor-pointer active:scale-95 transition-transform min-w-[185px]"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    {pod.resourceId === 'pure_water' ? (
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    ) : pod.resourceId === 'oxygen_canister' ? (
                      <Wind className="w-3.5 h-3.5 text-sky-400" />
                    ) : (
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>[B] / Toque: Coletar</span>
                  </div>
                  <span className="text-[11px] font-semibold text-white">
                    {def?.name || pod.resourceId} +{pod.yieldAmount}
                  </span>
                  {def?.effectLabel && (
                    <span className="text-[9px] font-mono font-bold text-emerald-300">
                      {def.effectLabel}
                    </span>
                  )}
                </button>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
