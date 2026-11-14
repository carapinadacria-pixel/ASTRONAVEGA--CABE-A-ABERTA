import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  MeshBasicMaterial,
  Color,
  TextureLoader,
  CanvasTexture,
  SphereGeometry,
  CylinderGeometry,
  BoxGeometry,
  PlaneGeometry,
  CircleGeometry,
  RingGeometry,
  TorusGeometry,
  DoubleSide,
  Vector3,
  Matrix4,
  Quaternion,
  Euler,
  MathUtils,
} from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store';
import { getOfficialAngolaFlagTexture } from './AngolaFlag';

// Reusable scratch objects for per-frame procedural bone rotations
const _xAxis = new Vector3(1, 0, 0);
const _deltaQuat = new Quaternion();
const _scratchEuler = new Euler();

interface AstronautCharacterProps {
  gender: 'male' | 'female';
  visorMode: 'transparent' | 'gold';
  suitStyle: 'white' | 'orange' | 'carbon';
  actionName: string;
  speed: number;
  isJumping: boolean;
  hasSpacesuit?: boolean;
  carryingFlag?: boolean;
}

// Certified Aerospace Spacesuit Color Palettes
export const SUIT_THEMES = {
  white: {
    primary: '#f8fafc',
    secondary: '#1e293b',
    betaCloth: '#f1f5f9',
    commanderStripe: '#dc2626', // Iconic Red Commander Stripe from NASA EMU
    joints: '#334155',
    boots: '#0f172a',
    bootSole: '#0284c7', // NASA Apollo Blue Lunar traction sole
    gloves: '#1e293b',
    metalTrim: '#cbd5e1',
    goldFoil: '#f59e0b',
  },
  orange: {
    primary: '#ea580c',
    secondary: '#18181b',
    betaCloth: '#ea580c',
    commanderStripe: '#ffffff',
    joints: '#292524',
    boots: '#0c0a09',
    bootSole: '#ea580c',
    gloves: '#1c1917',
    metalTrim: '#f97316',
    goldFoil: '#f59e0b',
  },
  carbon: {
    primary: '#18181b',
    secondary: '#27272a',
    betaCloth: '#18181b',
    commanderStripe: '#eab308',
    joints: '#3f3f46',
    boots: '#09090b',
    bootSole: '#06b6d4',
    gloves: '#18181b',
    metalTrim: '#eab308',
    goldFoil: '#d97706',
  },
};

// Memory-leak prevention: Deep recursive disposal of GPU buffers
function disposeHierarchy(obj: any) {
  if (!obj) return;
  obj.traverse((child: any) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m: any) => m?.dispose?.());
      } else {
        child.material?.dispose?.();
      }
    }
  });
}

export const AstronautCharacter = React.memo(function AstronautCharacter({
  gender,
  visorMode,
  suitStyle,
  actionName,
  speed,
  isJumping,
  hasSpacesuit = true,
  carryingFlag = false,
}: AstronautCharacterProps) {
  const theme = SUIT_THEMES[suitStyle] || SUIT_THEMES.white;

  return (
    <AstronautModel
      key={gender}
      gender={gender}
      visorMode={visorMode}
      theme={theme}
      actionName={actionName}
      speed={speed}
      isJumping={isJumping}
      hasSpacesuit={hasSpacesuit}
      carryingFlag={carryingFlag}
    />
  );
});

