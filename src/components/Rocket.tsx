import React, { useRef } from 'react';
import { useGameStore, PLANETS } from '../store';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, MathUtils } from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { RocketModel } from './RocketModel';
import { PlanetaryCapsuleLander } from './PlanetaryCapsuleLander';
import { LaunchPadStairs } from './LaunchPadStairs';
import { Text } from '@react-three/drei';

const _rocketWorldPos = new Vector3();
const _camTargetPos = new Vector3();

export function Rocket() {
  const changePlanet = useGameStore((state) => state.changePlanet);
  const setLaunching = useGameStore((state) => state.setLaunching);
  const isLaunching = useGameStore((state) => state.isLaunching);
  const isNearRocket = useGameStore((state) => state.isNearRocket);
  const planetIndex = useGameStore((state) => state.planetIndex);
  const currentPlanet = PLANETS[planetIndex] || PLANETS[0];
  const isEarth = currentPlanet.type === 'earth';

  const rocketRef = useRef<Group>(null);
  const clampLeftRef = useRef<Group>(null);
  const clampRightRef = useRef<Group>(null);
  const clampFrontRef = useRef<Group>(null);
  const clampBackRef = useRef<Group>(null);
  const swingArmRef = useRef<Group>(null);
  const umbilicalArm1Ref = useRef<Group>(null);
  const umbilicalArm2Ref = useRef<Group>(null);
  const umbilicalArm3Ref = useRef<Group>(null);

  // Countdown (5 -> 0), Velocity (m/s), and Fuel (%) state refs for Earth Launch Sequence
  const countdownRef = useRef<number>(5.0);
  const velocityRef = useRef<number>(0);
  const fuelRef = useRef<number>(100);
  const lastTelemetrySyncRef = useRef<number>(0);
  const [engineIgnited, setEngineIgnited] = React.useState(false);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (!rocketRef.current) return;

    if (isLaunching) {
      if (isEarth) {
        // PHASE 1: T-5 TO T-0 COUNTDOWN ON PAD BEFORE LIFTOFF
        if (countdownRef.current > 0) {
          countdownRef.current = Math.max(0, countdownRef.current - delta);
          const displayCount = Math.ceil(countdownRef.current);

          // Main engine pre-ignition at T-2s while hold-down clamps keep rocket anchored
          const isPreIgnition = countdownRef.current <= 2.2;
          if (isPreIgnition !== engineIgnited) {
            setEngineIgnited(isPreIgnition);
          }

          // Pad vibration builds up as engines spool up
          const vibAmp = isPreIgnition ? 0.07 : 0.025;
          rocketRef.current.position.y = 4.2 + Math.sin(state.clock.elapsedTime * 32) * vibAmp;

          // Retract Crew Access White Room Arm & Cryogenic Umbilical Arms during countdown
          if (swingArmRef.current) {
            swingArmRef.current.rotation.y = MathUtils.lerp(swingArmRef.current.rotation.y, -Math.PI / 2.6, delta * 1.8);
          }
          if (umbilicalArm1Ref.current) {
            umbilicalArm1Ref.current.rotation.y = MathUtils.lerp(umbilicalArm1Ref.current.rotation.y, -Math.PI / 3.2, delta * 1.5);
          }
          if (umbilicalArm2Ref.current) {
            umbilicalArm2Ref.current.rotation.y = MathUtils.lerp(umbilicalArm2Ref.current.rotation.y, -Math.PI / 3.2, delta * 1.6);
          }
          if (umbilicalArm3Ref.current) {
            umbilicalArm3Ref.current.rotation.y = MathUtils.lerp(umbilicalArm3Ref.current.rotation.y, -Math.PI / 3.2, delta * 1.7);
          }

          // Pre-ignition fuel flow (100% -> 98%)
          fuelRef.current = isPreIgnition ? 98 + (countdownRef.current / 2.2) * 2 : 100;

          // Sync HUD telemetry
          if (state.clock.elapsedTime - lastTelemetrySyncRef.current > 0.08 || countdownRef.current === 0) {
            lastTelemetrySyncRef.current = state.clock.elapsedTime;
            useGameStore.getState().setLaunchTelemetry({
              countdown: displayCount,
              fuel: Math.round(fuelRef.current),
              speed: 0,
              altitude: 0,
              status: 'countdown',
            });
          }

          // Dramatic pad-side camera framing the rocket and launch tower during 5..0 countdown
          rocketRef.current.getWorldPosition(_rocketWorldPos);
          _camTargetPos.set(_rocketWorldPos.x + 36, _rocketWorldPos.y + 18, _rocketWorldPos.z + 46);
          state.camera.position.lerp(_camTargetPos, 0.08);
          state.camera.lookAt(_rocketWorldPos.x, _rocketWorldPos.y + 22, _rocketWorldPos.z);
        } else {
          // PHASE 2: T-0 LIFTOFF! RELEASE HOLD-DOWN CLAMPS & ASCEND WITH FUEL BURN AND VELOCITY
          if (!engineIgnited) setEngineIgnited(true);

          const openAngle = Math.PI / 3.5;
          if (clampLeftRef.current) clampLeftRef.current.rotation.z = MathUtils.lerp(clampLeftRef.current.rotation.z, -openAngle, 0.14);
          if (clampRightRef.current) clampRightRef.current.rotation.z = MathUtils.lerp(clampRightRef.current.rotation.z, openAngle, 0.14);
          if (clampFrontRef.current) clampFrontRef.current.rotation.x = MathUtils.lerp(clampFrontRef.current.rotation.x, openAngle, 0.14);
          if (clampBackRef.current) clampBackRef.current.rotation.x = MathUtils.lerp(clampBackRef.current.rotation.x, -openAngle, 0.14);

          // Progressive thrust acceleration (0 -> 450 m/s)
          velocityRef.current = Math.min(450, velocityRef.current + delta * 105);
          rocketRef.current.position.y += velocityRef.current * delta;

          const currentAlt = Math.max(0, rocketRef.current.position.y - 4.2);
          fuelRef.current = Math.max(16, 98 - (currentAlt / 650) * 82);

          if (state.clock.elapsedTime - lastTelemetrySyncRef.current > 0.08) {
            lastTelemetrySyncRef.current = state.clock.elapsedTime;
            useGameStore.getState().setLaunchTelemetry({
              countdown: 0,
              fuel: Math.round(fuelRef.current),
              speed: Math.round(velocityRef.current),
              altitude: Math.round(currentAlt),
              status: 'liftoff',
            });
          }

          // Lock camera smoothly to ascending rocket
          rocketRef.current.getWorldPosition(_rocketWorldPos);
          _camTargetPos.set(_rocketWorldPos.x + 35, _rocketWorldPos.y + 15, _rocketWorldPos.z + 45);
          state.camera.position.lerp(_camTargetPos, 0.08);
          state.camera.lookAt(_rocketWorldPos);

          if (rocketRef.current.position.y > 650) {
            changePlanet(); // Transition to space
          }
        }
      } else {
        // Planetary Ascent Launch (Immediate liftoff from planetary surface)
        rocketRef.current.position.y += delta * 135;
        rocketRef.current.getWorldPosition(_rocketWorldPos);
        _camTargetPos.set(_rocketWorldPos.x + 24, _rocketWorldPos.y + 10, _rocketWorldPos.z + 32);
        state.camera.position.lerp(_camTargetPos, 0.08);
        state.camera.lookAt(_rocketWorldPos);

        if (rocketRef.current.position.y > 420) {
          changePlanet();
        }
      }
    } else {
      if (isEarth) {
        if (clampLeftRef.current) clampLeftRef.current.rotation.z = 0;
        if (clampRightRef.current) clampRightRef.current.rotation.z = 0;
        if (clampFrontRef.current) clampFrontRef.current.rotation.x = 0;
        if (clampBackRef.current) clampBackRef.current.rotation.x = 0;
        if (swingArmRef.current) swingArmRef.current.rotation.y = 0;
        if (umbilicalArm1Ref.current) umbilicalArm1Ref.current.rotation.y = 0;
        if (umbilicalArm2Ref.current) umbilicalArm2Ref.current.rotation.y = 0;
        if (umbilicalArm3Ref.current) umbilicalArm3Ref.current.rotation.y = 0;
        if (engineIgnited) setEngineIgnited(false);

        countdownRef.current = 5.0;
        velocityRef.current = 0;
        fuelRef.current = 100;

        // Subtle pre-launch vibration on pad
        rocketRef.current.position.y = 4.2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
      } else {
        // Planetary lander resting firmly with its 4 footpads seated on the ground (Y = 0.0)!
        rocketRef.current.position.y = 0.0;
      }
    }
  });

  const handleLaunch = () => {
    // Astronaut must be near the rocket to board/launch
    if (!isLaunching && useGameStore.getState().isNearRocket) {
      if (isEarth) {
        countdownRef.current = 5.0;
        velocityRef.current = 0;
        fuelRef.current = 100;
        setEngineIgnited(false);
        useGameStore.getState().setLaunchTelemetry({
          countdown: 5,
          fuel: 100,
          speed: 0,
          altitude: 0,
          status: 'countdown',
        });
      }
      setLaunching(true);
    }
  };

  // On celestial bodies other than Earth: Render the Planetary Exploration Lander Module firmly grounded at Y = 0
  if (!isEarth) {
    return (
      <group position={[0, 0, 0]}>
        {/* Boarding Access Stairway & Ramp leading from ground (Y = 0) up to the Lander Deck (Y = 1.85m) */}
        <group position={[0, 0, 4.8]}>
          <RigidBody type="fixed" colliders={false} friction={0.0}>
            {/* Smooth climbing ramp onto lander stage */}
            <CuboidCollider
              args={[1.35, 0.08, 2.1]}
              position={[0, 0.92, 0]}
              rotation={[-0.44, 0, 0]}
              friction={0.0}
            />
            {/* Landing threshold at top of ramp flush with deck Y = 1.82 */}
            <CuboidCollider args={[1.4, 0.1, 0.9]} position={[0, 1.82, -1.6]} friction={0.0} />
          </RigidBody>

          {/* Angled Metal Stairs Mesh with Structural Side Stringers */}
          <mesh position={[0, 0.92, 0]} rotation={[-0.44, 0, 0]} receiveShadow castShadow>
            <boxGeometry args={[2.5, 0.12, 4.2]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
          {[-1.28, 1.28].map((sx, si) => (
            <mesh key={`lander-stringer-${si}`} position={[sx, 0.90, 0]} rotation={[-0.44, 0, 0]} castShadow>
              <boxGeometry args={[0.12, 0.24, 4.3]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}

          {/* High-Visibility Yellow Handrails */}
          {[-1.3, 1.3].map((hx, hi) => (
            <group key={`lander-rail-${hi}`} position={[hx, 1.48, 0]} rotation={[-0.44, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.06, 0.06, 4.2]} />
                <meshStandardMaterial color="#eab308" metalness={0.6} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Boarding Callout Indicator */}
        <group position={[0, 2.9, 5.4]}>
          <Text fontSize={0.32} color={isNearRocket ? '#10b981' : '#38bdf8'} fontWeight="bold" anchorX="center" outlineWidth={0.04} outlineColor="#020617">
            {isNearRocket
              ? '➔ [TECLA R ou ENCOSTAR] SUBIR NA CÁPSULA'
              : '➔ APROXIME-SE DA CÁPSULA PARA SUBIR [TECLA R]'}
          </Text>
        </group>

        {/* Grounded Planetary Exploration Capsule Lander (Footpads seated at Y = 0!) */}
        {!isLaunching && (
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[2.5, 4.5, 2.5]} position={[0, 4.5, 0]} />
          </RigidBody>
        )}
        <group onClick={handleLaunch}>
          <group ref={rocketRef} position={[0, 0, 0]}>
            <PlanetaryCapsuleLander isLaunching={isLaunching} />
          </group>
        </group>
      </group>
    );
  }

  // On Earth: Render the Full Cape Canaveral / GGPEN Pad 39A Launch Complex
  return (
    <group position={[0, 0, 0]}>
      {/* STATIC GROUND LAUNCH COMPLEX (Permanently fixed on the ground) */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[16.0, 2.5, 16.0]} position={[0, 2.5, 0]} />
        <CuboidCollider args={[5.8, 2.5, 6.0]} position={[19.0, 2.5, 0]} />
        <CuboidCollider args={[5.8, 2.5, 10.0]} position={[19.0, 2.5, 15.0]} />
        <CuboidCollider args={[5.8, 2.5, 10.0]} position={[19.0, 2.5, -15.0]} />

        {/* Solid Rocket Fuselage, Hold-Down Clamps & Tail Service Masts Colliders on Pad */}
        {!isLaunching && (
          <CuboidCollider args={[3.4, 28.0, 3.4]} position={[0, 32.0, 0]} />
        )}
        <CuboidCollider args={[1.0, 1.2, 1.0]} position={[-5.2, 6.0, 0]} />
        <CuboidCollider args={[1.0, 1.2, 1.0]} position={[5.2, 6.0, 0]} />
        <CuboidCollider args={[1.0, 1.2, 1.0]} position={[0, 6.0, -5.2]} />
        <CuboidCollider args={[1.0, 1.2, 1.0]} position={[0, 6.0, 5.2]} />
        <CuboidCollider args={[1.1, 2.3, 1.2]} position={[-7.2, 7.3, 0]} />
        <CuboidCollider args={[1.1, 2.3, 1.2]} position={[7.2, 7.3, 0]} />

        {/* North and South Elevated Blast Deck Wings */}
        <CuboidCollider args={[19.0, 0.9, 3.5]} position={[0, 4.2, -18.5]} />
        <CuboidCollider args={[19.0, 0.9, 3.5]} position={[0, 4.2, 18.5]} />
        <CuboidCollider args={[3.5, 0.9, 12.0]} position={[-19.5, 4.2, -6.0]} />
        <CuboidCollider args={[4.2, 35, 4.2]} position={[-15, 35, 0]} />

        {/* Perimeter Safety Barriers */}
        <CuboidCollider args={[5.6, 0.75, 0.12]} position={[18.5, 5.75, 2.85]} friction={0.0} />
        <CuboidCollider args={[5.6, 0.75, 0.12]} position={[18.5, 5.75, -2.85]} friction={0.0} />
        <CuboidCollider args={[19.0, 0.75, 0.12]} position={[0, 5.75, 19.0]} friction={0.0} />
        <CuboidCollider args={[19.0, 0.75, 0.12]} position={[0, 5.75, -19.0]} friction={0.0} />
        <CuboidCollider args={[0.12, 0.75, 14.0]} position={[-19.0, 5.75, -5.0]} friction={0.0} />
        <CuboidCollider args={[0.12, 0.75, 8.0]} position={[19.0, 5.75, 11.0]} friction={0.0} />
        <CuboidCollider args={[0.12, 0.75, 8.0]} position={[19.0, 5.75, -11.0]} friction={0.0} />

        {/* --- MAIN REINFORCED CONCRETE LAUNCH DECK --- */}
        <group position={[0, 0, 0]}>
          <mesh position={[18.5, 5.06, 0]} receiveShadow>
            <boxGeometry args={[11.2, 0.1, 5.5]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.42} />
          </mesh>

          {[-2.85, 2.85].map((z, wIdx) => (
            <group key={`walkway-rail-${wIdx}`} position={[18.5, 5.6, z]}>
              <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[11.0, 0.08, 0.08]} />
                <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[11.0, 0.06, 0.06]} />
                <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
              </mesh>
            </group>
          ))}

          <mesh position={[0, 2.5, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[20, 21.5, 5, 8]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} metalness={0.1} />
          </mesh>

          <mesh position={[0, 5.05, 0]} receiveShadow castShadow>
            <boxGeometry args={[38, 0.1, 38]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Yellow & Black Perimeter Ring */}
          <mesh position={[0, 5.12, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[10.5, 12.2, 32]} />
            <meshStandardMaterial color="#eab308" roughness={0.8} metalness={0.2} />
          </mesh>

          {/* Central Exhaust Hole */}
          <mesh position={[0, 5.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[7, 32]} />
            <meshBasicMaterial color="#020617" />
          </mesh>

          {/* Pad Perimeter Railings */}
          {[
            { pos: [0, 5.65, -18.5], rot: [0, 0, 0], len: 37 },
            { pos: [0, 5.65, 18.5], rot: [0, 0, 0], len: 37 },
            { pos: [18.5, 5.65, 11.0], rot: [0, Math.PI / 2, 0], len: 15.0 },
            { pos: [18.5, 5.65, -11.0], rot: [0, Math.PI / 2, 0], len: 15.0 },
            { pos: [-18.5, 5.65, 11.0], rot: [0, Math.PI / 2, 0], len: 15.0 },
            { pos: [-18.5, 5.65, -11.0], rot: [0, Math.PI / 2, 0], len: 15.0 },
          ].map((rail, i) => (
            <group key={`pad-rail-${i}`} position={rail.pos as [number, number, number]} rotation={rail.rot as [number, number, number]}>
              <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[rail.len, 0.08, 0.08]} />
                <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.05, 0]}>
                <boxGeometry args={[rail.len, 0.06, 0.06]} />
                <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
              </mesh>
            </group>
          ))}

          {/* Heavy-Duty Mobile Launcher Hold-Down Clamps & Cryogenic Support Masts */}
          {/* 1. West Hold-Down Clamp */}
          <group position={[-5.2, 5.1, 0]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[1.5, 0.6, 1.5]} />
              <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
            </mesh>
            <group ref={clampLeftRef} position={[0.4, 0.5, 0]}>
              <mesh position={[0.6, 0.7, 0]} rotation={[0, 0, -0.4]} castShadow>
                <boxGeometry args={[0.6, 1.6, 0.8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} />
              </mesh>
            </group>
          </group>

          {/* 2. East Hold-Down Clamp */}
          <group position={[5.2, 5.1, 0]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[1.5, 0.6, 1.5]} />
              <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
            </mesh>
            <group ref={clampRightRef} position={[-0.4, 0.5, 0]}>
              <mesh position={[-0.6, 0.7, 0]} rotation={[0, 0, 0.4]} castShadow>
                <boxGeometry args={[0.6, 1.6, 0.8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} />
              </mesh>
            </group>
          </group>

          {/* 3. North Hold-Down Clamp */}
          <group position={[0, 5.1, -5.2]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[1.5, 0.6, 1.5]} />
              <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
            </mesh>
            <group ref={clampBackRef} position={[0, 0.5, 0.4]}>
              <mesh position={[0, 0.7, 0.6]} rotation={[-0.4, 0, 0]} castShadow>
                <boxGeometry args={[0.8, 1.6, 0.6]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} />
              </mesh>
            </group>
          </group>

          {/* 4. South Hold-Down Clamp */}
          <group position={[0, 5.1, 5.2]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[1.5, 0.6, 1.5]} />
              <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
            </mesh>
            <group ref={clampFrontRef} position={[0, 0.5, -0.4]}>
              <mesh position={[0, 0.7, -0.6]} rotation={[0.4, 0, 0]} castShadow>
                <boxGeometry args={[0.8, 1.6, 0.6]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} />
              </mesh>
            </group>
          </group>

          {/* Cryogenic Tail Service Masts (TSM) - Umbilical Fuel Lines to Rocket Aft */}
          {[-7.2, 7.2].map((tsmX, idx) => (
            <group key={`tsm-${idx}`} position={[tsmX, 5.1, 0]}>
              <mesh position={[0, 2.2, 0]} castShadow>
                <boxGeometry args={[2.0, 4.4, 2.2]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[idx === 0 ? 1.1 : -1.1, 3.8, 0]} rotation={[0, 0, idx === 0 ? -0.3 : 0.3]}>
                <boxGeometry args={[1.4, 0.7, 1.4]} />
                <meshStandardMaterial color="#eab308" metalness={0.7} />
              </mesh>
            </group>
          ))}

          {/* ============================================================== */}
          {/* UPGRADED AEROSPACE LAUNCH UMBILICAL & SERVICE TOWER (LUT)      */}
          {/* Full structural lattice truss, 10 platforms, elevator shaft,   */}
          {/* cryogenic standpipes, 3 umbilical arms, White Room & mast      */}
          {/* ============================================================== */}
          <group position={[-15, 5.1, 0]}>
            {/* Heavy Reinforced Steel & Concrete Base Pedestal */}
            <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
              <boxGeometry args={[8.4, 1.8, 8.4]} />
              <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
            </mesh>
            <mesh position={[0, 1.85, 0]}>
              <boxGeometry args={[7.8, 0.25, 7.8]} />
              <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* 4 Heavy Corner Steel Columns with Aerospace Red/White Hazard Banding */}
            {[
              [-3.2, -3.2],
              [3.2, -3.2],
              [-3.2, 3.2],
              [3.2, 3.2],
            ].map((col, i) => (
              <group key={`tower-col-${i}`} position={[col[0], 0, col[1]]}>
                {Array.from({ length: 6 }).map((_, segIdx) => (
                  <mesh key={`col-seg-${segIdx}`} position={[0, 5 + segIdx * 10, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.78, 10, 0.78]} />
                    <meshStandardMaterial
                      color={segIdx % 2 === 0 ? '#b91c1c' : '#f8fafc'}
                      metalness={0.75}
                      roughness={0.28}
                    />
                  </mesh>
                ))}
              </group>
            ))}

            {/* Central Enclosed High-Speed Service Elevator & Ladder Core */}
            <mesh position={[-0.6, 30, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.6, 58, 2.8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.88} roughness={0.25} />
            </mesh>

            {/* Vertical Cryogenic Propellant Standpipes (LOX & RP-1/LH2) along East Face */}
            {[-1.2, 1.2].map((pz, pi) => (
              <mesh key={`cryo-pipe-${pi}`} position={[2.85, 29, pz]} castShadow>
                <cylinderGeometry args={[0.22, 0.22, 56, 12]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
              </mesh>
            ))}

            {/* 10 Structural Service Platforms + Perimeter Girder Beams + Diagonal X-Bracing */}
            {Array.from({ length: 10 }).map((_, lvlIdx) => {
              const ly = (lvlIdx + 1) * 6.0; // Levels at Y = 6, 12, 18, 24, 30, 36, 42, 48, 54, 60m
              const bayCenterY = ly - 3.0;
              return (
                <group key={`tower-level-${lvlIdx}`}>
                  {/* Steel Grating Service Platform Deck */}
                  <mesh position={[0, ly, 0]} castShadow receiveShadow>
                    <boxGeometry args={[7.2, 0.32, 7.2]} />
                    <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.32} />
                  </mesh>

                  {/* Yellow Safety Toe-Board & Handrail around Platform Perimeter */}
                  <mesh position={[0, ly + 0.22, 3.52]}>
                    <boxGeometry args={[7.1, 0.16, 0.12]} />
                    <meshStandardMaterial color="#eab308" metalness={0.6} />
                  </mesh>
                  <mesh position={[0, ly + 0.22, -3.52]}>
                    <boxGeometry args={[7.1, 0.16, 0.12]} />
                    <meshStandardMaterial color="#eab308" metalness={0.6} />
                  </mesh>
                  <mesh position={[3.52, ly + 0.22, 0]}>
                    <boxGeometry args={[0.12, 0.16, 7.1]} />
                    <meshStandardMaterial color="#eab308" metalness={0.6} />
                  </mesh>
                  <mesh position={[-3.52, ly + 0.22, 0]}>
                    <boxGeometry args={[0.12, 0.16, 7.1]} />
                    <meshStandardMaterial color="#eab308" metalness={0.6} />
                  </mesh>

                  <mesh position={[0, ly + 0.95, 3.52]}>
                    <boxGeometry args={[7.1, 0.08, 0.08]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
                  </mesh>
                  <mesh position={[0, ly + 0.95, -3.52]}>
                    <boxGeometry args={[7.1, 0.08, 0.08]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
                  </mesh>

                  {/* Diagonal X-Bracing Trusses on North & South Faces (Z = ±3.2) */}
                  {[-3.2, 3.2].map((fz, fi) => (
                    <group key={`brace-ns-${fi}`} position={[0, bayCenterY, fz]}>
                      <mesh rotation={[0, 0, 0.82]} castShadow>
                        <boxGeometry args={[0.22, 8.6, 0.22]} />
                        <meshStandardMaterial color={lvlIdx % 2 === 0 ? '#b91c1c' : '#e2e8f0'} metalness={0.8} roughness={0.3} />
                      </mesh>
                      <mesh rotation={[0, 0, -0.82]} castShadow>
                        <boxGeometry args={[0.22, 8.6, 0.22]} />
                        <meshStandardMaterial color={lvlIdx % 2 === 0 ? '#b91c1c' : '#e2e8f0'} metalness={0.8} roughness={0.3} />
                      </mesh>
                    </group>
                  ))}

                  {/* Diagonal X-Bracing Trusses on West & East Faces (X = ±3.2) */}
                  {[-3.2, 3.2].map((fx, fi) => (
                    <group key={`brace-we-${fi}`} position={[fx, bayCenterY, 0]}>
                      <mesh rotation={[0.82, 0, 0]} castShadow>
                        <boxGeometry args={[0.22, 8.6, 0.22]} />
                        <meshStandardMaterial color={lvlIdx % 2 === 0 ? '#b91c1c' : '#e2e8f0'} metalness={0.8} roughness={0.3} />
                      </mesh>
                      <mesh rotation={[-0.82, 0, 0]} castShadow>
                        <boxGeometry args={[0.22, 8.6, 0.22]} />
                        <meshStandardMaterial color={lvlIdx % 2 === 0 ? '#b91c1c' : '#e2e8f0'} metalness={0.8} roughness={0.3} />
                      </mesh>
                    </group>
                  ))}
                </group>
              );
            })}

            {/* 3 Intermediate Retractable Cryogenic & Avionics Umbilical Arms (Y = 18m, 30m, 42m) */}
            {[
              { y: 18, ref: umbilicalArm1Ref, label: 'LOX INTERSTAGE' },
              { y: 30, ref: umbilicalArm2Ref, label: '2º ESTÁGIO' },
              { y: 42, ref: umbilicalArm3Ref, label: 'AVIÔNICA' },
            ].map((arm, ai) => (
              <group key={`umbilical-arm-${ai}`} ref={arm.ref} position={[3.4, arm.y + 0.8, 0]}>
                {/* Truss Boom Arm */}
                <mesh position={[4.8, 0, 0]} castShadow>
                  <boxGeometry args={[9.2, 1.1, 1.2]} />
                  <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
                </mesh>
                {/* Flexible Cryogenic Hose & Quick-Disconnect Plate */}
                <mesh position={[9.5, 0, 0]} castShadow>
                  <boxGeometry args={[1.2, 1.5, 1.8]} />
                  <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.25} />
                </mesh>
              </group>
            ))}

            {/* Top Crew Access Arm & Enclosed White Room (Y = 54m) */}
            <group ref={swingArmRef} position={[3.2, 54.4, 0]}>
              {/* Structural Steel Gantry Corridor */}
              <mesh position={[5.5, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[11, 2.6, 2.4]} />
                <meshStandardMaterial color="#f1f5f9" metalness={0.45} roughness={0.3} />
              </mesh>
              {/* Side Windows on Crew Access Arm */}
              <mesh position={[5.5, 0.2, 1.23]}>
                <boxGeometry args={[8.5, 0.9, 0.05]} />
                <meshBasicMaterial color="#38bdf8" />
              </mesh>
              {/* Pressurized White Room Cabin at Rocket Hatch */}
              <mesh position={[11.2, 0, 0]} castShadow>
                <boxGeometry args={[2.6, 3.1, 3.1]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.25} />
              </mesh>
            </group>

            {/* Tower Crown Hammerhead Crane & Fiberglass Lightning Arrestor Mast (Y = 60m to 72m) */}
            <group position={[0, 60.2, 0]}>
              <mesh position={[1.5, 0.8, 0]} castShadow>
                <boxGeometry args={[11.5, 1.2, 2.4]} />
                <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.25} />
              </mesh>
              {/* Lightning Mast */}
              <mesh position={[0, 6.5, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.32, 11.5, 12]} />
                <meshStandardMaterial color="#f8fafc" metalness={0.85} />
              </mesh>
              {/* Red Aviation Obstruction Strobe Beacon */}
              <mesh position={[0, 12.4, 0]}>
                <sphereGeometry args={[0.35, 12, 12]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
            </group>
          </group>
        </group>
      </RigidBody>

      {/* Accessible Industrial Front Stairs */}
      <LaunchPadStairs />

      {/* Proximity 3D Boarding Prompt on Earth Launch Pad */}
      {isNearRocket && !isLaunching && (
        <group position={[8.5, 7.6, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[5.8, 0.85]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          <Text position={[0, 0.12, 0]} fontSize={0.26} color="#10b981" fontWeight="bold" anchorX="center">
            [TECLA R ou ENCOSTAR] SUBIR NO FOGUETE
          </Text>
          <Text position={[0, -0.18, 0]} fontSize={0.16} color="#facc15" fontWeight="bold" anchorX="center">
            EMBARQUE AUTORIZADO • GGPEN PAD 39A
          </Text>
        </group>
      )}

      {/* ROCKET MODEL (Pre-ignites during 5-to-0 countdown and lifts off at T-0!) */}
      <group onClick={handleLaunch}>
        <group ref={rocketRef} position={[0, 4.2, 0]}>
          <RocketModel isFlying={isLaunching && (engineIgnited || countdownRef.current <= 0)} />
        </group>
      </group>
    </group>
  );
}
