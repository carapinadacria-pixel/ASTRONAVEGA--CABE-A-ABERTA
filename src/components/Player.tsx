import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group, Quaternion, Color, MathUtils } from 'three';
import { useGameStore, livePlayerMotion } from '../store';
import { UI_TEXT } from '../utils/i18n';
import { useKeyboardControls, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { RigidBody, CapsuleCollider, RapierRigidBody, useRapier } from '@react-three/rapier';
import { AstronautCharacter } from './AstronautCharacter';
import { carVisualGroups } from './RealisticCars';
import { SUIT_TABLE_POS, MOON_FLAG_SPOT_POS } from './StoryMissionProps';
import {
  playWaterSplashSound,
  playWaterWadeSound,
  playCarCrashSound,
  updateSpatialAudio,
  updateCarAudio,
  setAudioEnvironment,
  playAstronautDeathSound,
} from '../audio';
import { getOceanWaveHeight } from './CoastalOcean';

interface PlayerProps {
  onAction: (action: string) => void;
  actionRequested: string | null;
}

// ---------------------------------------------------------------------------
// DYNAMIC WATER SPLASH & SURFACE FOAM RIPPLE PARTICLES
// ---------------------------------------------------------------------------
function WaterSplashFX({ active, speed }: { active: boolean; speed: number }) {
  const rippleRef = useRef<Group>(null);
  const splashRef = useRef<Group>(null);

  const droplets = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      vel: [
        (Math.random() - 0.5) * 1.8,
        0.5 + Math.random() * 1.4,
        (Math.random() - 0.5) * 1.8,
      ] as [number, number, number],
      speed: 2.0 + Math.random() * 1.5,
      phase: (i / 14) * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!rippleRef.current || !splashRef.current) return;
    if (!active) {
      if (rippleRef.current.visible) rippleRef.current.visible = false;
      if (splashRef.current.visible) splashRef.current.visible = false;
      return;
    }
    const t = state.clock.getElapsedTime();
    rippleRef.current.visible = true;
    splashRef.current.visible = speed > 0.3;

    // Concentric expanding foam ripple rings on water surface
    rippleRef.current.children.forEach((child, i) => {
      const ringCycle = (t * 1.1 + i * 0.33) % 1;
      const scale = 0.5 + ringCycle * 3.2;
      child.scale.set(scale, scale, 1);
      const mat = (child as any).material;
      if (mat) {
        mat.opacity = (1 - ringCycle) * 0.65;
      }
    });

    // Splashing water droplet spray
    splashRef.current.children.forEach((child, i) => {
      const d = droplets[i];
      const cycle = (t * d.speed + d.phase) % 1;
      child.position.x = d.vel[0] * cycle;
      child.position.y = d.vel[1] * cycle - 3.4 * cycle * cycle;
      child.position.z = d.vel[2] * cycle;
      const mat = (child as any).material;
      if (mat) {
        mat.opacity = (1 - cycle) * 0.75;
      }
    });
  });

  return (
    <group position={[0, -0.92, 0]}>
      {/* Expanding surface ripple rings */}
      <group ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={`water-ring-${i}`}>
            <ringGeometry args={[0.32, 0.46, 24]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.65} />
          </mesh>
        ))}
      </group>

      {/* Water spray droplets */}
      <group ref={splashRef}>
        {droplets.map((_, i) => (
          <mesh key={`splash-drop-${i}`}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshBasicMaterial color="#bae6fd" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Lightweight planetary surface dust puff particles
function FootstepDust({ active, speed }: { active: boolean; speed: number }) {
  const particlesRef = useRef<Group>(null);
  const dustParticles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      offset: [(Math.random() - 0.5) * 0.4, 0.05 + Math.random() * 0.1, (Math.random() - 0.5) * 0.4] as [number, number, number],
      scale: 0.04 + Math.random() * 0.06,
      opacity: 0.3 + Math.random() * 0.4,
      speed: 0.8 + Math.random() * 0.6,
      phase: (i / 8) * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    if (!active || speed <= 0.6) {
      if (particlesRef.current.visible) particlesRef.current.visible = false;
      return;
    }
    particlesRef.current.visible = true;
    const t = state.clock.getElapsedTime();
    particlesRef.current.children.forEach((child, i) => {
      const p = dustParticles[i];
      child.visible = true;
      const cycle = (t * p.speed * 4 + p.phase) % 1;
      child.position.y = 0.02 + cycle * 0.18;
      const currentScale = p.scale * (1 + cycle * 1.5);
      child.scale.set(currentScale, currentScale, currentScale);
      const mesh = child as any;
      if (mesh.material) {
        mesh.material.opacity = (1 - cycle) * p.opacity;
      }
    });
  });

  return (
    <group ref={particlesRef} position={[0, -0.92, 0]}>
      {dustParticles.map((p, i) => (
        <mesh key={i} position={p.offset}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#d4d4d8" transparent opacity={p.opacity} />
        </mesh>
      ))}
    </group>
  );
}

// High-performance reusable scratch vectors to eliminate per-frame GC allocations (60 FPS fluidity)
const _currentVel = new Vector3();
const _camForward = new Vector3();
const _camRight = new Vector3();
const _desiredMove = new Vector3();
const _normal = new Vector3();
const _slopeTangent = new Vector3();
const _moveDir = new Vector3();
const _lookAtPos = new Vector3();
const _upVector = new Vector3(0, 1, 0);

// Pre-allocated Rapier ray definitions to prevent GC freezes on mobile
const _downRayOrigin = { x: 0, y: 0, z: 0 };
const _downRayDir = { x: 0, y: -1, z: 0 };
let _cachedDownRay: any = null;

const _footRayOrigin = { x: 0, y: 0, z: 0 };
const _footRayDir = { x: 0, y: 0, z: 0 };
let _cachedFootRay: any = null;

const _toeRayOrigin = { x: 0, y: 0, z: 0 };
const _toeRayDir = { x: 0, y: 0, z: 0 };
let _cachedToeRay: any = null;

const _waistRayOrigin = { x: 0, y: 0, z: 0 };
const _waistRayDir = { x: 0, y: 0, z: 0 };
let _cachedWaistRay: any = null;

export function Player({ onAction, actionRequested }: PlayerProps) {
  const characterGender = useGameStore((state) => state.characterGender);
  const visorMode = useGameStore((state) => state.visorMode);
  const suitStyle = useGameStore((state) => state.suitStyle);

  const rb = useRef<RapierRigidBody>(null);
  const group = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const prevCamPlayerPos = useRef<Vector3 | null>(null);

  const [_, get] = useKeyboardControls();
  const cameraMode = useGameStore((state) => state.cameraMode);
  const isLaunching = useGameStore((state) => state.isLaunching);
  const gravity = useGameStore((state) => state.gravity);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const drivingCarId = useGameStore((state) => state.drivingCarId);
  const gameMode = useGameStore((state) => state.gameMode);
  const storyStep = useGameStore((state) => state.storyStep);
  const hasSpacesuit = useGameStore((state) => state.hasSpacesuit);
  const isFlagPlantedOnMoon = useGameStore((state) => state.isFlagPlantedOnMoon);
  const { camera } = useThree();
  const { rapier, world } = useRapier();

  // Animation and movement states
  const [actionName, setActionName] = useState<string>('idle');
  const actionNameRef = useRef<string>('idle');
  const prevNearVAB = useRef<boolean>(false);
  const prevNearCarId = useRef<string | null>(null);
  const prevNearRocket = useRef<boolean>(false);
  const prevNearSuitTable = useRef<boolean>(false);
  const prevNearFlagSpot = useRef<boolean>(false);
  const prevNearComputer = useRef<boolean>(false);
  const prevNearComputerTitle = useRef<string | null>(null);
  const prevDrivingCarId = useRef<string | null>(null);
  const [inWater, setInWater] = useState<boolean>(false);
  const inWaterRef = useRef<boolean>(false);
  const wadeTimer = useRef<number>(0);
  const prevJumpRef = useRef<boolean>(false);

  // Ground contact hysteresis and camera stabilization refs
  const wasGroundedRef = useRef<boolean>(true);
  const firstPersonEyePos = useRef<Vector3 | null>(null);
  const prevCameraMode = useRef<'first' | 'third'>(cameraMode);

  // Smart chase camera state refs: allows manual orbit overrides while auto-following during locomotion
  const isUserOrbiting = useRef<boolean>(false);
  const lastUserOrbitTime = useRef<number>(0);
  const lastCarCrashTime = useRef<number>(0);
  const lastFuelWarnTime = useRef<number>(0);
  const lastHandledRespawnAt = useRef<number | null>(useGameStore.getState().lastRespawnAt);
  const dyingTimerRef = useRef<number>(0);
  const isDying = useGameStore((state) => state.isDying);
  const carCamYawRef = useRef<number | null>(null);
  const carCockpitPitchRef = useRef<number>(0);
  const carCockpitYawRef = useRef<number>(0);
  const smoothedCornerSteerRef = useRef<number>(0);

  // Swept OBB & Perimeter Obstacle Collision Check for Driveable Vehicles:
  // Tests 7 perimeter points of the car (front bumper left/center/right, mid-sides, rear bumper left/right)
  // against all base buildings, walls, pillars, Hangar sliding gate, Rocket pad, EV chargers, and other cars.
  const checkCarObstacleCollision = (
    nx: number,
    nz: number,
    rot: number,
    currentCarId: string,
    cars: Record<string, any>,
    isHangarDoorOpen: boolean
  ): boolean => {
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const halfW = 0.96;
    const halfL = 2.22;

    const localPoints: [number, number][] = [
      [0, halfL],
      [-halfW, halfL],
      [halfW, halfL],
      [-halfW, 0],
      [halfW, 0],
      [-halfW, -halfL],
      [halfW, -halfL],
    ];

    // 1. Check collision against all other 15 vehicles in the base (Oriented Bounding Box check)
    for (const cid in cars) {
      if (cid === currentCarId) continue;
      const other = cars[cid];
      const dxC = nx - other.x;
      const dzC = nz - other.z;
      if (dxC * dxC + dzC * dzC < 4.8 * 4.8) {
        const cosO = Math.cos(other.rot);
        const sinO = Math.sin(other.rot);
        for (let i = 0; i < localPoints.length; i++) {
          const [lx, lz] = localPoints[i];
          const wx = nx + lx * cosR + lz * sinR;
          const wz = nz - lx * sinR + lz * cosR;
          const relX = (wx - other.x) * cosO - (wz - other.z) * sinO;
          const relZ = (wx - other.x) * sinO + (wz - other.z) * cosO;
          if (Math.abs(relX) < 1.15 && Math.abs(relZ) < 2.38) {
            return true;
          }
        }
      }
    }

    // 2. Check all 7 car perimeter points against static solid obstacles
    for (let i = 0; i < localPoints.length; i++) {
      const [lx, lz] = localPoints[i];
      const px = nx + lx * cosR + lz * sinR;
      const pz = nz - lx * sinR + lz * cosR;

      // A. Ocean Seawall / Coastal Boundary (West X < -23.2)
      if (px < -23.2) return true;

      // B. Launch Pad 39A & Rocket Base (Tightened to exact concrete pad X: -16.2..24.5, Z: -16.2..16.2 + Front Stairs X: 24.5..33.6, Z: -3.2..3.2)
      if (px >= -16.2 && px <= 24.5 && pz >= -16.2 && pz <= 16.2) return true;
      if (px >= 24.5 && px <= 33.6 && pz >= -3.2 && pz <= 3.2) return true;

      // C. Scientific Laboratory Building Shell, Glass Walls & Pillars (X: 201.6..258.4, Z: -91.2..-64.8)
      if (px >= 201.6 && px <= 258.4 && pz >= -91.2 && pz <= -64.8) return true;

      // D. Laboratory West Entrance Canopy Columns (X ≈ 196.6, Z ≈ -84.1 and -71.9)
      if (Math.hypot(px - 196.6, pz - -84.1) < 0.72) return true;
      if (Math.hypot(px - 196.6, pz - -71.9) < 0.72) return true;

      // E. EV Charging Stations at North-West stalls of Parking Lot (X = 222.0 and 232.0, Z = -112.5)
      // Leaves the West Arterial Road (X = 182..194) and Parking Lot Entrance Curve (X = 182..215) 100% unobstructed!
      if (Math.hypot(px - 222.0, pz - -112.5) < 0.72) return true;
      if (Math.hypot(px - 232.0, pz - -112.5) < 0.72) return true;

      // F. VAB Hangar Exterior Walls, Flank Walls, Sliding Gate & Interior Structures (World X ≈ 220..300, Z ≈ -50..50)
      // North Wall (Z: 48.0..50.6, X: 219.4..300.6)
      if (px >= 219.4 && px <= 300.6 && pz >= 48.0 && pz <= 50.6) return true;
      // South Wall (Z: -50.6..-48.0, X: 219.4..300.6)
      if (px >= 219.4 && px <= 300.6 && pz >= -50.6 && pz <= -48.0) return true;
      // East Rear Wall (X: 298.0..300.6, Z: -50.6..50.6)
      if (px >= 298.0 && px <= 300.6 && pz >= -50.6 && pz <= 50.6) return true;
      // West Left Flank Wall (X: 219.4..222.2, Z: -50.6..-15.8)
      if (px >= 219.4 && px <= 222.2 && pz >= -50.6 && pz <= -15.8) return true;
      // West Right Flank Wall (X: 219.4..222.2, Z: 15.8..50.6)
      if (px >= 219.4 && px <= 222.2 && pz >= 15.8 && pz <= 50.6) return true;
      // West Hangar Sliding Blast Gate (X: 219.6..222.0, Z: -16.0..16.0) when gate is closed!
      if (!isHangarDoorOpen && px >= 219.6 && px <= 222.0 && pz >= -16.0 && pz <= 16.0) return true;
      // Hangar Interior Primary Rocket Stand (X: 270, Z: -18, radius 7.4m) & Secondary Rocket Bay (X: 270, Z: 22, radius 7.4m)
      if (Math.hypot(px - 270.0, pz - -18.0) < 7.4) return true;
      if (Math.hypot(px - 270.0, pz - 22.0) < 7.4) return true;
      // Hangar Interior Support Columns (exact column footprints only; open Hangar floor is 100% clear!)
      if (Math.hypot(px - 234.1, pz - -13.0) < 0.85) return true;
      if (Math.hypot(px - 256.9, pz - -13.0) < 0.85) return true;
      if (Math.hypot(px - 234.1, pz - 9.8) < 0.85) return true;
      if (Math.hypot(px - 256.9, pz - 9.8) < 0.85) return true;
    }

    return false;
  };

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      isUserOrbiting.current = true;
      lastUserOrbitTime.current = performance.now();
    };
    const onEnd = () => {
      isUserOrbiting.current = false;
      lastUserOrbitTime.current = performance.now();
    };
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);
    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    };
  }, []);

  // Reposition player cleanly when landing on another planet or returning to Earth
  useEffect(() => {
    if (!rb.current || !group.current) return;
    const spawnPos: [number, number, number] = planetIndex === 0 ? [255, 1.2, 5] : [0, 1.2, 9.5];
    rb.current.setGravityScale(1.0, true);
    rb.current.setTranslation({ x: spawnPos[0], y: spawnPos[1], z: spawnPos[2] }, true);
    rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    group.current.position.set(spawnPos[0], spawnPos[1] - 0.93, spawnPos[2]);
    group.current.rotation.set(0, 0, 0);
    group.current.scale.set(1, 1, 1);
    prevNearRocket.current = false;
    useGameStore.getState().setIsNearRocket(false);
    prevCamPlayerPos.current = new Vector3(spawnPos[0], spawnPos[1] + 0.25, spawnPos[2]);
    camera.up.set(0, 1, 0);
    camera.position.set(spawnPos[0], spawnPos[1] + 1.4, spawnPos[2] + 5.0);
    if (controlsRef.current) {
      controlsRef.current.target.set(spawnPos[0], spawnPos[1] + 0.25, spawnPos[2]);
      controlsRef.current.update();
    }
  }, [planetIndex, camera]);

  // Synchronize surface acoustic environment per planet & mute vehicle engine on unmount
  useEffect(() => {
    setAudioEnvironment('surface', planetIndex);
  }, [planetIndex]);

  useEffect(() => {
    return () => {
      updateCarAudio(false, 0, 0, false, false);
    };
  }, []);

  // Allow free vertical & horizontal look inside the 1st-person car cockpit (so user can look up at the interior roof/ceiling!)
  useEffect(() => {
    if (!drivingCarId || cameraMode !== 'first') {
      carCockpitPitchRef.current = 0;
      carCockpitYawRef.current = 0;
      return;
    }
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName !== 'CANVAS') return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      carCockpitYawRef.current = MathUtils.clamp(carCockpitYawRef.current - dx * 0.0045, -1.15, 1.15);
      // Dragging up/down tilts the 1st-person cockpit camera up to inspect the car ceiling (+0.95 rad) or down to the steering wheel (-0.45 rad)
      carCockpitPitchRef.current = MathUtils.clamp(carCockpitPitchRef.current - dy * 0.0045, -0.45, 0.95);
    };
    const onPointerUp = () => {
      dragging = false;
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [drivingCarId, cameraMode]);

  // Female vs Male physical mass and response differentiation
  const isFemale = characterGender === 'female';

  useEffect(() => {
    if (actionRequested === 'build' && rb.current) {
      const pos = rb.current.translation();
      if (pos && pos.x !== undefined) {
        useGameStore.getState().buildBase(pos.x, pos.z);
      }
    }
    if (actionRequested === 'collect' && rb.current) {
      useGameStore.getState().addResource('iron', 1);
      if (Math.random() > 0.5) useGameStore.getState().addResource('titanium', 1);
      if (Math.random() > 0.8) useGameStore.getState().addResource('plasma', 1);
    }
  }, [actionRequested]);

  useFrame((state, delta) => {
    if (!rb.current || !group.current) return;

    const { forward, backward, left, right, jump, sprint } = get() as any;
    const storeState = useGameStore.getState();
    const joystick = storeState.joystick;
    const isMobileJump = storeState.mobileJump;
    const isMobileSprint = storeState.mobileSprint;
    const safeDelta = Math.min(delta, 0.05);

    // Tick hydration/oxygen/chamber countdown & handle death fall animation or rocket crash respawn
    storeState.tickLifeSupport(safeDelta);
    const liveStateAfterTick = useGameStore.getState();
    const externalRespawnTriggered =
      liveStateAfterTick.lastRespawnAt !== null &&
      liveStateAfterTick.lastRespawnAt !== lastHandledRespawnAt.current;

    if (externalRespawnTriggered) {
      if (prevDrivingCarId.current) {
        const crashedCar = storeState.carStates[prevDrivingCarId.current];
        if (crashedCar) {
          crashedCar.speed = 0;
          crashedCar.steer = 0;
        }
        prevDrivingCarId.current = null;
      }
      updateCarAudio(false, 0, 0, false, false);
      const postRespawnState = useGameStore.getState();
      lastHandledRespawnAt.current = postRespawnState.lastRespawnAt;
      const [rx, ry, rz] = postRespawnState.respawnTargetPosition;
      rb.current.setGravityScale(1.0, true);
      rb.current.setTranslation({ x: rx, y: ry, z: rz }, true);
      rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      group.current.position.set(rx, ry - 0.93, rz);
      group.current.rotation.set(0, 0, 0);
      group.current.scale.set(1, 1, 1);
      if (bodyRef.current) {
        bodyRef.current.rotation.set(0, 0, 0);
        bodyRef.current.position.set(0, 0, 0);
        bodyRef.current.visible = cameraMode === 'third';
      }
      if (actionNameRef.current !== 'idle') {
        actionNameRef.current = 'idle';
        setActionName('idle');
      }
      carCamYawRef.current = null;
      prevCamPlayerPos.current = new Vector3(rx, ry + 0.25, rz);
      camera.up.set(0, 1, 0);
      camera.position.set(rx, ry + 1.3, rz + 4.2);
      if (controlsRef.current) {
        controlsRef.current.target.set(rx, ry + 0.25, rz);
        controlsRef.current.update();
      }
      return;
    }

    if (liveStateAfterTick.health <= 0 && !liveStateAfterTick.isDying) {
      if (prevDrivingCarId.current) {
        const parkedCar = storeState.carStates[prevDrivingCarId.current];
        if (parkedCar) {
          parkedCar.speed = 0;
          parkedCar.steer = 0;
        }
        prevDrivingCarId.current = null;
      }
      updateCarAudio(false, 0, 0, false, false);
      const reason =
        liveStateAfterTick.planetIndex !== 0 && !liveStateAfterTick.isOxygenChamberOpen
          ? 'oxygen_chamber'
          : 'hazard';
      liveStateAfterTick.startDying(reason);
      dyingTimerRef.current = 0;
      playAstronautDeathSound();
    }

    if (useGameStore.getState().isDying) {
      dyingTimerRef.current += safeDelta;
      const curPos = rb.current.translation();
      const curVel = rb.current.linvel();
      rb.current.setGravityScale(1.0, true);
      rb.current.setLinvel({ x: 0, y: Math.min(0, curVel.y), z: 0 }, true);
      group.current.position.set(curPos.x, curPos.y - 0.93, curPos.z);
      group.current.scale.set(1, 1, 1);

      if (actionNameRef.current !== 'dead') {
        actionNameRef.current = 'dead';
        setActionName('dead');
      }

      if (bodyRef.current) {
        bodyRef.current.visible = true;
        bodyRef.current.rotation.order = 'YXZ';
        bodyRef.current.rotation.x = MathUtils.damp(bodyRef.current.rotation.x, -Math.PI / 2, 7.5, safeDelta);
        bodyRef.current.rotation.z = MathUtils.damp(bodyRef.current.rotation.z, 0.14, 6.0, safeDelta);
        bodyRef.current.position.y = MathUtils.damp(bodyRef.current.position.y, 0.24, 7.5, safeDelta);
      }
      livePlayerMotion.action = 'idle';
      livePlayerMotion.isJumping = false;
      livePlayerMotion.inWater = false;
      livePlayerMotion.deepWater = false;
      livePlayerMotion.speed = 0;
      livePlayerMotion.bodyYOffset = 0;
      livePlayerMotion.bodyPitch = 0;

      // Ensure player sees the astronaut collapse even when in 1st-person mode
      const camTargetX = curPos.x;
      const camTargetY = curPos.y - 0.35;
      const camTargetZ = curPos.z;
      camera.up.set(0, 1, 0);
      if (cameraMode === 'first') {
        camera.position.set(
          MathUtils.damp(camera.position.x, curPos.x + 1.85, 6.0, safeDelta),
          MathUtils.damp(camera.position.y, curPos.y + 1.45, 6.0, safeDelta),
          MathUtils.damp(camera.position.z, curPos.z + 2.35, 6.0, safeDelta)
        );
      }
      camera.lookAt(camTargetX, camTargetY, camTargetZ);
      if (controlsRef.current) {
        controlsRef.current.target.set(camTargetX, camTargetY, camTargetZ);
        controlsRef.current.update();
      }

      if (dyingTimerRef.current >= 2.2) {
        dyingTimerRef.current = 0;
        useGameStore.getState().completeDeathRespawn();
        const postRespawnState = useGameStore.getState();
        lastHandledRespawnAt.current = postRespawnState.lastRespawnAt;
        const [rx, ry, rz] = postRespawnState.respawnTargetPosition;
        rb.current.setGravityScale(1.0, true);
        rb.current.setTranslation({ x: rx, y: ry, z: rz }, true);
        rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        group.current.position.set(rx, ry - 0.93, rz);
        group.current.rotation.set(0, 0, 0);
        group.current.scale.set(1, 1, 1);
        if (bodyRef.current) {
          bodyRef.current.rotation.set(0, 0, 0);
          bodyRef.current.position.set(0, 0, 0);
          bodyRef.current.visible = cameraMode === 'third';
        }
        actionNameRef.current = 'idle';
        setActionName('idle');
        carCamYawRef.current = null;
        prevCamPlayerPos.current = new Vector3(rx, ry + 0.25, rz);
        camera.up.set(0, 1, 0);
        camera.position.set(rx, ry + 1.3, rz + 4.2);
        if (controlsRef.current) {
          controlsRef.current.target.set(rx, ry + 0.25, rz);
          controlsRef.current.update();
        }
      }
      return;
    }

    const inputForward = (forward ? 1 : 0) - (backward ? 1 : 0) + (joystick?.y || 0);
    const inputRight = (right ? 1 : 0) - (left ? 1 : 0) + (joystick?.x || 0);
    const isSprintKey = Boolean(sprint) || isMobileSprint;

    // -----------------------------------------------------------
    // VEHICLE DRIVING MODE (WHEN PLAYER IS DRIVING A CAR)
    // Supports both 1st-Person Interior Cockpit View (Volante + Vidro)
    // and 3rd-Person Exterior View (Astronaut seated holding Volante)
    // -----------------------------------------------------------
    const activeCarId = storeState.drivingCarId;
    if (prevDrivingCarId.current && !activeCarId) {
      // Just exited a vehicle: place astronaut cleanly beside the left driver's door (X = +2.35 local)
      const exitedCar = storeState.carStates[prevDrivingCarId.current];
      if (exitedCar) {
        const exitX = exitedCar.x + Math.cos(exitedCar.rot) * 2.35;
        const exitZ = exitedCar.z - Math.sin(exitedCar.rot) * 2.35;
        rb.current.setGravityScale(1.0, true);
        rb.current.setTranslation({ x: exitX, y: 1.25, z: exitZ }, true);
        rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        group.current.position.set(exitX, 0.32, exitZ);
        group.current.rotation.set(0, 0, 0);
        group.current.scale.set(1, 1, 1);
        exitedCar.speed = 0;
        exitedCar.steer = 0;
      }
      if (actionName === 'drive') {
        setActionName('idle');
      }
      storeState.setCarSpeedKmh(0);
      updateCarAudio(false, 0, 0, false, false);
      prevDrivingCarId.current = null;
      carCamYawRef.current = null;
    } else if (activeCarId) {
      prevDrivingCarId.current = activeCarId;
      if (actionName !== 'drive') {
        setActionName('drive');
      }
      const car = storeState.carStates[activeCarId];
      if (car) {
        // Progressive physical torque acceleration (m/s²) & authentic 1:1 speedometer calibration (1 m/s = 3.6 km/h)
        // Sedan/SUV/Convertible: 36.2 m/s (130 km/h normal, 162 km/h turbo); Supercar: 47.2 m/s (170 km/h normal, 212 km/h turbo)
        const maxCarSpeed = (car.type === 'supercar' ? 47.2 : 36.2) * (isSprintKey ? 1.25 : 1.0);
        const engineAccel = (car.type === 'supercar' ? 14.5 : 11.2) * (isSprintKey ? 1.30 : 1.0);
        const reverseAccel = 9.5;
        const brakeDecel = 28.0;
        const coastDecel = 5.2;

        const kbForward = (forward ? 1 : 0) - (backward ? 1 : 0);
        const kbRight = (right ? 1 : 0) - (left ? 1 : 0);
        const joyX = joystick?.x || 0;
        const joyY = joystick?.y || 0;

        // Direct throttle & steering from keyboard or mobile directional arrows (Cima/Baixo/Esquerda/Direita)
        const rawThrottle = kbForward !== 0 ? kbForward : joyY;
        const throttle = Math.max(-1, Math.min(1, rawThrottle));

        const rawSteer = kbRight !== 0 ? -kbRight : -joyX;
        const curvedSteer = Math.sign(rawSteer) * Math.pow(Math.min(1.0, Math.abs(rawSteer)), 1.1);
        const isBraking = Boolean(jump) || isMobileJump;

        if (isBraking) {
          if (car.speed > 0) {
            car.speed = Math.max(0, car.speed - brakeDecel * safeDelta);
          } else if (car.speed < 0) {
            car.speed = Math.min(0, car.speed + brakeDecel * safeDelta);
          }
        } else if (throttle > 0.04) {
          if (car.speed < 0) {
            // Braking from reverse before accelerating forward
            car.speed = Math.min(maxCarSpeed, car.speed + brakeDecel * safeDelta);
          } else {
            const targetCarSpeed = throttle * maxCarSpeed;
            // Progressive torque curve: strong launch torque that tapers near top speed
            const torqueFactor = 1.0 - Math.min(0.55, (car.speed / maxCarSpeed) * 0.55);
            const step = engineAccel * torqueFactor * safeDelta;
            if (car.speed < targetCarSpeed) {
              car.speed = Math.min(targetCarSpeed, car.speed + step);
            } else {
              car.speed = Math.max(targetCarSpeed, car.speed - coastDecel * safeDelta);
            }
          }
        } else if (throttle < -0.04) {
          if (car.speed > 0.2) {
            // Pressing Down/S while moving forward engages strong physical brakes first!
            car.speed = Math.max(0, car.speed - brakeDecel * safeDelta);
          } else {
            const maxRevSpeed = maxCarSpeed * 0.38;
            const targetRevSpeed = throttle * maxRevSpeed;
            const step = reverseAccel * safeDelta;
            if (car.speed > targetRevSpeed) {
              car.speed = Math.max(targetRevSpeed, car.speed - step);
            } else {
              car.speed = Math.min(targetRevSpeed, car.speed + coastDecel * safeDelta);
            }
          }
        } else {
          // Natural rolling resistance / engine coasting deceleration
          if (car.speed > 0) {
            car.speed = Math.max(0, car.speed - coastDecel * safeDelta);
          } else if (car.speed < 0) {
            car.speed = Math.min(0, car.speed + coastDecel * safeDelta);
          }
          if (Math.abs(car.speed) < 0.04) car.speed = 0;
        }

        // Real-time vehicle acceleration & brake friction sound
        updateCarAudio(true, car.speed, throttle, isBraking, isSprintKey);

        // Smooth front wheel steering angle & Ackermann yaw rotation with high-speed stability damping
        const highSpeedSteerDamp = 1.0 - Math.min(0.32, (Math.abs(car.speed) / maxCarSpeed) * 0.32);
        car.steer = MathUtils.damp(car.steer, curvedSteer * 0.52 * highSpeedSteerDamp, 12.0, safeDelta);
        const prevRot = car.rot;
        if (Math.abs(car.speed) > 0.08) {
          const speedFactor = Math.min(1.0, Math.abs(car.speed) / 3.8);
          const dirSign = car.speed >= 0 ? 1 : -1;
          car.rot += car.steer * 2.35 * speedFactor * dirSign * safeDelta;
        }

        // Candidate next position along car heading
        const candidateX = Math.max(-23.0, Math.min(480.0, car.x + Math.sin(car.rot) * car.speed * safeDelta));
        const candidateZ = Math.max(-320.0, Math.min(320.0, car.z + Math.cos(car.rot) * car.speed * safeDelta));

        // Solid Obstacle & Vehicle-to-Vehicle Crash Detection:
        // Stops on impact with a realistic elastic recoil and metallic crash sound without passing through anything!
        const hitObstacle = checkCarObstacleCollision(
          candidateX,
          candidateZ,
          car.rot,
          activeCarId,
          storeState.carStates,
          storeState.isHabitatDoorOpen
        );

        if (hitObstacle) {
          const impactSpeed = Math.abs(car.speed);
          const reboundSign = car.speed >= 0 ? -1 : 1;
          car.rot = prevRot;
          const reboundSpeed = reboundSign * Math.min(4.2, impactSpeed * 0.32 + 1.1);
          car.speed = reboundSpeed;

          const bounceX = car.x + Math.sin(car.rot) * reboundSpeed * safeDelta * 1.4;
          const bounceZ = car.z + Math.cos(car.rot) * reboundSpeed * safeDelta * 1.4;
          if (
            !checkCarObstacleCollision(
              bounceX,
              bounceZ,
              car.rot,
              activeCarId,
              storeState.carStates,
              storeState.isHabitatDoorOpen
            )
          ) {
            car.x = bounceX;
            car.z = bounceZ;
          }

          const nowMs = performance.now();
          if (impactSpeed > 0.8 && nowMs - lastCarCrashTime.current > 240) {
            lastCarCrashTime.current = nowMs;
            playCarCrashSound(impactSpeed);
          }
        } else {
          car.x = candidateX;
          car.z = candidateZ;
        }

        car.wheelSpin += (car.speed / 0.37) * safeDelta;

        // CRITICAL LOCKSTEP SYNC: Immediately update the 3D car visual group AND the seated astronaut group in the same frame BEFORE setting camera position!
        // Because the astronaut group is outside RigidBody and updated right here in the same useFrame callback,
        // the astronaut NEVER drifts forward through the windshield on W or backward through the driver's seat on S!
        const visualCarGroup = carVisualGroups[activeCarId];
        if (visualCarGroup) {
          visualCarGroup.position.set(car.x, car.y, car.z);
          visualCarGroup.rotation.set(0, car.rot, 0);
          visualCarGroup.updateMatrixWorld(true);
        }

        // Sync high-precision live KM/H (exact physical conversion 1 m/s = 3.6 km/h) to Zustand store
        const liveKmh = Math.abs(Math.round(car.speed * 3.6));
        if (storeState.carSpeedKmh !== liveKmh) {
          storeState.setCarSpeedKmh(liveKmh);
        }

        const cosR = Math.cos(car.rot);
        const sinR = Math.sin(car.rot);

        // Lock the unified Astronaut world group directly into the Left-Hand-Drive bucket seat (X = +0.38, Z = -0.14)
        // Calibrated so torso, helmet, and hands on the steering wheel are clearly visible while legs stay 100% above the floor pan!
        const driverSeatYOffset =
          car.type === 'supercar'
            ? 0.14
            : car.type === 'suv'
            ? 0.21
            : 0.17;
        const localSeatX = 0.38;
        const localSeatZ = -0.14;
        const seatWorldX = car.x + localSeatX * cosR + localSeatZ * sinR;
        const seatWorldY = car.y + driverSeatYOffset;
        const seatWorldZ = car.z - localSeatX * sinR + localSeatZ * cosR;

        group.current.position.set(seatWorldX, seatWorldY, seatWorldZ);
        group.current.rotation.set(0, car.rot, 0);
        group.current.scale.set(0.76, 0.76, 0.76);
        group.current.updateMatrixWorld(true);
        if (bodyRef.current) {
          bodyRef.current.position.set(0, 0, 0);
          bodyRef.current.rotation.set(0, 0, 0);
        }

        // Keep player RigidBody & store position locked to the vehicle
        rb.current.setGravityScale(0.0, true);
        rb.current.setTranslation({ x: car.x, y: 1.05, z: car.z }, true);
        rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        const storePos = storeState.playerPosition;
        storePos[0] = car.x;
        storePos[1] = 1.05;
        storePos[2] = car.z;
        storeState.playerSpeed = Math.abs(car.speed);
        livePlayerMotion.action = 'drive';
        livePlayerMotion.isJumping = false;
        livePlayerMotion.inWater = false;
        livePlayerMotion.deepWater = false;
        livePlayerMotion.yaw = car.rot;
        livePlayerMotion.speed = Math.abs(car.speed);
        livePlayerMotion.bodyYOffset = 0;
        livePlayerMotion.bodyPitch = 0;

        if (cameraMode === 'first') {
          // 1ST-PERSON COCKPIT VIEW: Strictly locked in the Left-Hand-Drive driver's seat (X = +0.38) in exact lockstep with visualCarGroup!
          // Features wider cockpit FOV (68°) so the interior roof header/ceiling, windshield, dashboard, and gloved hands on the steering wheel are all visible,
          // plus an intelligent cornering camera system that curves and banks smoothly into left/right turns!
          if ((camera as any).fov !== 68) {
            (camera as any).fov = 68;
            camera.updateProjectionMatrix();
          }

          const localEyeX = 0.38;
          const localEyeY =
            car.type === 'supercar'
              ? 0.95
              : car.type === 'suv'
              ? 1.06
              : 1.00;
          const localEyeZ = -0.22;

          const eyeWorldX = car.x + localEyeX * cosR + localEyeZ * sinR;
          const eyeWorldY = car.y + localEyeY;
          const eyeWorldZ = car.z - localEyeX * sinR + localEyeZ * cosR;

          // Intelligent Cornering Curve: smoothly anticipates left (+X) and right (-X) steering turns with dynamic look-ahead yaw & subtle roll banking!
          smoothedCornerSteerRef.current = MathUtils.damp(
            smoothedCornerSteerRef.current,
            car.steer,
            10.0,
            safeDelta
          );
          const cornerSteer = smoothedCornerSteerRef.current;

          // If user is actively steering and hasn't manually panned far away, gently recenter manual yaw offset
          if (Math.abs(car.steer) > 0.08 && Math.abs(car.speed) > 0.5) {
            carCockpitYawRef.current = MathUtils.damp(carCockpitYawRef.current, 0, 2.5, safeDelta);
          }

          const totalYawOffset = cornerSteer * 0.62 + carCockpitYawRef.current;
          const lookDist = 1.65;
          const localLookX = localEyeX + Math.sin(totalYawOffset) * lookDist;
          const localLookY = localEyeY - 0.03 + Math.sin(carCockpitPitchRef.current) * 1.15;
          const localLookZ = localEyeZ + Math.cos(totalYawOffset) * lookDist;

          const lookWorldX = car.x + localLookX * cosR + localLookZ * sinR;
          const lookWorldY = car.y + localLookY;
          const lookWorldZ = car.z - localLookX * sinR + localLookZ * cosR;

          // Subtle intelligent cornering roll banking (leans slightly into the turn)
          const bankRoll = cornerSteer * 0.085;
          camera.up.set(
            Math.sin(bankRoll) * cosR,
            Math.cos(bankRoll),
            -Math.sin(bankRoll) * sinR
          );

          camera.position.set(eyeWorldX, eyeWorldY, eyeWorldZ);
          camera.lookAt(lookWorldX, lookWorldY, lookWorldZ);
          if (controlsRef.current) {
            controlsRef.current.target.set(lookWorldX, lookWorldY, lookWorldZ);
          }
        } else {
          if ((camera as any).fov !== 60) {
            (camera as any).fov = 60;
            camera.updateProjectionMatrix();
          }
          camera.up.set(0, 1, 0);

          // 3RD-PERSON CHASE CAMERA: 100% lockstep distance & elevation relative to car.x, car.y, car.z
          // Zero OrbitControls fighting, zero vibration, and zero forward/backward body drift!
          if (carCamYawRef.current === null || prevCameraMode.current !== 'third') {
            carCamYawRef.current = car.rot;
          } else {
            let angleDiff = car.rot - carCamYawRef.current;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            const yawFollowRate = Math.abs(car.speed) > 0.2 ? 6.5 : 3.5;
            carCamYawRef.current += angleDiff * (1 - Math.exp(-yawFollowRate * safeDelta));
          }

          const camYaw = carCamYawRef.current;
          const chaseDist = 5.5;
          const chaseHeight = 2.15;
          const camX = car.x - Math.sin(camYaw) * chaseDist;
          const camY = car.y + chaseHeight;
          const camZ = car.z - Math.cos(camYaw) * chaseDist;

          const lookTargetX = car.x;
          const lookTargetY = car.y + 0.95;
          const lookTargetZ = car.z;

          camera.position.set(camX, camY, camZ);
          camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);
          if (controlsRef.current) {
            controlsRef.current.target.set(lookTargetX, lookTargetY, lookTargetZ);
          }
          if (!prevCamPlayerPos.current) {
            prevCamPlayerPos.current = new Vector3(lookTargetX, lookTargetY, lookTargetZ);
          } else {
            prevCamPlayerPos.current.set(lookTargetX, lookTargetY, lookTargetZ);
          }
        }
        prevCameraMode.current = cameraMode;
        return;
      }
    }

    if ((camera as any).fov !== 60) {
      (camera as any).fov = 60;
      camera.updateProjectionMatrix();
    }
    camera.up.set(0, 1, 0);

    const rawInputLen = Math.hypot(inputRight, inputForward);
    const analogMagnitude = Math.min(1.0, rawInputLen);
    const isMoving = analogMagnitude > 0.04;
    const isRunning = isSprintKey;
    const effectiveJump = Boolean(jump) || isMobileJump;
    const jumpJustPressed = effectiveJump && !prevJumpRef.current;

    // -----------------------------------------------------------
    // RESPONSIVE PROPORTIONAL KINEMATICS: FEMALE & MALE ASTRONAUTS
    // Walk by default; Sprint when Run button or Shift is active
    // -----------------------------------------------------------
    const acceleration = isFemale ? 130 : 125;
    const maxWalkSpeed = isFemale ? 6.4 : 6.6;
    const maxRunSpeed = isFemale ? 16.0 : 16.5;
    const baseTargetSpeed = isRunning ? maxRunSpeed : maxWalkSpeed;
    const analogFactor = isRunning
      ? Math.max(0.85, analogMagnitude)
      : analogMagnitude < 0.50
      ? MathUtils.lerp(0.35, 0.75, analogMagnitude / 0.50)
      : MathUtils.lerp(0.75, 1.0, (analogMagnitude - 0.50) / 0.50);
    const targetSpeed = isMoving ? baseTargetSpeed * analogFactor : 0;

    const linvel = rb.current.linvel();
    if (!linvel || linvel.x === undefined) return;
    const currentVel = _currentVel.set(linvel.x || 0, 0, linvel.z || 0);

    // Camera-relative direction using pooled scratch vectors
    const camForward = _camForward;
    camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();

    const camRight = _camRight;
    camRight.crossVectors(camForward, _upVector).normalize();

    const desiredMove = _desiredMove
      .set(0, 0, 0)
      .addScaledVector(camForward, inputForward)
      .addScaledVector(camRight, inputRight);

    if (desiredMove.length() > 0.001) {
      desiredMove.normalize();
    }

    // -----------------------------------------------------------
    // TERRAIN INTERACTION & MULTI-PROBE GROUND ADAPTATION
    // -----------------------------------------------------------
    const playerPos = rb.current.translation();
    if (!playerPos || playerPos.x === undefined) return;

    // Safety Respawn inside the Hangar (Earth) or landing zone (other planets) if fallen below world
    if (playerPos.y < -25) {
      const [fx, fy, fz] = planetIndex === 0 ? [255, 1.2, 5] : [0, 1.2, 9.5];
      rb.current.setGravityScale(1.0, true);
      rb.current.setTranslation({ x: fx, y: fy, z: fz }, true);
      rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    // Mutably update store position for 3D components without triggering React re-renders
    const storePos = storeState.playerPosition;
    storePos[0] = playerPos.x;
    storePos[1] = playerPos.y;
    storePos[2] = playerPos.z;

    // Sync world-space Astronaut group directly to the physical capsule position when on foot
    group.current.position.set(playerPos.x, playerPos.y - 0.93, playerPos.z);
    group.current.rotation.set(0, 0, 0);
    group.current.scale.set(1, 1, 1);

    // Proximity to VAB check
    const nearVAB = Math.hypot(playerPos.x - 220, playerPos.z) < 38 ||
      (playerPos.x >= 220 && playerPos.x <= 300 && Math.abs(playerPos.z) < 48);
    if (nearVAB !== prevNearVAB.current) {
      prevNearVAB.current = nearVAB;
      storeState.setIsNearVAB(nearVAB);
    }

    // Story Mode: Proximity to Suit Table in Hangar (Earth) and Moon Flag Spot (Lua)
    const nearSuitTableNow =
      storeState.gameMode === 'story' &&
      planetIndex === 0 &&
      !storeState.hasSpacesuit &&
      Math.hypot(playerPos.x - SUIT_TABLE_POS[0], playerPos.z - SUIT_TABLE_POS[2]) < 4.5 &&
      playerPos.y < 3.0;
    if (nearSuitTableNow !== prevNearSuitTable.current) {
      prevNearSuitTable.current = nearSuitTableNow;
      storeState.setIsNearSuitTable(nearSuitTableNow);
    }

    const nearFlagSpotNow =
      storeState.gameMode === 'story' &&
      planetIndex === 1 &&
      !storeState.isFlagPlantedOnMoon &&
      Math.hypot(playerPos.x - MOON_FLAG_SPOT_POS[0], playerPos.z - MOON_FLAG_SPOT_POS[2]) < 3.6;
    if (nearFlagSpotNow !== prevNearFlagSpot.current) {
      prevNearFlagSpot.current = nearFlagSpotNow;
      storeState.setIsNearFlagSpot(nearFlagSpotNow);
    }

    // Proximity & Touch Detection for Rocket / Planetary Capsule Lander
    // Astronaut must be genuinely close to the capsule lander to board with [R] or by touching it
    const rocketHorizDist = Math.hypot(playerPos.x, playerPos.z);
    const isNearRocketNow =
      planetIndex === 0
        ? rocketHorizDist < 9.5 && playerPos.y >= 4.2
        : rocketHorizDist < 4.8;
    if (isNearRocketNow !== prevNearRocket.current) {
      prevNearRocket.current = isNearRocketNow;
      storeState.setIsNearRocket(isNearRocketNow);
    }

    // Auto-board rocket when astronaut walks up and touches the rocket base / lander hull
    const isTouchingRocket =
      planetIndex === 0
        ? rocketHorizDist < 5.7 && playerPos.y >= 4.2 && isMoving
        : rocketHorizDist < 3.15 && isMoving;
    if (isTouchingRocket && !storeState.isLaunching) {
      if (planetIndex === 0) {
        if (storeState.gameMode === 'story' && !storeState.hasSpacesuit) {
          const nowMs = performance.now();
          if (nowMs - lastFuelWarnTime.current > 2500) {
            lastFuelWarnTime.current = nowMs;
            storeState.setLaunchFailureMsg(UI_TEXT[storeState.language].needSuitBeforeRocket);
          }
        } else if (storeState.rocketFuel <= 0) {
          const nowMs = performance.now();
          if (nowMs - lastFuelWarnTime.current > 2500) {
            lastFuelWarnTime.current = nowMs;
            storeState.setLaunchFailureMsg(UI_TEXT[storeState.language].noFuelBeforeLaunch);
          }
        } else {
          const f = storeState.rocketFuel;
          storeState.setLaunchFailureMsg(null);
          storeState.setLaunchTelemetry({
            countdown: 5,
            fuel: Math.round(f),
            speed: 0,
            altitude: 0,
            weightTons: Math.round(420 + f * 25.5),
            status: 'countdown',
          });
          storeState.setLaunching(true);
        }
      } else {
        storeState.setLaunching(true);
      }
    }

    // Proximity to Driveable Cars check (within 4.4m on Earth surface)
    if (planetIndex === 0) {
      let closestCarId: string | null = null;
      let closestDistSq = 4.4 * 4.4;
      const cars = storeState.carStates;
      for (const cid in cars) {
        const c = cars[cid];
        const dSq = (playerPos.x - c.x) ** 2 + (playerPos.z - c.z) ** 2;
        if (dSq < closestDistSq && Math.abs(playerPos.y - (c.y + 0.9)) < 2.8) {
          closestDistSq = dSq;
          closestCarId = cid;
        }
      }
      if (closestCarId !== prevNearCarId.current) {
        prevNearCarId.current = closestCarId;
        storeState.setNearCarId(closestCarId);
      }

      // Proximity to Supercomputers & Research Area Computers (Hangar & Laboratory)
      const computerTerminals: { x: number; y: number; z: number; radius: number; title: string }[] = [
        { x: 239.3, y: 24.0, z: 4.6, radius: 6.2, title: 'Computadores de Investigação do Hangar (3º Piso)' },
        { x: 252.3, y: 24.0, z: 4.6, radius: 6.2, title: 'Computadores de Investigação do Hangar (3º Piso)' },
        { x: 254.0, y: 0.0, z: -18.0, radius: 5.8, title: 'Supercomputador de Telemetria do Hangar' },
        { x: 243.0, y: 0.0, z: 3.5, radius: 4.2, title: 'Computador de Diagnóstico do Hangar' },
        { x: 261.5, y: 0.0, z: 16.5, radius: 4.2, title: 'Computador de Investigação do Hangar' },
        { x: 225.5, y: 0.0, z: -88.5, radius: 7.2, title: 'Supercomputador de Dinâmica Orbital GGPEN' },
        { x: 214.0, y: 10.5, z: -84.0, radius: 6.5, title: 'Computadores de Telemetria e Investigação (2º Piso Lab)' },
      ];
      let matchedTitle: string | null = null;
      for (let i = 0; i < computerTerminals.length; i++) {
        const ct = computerTerminals[i];
        const dh = Math.hypot(playerPos.x - ct.x, playerPos.z - ct.z);
        if (dh < ct.radius && Math.abs(playerPos.y - (ct.y + 1.2)) < 4.5) {
          matchedTitle = ct.title;
          break;
        }
      }
      const nearComp = matchedTitle !== null;
      if (nearComp !== prevNearComputer.current) {
        prevNearComputer.current = nearComp;
        storeState.setIsNearComputer(nearComp);
      }
      if (matchedTitle !== prevNearComputerTitle.current) {
        prevNearComputerTitle.current = matchedTitle;
        storeState.setNearComputerTitle(matchedTitle);
      }
    } else {
      if (prevNearCarId.current !== null) {
        prevNearCarId.current = null;
        storeState.setNearCarId(null);
      }
      if (prevNearComputer.current) {
        prevNearComputer.current = false;
        storeState.setIsNearComputer(false);
        prevNearComputerTitle.current = null;
        storeState.setNearComputerTitle(null);
      }
    }

    // Downward ground detection ray starting strictly below the player's own CapsuleCollider (bottom is at y - 0.93)
    if (!_cachedDownRay) {
      _cachedDownRay = new rapier.Ray(_downRayOrigin, _downRayDir);
      _cachedFootRay = new rapier.Ray(_footRayOrigin, _footRayDir);
      _cachedToeRay = new rapier.Ray(_toeRayOrigin, _toeRayDir);
      _cachedWaistRay = new rapier.Ray(_waistRayOrigin, _waistRayDir);
    }

    const rayBootOriginY = playerPos.y - 0.935;
    _downRayOrigin.x = playerPos.x;
    _downRayOrigin.y = rayBootOriginY;
    _downRayOrigin.z = playerPos.z;
    _cachedDownRay.origin.x = playerPos.x;
    _cachedDownRay.origin.y = rayBootOriginY;
    _cachedDownRay.origin.z = playerPos.z;

    const groundHit = (world as any).castRayAndGetNormal(
      _cachedDownRay,
      1.50,
      true,
      undefined,
      undefined,
      undefined,
      rb.current
    );
    const groundThreshold = wasGroundedRef.current ? 0.36 : 0.10;
    const isGrounded = groundHit !== null && groundHit.timeOfImpact <= groundThreshold;
    wasGroundedRef.current = isGrounded;

    // -----------------------------------------------------------
    // REALISTIC OCEAN WATER IMMERSION, PIER IRON LADDER CLIMB & SHORE EXIT
    // -----------------------------------------------------------
    const feetY = playerPos.y - 0.92;
    const waveHarmonic = getOceanWaveHeight(playerPos.x, playerPos.z, state.clock.getElapsedTime());
    const waterSurfaceLevel = 0.0 + waveHarmonic;
    const submergedFeetDepth = Math.max(0, waterSurfaceLevel - feetY);

    const groundUnderneathY = groundHit !== null ? (rayBootOriginY - groundHit.timeOfImpact) : -12.0;
    const physicalWaterColumnDepth = Math.max(0, waterSurfaceLevel - groundUnderneathY);

    const isElevatedOnPier = playerPos.x <= -23.5 && playerPos.x >= -58.0 && Math.abs(playerPos.z - 20) <= 3.2 && playerPos.y >= 0.16;
    const isElevatedOnPromenade = playerPos.x >= -29.2 && playerPos.x <= -23.5 && playerPos.y >= 0.16;

    const isInWaterZone =
      planetIndex === 0 &&
      !isElevatedOnPier &&
      !isElevatedOnPromenade &&
      playerPos.x < -28.0 &&
      (submergedFeetDepth > 0.04 || physicalWaterColumnDepth > 0.12);

    // MARINE PIER IRON LADDER CLIMB ZONE (World X ≈ -36.0, Z ≈ 15.2 to 18.2, climbing from water up onto pier deck Y=0.38m)
    const isInPierLadderZone =
      planetIndex === 0 &&
      playerPos.x >= -37.6 &&
      playerPos.x <= -34.4 &&
      playerPos.z >= 15.2 &&
      playerPos.z <= 18.25 &&
      playerPos.y < 1.30;
    const wantsToClimbLadder =
      isInPierLadderZone &&
      ((isMoving && desiredMove.z > -0.15) || effectiveJump || (playerPos.z >= 15.8 && playerPos.y > -0.15 && desiredMove.z >= -0.05));

    const isMovingShoreward = isMoving && desiredMove.x > 0.08;
    const isShallowShoreExit =
      groundHit !== null &&
      physicalWaterColumnDepth <= 0.44 &&
      (isMovingShoreward || playerPos.x > -31.8);
    const isDeepWater =
      isInWaterZone &&
      !wantsToClimbLadder &&
      !isShallowShoreExit &&
      (physicalWaterColumnDepth > 0.42 || submergedFeetDepth > 0.34 || groundHit === null);
    const isWading = isInWaterZone && !isDeepWater && !wantsToClimbLadder;

    // Trigger state changes & water entry sounds
    if (isInWaterZone !== inWaterRef.current) {
      inWaterRef.current = isInWaterZone;
      setInWater(isInWaterZone);
      storeState.setIsPlayerInWater(isInWaterZone);
      if (isInWaterZone) {
        playWaterSplashSound();
      }
    }

    let targetVerticalVel = linvel.y;

    if (wantsToClimbLadder) {
      rb.current.setGravityScale(1.0, true);
      // --- AUTOMATIC / ASSISTED IRON LADDER CLIMB ONTO MARITIME PIER DECK ---
      // Smoothly aligns astronaut with the iron ladder at X = -36.0, Z = 17.0 and climbs rung-by-rung onto the pier deck (Z = 18.25, Y = 1.31)
      currentVel.x = (-36.0 - playerPos.x) * 6.5;
      if (playerPos.y < 0.98) {
        // Keep hands and feet right on the vertical iron rungs at Z = 16.95 while ascending
        currentVel.z = (16.95 - playerPos.z) * 5.0 + 0.85;
        targetVerticalVel = 2.65;
      } else {
        // At top of ladder: step cleanly forward through the yellow iron gate onto the pier deck!
        currentVel.z = 3.6;
        targetVerticalVel = Math.max(1.2, (1.32 - playerPos.y) * 8.0);
      }
    } else if (isDeepWater) {
      rb.current.setGravityScale(1.0, true);
      // --- REAL HUMAN SWIMMING DYNAMICS (STROKE, KICK & SUBMERGED IDLE TREAD) ---
      const strokeCadence = 3.2;
      const strokePhase = (state.clock.getElapsedTime() * strokeCadence) % (Math.PI * 2);
      const strokePower = Math.pow(Math.max(0, Math.sin(strokePhase)), 1.4);
      const strokeImpulse = isMoving ? (0.78 + strokePower * 0.55) : 0;
      const swimMaxSpeed = (isSprintKey ? 6.5 : 4.2) * (isMoving ? 1.0 : 0);

      if (isMoving) {
        currentVel.addScaledVector(desiredMove, (acceleration * 0.72 * strokeImpulse) * safeDelta);
        if (currentVel.length() > swimMaxSpeed) {
          currentVel.normalize().multiplyScalar(swimMaxSpeed);
        }

        wadeTimer.current += safeDelta;
        if (wadeTimer.current > 0.42) {
          playWaterWadeSound();
          wadeTimer.current = 0;
        }
      } else {
        const currentSpeed = currentVel.length();
        const fluidDragCoeff = 2.4 + currentSpeed * 0.45;
        currentVel.multiplyScalar(Math.max(0, 1 - fluidDragCoeff * safeDelta));
      }

      // Archimedean Hydrostatic Buoyancy:
      // When swimming (isMoving), floats near surface (-0.18m); when stopped (!isMoving), sinks deeper (-0.42m) so torso is submerged in the water!
      const targetEquilibriumY = isMoving ? (waterSurfaceLevel - 0.18) : (waterSurfaceLevel - 0.42);
      const depthDelta = targetEquilibriumY - playerPos.y;

      const isApproachingBeachSand =
        isMovingShoreward && groundHit !== null && groundHit.timeOfImpact < 0.25 && playerPos.x > -34.0;

      if (effectiveJump) {
        targetVerticalVel = Math.min(4.2, targetVerticalVel + 24 * safeDelta);
        wadeTimer.current += safeDelta;
        if (wadeTimer.current > 0.30) {
          playWaterSplashSound();
          wadeTimer.current = 0;
        }
      } else if (isApproachingBeachSand) {
        targetVerticalVel = Math.max(1.2, depthDelta * 12.0);
      } else {
        targetVerticalVel = MathUtils.damp(targetVerticalVel, depthDelta * 14.0, 5.0, safeDelta);
        targetVerticalVel = MathUtils.clamp(targetVerticalVel, -2.5, 2.8);
      }
    } else if (isGrounded && groundHit) {
      // --- SOLID GROUND, STAIRCASE AUTO-STEP & NON-SLIDING STEP HOLD ---
      const normal = _normal.set(groundHit.normal.x, groundHit.normal.y, groundHit.normal.z).normalize();

      const depthRatio = isWading ? Math.min(1.0, physicalWaterColumnDepth / 0.50) : 0;
      const waterSpeedScale = isWading ? MathUtils.lerp(0.95, 0.80, depthRatio) : 1.0;
      const effectiveTargetSpeed = targetSpeed * waterSpeedScale;

      if (isMoving) {
        rb.current.setGravityScale(1.0, true);
        if (isWading) {
          wadeTimer.current += safeDelta;
          if (wadeTimer.current > 0.38) {
            playWaterWadeSound();
            wadeTimer.current = 0;
          }
        }

        const targetVelX = desiredMove.x * effectiveTargetSpeed;
        const targetVelZ = desiredMove.z * effectiveTargetSpeed;

        currentVel.x = MathUtils.damp(currentVel.x, targetVelX, 28.0, safeDelta);
        currentVel.z = MathUtils.damp(currentVel.z, targetVelZ, 28.0, safeDelta);

        const slopeGradient = -(desiredMove.x * normal.x + desiredMove.z * normal.z) / Math.max(0.15, normal.y);
        const slopeClimbSpeed = effectiveTargetSpeed * slopeGradient;

        const moveSource = desiredMove.length() > 0.1 ? desiredMove : currentVel;
        const moveDir = _moveDir.copy(moveSource).normalize();
        const frontSkinX = playerPos.x + moveDir.x * 0.46;
        const frontSkinZ = playerPos.z + moveDir.z * 0.46;

        // 1. Low Toe Ray
        _toeRayOrigin.x = frontSkinX;
        _toeRayOrigin.y = playerPos.y - 0.88;
        _toeRayOrigin.z = frontSkinZ;
        _cachedToeRay.origin.x = _toeRayOrigin.x;
        _cachedToeRay.origin.y = _toeRayOrigin.y;
        _cachedToeRay.origin.z = _toeRayOrigin.z;
        _cachedToeRay.dir.x = moveDir.x;
        _cachedToeRay.dir.y = 0;
        _cachedToeRay.dir.z = moveDir.z;
        const toeHit = (world as any).castRayAndGetNormal(
          _cachedToeRay,
          0.32,
          true,
          undefined,
          undefined,
          undefined,
          rb.current
        );

        // 2. Mid Foot/Shin Ray
        _footRayOrigin.x = frontSkinX;
        _footRayOrigin.y = playerPos.y - 0.62;
        _footRayOrigin.z = frontSkinZ;
        _cachedFootRay.origin.x = _footRayOrigin.x;
        _cachedFootRay.origin.y = _footRayOrigin.y;
        _cachedFootRay.origin.z = _footRayOrigin.z;
        _cachedFootRay.dir.x = moveDir.x;
        _cachedFootRay.dir.y = 0;
        _cachedFootRay.dir.z = moveDir.z;
        const footHit = (world as any).castRayAndGetNormal(
          _cachedFootRay,
          0.32,
          true,
          undefined,
          undefined,
          undefined,
          rb.current
        );

        // 3. Waist Clearance Ray
        _waistRayOrigin.x = frontSkinX;
        _waistRayOrigin.y = playerPos.y + 0.05;
        _waistRayOrigin.z = frontSkinZ;
        _cachedWaistRay.origin.x = _waistRayOrigin.x;
        _cachedWaistRay.origin.y = _waistRayOrigin.y;
        _cachedWaistRay.origin.z = _waistRayOrigin.z;
        _cachedWaistRay.dir.x = moveDir.x;
        _cachedWaistRay.dir.y = 0;
        _cachedWaistRay.dir.z = moveDir.z;
        const waistHit = (world as any).castRay(
          _cachedWaistRay,
          0.42,
          true,
          undefined,
          undefined,
          undefined,
          rb.current
        );

        const hasLowStepHit =
          (toeHit !== null && toeHit.timeOfImpact < 0.30 && Math.abs(toeHit.normal.y) < 0.78) ||
          (footHit !== null && footHit.timeOfImpact < 0.30 && Math.abs(footHit.normal.y) < 0.78);
        const groundGap = groundHit.timeOfImpact;

        if (hasLowStepHit && waistHit === null) {
          targetVerticalVel = Math.max(targetVerticalVel, 4.4);
          const minStepForwardSpeed = Math.max(effectiveTargetSpeed, 5.2);
          currentVel.x = desiredMove.x * minStepForwardSpeed;
          currentVel.z = desiredMove.z * minStepForwardSpeed;
        } else if (slopeGradient > 0.01) {
          targetVerticalVel = Math.min(8.8, slopeClimbSpeed + 0.45);
        } else if (slopeGradient < -0.01) {
          targetVerticalVel = Math.max(-9.0, slopeClimbSpeed - 0.35);
        } else if (groundGap > 0.015) {
          targetVerticalVel = -Math.min(5.0, groundGap * 22.0);
        } else {
          targetVerticalVel = 0;
        }
      } else {
        // When stopped on any staircase step or ramp: lock position & gravityScale=0 so astronaut NEVER slides down!
        rb.current.setGravityScale(0.0, true);
        currentVel.set(0, 0, 0);
        targetVerticalVel = 0;
      }

      const isEarth = planetIndex === 0;
      if (jumpJustPressed || (!isEarth && effectiveJump)) {
        rb.current.setGravityScale(1.0, true);
        if (isEarth) {
          const baseJump = isFemale ? 3.05 : 3.00;
          targetVerticalVel = baseJump;
        } else {
          const gRatio = 9.8 / Math.max(1.2, gravity);
          const baseJump = isFemale ? 7.8 : 7.4;
          targetVerticalVel = baseJump * Math.min(1.80, Math.sqrt(gRatio));
        }
        if (isWading) {
          playWaterSplashSound();
        }
      }
    } else {
      // --- AIRBORNE / FALLING FROM HIGH PLACES ON ALL PLANETS ---
      rb.current.setGravityScale(1.0, true);
      const isEarth = planetIndex === 0;
      const basePlanetGravity = isEarth ? 9.8 : Math.max(1.62, gravity || 9.8);
      let effectiveGravity = basePlanetGravity;

      if (isEarth) {
        effectiveGravity = linvel.y < 0 ? 9.8 * 2.1 : 9.8 * 1.6;
      } else {
        effectiveGravity = linvel.y < 0 ? basePlanetGravity * 1.85 : basePlanetGravity * 1.45;
      }

      targetVerticalVel = linvel.y - effectiveGravity * safeDelta;
      const maxFallSpeed = isEarth ? -34.0 : -Math.max(14.0, basePlanetGravity * 3.2);
      targetVerticalVel = Math.max(maxFallSpeed, targetVerticalVel);

      if (!isEarth) {
        if (isMoving) {
          currentVel.addScaledVector(desiredMove, (acceleration * 0.45) * safeDelta);
          if (currentVel.length() > targetSpeed) {
            currentVel.normalize().multiplyScalar(targetSpeed);
          }
        }
        if (effectiveJump && linvel.y < 0 && basePlanetGravity < 6) {
          targetVerticalVel = Math.max(targetVerticalVel, -2.2);
        }
      } else {
        if (isMoving) {
          currentVel.x = MathUtils.damp(currentVel.x, desiredMove.x * targetSpeed * 0.75, 4.0, safeDelta);
          currentVel.z = MathUtils.damp(currentVel.z, desiredMove.z * targetSpeed * 0.75, 4.0, safeDelta);
        } else {
          currentVel.x *= Math.max(0, 1 - 0.8 * safeDelta);
          currentVel.z *= Math.max(0, 1 - 0.8 * safeDelta);
        }
      }
    }

    // Apply linear velocity
    rb.current.setLinvel(
      { x: currentVel.x, y: targetVerticalVel, z: currentVel.z },
      true
    );

    // -----------------------------------------------------------
    // ROTATION, BANKING & BIOMECHANICAL POSTURE
    // -----------------------------------------------------------
    const horizSpeed = currentVel.length();
    storeState.playerSpeed = horizSpeed;

    if (bodyRef.current) {
      bodyRef.current.rotation.order = 'YXZ';
    }

    if (bodyRef.current && wantsToClimbLadder) {
      // Lock facing North (+Z, rotation.y = 0) directly grabbing the iron rungs of the marine pier ladder
      let diff = 0 - bodyRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      bodyRef.current.rotation.y += diff * (1 - Math.exp(-16.0 * safeDelta));
      bodyRef.current.rotation.x = MathUtils.damp(bodyRef.current.rotation.x, -0.06, 10.0, safeDelta);
      bodyRef.current.rotation.z = MathUtils.damp(bodyRef.current.rotation.z, 0.0, 14.0, safeDelta);
      bodyRef.current.position.y = MathUtils.damp(bodyRef.current.position.y, 0.0, 10.0, safeDelta);
      bodyRef.current.position.z = MathUtils.damp(bodyRef.current.position.z, 0.08, 10.0, safeDelta);
    } else if (bodyRef.current && isMoving && desiredMove.length() > 0.05) {
      const targetAngle = Math.atan2(desiredMove.x, desiredMove.z);
      let diff = targetAngle - bodyRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      bodyRef.current.rotation.y += diff * (1 - Math.exp(-14.0 * safeDelta));

      if (isDeepWater) {
        const targetSwimPitch = 1.32;
        bodyRef.current.rotation.x = MathUtils.damp(bodyRef.current.rotation.x, targetSwimPitch, 8.0, safeDelta);
        bodyRef.current.rotation.z = MathUtils.damp(bodyRef.current.rotation.z, 0.0, 14.0, safeDelta);

        const strokeCycle = Math.sin(state.clock.getElapsedTime() * 3.0);
        const targetY = 0.60 + strokeCycle * 0.015;
        const targetZ = 0.45;
        bodyRef.current.position.y = MathUtils.damp(bodyRef.current.position.y, targetY, 7.0, safeDelta);
        bodyRef.current.position.z = MathUtils.damp(bodyRef.current.position.z, targetZ, 7.0, safeDelta);
      } else {
        const bankFactor = isFemale ? 0.20 : 0.12;
        const bankAmount = Math.max(-0.18, Math.min(0.18, diff * bankFactor));
        bodyRef.current.rotation.z = MathUtils.damp(bodyRef.current.rotation.z, -bankAmount, 10.0, safeDelta);

        const pitchFactor = isFemale ? 0.12 : 0.10;
        bodyRef.current.rotation.x = MathUtils.damp(
          bodyRef.current.rotation.x,
          Math.min(0.16, (horizSpeed / maxRunSpeed) * pitchFactor),
          8.0,
          safeDelta
        );
        const footGroundCorrection = (isGrounded && groundHit) ? -(groundHit.timeOfImpact - 0.93) : 0;
        const clampedCorrection = Math.max(-0.05, Math.min(0.05, footGroundCorrection));
        bodyRef.current.position.y = MathUtils.damp(bodyRef.current.position.y, clampedCorrection, 12.0, safeDelta);
        bodyRef.current.position.z = MathUtils.damp(bodyRef.current.position.z, 0.0, 12.0, safeDelta);
      }
    } else if (bodyRef.current) {
      bodyRef.current.rotation.z = MathUtils.damp(bodyRef.current.rotation.z, 0.0, 12.0, safeDelta);
      if (isDeepWater) {
        // Treading Water when Stopped: submerged deeper in the water (torso underwater, shoulders/helmet at surface)
        const treadBob = Math.sin(state.clock.getElapsedTime() * 2.0) * 0.03;
        bodyRef.current.position.y = MathUtils.damp(bodyRef.current.position.y, -0.22 + treadBob, 5.0, safeDelta);
        bodyRef.current.position.z = MathUtils.damp(bodyRef.current.position.z, 0.0, 5.0, safeDelta);
        bodyRef.current.rotation.x = MathUtils.damp(bodyRef.current.rotation.x, 0.08, 6.0, safeDelta);
      } else {
        bodyRef.current.rotation.x = MathUtils.damp(bodyRef.current.rotation.x, 0.0, 10.0, safeDelta);
        const footGroundCorrection = (isGrounded && groundHit) ? -(groundHit.timeOfImpact - 0.93) : 0;
        const clampedCorrection = Math.max(-0.05, Math.min(0.05, footGroundCorrection));
        bodyRef.current.position.y = MathUtils.damp(bodyRef.current.position.y, clampedCorrection, 12.0, safeDelta);
        bodyRef.current.position.z = MathUtils.damp(bodyRef.current.position.z, 0.0, 12.0, safeDelta);
      }
    }

    // Determine animation with responsive thresholds
    let nextAction = 'idle';
    if (wantsToClimbLadder) {
      nextAction = 'climb';
    } else if (isDeepWater) {
      nextAction = isMoving ? 'swim' : 'treadWater';
    } else if (!isGrounded && (linvel.y > 0.8 || Math.abs(linvel.y) > 2.0)) {
      nextAction = 'jump';
    } else if (isMoving || horizSpeed > 0.1) {
      nextAction = isRunning && horizSpeed > 2.0 ? 'run' : 'walk';
    } else {
      nextAction = 'idle';
    }

    if (nextAction !== actionNameRef.current) {
      actionNameRef.current = nextAction;
      setActionName(nextAction);
    }

    // Keep world-space astronaut group locked to the physical player position on foot (NEVER reset to 0, -0.93, 0!)
    group.current.position.set(playerPos.x, playerPos.y - 0.93, playerPos.z);
    group.current.rotation.set(0, 0, 0);
    group.current.scale.set(1, 1, 1);
    prevJumpRef.current = effectiveJump;

    livePlayerMotion.action = nextAction;
    livePlayerMotion.isJumping = nextAction === 'jump';
    livePlayerMotion.inWater = isInWaterZone;
    livePlayerMotion.deepWater = isDeepWater;
    livePlayerMotion.yaw = bodyRef.current ? bodyRef.current.rotation.y : 0;
    livePlayerMotion.speed = horizSpeed;
    livePlayerMotion.bodyYOffset = bodyRef.current ? bodyRef.current.position.y : 0;
    livePlayerMotion.bodyPitch = bodyRef.current ? bodyRef.current.rotation.x : 0;

    // Spatial audio: Earth ocean/machinery fades out away from source; footsteps play on all planets
    updateSpatialAudio(
      [playerPos.x, playerPos.y, playerPos.z],
      isMoving,
      horizSpeed,
      isGrounded,
      isInWaterZone
    );

    if (isLaunching) return;

    if (prevCameraMode.current !== cameraMode) {
      if (cameraMode === 'third') {
        const backVec = new Vector3(0, 0.25, 1).applyQuaternion(camera.quaternion).normalize();
        camera.position.set(
          playerPos.x + backVec.x * 4.2,
          playerPos.y + 1.2 + backVec.y * 4.2,
          playerPos.z + backVec.z * 4.2
        );
        if (prevCamPlayerPos.current) {
          prevCamPlayerPos.current.set(playerPos.x, playerPos.y + 0.25, playerPos.z);
        }
      } else {
        const eyeHeight = isFemale ? 0.62 : 0.66;
        firstPersonEyePos.current = new Vector3(playerPos.x, playerPos.y + eyeHeight, playerPos.z);
        camera.position.copy(firstPersonEyePos.current);
      }
      prevCameraMode.current = cameraMode;
    }

    if (cameraMode === 'first') {
      const eyeHeight = isFemale ? 0.62 : 0.66;
      const targetEyeX = playerPos.x;
      const targetEyeY = playerPos.y + eyeHeight;
      const targetEyeZ = playerPos.z;

      if (!firstPersonEyePos.current) {
        firstPersonEyePos.current = new Vector3(targetEyeX, targetEyeY, targetEyeZ);
      } else {
        firstPersonEyePos.current.x = targetEyeX;
        firstPersonEyePos.current.y = MathUtils.damp(firstPersonEyePos.current.y, targetEyeY, 22.0, safeDelta);
        firstPersonEyePos.current.z = targetEyeZ;
      }
      camera.position.copy(firstPersonEyePos.current);

      if (controlsRef.current) {
        controlsRef.current.minDistance = 0.05;
        controlsRef.current.maxDistance = 1.0;

        // Intelligent 1st-person cornering curve on foot: smoothly turns camera azimuth when steering left/right
        const now = performance.now();
        const userRecentlyInteracted = isUserOrbiting.current || (now - lastUserOrbitTime.current < 450);
        if (!userRecentlyInteracted && Math.abs(inputRight) > 0.06 && (isMoving || Math.abs(inputForward) > 0.05)) {
          camera.rotateOnWorldAxis(_upVector, -inputRight * 1.35 * safeDelta);
        }

        _lookAtPos
          .set(0, 0, -1)
          .applyQuaternion(camera.quaternion)
          .add(camera.position);
        controlsRef.current.target.copy(_lookAtPos);
        controlsRef.current.update();
      }
    } else {
      if (controlsRef.current) {
        controlsRef.current.minDistance = 1.8;
        controlsRef.current.maxDistance = 12.0;

        const chestHeight = isFemale ? 0.22 : 0.26;
        const targetX = playerPos.x;
        const targetY = playerPos.y + chestHeight;
        const targetZ = playerPos.z;

        if (!prevCamPlayerPos.current) {
          prevCamPlayerPos.current = new Vector3(targetX, targetY, targetZ);
          camera.position.set(targetX, targetY + 0.85, targetZ + 3.8);
          controlsRef.current.target.set(targetX, targetY, targetZ);
        } else {
          const followSpeed = horizSpeed > 3.0 ? 28.0 : 22.0;
          const followFactor = 1 - Math.exp(-followSpeed * safeDelta);
          const smoothedTargetX = prevCamPlayerPos.current.x + (targetX - prevCamPlayerPos.current.x) * followFactor;
          const smoothedTargetY = prevCamPlayerPos.current.y + (targetY - prevCamPlayerPos.current.y) * followFactor;
          const smoothedTargetZ = prevCamPlayerPos.current.z + (targetZ - prevCamPlayerPos.current.z) * followFactor;

          const dx = smoothedTargetX - prevCamPlayerPos.current.x;
          const dy = smoothedTargetY - prevCamPlayerPos.current.y;
          const dz = smoothedTargetZ - prevCamPlayerPos.current.z;

          camera.position.x += dx;
          camera.position.y += dy;
          camera.position.z += dz;

          prevCamPlayerPos.current.x = smoothedTargetX;
          prevCamPlayerPos.current.y = smoothedTargetY;
          prevCamPlayerPos.current.z = smoothedTargetZ;

          controlsRef.current.target.set(smoothedTargetX, smoothedTargetY, smoothedTargetZ);

          const now = performance.now();
          const userRecentlyInteracted = isUserOrbiting.current || (now - lastUserOrbitTime.current < 650);

          // Only auto-align chase camera azimuth when moving forward (inputForward > 0.05)!
          // When walking backward with S (inputForward < 0), keep camera azimuth steady so it NEVER oscillates or shakes!
          if (!userRecentlyInteracted && inputForward > 0.05 && horizSpeed > 0.45 && desiredMove.length() > 0.1) {
            const moveYaw = Math.atan2(desiredMove.x, desiredMove.z);
            const targetAzimuth = moveYaw - Math.PI;

            const offX = camera.position.x - smoothedTargetX;
            const offZ = camera.position.z - smoothedTargetZ;
            const currentAzimuth = Math.atan2(offX, offZ);
            const horizRadius = Math.hypot(offX, offZ);

            let angleDiff = targetAzimuth - currentAzimuth;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

            const autoTurnRate = horizSpeed > 3.0 ? 2.4 : 1.7;
            const turnStep = angleDiff * (1 - Math.exp(-autoTurnRate * safeDelta));

            if (Math.abs(turnStep) > 0.0001 && horizRadius > 0.5) {
              const newAzimuth = currentAzimuth + turnStep;
              camera.position.x = smoothedTargetX + Math.sin(newAzimuth) * horizRadius;
              camera.position.z = smoothedTargetZ + Math.cos(newAzimuth) * horizRadius;
            }
          }
        }
        controlsRef.current.update();
      }
    }
  });

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={!drivingCarId}
        enablePan={false}
        enableDamping={false}
        minDistance={cameraMode === 'first' ? 0.05 : 1.8}
        maxDistance={cameraMode === 'first' ? 1.0 : 12}
        minPolarAngle={0.08}
        maxPolarAngle={cameraMode === 'first' ? Math.PI - 0.08 : Math.PI / 2 - 0.08}
      />

      <RigidBody
        ref={rb}
        type="dynamic"
        colliders={false}
        enabledRotations={[false, false, false]}
        mass={isFemale ? 100 : 145}
        position={planetIndex === 0 ? [255, 1.2, 5] : [0, 1.2, 9.5]}
        ccd={true}
      >
        <CapsuleCollider args={[0.55, 0.38]} position={[0, 0, 0]} friction={0.8} />
      </RigidBody>

      {/* Unified World-Space Astronaut Group (Outside RigidBody so there is zero physics lag when seated in a car!) */}
      <group ref={group} position={planetIndex === 0 ? [255, 0.27, 5] : [0, 0.27, 9.5]}>
        <group ref={bodyRef} visible={isDying || cameraMode === 'third'}>
          <AstronautCharacter
            key={`${characterGender}-${suitStyle}`}
            gender={characterGender}
            visorMode={visorMode}
            suitStyle={suitStyle}
            actionName={drivingCarId ? 'drive' : isDying ? 'dead' : actionName}
            speed={drivingCarId ? 0 : inWater ? 2.8 : actionName === 'run' ? 17.0 : 8.8}
            isJumping={!drivingCarId && !isDying && actionName === 'jump'}
            hasSpacesuit={gameMode === 'story' ? hasSpacesuit : true}
            carryingFlag={gameMode === 'story' && planetIndex === 1 && storyStep === 'moon_exit_flag' && !isFlagPlantedOnMoon}
          />
          {!drivingCarId &&
            (inWater ? (
              <WaterSplashFX active={true} speed={actionName === 'run' ? 4.5 : 1.5} />
            ) : (
              <FootstepDust
                active={actionName === 'walk' || actionName === 'run'}
                speed={actionName === 'run' ? 5.8 : 2.0}
              />
            ))}
        </group>
      </group>
    </>
  );
}