// -------------------------------------------------------------------------
// PROFESSIONAL HIGH-FIDELITY NASA EMU SPACESUIT (FAITHFUL TO REFERENCE PHOTO)
// Organic Rigging + Volumetric Pressure Bulk + Panoramic Visor (100% Coverage) +
// Anti-Glare Soft Face + Chest DCM + PLSS Backpack + Official Badges
// -------------------------------------------------------------------------
function AstronautModel({
  gender,
  visorMode,
  theme,
  actionName,
  speed,
  isJumping,
  hasSpacesuit = true,
  carryingFlag = false,
}: {
  gender: 'male' | 'female';
  visorMode: 'transparent' | 'gold';
  theme: typeof SUIT_THEMES.white;
  actionName: string;
  speed: number;
  isJumping: boolean;
  hasSpacesuit?: boolean;
  carryingFlag?: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const beaconRef = useRef<Mesh | null>(null);
  const plssGroupRef = useRef<Group | null>(null);
  const isFemale = gender === 'female';

  // 1. Load avatar character model with realistic facial anatomy
  const avatarGltf = useGLTF(isFemale ? '/female_avatar.glb' : '/male_avatar.glb');

  // 2. Load dedicated motion-captured animations
  const idleGltf = useGLTF(isFemale ? '/f_idle.glb' : '/m_idle.glb');
  const walkGltf = useGLTF(isFemale ? '/f_walk.glb' : '/m_walk.glb');
  const runGltf = useGLTF(isFemale ? '/f_run.glb' : '/m_run.glb');
  const jumpGltf = useGLTF(isFemale ? '/f_jump.glb' : '/m_jump.glb');

  // Root-motion detrending: preserves biomechanical pelvic sway while removing forward translation
  const sanitizeInPlaceClip = (rawClip: any, name: string) => {
    if (!rawClip) return null;
    const clip = rawClip.clone();
    clip.name = name;
    for (const track of clip.tracks) {
      if (track.name.endsWith('.position') && track.name.toLowerCase().includes('hips')) {
        const vals = track.values;
        const initialX = vals[0];
        const initialZ = vals[2];
        const lastZ = vals[vals.length - 1];
        const totalZ = lastZ - initialZ;
        const count = vals.length / 3;
        const times = track.times;
        const totalTime = times && times.length > 0 ? times[times.length - 1] : 1;

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          vals[idx] = vals[idx] - initialX;
          if (Math.abs(totalZ) > 0.4 && totalTime > 0) {
            const t = times && times[i] !== undefined ? times[i] : i / (count - 1);
            const linearProgress = (t / totalTime) * totalZ;
            vals[idx + 2] = (vals[idx + 2] - initialZ) - linearProgress;
          } else {
            vals[idx + 2] = 0;
          }
        }
      }
    }
    return clip;
  };

  const clips = useMemo(() => {
    const cIdle = sanitizeInPlaceClip(idleGltf.animations[0], 'idle');
    const cWalk = sanitizeInPlaceClip(walkGltf.animations[0], 'walk');
    const cRun = sanitizeInPlaceClip(runGltf.animations[0], 'run');
    const cJump = sanitizeInPlaceClip(jumpGltf.animations[0], 'jump');

    return [cIdle, cWalk, cRun, cJump].filter(Boolean);
  }, [idleGltf, walkGltf, runGltf, jumpGltf]);

  const { actions } = useAnimations(clips, groupRef);
  const currentAction = useRef<string>('idle');
  const swimBlendWeight = useRef<number>(actionName === 'drive' || actionName === 'passenger' ? 1 : 0);

  // Cache avatar bones once BEFORE useEffects so TypeScript & React hooks have immediate access
  const swimBones = useMemo(() => {
    return {
      leftShoulder: avatarGltf.scene.getObjectByName('LeftShoulder'),
      rightShoulder: avatarGltf.scene.getObjectByName('RightShoulder'),
      leftArm: avatarGltf.scene.getObjectByName('LeftArm'),
      rightArm: avatarGltf.scene.getObjectByName('RightArm'),
      leftForeArm: avatarGltf.scene.getObjectByName('LeftForeArm'),
      rightForeArm: avatarGltf.scene.getObjectByName('RightForeArm'),
      leftHand: avatarGltf.scene.getObjectByName('LeftHand'),
      rightHand: avatarGltf.scene.getObjectByName('RightHand'),
      leftUpLeg: avatarGltf.scene.getObjectByName('LeftUpLeg'),
      rightUpLeg: avatarGltf.scene.getObjectByName('RightUpLeg'),
      leftLeg: avatarGltf.scene.getObjectByName('LeftLeg'),
      rightLeg: avatarGltf.scene.getObjectByName('RightLeg'),
      leftFoot: avatarGltf.scene.getObjectByName('LeftFoot'),
      rightFoot: avatarGltf.scene.getObjectByName('RightFoot'),
      spine: avatarGltf.scene.getObjectByName('Spine'),
      spine1: avatarGltf.scene.getObjectByName('Spine1'),
      head: avatarGltf.scene.getObjectByName('Head'),
      hips: avatarGltf.scene.getObjectByName('Hips'),
    };
  }, [avatarGltf.scene]);

  // Capture and cache original bind pose rest quaternions and Hips Y position ONCE per loaded GLTF scene
  const { boneRestQuats, hipsRestY } = useMemo(() => {
    const sceneAny = avatarGltf.scene as any;
    if (!sceneAny.__bindPoseCache) {
      const map = new Map<string, Quaternion>();
      avatarGltf.scene.traverse((child: any) => {
        if (child.isBone || child.type === 'Bone') {
          map.set(child.name, child.quaternion.clone());
        }
      });
      const h = avatarGltf.scene.getObjectByName('Hips');
      const restY = h && h.position.y > 0.65 ? h.position.y : 0.98;
      sceneAny.__bindPoseCache = { boneRestQuats: map, hipsRestY: restY };
    }
    return sceneAny.__bindPoseCache as { boneRestQuats: Map<string, Quaternion>; hipsRestY: number };
  }, [avatarGltf.scene]);

  // Initial animation start on mount (Never play standing 'idle' clip when mounted in 'drive' or 'passenger' mode!)
  useEffect(() => {
    if (!actions) return;
    if (
      actionName === 'drive' ||
      actionName === 'passenger' ||
      actionName === 'swim' ||
      actionName === 'treadWater' ||
      actionName === 'climb' ||
      actionName === 'dead'
    ) {
      Object.values(actions).forEach((act) => act?.stop());
      currentAction.current = actionName;
      swimBlendWeight.current = 1.0;
      return;
    }
    const initial = actions[actionName] || actions['idle'];
    if (initial) {
      initial.reset().fadeIn(0.1).play();
      currentAction.current = actionName;
    }
  }, [actions]);

  // Smooth crossfading between movement states
  useEffect(() => {
    const {
      hips,
      leftLeg,
      rightLeg,
      leftFoot,
      rightFoot,
    } = swimBones;

    if (actionName !== 'drive' && actionName !== 'passenger') {
      if (hips) hips.position.set(0, hipsRestY, 0);
      if (leftLeg) leftLeg.scale.setScalar(1);
      if (rightLeg) rightLeg.scale.setScalar(1);
      if (leftFoot) leftFoot.scale.setScalar(1);
      if (rightFoot) rightFoot.scale.setScalar(1);
    }

    return () => {
      if (hips) hips.position.set(0, hipsRestY, 0);
      if (leftLeg) leftLeg.scale.setScalar(1);
      if (rightLeg) rightLeg.scale.setScalar(1);
      if (leftFoot) leftFoot.scale.setScalar(1);
      if (rightFoot) rightFoot.scale.setScalar(1);
    };
  }, [actionName, swimBones, hipsRestY]);

  useEffect(() => {
    if (!actions) return;
    if (
      actionName === 'swim' ||
      actionName === 'treadWater' ||
      actionName === 'climb' ||
      actionName === 'drive' ||
      actionName === 'passenger' ||
      actionName === 'dead'
    ) {
      if (actionName === 'drive' || actionName === 'passenger' || actionName === 'dead') {
        Object.values(actions).forEach((act) => act?.stop());
        swimBlendWeight.current = 1.0;
      } else {
        const prevAction = actions[currentAction.current];
        if (prevAction) {
          prevAction.fadeOut(0.15);
        }
      }
      currentAction.current = actionName;
      return;
    }

    const target = actions[actionName] || actions['idle'];
    const prev = currentAction.current;

    if (target && prev !== actionName) {
      const prevAction = actions[prev];
      const blendDuration = actionName === 'jump' ? 0.08 : actionName === 'run' ? 0.12 : 0.14;
      if (prevAction && prevAction !== target) {
        prevAction.fadeOut(blendDuration);
      }
      target.reset().fadeIn(blendDuration).play();
      currentAction.current = actionName;
    }
  }, [actions, actionName]);

  // Cadence scaling matching physical velocity inside useFrame (Zero effect churn!)
  useFrame((state, delta) => {
    const store = useGameStore.getState();
    const isDrivingCar = actionName === 'drive';
    const isPassenger = actionName === 'passenger';
    const isSeatedInCar = isDrivingCar || isPassenger;

    // Hide the bulky PLSS rear backpack while seated in a vehicle bucket seat so it never clips through the seat backrest
    if (plssGroupRef.current) {
      plssGroupRef.current.visible = !isSeatedInCar;
    }

    if (isSeatedInCar && actions) {
      Object.values(actions).forEach((act) => {
        if (act && act.isRunning()) act.stop();
      });
    } else if (actions && currentAction.current && actions[currentAction.current]) {
      const act = actions[currentAction.current];
      const realSpeed = Math.max(speed || 0, store.playerSpeed ?? 0);
      if (currentAction.current === 'walk') {
        const naturalMocapWalkSpeed = isFemale ? 2.05 : 2.15;
        const targetScale = realSpeed > 0.05 ? realSpeed / naturalMocapWalkSpeed : 1.0;
        act.timeScale = Math.max(0.35, Math.min(1.85, targetScale));
      } else if (currentAction.current === 'run') {
        const naturalMocapRunSpeed = isFemale ? 6.2 : 6.6;
        const targetScale = realSpeed > 0.05 ? realSpeed / naturalMocapRunSpeed : 1.0;
        act.timeScale = Math.max(0.6, Math.min(1.9, targetScale));
      } else {
        act.timeScale = 1.0;
      }
    }

    // Smooth transition weight: 1.0 when swimming, treading water, climbing ladder, seated in car, or fallen dead
    const isProceduralActive =
      isSeatedInCar ||
      actionName === 'dead' ||
      actionName === 'swim' ||
      actionName === 'treadWater' ||
      actionName === 'climb';
    const targetSwimWeight = isProceduralActive ? 1.0 : 0.0;
    swimBlendWeight.current = isSeatedInCar || actionName === 'dead'
      ? 1.0
      : MathUtils.damp(swimBlendWeight.current, targetSwimWeight, 12.0, delta);

    if (!isSeatedInCar) {
      const { hips, leftLeg, rightLeg, leftFoot, rightFoot, leftHand, rightHand } = swimBones;
      if (hips) hips.position.set(0, hipsRestY, 0);
      if (leftLeg && leftLeg.scale.x !== 1) leftLeg.scale.setScalar(1);
      if (rightLeg && rightLeg.scale.x !== 1) rightLeg.scale.setScalar(1);
      if (leftFoot && leftFoot.scale.x !== 1) leftFoot.scale.setScalar(1);
      if (rightFoot && rightFoot.scale.x !== 1) rightFoot.scale.setScalar(1);
      if (leftHand && leftHand.scale.x !== 1) leftHand.scale.setScalar(1);
      if (rightHand && rightHand.scale.x !== 1) rightHand.scale.setScalar(1);
    }

    if (swimBlendWeight.current > 0.01) {
      const weight = swimBlendWeight.current;
      const {
        leftArm,
        rightArm,
        leftForeArm,
        rightForeArm,
        leftHand,
        rightHand,
        leftUpLeg,
        rightUpLeg,
        leftLeg,
        rightLeg,
        leftFoot,
        rightFoot,
        spine,
        spine1,
        head,
        hips,
      } = swimBones;

      const time = state.clock.getElapsedTime();
      const realSpeed = Math.max(speed || 0, store.playerSpeed ?? 0);
      const isClimbingLadder = !isSeatedInCar && actionName === 'climb';
      const isSwimmingMoving = !isSeatedInCar && actionName === 'swim' && realSpeed > 0.15;

      const restHips = boneRestQuats.get('Hips');
      const restUpL = boneRestQuats.get('LeftUpLeg');
      const restUpR = boneRestQuats.get('RightUpLeg');
      const restLegL = boneRestQuats.get('LeftLeg');
      const restLegR = boneRestQuats.get('RightLeg');
      const restFootL = boneRestQuats.get('LeftFoot');
      const restFootR = boneRestQuats.get('RightFoot');
      const restArmL = boneRestQuats.get('LeftArm');
      const restArmR = boneRestQuats.get('RightArm');
      const restForeArmL = boneRestQuats.get('LeftForeArm');
      const restForeArmR = boneRestQuats.get('RightForeArm');
      const restSpine = boneRestQuats.get('Spine');
      const restSpine1 = boneRestQuats.get('Spine1');
      const restHead = boneRestQuats.get('Head');

      if (isSeatedInCar) {
        // --- SEATED IN CAR COCKPIT BUCKET SEAT (DRIVER GRIPS WHEEL OR PASSENGER RELAXED IN RIGHT SEAT) ---
        const activeCar = store.drivingCarId ? store.carStates[store.drivingCarId] : null;
        const steer = isDrivingCar && activeCar ? activeCar.steer : 0;

        if (hips && restHips) {
          hips.position.set(0, hipsRestY * 0.50, -0.02);
          _deltaQuat.setFromEuler(_scratchEuler.set(-0.12 * weight, 0, 0));
          hips.quaternion.copy(restHips).multiply(_deltaQuat);
        }
        if (spine && restSpine) {
          _deltaQuat.setFromEuler(_scratchEuler.set((isPassenger ? 0.05 : 0.10) * weight, -steer * 0.10 * weight, 0));
          spine.quaternion.copy(restSpine).multiply(_deltaQuat);
        }
        if (spine1 && restSpine1) {
          _deltaQuat.setFromEuler(_scratchEuler.set((isPassenger ? 0.06 : 0.12) * weight, -steer * 0.08 * weight, 0));
          spine1.quaternion.copy(restSpine1).multiply(_deltaQuat);
        }

        // Swing thighs forward/upward along the seat cushion (+1.68 rad) so knees stay high inside the cockpit
        if (leftUpLeg && restUpL) {
          _deltaQuat.setFromEuler(_scratchEuler.set(1.68 * weight, -0.08 * weight, 0));
          leftUpLeg.quaternion.copy(restUpL).multiply(_deltaQuat);
        }
        if (rightUpLeg && restUpR) {
          _deltaQuat.setFromEuler(_scratchEuler.set(1.68 * weight, 0.08 * weight, 0));
          rightUpLeg.quaternion.copy(restUpR).multiply(_deltaQuat);
        }
        // Tuck lower shins and boots completely inside the cabin footwell so they NEVER appear underneath the car chassis!
        if (leftLeg && restLegL) {
          _deltaQuat.setFromAxisAngle(_xAxis, -0.65 * weight);
          leftLeg.quaternion.copy(restLegL).multiply(_deltaQuat);
          leftLeg.scale.setScalar(0.18);
        }
        if (rightLeg && restLegR) {
          _deltaQuat.setFromAxisAngle(_xAxis, -0.65 * weight);
          rightLeg.quaternion.copy(restLegR).multiply(_deltaQuat);
          rightLeg.scale.setScalar(0.18);
        }
        if (leftFoot && restFootL) {
          _deltaQuat.setFromAxisAngle(_xAxis, 0.15 * weight);
          leftFoot.quaternion.copy(restFootL).multiply(_deltaQuat);
          leftFoot.scale.setScalar(0.12);
        }
        if (rightFoot && restFootR) {
          _deltaQuat.setFromAxisAngle(_xAxis, 0.15 * weight);
          rightFoot.quaternion.copy(restFootR).multiply(_deltaQuat);
          rightFoot.scale.setScalar(0.12);
        }

        const isFemaleRig = gender === 'female';
        if (isPassenger) {
          // Companion seated comfortably in front-right passenger seat with arms resting on lap
          if (leftArm && restArmL) {
            _deltaQuat.setFromEuler(_scratchEuler.set(0.32 * weight, 0.12 * weight, (isFemaleRig ? 0.65 : 0.72) * weight));
            leftArm.quaternion.copy(restArmL).multiply(_deltaQuat);
          }
          if (leftForeArm && restForeArmL) {
            _deltaQuat.setFromEuler(_scratchEuler.set(0.55 * weight, 0, -0.18 * weight));
            leftForeArm.quaternion.copy(restForeArmL).multiply(_deltaQuat);
          }
          if (leftHand) leftHand.scale.setScalar(0.9);

          if (rightArm && restArmR) {
            _deltaQuat.setFromEuler(_scratchEuler.set(0.32 * weight, -0.12 * weight, -(isFemaleRig ? 0.65 : 0.72) * weight));
            rightArm.quaternion.copy(restArmR).multiply(_deltaQuat);
          }
          if (rightForeArm && restForeArmR) {
            _deltaQuat.setFromEuler(_scratchEuler.set(0.55 * weight, 0, 0.18 * weight));
            rightForeArm.quaternion.copy(restForeArmR).multiply(_deltaQuat);
          }
          if (rightHand) rightHand.scale.setScalar(0.9);

          if (head && restHead) {
            _deltaQuat.setFromEuler(_scratchEuler.set(0.05 * weight, -0.14 * weight, 0));
            head.quaternion.copy(restHead).multiply(_deltaQuat);
          }
        } else {
          // Driver Left & Right Arms calibrated per skeleton gender so EVA gloves grip the steering wheel cleanly
          if (leftArm && restArmL) {
            const baseExL = isFemaleRig ? 0.40 : -0.60;
            const baseEyL = isFemaleRig ? 0.40 : 0.60;
            const baseEzL = isFemaleRig ? 1.20 : 1.80;
            _deltaQuat.setFromEuler(
              _scratchEuler.set(
                (baseExL - steer * 0.28) * weight,
                baseEyL * weight,
                (baseEzL - steer * 0.14) * weight
              )
            );
            leftArm.quaternion.copy(restArmL).multiply(_deltaQuat);
          }
          if (leftForeArm && restForeArmL) {
            _deltaQuat.setFromEuler(_scratchEuler.set(0.18 * weight, 0, -0.14 * weight));
            leftForeArm.quaternion.copy(restForeArmL).multiply(_deltaQuat);
          }
          if (leftHand) {
            leftHand.scale.setScalar(0.95);
            const restHandL = boneRestQuats.get('LeftHand');
            if (restHandL) {
              _deltaQuat.setFromEuler(_scratchEuler.set(0.25 * weight, -0.35 * weight, 0));
              leftHand.quaternion.copy(restHandL).multiply(_deltaQuat);
            }
          }

          if (rightArm && restArmR) {
            const baseExR = isFemaleRig ? 0.40 : -0.20;
            const baseEyR = isFemaleRig ? -0.40 : -0.60;
            const baseEzR = isFemaleRig ? -1.20 : -1.60;
            _deltaQuat.setFromEuler(
              _scratchEuler.set(
                (baseExR + steer * 0.28) * weight,
                baseEyR * weight,
                (baseEzR - steer * 0.14) * weight
              )
            );
            rightArm.quaternion.copy(restArmR).multiply(_deltaQuat);
          }
          if (rightForeArm && restForeArmR) {
            _deltaQuat.setFromEuler(_scratchEuler.set(0.18 * weight, 0, 0.14 * weight));
            rightForeArm.quaternion.copy(restForeArmR).multiply(_deltaQuat);
          }
          if (rightHand) {
            rightHand.scale.setScalar(0.95);
            const restHandR = boneRestQuats.get('RightHand');
            if (restHandR) {
              _deltaQuat.setFromEuler(_scratchEuler.set(0.25 * weight, 0.35 * weight, 0));
              rightHand.quaternion.copy(restHandR).multiply(_deltaQuat);
            }
          }

          // Head looking forward through the windshield and slightly into the turn
          if (head && restHead) {
            _deltaQuat.setFromEuler(_scratchEuler.set(0.06 * weight, steer * 0.35 * weight, 0));
            head.quaternion.copy(restHead).multiply(_deltaQuat);
          }
        }
      } else if (actionName === 'dead') {
        // --- COLLAPSED / FALLEN ASTRONAUT RAGDOLL POSE ---
        if (hips && restHips) {
          hips.quaternion.copy(restHips);
        }
        if (spine && restSpine) {
          _deltaQuat.setFromEuler(_scratchEuler.set(0.12 * weight, 0, 0.06 * weight));
          spine.quaternion.copy(restSpine).multiply(_deltaQuat);
        }
        if (spine1 && restSpine1) {
          _deltaQuat.setFromEuler(_scratchEuler.set(0.10 * weight, 0, -0.04 * weight));
          spine1.quaternion.copy(restSpine1).multiply(_deltaQuat);
        }
        if (head && restHead) {
          _deltaQuat.setFromEuler(_scratchEuler.set(0.28 * weight, 0.22 * weight, 0.14 * weight));
          head.quaternion.copy(restHead).multiply(_deltaQuat);
        }
        if (leftArm && restArmL) {
          _deltaQuat.setFromEuler(_scratchEuler.set(0.22 * weight, 0.15 * weight, 0.55 * weight));
          leftArm.quaternion.copy(restArmL).multiply(_deltaQuat);
        }
        if (leftForeArm && restForeArmL) {
          _deltaQuat.setFromAxisAngle(_xAxis, 0.35 * weight);
          leftForeArm.quaternion.copy(restForeArmL).multiply(_deltaQuat);
        }
        if (rightArm && restArmR) {
          _deltaQuat.setFromEuler(_scratchEuler.set(0.18 * weight, -0.18 * weight, -0.62 * weight));
          rightArm.quaternion.copy(restArmR).multiply(_deltaQuat);
        }
        if (rightForeArm && restForeArmR) {
          _deltaQuat.setFromAxisAngle(_xAxis, 0.42 * weight);
          rightForeArm.quaternion.copy(restForeArmR).multiply(_deltaQuat);
        }
        if (leftUpLeg && restUpL) {
          _deltaQuat.setFromEuler(_scratchEuler.set(-0.18 * weight, -0.10 * weight, 0.12 * weight));
          leftUpLeg.quaternion.copy(restUpL).multiply(_deltaQuat);
        }
        if (leftLeg && restLegL) {
          _deltaQuat.setFromAxisAngle(_xAxis, 0.38 * weight);
          leftLeg.quaternion.copy(restLegL).multiply(_deltaQuat);
        }
        if (rightUpLeg && restUpR) {
          _deltaQuat.setFromEuler(_scratchEuler.set(-0.08 * weight, 0.12 * weight, -0.14 * weight));
          rightUpLeg.quaternion.copy(restUpR).multiply(_deltaQuat);
        }
        if (rightLeg && restLegR) {
          _deltaQuat.setFromAxisAngle(_xAxis, 0.22 * weight);
          rightLeg.quaternion.copy(restLegR).multiply(_deltaQuat);
        }
        if (leftFoot && restFootL) leftFoot.quaternion.copy(restFootL);
        if (rightFoot && restFootR) rightFoot.quaternion.copy(restFootR);
      } else if (isClimbingLadder) {
        // --- REALISTIC IRON LADDER CLIMBING KINEMATICS (GRABBING RUNGS & STEPPING UP) ---
        const climbCycle = time * 5.2;
        const sinL = Math.sin(climbCycle);
        const sinR = Math.sin(climbCycle + Math.PI);

        if (hips && restHips) {
          _deltaQuat.setFromEuler(_scratchEuler.set(0, 0, sinL * 0.05 * weight));
          hips.quaternion.copy(restHips).multiply(_deltaQuat);
        }
        if (spine && restSpine) {
          _deltaQuat.setFromEuler(_scratchEuler.set(-0.08 * weight, 0, 0));
          spine.quaternion.copy(restSpine).multiply(_deltaQuat);
        }

        // Left & Right Arms reaching forward/upward to grasp the vertical side rails & iron rungs
        if (leftArm && restArmL) {
          const reachPitchL = (-1.15 + sinL * 0.42) * weight;
          const inwardYawL = 0.32 * weight;
          const shoulderRaiseL = (0.55 + sinL * 0.25) * weight;
          _deltaQuat.setFromEuler(_scratchEuler.set(reachPitchL, inwardYawL, shoulderRaiseL));
          leftArm.quaternion.copy(restArmL).multiply(_deltaQuat);
        }
        if (leftForeArm && restForeArmL) {
          const elbowPullL = (0.65 - sinL * 0.25) * weight;
          _deltaQuat.setFromAxisAngle(_xAxis, elbowPullL);
          leftForeArm.quaternion.copy(restForeArmL).multiply(_deltaQuat);
        }

        if (rightArm && restArmR) {
          const reachPitchR = (-1.15 + sinR * 0.42) * weight;
          const inwardYawR = -0.32 * weight;
          const shoulderRaiseR = (-0.55 - sinR * 0.25) * weight;
          _deltaQuat.setFromEuler(_scratchEuler.set(reachPitchR, inwardYawR, shoulderRaiseR));
          rightArm.quaternion.copy(restArmR).multiply(_deltaQuat);
        }
        if (rightForeArm && restForeArmR) {
          const elbowPullR = (0.65 - sinR * 0.25) * weight;
          _deltaQuat.setFromAxisAngle(_xAxis, elbowPullR);
          rightForeArm.quaternion.copy(restForeArmR).multiply(_deltaQuat);
        }

        // Alternating knees & boots stepping firmly onto each iron ladder rung
        const stepLiftL = Math.max(0, sinR); // Opposite leg lifts as arm pulls
        const stepLiftR = Math.max(0, sinL);

        if (leftUpLeg && restUpL) {
          _deltaQuat.setFromAxisAngle(_xAxis, (-0.15 - stepLiftL * 0.68) * weight);
          leftUpLeg.quaternion.copy(restUpL).multiply(_deltaQuat);
        }
        if (leftLeg && restLegL) {
          _deltaQuat.setFromAxisAngle(_xAxis, (0.20 + stepLiftL * 0.75) * weight);
          leftLeg.quaternion.copy(restLegL).multiply(_deltaQuat);
        }
        if (leftFoot && restFootL) {
          _deltaQuat.setFromAxisAngle(_xAxis, 0.12 * weight);
          leftFoot.quaternion.copy(restFootL).multiply(_deltaQuat);
        }

        if (rightUpLeg && restUpR) {
          _deltaQuat.setFromAxisAngle(_xAxis, (-0.15 - stepLiftR * 0.68) * weight);
          rightUpLeg.quaternion.copy(restUpR).multiply(_deltaQuat);
        }
        if (rightLeg && restLegR) {
          _deltaQuat.setFromAxisAngle(_xAxis, (0.20 + stepLiftR * 0.75) * weight);
          rightLeg.quaternion.copy(restLegR).multiply(_deltaQuat);
        }
        if (rightFoot && restFootR) {
          _deltaQuat.setFromAxisAngle(_xAxis, 0.12 * weight);
          rightFoot.quaternion.copy(restFootR).multiply(_deltaQuat);
        }

        // Head looking slightly up toward the top of the pier ladder
        if (head && restHead) {
          _deltaQuat.setFromEuler(_scratchEuler.set(-0.22 * weight, 0, 0));
          head.quaternion.copy(restHead).multiply(_deltaQuat);
        }
      } else if (isSwimmingMoving) {
        // --- STREAMLINED HYDRODYNAMIC PRONE PLANK SWIMMING KINEMATICS ---
        if (hips && restHips) {
          hips.quaternion.copy(restHips);
        }
        if (spine && restSpine) {
          spine.quaternion.copy(restSpine);
        }

        const strokeCadence = 3.4;
        const strokeCycleL = time * strokeCadence;
        const strokeCycleR = strokeCycleL + Math.PI;
        const kickCadence = time * 6.8;

        const sinL = Math.sin(strokeCycleL);
        const cosL = Math.cos(strokeCycleL);
        const isRecoveryL = sinL < 0;

        const sinR = Math.sin(strokeCycleR);
        const cosR = Math.cos(strokeCycleR);
        const isRecoveryR = sinR < 0;

        if (leftArm && restArmL) {
          const pitchL = sinL * 0.95 * weight;
          const yawL = -cosL * 0.52 * weight;
          const spreadL = (0.25 + (isRecoveryL ? Math.abs(sinL) * 0.35 : 0.05)) * weight;
          _deltaQuat.setFromEuler(_scratchEuler.set(pitchL, yawL, spreadL));
          leftArm.quaternion.copy(restArmL).multiply(_deltaQuat);
        }
        if (leftForeArm && restForeArmL) {
          const flexL = (isRecoveryL ? 0.55 * Math.abs(sinL) + 0.18 : 0.12) * weight;
          _deltaQuat.setFromAxisAngle(_xAxis, flexL);
          leftForeArm.quaternion.copy(restForeArmL).multiply(_deltaQuat);
        }

        if (rightArm && restArmR) {
          const pitchR = sinR * 0.95 * weight;
          const yawR = cosR * 0.52 * weight;
          const spreadR = (-0.25 - (isRecoveryR ? Math.abs(sinR) * 0.35 : 0.05)) * weight;
          _deltaQuat.setFromEuler(_scratchEuler.set(pitchR, yawR, spreadR));
          rightArm.quaternion.copy(restArmR).multiply(_deltaQuat);
        }
        if (rightForeArm && restForeArmR) {
          const flexR = (isRecoveryR ? 0.55 * Math.abs(sinR) + 0.18 : 0.12) * weight;
          _deltaQuat.setFromAxisAngle(_xAxis, flexR);
          rightForeArm.quaternion.copy(restForeArmR).multiply(_deltaQuat);
        }

        const kickL = Math.sin(kickCadence);
        const kickR = Math.sin(kickCadence + Math.PI);

        if (leftUpLeg && restUpL) {
          _deltaQuat.setFromAxisAngle(_xAxis, kickL * 0.10 * weight);
          leftUpLeg.quaternion.copy(restUpL).multiply(_deltaQuat);
        }
        if (rightUpLeg && restUpR) {
          _deltaQuat.setFromAxisAngle(_xAxis, kickR * 0.10 * weight);
          rightUpLeg.quaternion.copy(restUpR).multiply(_deltaQuat);
        }

        if (leftLeg && restLegL) leftLeg.quaternion.copy(restLegL);
        if (rightLeg && restLegR) rightLeg.quaternion.copy(restLegR);

        if (leftFoot && restFootL) {
          _deltaQuat.setFromAxisAngle(_xAxis, -0.40 * weight);
          leftFoot.quaternion.copy(restFootL).multiply(_deltaQuat);
        }
        if (rightFoot && restFootR) {
          _deltaQuat.setFromAxisAngle(_xAxis, -0.40 * weight);
          rightFoot.quaternion.copy(restFootR).multiply(_deltaQuat);
        }

        if (head && restHead) {
          _deltaQuat.setFromEuler(_scratchEuler.set(-0.38 * weight, 0, 0));
          head.quaternion.copy(restHead).multiply(_deltaQuat);
        }
      } else {
        // --- REALISTIC TREADING WATER (SUBMERGED VERTICAL FLOAT) ---
        const treadTime = time * 2.2;
        const treadSweep = Math.sin(treadTime) * 0.25;

        if (hips && restHips) hips.quaternion.copy(restHips);

        // Submerged horizontal sculling arm motions keeping head above water
        if (leftArm && restArmL) {
          _deltaQuat.setFromEuler(_scratchEuler.set(0.32 * weight, 0.20 * weight, (0.42 + treadSweep) * weight));
          leftArm.quaternion.copy(restArmL).multiply(_deltaQuat);
        }
        if (leftForeArm && restForeArmL) {
          _deltaQuat.setFromAxisAngle(_xAxis, (0.55 - treadSweep * 0.22) * weight);
          leftForeArm.quaternion.copy(restForeArmL).multiply(_deltaQuat);
        }
        if (rightArm && restArmR) {
          _deltaQuat.setFromEuler(_scratchEuler.set(0.32 * weight, -0.20 * weight, (-0.42 - treadSweep) * weight));
          rightArm.quaternion.copy(restArmR).multiply(_deltaQuat);
        }
        if (rightForeArm && restForeArmR) {
          _deltaQuat.setFromAxisAngle(_xAxis, (0.55 - treadSweep * 0.22) * weight);
          rightForeArm.quaternion.copy(restForeArmR).multiply(_deltaQuat);
        }

        // Submerged frog/eggbeater leg kicks deep under water
        const eggCycle = time * 3.0;
        if (leftUpLeg && restUpL) {
          _deltaQuat.setFromAxisAngle(_xAxis, (-0.22 + Math.sin(eggCycle) * 0.16) * weight);
          leftUpLeg.quaternion.copy(restUpL).multiply(_deltaQuat);
        }
        if (rightUpLeg && restUpR) {
          _deltaQuat.setFromAxisAngle(_xAxis, (-0.22 + Math.cos(eggCycle) * 0.16) * weight);
          rightUpLeg.quaternion.copy(restUpR).multiply(_deltaQuat);
        }
        if (leftLeg && restLegL) {
          _deltaQuat.setFromAxisAngle(_xAxis, (0.35 + Math.sin(eggCycle) * 0.15) * weight);
          leftLeg.quaternion.copy(restLegL).multiply(_deltaQuat);
        }
        if (rightLeg && restLegR) {
          _deltaQuat.setFromAxisAngle(_xAxis, (0.35 + Math.cos(eggCycle) * 0.15) * weight);
          rightLeg.quaternion.copy(restLegR).multiply(_deltaQuat);
        }
        if (leftFoot && restFootL) leftFoot.quaternion.copy(restFootL);
        if (rightFoot && restFootR) rightFoot.quaternion.copy(restFootR);
        if (spine && restSpine) spine.quaternion.copy(restSpine);
        if (head && restHead) {
          _deltaQuat.setFromAxisAngle(_xAxis, -0.08 * weight);
          head.quaternion.copy(restHead).multiply(_deltaQuat);
        }
      }
    }
  });

// Module-level singleton for astronaut badges and insignia textures
interface SharedAstronautTextures {
  angola: any;
  ggpen: any;
  nasaApps: any;
  nasaAppsBanner: any;
  rankBadge: CanvasTexture;
}

let _cachedAstronautTextures: SharedAstronautTextures | null = null;

function getSharedAstronautTextures(): SharedAstronautTextures {
  if (_cachedAstronautTextures) return _cachedAstronautTextures;

  const loader = new TextureLoader();
  const safeLoad = (url: string, fallbackUrl?: string) => {
    const texture = loader.load(
      url,
      undefined,
      undefined,
      () => {
        if (fallbackUrl) {
          loader.load(fallbackUrl, (t) => {
            texture.image = t.image;
            texture.needsUpdate = true;
          });
        }
      }
    );
    return texture;
  };

  const angola = getOfficialAngolaFlagTexture() || safeLoad('/angola_flag.jpg');
  const ggpen = safeLoad('/ggpen_logo.png', '/ggpen_logo.jpg');
  const nasaApps = safeLoad('/space_apps_luanda_emblem.png');
  const nasaAppsBanner = safeLoad('/nasa_space_apps_luanda.svg');

  [angola, ggpen, nasaApps, nasaAppsBanner].forEach((t) => {
    t.anisotropy = 8;
    t.generateMipmaps = true;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 498, 242);

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, 476, 220);

    const barW = 85;
    const barH = 14;
    const startX = 256 - (3 * barW + 2 * 16) / 2;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(startX + i * (barW + 16), 34, barW, barH);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(startX + i * (barW + 16) + 4, 37, barW - 8, 4);
    }

    ctx.save();
    ctx.translate(256, 114);
    ctx.fillStyle = '#eab308';

    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 2);

    ctx.beginPath();
    ctx.moveTo(-18, -2);
    ctx.lineTo(-120, -18);
    ctx.lineTo(-80, 4);
    ctx.lineTo(-110, 8);
    ctx.lineTo(-60, 16);
    ctx.lineTo(-20, 12);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(18, -2);
    ctx.lineTo(120, -18);
    ctx.lineTo(80, 4);
    ctx.lineTo(110, 8);
    ctx.lineTo(60, 16);
    ctx.lineTo(20, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COMANDANTE', 256, 185);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('GGPEN • MISSÃO ESPACIAL', 256, 222);
  }
  const rankBadge = new CanvasTexture(canvas);
  rankBadge.needsUpdate = true;

  _cachedAstronautTextures = { angola, ggpen, nasaApps, nasaAppsBanner, rankBadge };
  return _cachedAstronautTextures;
}

// Procedural curved patch geometry hugging spacesuit curves (curved deltoids and chest plate)
function createCurvedPatchGeometry(width: number, height: number, radius: number, segments = 16) {
  const geo = new PlaneGeometry(width, height, segments, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const theta = x / radius;
    const curvedX = radius * Math.sin(theta);
    const curvedZ = -radius * (1.0 - Math.cos(theta));
    pos.setXYZ(i, curvedX, pos.getY(i), curvedZ);
  }
  geo.computeVertexNormals();
  return geo;
}

// In AstronautModel: Reuse singleton textures without reloading
  const textures = useMemo(() => getSharedAstronautTextures(), []);

  // -----------------------------------------------------------------------
  // VOLUMETRIC SPACESUIT SHADER ON THE SKELETON
  // 1. Natural Soft Skin Tone: roughness 0.96, metalness 0.0 (NO specular shine)
  // 2. Volumetric Inflation: Transforms skinny humanoid into thick, bulky spacesuit
  // 3. Realistic Aerospace Beta-Cloth Texture, Accordion Pleats, Red Commander Stripe,
  //    Apollo Lunar Soles, and Wrist Rings
  // -----------------------------------------------------------------------
  useEffect(() => {
    const neckY = isFemale ? 1.48 : 1.54;
    const createdSuitMaterials: MeshStandardMaterial[] = [];
    avatarGltf.scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mesh = child as Mesh;
        if (mesh.material) {
          const oldMat = mesh.material as any;
          // Roughness 0.96 & metalness 0.0 ensures human skin has ZERO harsh plastic shine!
          const suitMat = new MeshStandardMaterial({
            map: oldMat.map || null,
            roughness: 0.96,
            metalness: 0.0,
          });
          createdSuitMaterials.push(suitMat);

          suitMat.onBeforeCompile = (shader) => {
            shader.uniforms.uNeckY = { value: neckY };
            shader.uniforms.uHasSpacesuit = { value: hasSpacesuit ? 1.0 : 0.0 };
            shader.uniforms.uIsFemale = { value: isFemale ? 1.0 : 0.0 };
            shader.uniforms.uSuitColor = { value: new Color(theme.primary) };
            shader.uniforms.uStripeColor = { value: new Color(theme.commanderStripe) };
            shader.uniforms.uJointColor = { value: new Color(theme.joints) };
            shader.uniforms.uSoleColor = { value: new Color(theme.bootSole) };

            // VOLUMETRIC INFLATION (Expands vertices outward along normals ONLY when wearing spacesuit)
            shader.vertexShader = `
              uniform float uNeckY;
              uniform float uHasSpacesuit;
              varying vec3 vLocalPos;
              varying vec3 vLocalNorm;
              ${shader.vertexShader}
            `.replace(
              '#include <begin_vertex>',
              `#include <begin_vertex>
              vLocalPos = position;
              vLocalNorm = normal;

              // Expand suit vertices to give realistic aerospace fabric thickness & lunar overboots
              if (uHasSpacesuit > 0.5 && position.y <= uNeckY) {
                float inflation = 0.024; // Base 2.4cm thermal micrometeoroid garment
                // Thick Apollo Lunar Overboots
                if (position.y < 0.16) {
                  inflation = 0.038;
                }
                // Puffy thighs and biceps
                else if (position.y < 0.85 || abs(position.x) > 0.18) {
                  inflation = 0.028;
                }
                transformed += normal * inflation;
              }`
            );

            shader.fragmentShader = `
              varying vec3 vLocalPos;
              varying vec3 vLocalNorm;
              uniform float uNeckY;
              uniform float uHasSpacesuit;
              uniform float uIsFemale;
              uniform vec3 uSuitColor;
              uniform vec3 uStripeColor;
              uniform vec3 uJointColor;
              uniform vec3 uSoleColor;
              ${shader.fragmentShader}
            `.replace(
              '#include <map_fragment>',
              `
              #include <map_fragment>
              // Face & hair remain completely natural with soft realistic skin (above neck)
              if (vLocalPos.y <= uNeckY) {
                float y = vLocalPos.y;
                float x = vLocalPos.x;
                float z = vLocalPos.z;
                float ax = abs(x);

                if (uHasSpacesuit > 0.5) {
                  // Below neck: Pure high-fidelity NASA EMU spacesuit
                  vec3 col = uSuitColor;
                  float fabricSoftGrain = sin(vLocalPos.x * 40.0) * cos(vLocalPos.z * 40.0) * 0.012;
                  col += vec3(fabricSoftGrain);

                  if (y < 0.038) {
                    col = uSoleColor;
                    if (y < 0.022 && mod(z * 45.0, 1.0) > 0.5) {
                      col = vec3(0.02, 0.06, 0.12);
                    }
                  }
                  else if (y >= 0.038 && y < 0.08) {
                    col = uJointColor;
                  }
                  else if (y >= 0.38 && y <= 0.48) {
                    col = uJointColor;
                  }
                  else if (x > 0.02 && y >= 0.63 && y <= 0.73) {
                    col = uStripeColor;
                  }
                  else if (y >= 0.88 && y <= 0.94) {
                    col = uJointColor;
                  }
                  else if (ax > 0.16 && y > 0.85 && y < 1.42) {
                    if (y >= 1.06 && y <= 1.16) {
                      col = uJointColor;
                    }
                    if (x > 0.16 && y >= 1.20 && y <= 1.28) {
                      col = uStripeColor;
                    }
                    if (ax > 0.34 && y >= 1.02 && y <= 1.05) {
                      col = (x > 0.0) ? vec3(0.1, 0.5, 0.9) : vec3(0.9, 0.2, 0.2);
                    }
                    if (ax > 0.35 && y < 1.02) {
                      col = uJointColor;
                      if (y < 0.92) {
                        col = uSoleColor;
                      }
                    }
                  }
                  diffuseColor = vec4(col, 1.0);
                } else {
                  // Civilian / Normal Hangar Crew Outfit (no spacesuit):
                  // Tailored crew flight polo/jacket + slate trousers + clean sneakers, keeping hands/skin natural
                  bool isBareHand = (ax > 0.34 && y < 1.05);
                  if (!isBareHand) {
                    vec3 shirtCol = uIsFemale > 0.5
                      ? vec3(0.07, 0.33, 0.42)   // Teal-slate specialist mission polo (Ana)
                      : vec3(0.10, 0.21, 0.44);  // Royal navy commander mission polo (Manuel)
                    vec3 trouserCol = vec3(0.11, 0.14, 0.20);
                    vec3 shoeCol = vec3(0.06, 0.07, 0.10);
                    vec3 col = trouserCol;

                    if (y < 0.032) {
                      col = vec3(0.88, 0.90, 0.94); // Clean white sneaker sole
                    } else if (y < 0.11) {
                      col = shoeCol; // Sneakers
                    } else if (y >= 0.88 && y <= 0.93) {
                      col = vec3(0.05, 0.05, 0.07); // Crew belt
                    } else if (y > 0.93) {
                      col = shirtCol;
                      // Crisp collar / shoulder accent stripe
                      if (y > uNeckY - 0.06 && ax < 0.14) {
                        col = vec3(0.85, 0.68, 0.15);
                      }
                    }
                    diffuseColor = vec4(col, 1.0);
                  }
                }
              }
              `
            ).replace(
              '#include <roughnessmap_fragment>',
              `
              #include <roughnessmap_fragment>
              if (vLocalPos.y <= uNeckY) {
                if (uHasSpacesuit > 0.5) {
                  float y = vLocalPos.y;
                  float ax = abs(vLocalPos.x);
                  if (ax > 0.34 && y >= 1.02 && y <= 1.05) {
                    roughnessFactor = 0.22;
                  } else if (y < 0.08 || (y >= 0.38 && y <= 0.48) || (y >= 1.06 && y <= 1.16)) {
                    roughnessFactor = 0.75;
                  } else {
                    roughnessFactor = 0.42;
                  }
                } else {
                  roughnessFactor = 0.85;
                }
              }
              `
            ).replace(
              '#include <metalnessmap_fragment>',
              `
              #include <metalnessmap_fragment>
              if (vLocalPos.y <= uNeckY) {
                if (uHasSpacesuit > 0.5) {
                  float y = vLocalPos.y;
                  float ax = abs(vLocalPos.x);
                  if (ax > 0.34 && y >= 1.02 && y <= 1.05) {
                    metalnessFactor = 0.85;
                  } else {
                    metalnessFactor = 0.02;
                  }
                } else {
                  metalnessFactor = 0.0;
                }
              }
              `
            );
          };

          mesh.material = suitMat;
        }
      }
    });

    return () => {
      createdSuitMaterials.forEach((m) => m.dispose());
    };
  }, [avatarGltf.scene, isFemale, theme, hasSpacesuit]);

  // -----------------------------------------------------------------------
  // HARDWARE ACCESSORIES:
  // 1. FULL PANORAMIC HELMET (100% Coverage, No Holes, No Blind Spots)
  // 2. REALISTIC CONTOURED CHEST DCM WITH BADGES & VALVES
  // 3. ERGONOMIC PLSS BACKPACK WITH O2 TANKS & GOLD MLI FOIL
  // 4. EMBROIDERED SHOULDER PATCHES (ANGOLA FLAG & NASA SPACE APPS)
  // 5. OPTIONAL HANDHELD ANGOLA FLAG ON MOON MISSION
  // -----------------------------------------------------------------------
  useEffect(() => {
    const scene = avatarGltf.scene;
    const head = scene.getObjectByName('Head');
    const spine2 = scene.getObjectByName('Spine2');
    const leftArm = scene.getObjectByName('LeftArm');
    const rightArm = scene.getObjectByName('RightArm');
    const rightHand = scene.getObjectByName('RightHand');

    const cleanups: (() => void)[] = [];

    // Shared materials
    const matSuit = new MeshStandardMaterial({ color: theme.primary, roughness: 0.30, metalness: 0.05 });
    const matMetal = new MeshStandardMaterial({ color: theme.metalTrim, metalness: 0.92, roughness: 0.18 });
    const matDark = new MeshStandardMaterial({ color: theme.secondary, roughness: 0.35, metalness: 0.60 });
    const matGold = new MeshStandardMaterial({ color: theme.goldFoil, metalness: 0.96, roughness: 0.15 });
    const matWhite = new MeshBasicMaterial({ color: 0xffffff });
    const matBlackContour = new MeshBasicMaterial({ color: 0x050505 });
    const matRed = new MeshStandardMaterial({ color: 0xd9230a, roughness: 0.35 });

    // =====================================================================
    // 1. SLEEK NASA EMU HELMET (ATTACHED TO HEAD BONE - ONLY WITH SPACESUIT)
    // =====================================================================
    if (head && hasSpacesuit) {
      const helmetGroup = new Group();
      const radius = isFemale ? 0.190 : 0.200;
      // Head center offset
      helmetGroup.position.set(0, 0.08, 0.015);

      // Polished Titanium Neck Collar Ring
      const neckCollar = new Mesh(new CylinderGeometry(radius * 0.82, radius * 0.90, 0.040, 32), matMetal);
      neckCollar.position.set(0, -radius * 0.72, 0);
      helmetGroup.add(neckCollar);

      // Smooth White Outer Shell: Wraps from right temple through the back of the head to the left temple!
      // In Three.js Sphere: phi 0.5*PI is +Z (front/face), phi 1.5*PI is -Z (back of head).
      // Starts at 0.85*PI, length 1.30*PI covers the rear 234 degrees and top crown, leaving front open!
      const shellGeo = new SphereGeometry(
        radius * 1.025,
        32,
        24,
        Math.PI * 0.85,
        Math.PI * 1.30,
        0,
        Math.PI * 0.75
      );
      const shellMesh = new Mesh(shellGeo, matSuit);
      helmetGroup.add(shellMesh);

      // Aerospace Visor Opening Rubber Frame Gasket (clean bevel outline around the face viewport)
      const visorRim = new Mesh(new TorusGeometry(radius * 0.88, 0.014, 12, 32), matDark);
      visorRim.position.set(0, 0.01, radius * 0.40);
      visorRim.rotation.x = 0.25;
      helmetGroup.add(visorRim);

      // Dual Temple EVA Floodlights with Cold White LED Glow
      [-1, 1].forEach((side) => {
        const floodBody = new Mesh(new CylinderGeometry(0.015, 0.018, 0.032, 16), matDark);
        floodBody.position.set(side * (radius * 0.94), 0.015, radius * 0.25);
        floodBody.rotation.y = side * 0.35;
        helmetGroup.add(floodBody);

        const floodLens = new Mesh(new CircleGeometry(0.014, 16), new MeshBasicMaterial({ color: 0xe0f2fe }));
        floodLens.position.set(side * (radius * 0.94), 0.015, radius * 0.25 + 0.017);
        floodLens.rotation.y = side * 0.35;
        helmetGroup.add(floodLens);
      });

      // COMPLETE PANORAMIC VISOR BUBBLE (Full sphere that seamlessly encloses 100% of the head and face!)
      // Zero gaps, zero uncovered areas!
      const visorGeo = new SphereGeometry(radius, 36, 28);
      let visorMat: MeshStandardMaterial;
      if (visorMode === 'transparent') {
        // Crystal-clear anti-reflective aerospace polycarbonate (No face glare!)
        visorMat = new MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.09, // 91% crystal-clear see-through! Face is 100% visible and soft!
          roughness: 0.02,
          metalness: 0.08,
          depthWrite: false, // Prevents Z-fighting with face
        });
      } else {
        // 24K Gold Lunar Thermal Protection Visor
        visorMat = new MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.98,
          roughness: 0.08,
        });
      }

      const visorMesh = new Mesh(visorGeo, visorMat);
      helmetGroup.add(visorMesh);

      head.add(helmetGroup);
      cleanups.push(() => {
        head.remove(helmetGroup);
        disposeHierarchy(helmetGroup);
      });
    }

    // =====================================================================
    // 2. HARD UPPER TORSO (HUT) & CHEST DCM & BACKPACK PLSS & RANK EPAULETS
    // Realistic aerospace console with depth, switches, valves & mission logos
    // =====================================================================
    if (spine2 && hasSpacesuit) {
      const torsoGroup = new Group();
      torsoGroup.position.set(0, 0, 0);

      // -------------------------------------------------------------------
      // UPPER CHEST BADGES (PEITO SUPERIOR - HARD UPPER TORSO)
      // 1. Peito Esquerdo (Lado do Coração): Emblema Oficial GGPEN
      // 2. Peito Direito: Emblema Oficial NASA Space Apps Luanda (Circular com Contorno Preto)
      // 3. Centro Superior: Patente Oficial de Comandante de Missão & Asas de Voo
      // -------------------------------------------------------------------
      // UPPER CHEST BADGES (PEITO SUPERIOR COM RELEVO DOURADO & ALTA NITIDEZ)
      // 1. Peito Esquerdo (Lado do Coração): Emblema Oficial GGPEN
      // 2. Peito Direito: Bandeira Oficial da República de Angola
      // 3. Centro Superior: Patente de Comandante de Missão & Asas Douradas
      // -------------------------------------------------------------------
      // -------------------------------------------------------------------
      // UPPER CHEST BADGES (PEITO SUPERIOR CURVADO SEGUINDO O CONTORNO DO FATO)
      // 1. Peito Esquerdo (Lado do Coração): Emblema Oficial GGPEN Curvado
      // 2. Peito Direito: Bandeira Oficial da República de Angola Curvada
      // 3. Centro Superior: Patente de Comandante de Missão & Asas Douradas
      // -------------------------------------------------------------------
      // -------------------------------------------------------------------
      // UPPER CHEST BADGES (PEITO SUPERIOR FIXADOS DIRETAMENTE JUNTO AO FATO)
      // 1. Peito Esquerdo (Lado do Coração): Emblema Oficial GGPEN Flush
      // 2. Peito Direito: Bandeira Oficial da República de Angola Flush
      // 3. Centro Superior: Patente de Comandante de Missão & Asas Douradas
      // -------------------------------------------------------------------
      const chestZ = isFemale ? 0.125 : 0.121;
      const chestCurvatureRadius = 0.28; // Contours the cylindrical chest plate of the spacesuit

      // 1. GGPEN Space Agency Emblem (Left Upper Chest - Flush Embroidered Patch)
      const ggpenGroup = new Group();
      ggpenGroup.position.set(-0.072, 0.116, chestZ);
      ggpenGroup.rotation.set(-0.07, -0.05, 0);

      const ggpenTrim = new Mesh(createCurvedPatchGeometry(0.106, 0.066, chestCurvatureRadius), matGold);
      ggpenGroup.add(ggpenTrim);

      const ggpenBase = new Mesh(createCurvedPatchGeometry(0.100, 0.060, chestCurvatureRadius), matWhite);
      ggpenBase.position.set(0, 0, 0.0008);
      ggpenGroup.add(ggpenBase);

      const ggpenMat = new MeshBasicMaterial({
        map: textures.ggpen,
        transparent: true,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      });
      const ggpenDecal = new Mesh(createCurvedPatchGeometry(0.100, 0.060, chestCurvatureRadius), ggpenMat);
      ggpenDecal.position.set(0, 0, 0.0015);
      ggpenDecal.renderOrder = 22;
      ggpenGroup.add(ggpenDecal);
      torsoGroup.add(ggpenGroup);

      // 2. Official Angola Flag Emblem (Right Upper Chest - Flush Embroidered Patch)
      const rChestFlagGroup = new Group();
      rChestFlagGroup.position.set(0.072, 0.116, chestZ);
      rChestFlagGroup.rotation.set(-0.07, 0.05, 0);

      const flagTrim = new Mesh(createCurvedPatchGeometry(0.106, 0.066, chestCurvatureRadius), matGold);
      rChestFlagGroup.add(flagTrim);

      const flagMat = new MeshBasicMaterial({
        map: textures.angola,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      });
      const flagDecal = new Mesh(createCurvedPatchGeometry(0.100, 0.060, chestCurvatureRadius), flagMat);
      flagDecal.position.set(0, 0, 0.0012);
      flagDecal.renderOrder = 22;
      rChestFlagGroup.add(flagDecal);
      torsoGroup.add(rChestFlagGroup);

      // 3. Commander Flight Rank & Name Badge (Center Upper Chest - Flush)
      const rankGroup = new Group();
      rankGroup.position.set(0, 0.138, chestZ + 0.001);
      rankGroup.rotation.set(-0.07, 0, 0);

      const rankTrim = new Mesh(createCurvedPatchGeometry(0.082, 0.030, chestCurvatureRadius), matGold);
      rankGroup.add(rankTrim);

      const rankMat = new MeshBasicMaterial({ map: textures.rankBadge, side: DoubleSide });
      const rankDecal = new Mesh(createCurvedPatchGeometry(0.078, 0.026, chestCurvatureRadius), rankMat);
      rankDecal.position.set(0, 0, 0.001);
      rankGroup.add(rankDecal);
      torsoGroup.add(rankGroup);

      // -------------------------------------------------------------------
      // SHOULDER RANK EPAULETS (DRAGONAS DE PATENTE DE COMANDANTE NOS OMBROS)
      // 3 Galões Dourados Metálicos 3D em cada dragona de ombro
      // -------------------------------------------------------------------
      [-1, 1].forEach((side) => {
        const epaulet = new Group();
        epaulet.position.set(side * 0.116, 0.134, 0.020);
        epaulet.rotation.set(0.08, side * 0.06, side * -0.24);

        // Epaulet base in dark reinforced aerospace ballistic fabric
        const epBase = new Mesh(new BoxGeometry(0.038, 0.006, 0.082), matDark);
        epaulet.add(epBase);

        // 3 Solid Metallic Gold Commander Rank Bars
        for (let b = 0; b < 3; b++) {
          const bar = new Mesh(new BoxGeometry(0.032, 0.004, 0.009), matGold);
          bar.position.set(0, 0.004, -0.024 + b * 0.022);
          epaulet.add(bar);
        }

        // Titanium retention clasp button
        const clasp = new Mesh(new CylinderGeometry(0.005, 0.005, 0.008, 16), matMetal);
        clasp.position.set(0, 0.004, 0.032);
        epaulet.add(clasp);

        torsoGroup.add(epaulet);
      });

      // -------------------------------------------------------------------
      // OFFICIAL DELTOID EMBLEMS (FIXADOS DIRETAMENTE JUNTO AO TECIDO DO FATO)
      // Ombro Direito: Bandeira Oficial de Angola com Moldura Dourada Bordada
      // Ombro Esquerdo: Logo Oficial do GGPEN com Base Branca Radiante
      // Curvatura cilíndrica de R=0.095m assentando rente ao tecido do fato
      // Sem caixas ou molduras flutuantes no ar: fixação contínua 100% flush!
      // -------------------------------------------------------------------
      const armCurvatureRadius = 0.095; // Wraps tightly around the spacesuit deltoid sleeve
      const rDeltoid = isFemale ? { x: 0.016, y: 0.072, z: -0.074 } : { x: 0.018, y: 0.078, z: -0.080 };
      const lDeltoid = isFemale ? { x: -0.016, y: 0.072, z: -0.074 } : { x: -0.018, y: 0.078, z: -0.080 };

      if (rightArm) {
        const rShoulderGroup = new Group();
        rShoulderGroup.position.set(rDeltoid.x, rDeltoid.y, rDeltoid.z);
        rShoulderGroup.rotation.set(-3.142, 0.221, 0.331);

        // Thin golden embroidered outer rim flush against suit cloth
        const rFlagTrim = new Mesh(createCurvedPatchGeometry(0.098, 0.064, armCurvatureRadius), matGold);
        rShoulderGroup.add(rFlagTrim);

        const rFlagMat = new MeshBasicMaterial({
          map: textures.angola,
          side: DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          polygonOffsetUnits: -4,
        });
        const rFlagMesh = new Mesh(createCurvedPatchGeometry(0.092, 0.058, armCurvatureRadius), rFlagMat);
        rFlagMesh.position.set(0, 0, 0.001);
        rFlagMesh.renderOrder = 24;
        rShoulderGroup.add(rFlagMesh);

        rightArm.add(rShoulderGroup);
        cleanups.push(() => {
          rightArm.remove(rShoulderGroup);
          disposeHierarchy(rShoulderGroup);
        });
      }

      if (leftArm) {
        const lShoulderGroup = new Group();
        lShoulderGroup.position.set(lDeltoid.x, lDeltoid.y, lDeltoid.z);
        lShoulderGroup.rotation.set(3.118, -0.533, -0.263);

        // Thin golden embroidered outer rim flush against suit cloth
        const lGgpenTrim = new Mesh(createCurvedPatchGeometry(0.098, 0.064, armCurvatureRadius), matGold);
        lShoulderGroup.add(lGgpenTrim);

        const lGgpenBase = new Mesh(createCurvedPatchGeometry(0.092, 0.058, armCurvatureRadius), matWhite);
        lGgpenBase.position.set(0, 0, 0.0008);
        lGgpenBase.renderOrder = 23;
        lShoulderGroup.add(lGgpenBase);

        const lGgpenMat = new MeshBasicMaterial({
          map: textures.ggpen,
          transparent: true,
          side: DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          polygonOffsetUnits: -4,
        });
        const lGgpenMesh = new Mesh(createCurvedPatchGeometry(0.092, 0.058, armCurvatureRadius), lGgpenMat);
        lGgpenMesh.position.set(0, 0, 0.0015);
        lGgpenMesh.renderOrder = 24;
        lShoulderGroup.add(lGgpenMesh);

        leftArm.add(lShoulderGroup);
        cleanups.push(() => {
          leftArm.remove(lShoulderGroup);
          disposeHierarchy(lShoulderGroup);
        });
      }

      // -------------------------------------------------------------------
      // CHEST DCM (Display and Control Module) - LIMPO, ESPAÇOSO & FUNCIONAL
      // Sem emblemas esmagados no meio dos botões!
      // -------------------------------------------------------------------
      const dcmGroup = new Group();
      dcmGroup.position.set(0, -0.025, 0.138);

      // DCM Main Beveled Enclosure
      const dcmBase = new Mesh(new BoxGeometry(0.24, 0.15, 0.042), matSuit);
      dcmGroup.add(dcmBase);

      const dcmFace = new Mesh(new BoxGeometry(0.22, 0.13, 0.020), matDark);
      dcmFace.position.set(0, 0, 0.022);
      dcmGroup.add(dcmFace);

      // Angled Upper Control Switchboard
      const dcmShelf = new Mesh(new BoxGeometry(0.20, 0.030, 0.028), matMetal);
      dcmShelf.position.set(0, 0.052, 0.032);
      dcmShelf.rotation.x = -0.3;
      dcmGroup.add(dcmShelf);

      // 4 Precision Mechanical Toggle Switches
      [-0.07, -0.025, 0.025, 0.07].forEach((x) => {
        const toggle = new Mesh(new CylinderGeometry(0.003, 0.003, 0.015, 8), matMetal);
        toggle.position.set(x, 0.055, 0.042);
        toggle.rotation.x = 0.4;
        dcmGroup.add(toggle);
      });

      // Digital Telemetry OLED Display Bar (centralizado e limpo)
      const telemScreen = new Mesh(new PlaneGeometry(0.18, 0.032), new MeshBasicMaterial({ color: 0x020617 }));
      telemScreen.position.set(0, 0.010, 0.034);
      dcmGroup.add(telemScreen);

      [-0.065, -0.022, 0.022, 0.065].forEach((x, i) => {
        const led = new Mesh(new CircleGeometry(0.0045, 12), new MeshBasicMaterial({ color: i === 0 ? 0x22c55e : i === 1 ? 0x38bdf8 : i === 2 ? 0xeab308 : 0xec4899 }));
        led.position.set(x, 0.010, 0.035);
        dcmGroup.add(led);
      });

      // Dual Anodized Umbilical / Purge Valves (Red Right / Blue Left)
      [-0.085, 0.085].forEach((x, i) => {
        const valveBase = new Mesh(new CylinderGeometry(0.014, 0.014, 0.016, 16), matMetal);
        valveBase.position.set(x, -0.036, 0.030);
        valveBase.rotation.x = Math.PI / 2;
        dcmGroup.add(valveBase);

        const valveCap = new Mesh(new CylinderGeometry(0.010, 0.010, 0.014, 16), new MeshStandardMaterial({ color: i === 0 ? 0xdc2626 : 0x0284c7, metalness: 0.9, roughness: 0.2 }));
        valveCap.position.set(x, -0.036, 0.040);
        valveCap.rotation.x = Math.PI / 2;
        dcmGroup.add(valveCap);
      });

      torsoGroup.add(dcmGroup);

      // BACKPACK PLSS (Portable Life Support System)
      const plssGroup = new Group();
      plssGroup.position.set(0, 0.05, -0.15);
      plssGroupRef.current = plssGroup;

      // Main Aerodynamic Housing with Beveled Frame
      const plssBody = new Mesh(new BoxGeometry(0.30, 0.40, 0.12), matSuit);
      plssGroup.add(plssBody);

      // Dual High-Pressure Cryogenic Oxygen Cylinders
      [-0.075, 0.075].forEach((x) => {
        const tank = new Mesh(new CylinderGeometry(0.038, 0.038, 0.32, 20), matDark);
        tank.position.set(x, 0.01, -0.065);
        plssGroup.add(tank);

        // Anodized Aluminum Retention Bands
        [-0.09, 0, 0.09].forEach((y) => {
          const ring = new Mesh(new TorusGeometry(0.040, 0.004, 8, 20), new MeshStandardMaterial({ color: 0x0284c7, metalness: 0.92, roughness: 0.2 }));
          ring.position.set(x, y + 0.01, -0.065);
          plssGroup.add(ring);
        });

        // Top Brass Manifold Valves
        const valve = new Mesh(new CylinderGeometry(0.012, 0.015, 0.030, 12), matMetal);
        valve.position.set(x, 0.18, -0.065);
        plssGroup.add(valve);
      });

      // Gold MLI (Multi-Layer Insulation) Radiant Heat Barrier Foil
      const goldFoil = new Mesh(new PlaneGeometry(0.26, 0.12), matGold);
      goldFoil.position.set(0, -0.12, -0.070);
      goldFoil.rotation.y = Math.PI;
      plssGroup.add(goldFoil);

      // Rear Mission Insignias (GGPEN & NASA Space Apps Luanda & Bandeira de Angola)
      const rearGgpen = new Mesh(new PlaneGeometry(0.088, 0.052), ggpenMat);
      rearGgpen.position.set(-0.058, 0.108, -0.070);
      rearGgpen.rotation.y = Math.PI;
      plssGroup.add(rearGgpen);

      // NASA Space Apps Luanda with Solid Black Contour on PLSS Backpack
      const rearAppsGroup = new Group();
      rearAppsGroup.position.set(0.058, 0.108, -0.070);
      rearAppsGroup.rotation.y = Math.PI;

      const rearAppsBlack = new Mesh(new CircleGeometry(0.040, 32), matBlackContour);
      rearAppsGroup.add(rearAppsBlack);

      const rearAppsWhite = new Mesh(new CircleGeometry(0.035, 32), matWhite);
      rearAppsWhite.position.set(0, 0, 0.001);
      rearAppsGroup.add(rearAppsWhite);

      const rearApps = new Mesh(new CircleGeometry(0.035, 32), new MeshBasicMaterial({ map: textures.nasaApps, transparent: false, side: DoubleSide }));
      rearApps.position.set(0, 0, 0.002);
      rearAppsGroup.add(rearApps);

      const rearAppsRim = new Mesh(new RingGeometry(0.034, 0.040, 32), matBlackContour);
      rearAppsRim.position.set(0, 0, 0.003);
      rearAppsGroup.add(rearAppsRim);
      plssGroup.add(rearAppsGroup);

      // National Flag of Angola (Center Lower Backpack)
      const rearFlagBacking = new Mesh(new BoxGeometry(0.112, 0.072, 0.003), matDark);
      rearFlagBacking.position.set(0, 0.026, -0.070);
      rearFlagBacking.rotation.y = Math.PI;
      plssGroup.add(rearFlagBacking);

      const rearFlagTrim = new Mesh(new BoxGeometry(0.114, 0.074, 0.001), matGold);
      rearFlagTrim.position.set(0, 0.026, -0.071);
      rearFlagTrim.rotation.y = Math.PI;
      plssGroup.add(rearFlagTrim);

      const rearFlagMat = new MeshBasicMaterial({ map: textures.angola, side: DoubleSide });
      const rearFlag = new Mesh(new PlaneGeometry(0.106, 0.066), rearFlagMat);
      rearFlag.position.set(0, 0.026, -0.068);
      rearFlag.rotation.y = Math.PI;
      plssGroup.add(rearFlag);

      // UHF Whip Antenna with Pulsing Red Warning Strobe
      const antenna = new Mesh(new CylinderGeometry(0.003, 0.004, 0.26, 8), matMetal);
      antenna.position.set(0.12, 0.24, -0.02);
      plssGroup.add(antenna);

      const beacon = new Mesh(new SphereGeometry(0.012, 12, 12), new MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.9 }));
      beacon.position.set(0.12, 0.37, -0.02);
      plssGroup.add(beacon);
      beaconRef.current = beacon;

      torsoGroup.add(plssGroup);

      spine2.add(torsoGroup);
      cleanups.push(() => {
        spine2.remove(torsoGroup);
        disposeHierarchy(torsoGroup);
      });
    }

    // Handheld Angola Flag mounted in Right Hand when carrying the flag on the Moon
    if (rightHand && carryingFlag) {
      const flagGroup = new Group();
      flagGroup.position.set(0.02, 0.05, 0.04);
      flagGroup.rotation.set(0.35, 0.2, -0.25);

      const pole = new Mesh(new CylinderGeometry(0.016, 0.016, 1.45, 12), matMetal);
      pole.position.set(0, 0.45, 0);
      flagGroup.add(pole);

      const crossbar = new Mesh(new CylinderGeometry(0.010, 0.010, 0.68, 10), matMetal);
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0.33, 1.15, 0);
      flagGroup.add(crossbar);

      const finial = new Mesh(new SphereGeometry(0.028, 12, 12), matGold);
      finial.position.set(0, 1.19, 0);
      flagGroup.add(finial);

      const flagBannerMat = new MeshBasicMaterial({ map: textures.angola, side: DoubleSide });
      const flagBanner = new Mesh(new PlaneGeometry(0.64, 0.42), flagBannerMat);
      flagBanner.position.set(0.33, 0.93, 0);
      flagGroup.add(flagBanner);

      rightHand.add(flagGroup);
      cleanups.push(() => {
        rightHand.remove(flagGroup);
        disposeHierarchy(flagGroup);
      });
    }

    // Shoulder badges are anchored directly to torsoGroup on spine2 for rock-solid stability in all animations

    cleanups.push(() => {
      matSuit.dispose();
      matMetal.dispose();
      matDark.dispose();
      matGold.dispose();
      matWhite.dispose();
      matBlackContour.dispose();
      matRed.dispose();
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [avatarGltf.scene, isFemale, theme, visorMode, textures, hasSpacesuit, carryingFlag]);

  // Pulsing antenna beacon
  useFrame((state) => {
    if (beaconRef.current) {
      const pulse = (Math.sin(state.clock.elapsedTime * 6) + 1) * 0.5;
      (beaconRef.current.material as MeshBasicMaterial).opacity = 0.3 + pulse * 0.7;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Skinned Avatar with Volumetric Spacesuit Shader & Aerospace Attachments */}
      <primitive object={avatarGltf.scene} />
    </group>
  );
}

// Preload all assets for instant response
useGLTF.preload('/female_avatar.glb');
useGLTF.preload('/male_avatar.glb');
useGLTF.preload('/m_idle.glb');
useGLTF.preload('/m_walk.glb');
useGLTF.preload('/m_run.glb');
useGLTF.preload('/m_jump.glb');
useGLTF.preload('/f_idle.glb');
useGLTF.preload('/f_walk.glb');
useGLTF.preload('/f_run.glb');
useGLTF.preload('/f_jump.glb');
