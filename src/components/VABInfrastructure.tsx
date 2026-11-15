import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils, DoubleSide, CanvasTexture, SRGBColorSpace } from 'three';
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { useGameStore } from '../store';
import { UI_TEXT, Language } from '../utils/i18n';
import { playDoorOpenSound, playDoorCloseSound } from '../audio';
import { AngolaFlagDecal, GGPENLogoDecal, NasaSpaceAppsLuandaDecal } from './AngolaFlag';
import { HangarStairs } from './HangarStairs';
import { RocketAssemblyBay } from './RocketAssemblyBay';

// Module-level cache for high-resolution industrial blast door textures per language
const cachedDoorTextures: Partial<Record<Language, { left: CanvasTexture; right: CanvasTexture }>> = {};

function getHangarDoorTextures(language: Language): { left: CanvasTexture | null; right: CanvasTexture | null } {
  const cached = cachedDoorTextures[language];
  if (cached) return cached;
  if (typeof document === 'undefined') return { left: null, right: null };

  function drawDoor(isRight: boolean): CanvasTexture {
    const width = 1024;
    const height = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new CanvasTexture(canvas);

    // 1. Base dark aerospace alloy with subtle gradient
    const baseGrad = ctx.createLinearGradient(0, 0, width, 0);
    baseGrad.addColorStop(0, '#1a202c');
    baseGrad.addColorStop(0.5, '#242d3d');
    baseGrad.addColorStop(1, '#181e29');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Corrugated horizontal steel blast slats
    const slatHeight = 36;
    for (let y = 0; y < height; y += slatHeight) {
      // Top bevel highlight
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, y, width, 3);
      // Main panel body
      ctx.fillStyle = (Math.floor(y / slatHeight) % 2 === 0) ? '#283344' : '#202937';
      ctx.fillRect(0, y + 3, width, slatHeight - 6);
      // Bottom shadow groove
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, y + slatHeight - 3, width, 3);

      // Rivets along each slat
      ctx.fillStyle = '#64748b';
      for (let rx = 24; rx < width; rx += 96) {
        ctx.beginPath();
        ctx.arc(rx, y + slatHeight / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Vertical heavy structural I-beam reinforcements
    const beamPositions = [80, 320, 700, 944];
    beamPositions.forEach((bx) => {
      ctx.fillStyle = 'rgba(10, 14, 22, 0.75)';
      ctx.fillRect(bx - 20, 0, 40, height);
      ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
      ctx.fillRect(bx - 12, 0, 24, height);
      // Heavy bolts
      ctx.fillStyle = '#94a3b8';
      for (let by = 16; by < height; by += 48) {
        ctx.beginPath();
        ctx.arc(bx - 6, by, 3, 0, Math.PI * 2);
        ctx.arc(bx + 6, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 4. Industrial diagonal safety warning hazard chevrons (Bottom 260px)
    const hazardH = 260;
    const startY = height - hazardH;
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, startY, width, hazardH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, startY, width, hazardH);
    ctx.clip();
    const stripeW = 80;
    for (let sx = -hazardH; sx < width + hazardH; sx += stripeW * 2) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(sx, startY);
      ctx.lineTo(sx + stripeW, startY);
      ctx.lineTo(sx + stripeW + hazardH, height);
      ctx.lineTo(sx + hazardH, height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Hazard border lines
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, startY - 6, width, 6);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, startY - 10, width, 4);

    // 5. Upper safety warning band (Top 90px)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 0, width, 90);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, 90);
    ctx.clip();
    for (let sx = -90; sx < width + 90; sx += stripeW * 2) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx + stripeW, 0);
      ctx.lineTo(sx + stripeW + 90, 90);
      ctx.lineTo(sx + 90, 90);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 90, width, 5);

    // 6. Central Aerospace Stencil Markings
    const centerY = height * 0.44;
    // Dark matte backdrop placard
    ctx.fillStyle = 'rgba(11, 15, 25, 0.92)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.fillRect(120, centerY - 280, width - 240, 560);
    ctx.strokeRect(120, centerY - 280, width - 240, 560);

    // Inner gold border
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.strokeRect(132, centerY - 268, width - 264, 536);

    const isEn = language === 'en';
    // Text markings
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(isEn ? '• REPUBLIC OF ANGOLA •' : '• REPÚBLICA DE ANGOLA •', width / 2, centerY - 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px sans-serif';
    if (!isRight) {
      ctx.fillText('GGPEN • VAB 01', width / 2, centerY - 110);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText(isEn ? 'HIGH-PRESSURE BLAST GATE' : 'PORTÃO DE ALTA PRESSÃO', width / 2, centerY - 50);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(isEn ? '32M CLEARANCE • VERTICAL ASSEMBLY' : 'VÃO LIVRE 32M • MONTAGEM VERTICAL', width / 2, centerY);
    } else {
      ctx.fillText(isEn ? 'SPACE CENTER' : 'CENTRO ESPACIAL', width / 2, centerY - 110);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText(isEn ? 'VEHICLE INTEGRATION' : 'INTEGRAÇÃO DE VEÍCULOS', width / 2, centerY - 50);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(isEn ? 'RESTRICTED ACCESS • EVA CREW' : 'ACESSO RESTRITO • EQUIPE EVA', width / 2, centerY);
    }

    // Technical specs box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(200, centerY + 50, width - 400, 150);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.strokeRect(200, centerY + 50, width - 400, 150);

    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(isEn ? '▲ WARNING: AUTOMATIC OPERATION ▲' : '▲ ATENÇÃO: OPERAÇÃO AUTOMÁTICA ▲', width / 2, centerY + 95);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px monospace';
    ctx.fillText(isEn ? 'KEEP CLEAR DURING OPENING / CLOSING' : 'MANTER DISTÂNCIA DURANTE ABERTURA / FECHO', width / 2, centerY + 135);
    ctx.fillText(isEn ? 'PRESSURIZATION ACTIVE • HERMETIC SEAL' : 'PRESSURIZAÇÃO ATIVA • SELAGEM HERMÉTICA', width / 2, centerY + 168);

    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  const left = drawDoor(false);
  const right = drawDoor(true);
  cachedDoorTextures[language] = { left, right };
  return { left, right };
}

// ---------------------------------------------------------------------------
// VAB (VEHICLE ASSEMBLY BUILDING) MEGA INFRASTRUCTURE
// Real aerospace infrastructure with opening mega high-bay doors,
// detailed climbable industrial stairs, observation windows, mission control,
// rocket assembly interior, and authentic GGPEN / NASA Space Apps Luanda logos.
// ---------------------------------------------------------------------------
export function VABInfrastructure() {
  const isHabitatDoorOpen = useGameStore((state) => state.isHabitatDoorOpen);
  const setHabitatDoorOpen = useGameStore((state) => state.setHabitatDoorOpen);
  const toggleHabitatDoor = useGameStore((state) => state.toggleHabitatDoor);
  const language = useGameStore((state) => state.language);
  const t = UI_TEXT[language];

  // High-resolution procedural textures for corrugated aerospace blast doors
  const doorTextures = useMemo(() => getHangarDoorTextures(language), [language]);

  // Door and mechanical animation refs
  const leftDoorRef = useRef<Group>(null);
  const rightDoorRef = useRef<Group>(null);
  const leftDoorRbRef = useRef<RapierRigidBody>(null);
  const rightDoorRbRef = useRef<RapierRigidBody>(null);
  const leftSubDoorRef = useRef<Group>(null);
  const rightSubDoorRef = useRef<Group>(null);
  const craneTrolleyRef = useRef<Group>(null);
  const radarDishRef = useRef<Group>(null);
  const holoGlobeRef = useRef<Group>(null);

  // Base world position of the VAB
  const vabWorldX = 260;
  const vabWorldZ = 0;

  // Door animation interpolation state
  const doorProgress = useRef<number>(0);
  const prevOpenState = useRef<boolean>(false);

  // Proximity auto-door trigger for the VAB Mega Doors (West Facade: world X ≈ 220)
  useFrame((state, delta) => {
    // 1. Proximity detection to VAB High Bay Entrance (X ≈ 220, Z ≈ 0)
    const storeState = useGameStore.getState();
    const playerPos = storeState.playerPosition;
    const distToVABDoor = Math.hypot(
      playerPos[0] - 220,
      playerPos[2] - 0
    );

    // Trigger automatic opening only when approaching close on foot (15m) so the gate stays solid for vehicle collision tests or until close approach
    const isNearDoor = !storeState.drivingCarId && distToVABDoor < 15 && Math.abs(playerPos[1] - 0) < 12;
    const isManual = storeState.manualDoorOverride;

    // Auto-open/close on proximity only when not manually overridden
    if (!isManual) {
      if (isNearDoor && !isHabitatDoorOpen) {
        setHabitatDoorOpen(true);
      } else if (!isNearDoor && distToVABDoor > 24 && isHabitatDoorOpen) {
        setHabitatDoorOpen(false);
      }
    } else {
      // Re-enable automatic mode once the player walks far away
      if (distToVABDoor > 46) {
        storeState.setManualDoorOverride(false);
      }
    }

    // Play sound effects when door state changes
    if (isHabitatDoorOpen !== prevOpenState.current) {
      if (isHabitatDoorOpen) {
        playDoorOpenSound();
      } else {
        playDoorCloseSound();
      }
      prevOpenState.current = isHabitatDoorOpen;
    }

    // 2. Smoothly animate mega high-bay sliding doors & synchronized physical colliders
    const targetProgress = isHabitatDoorOpen ? 1 : 0;
    doorProgress.current = MathUtils.damp(
      doorProgress.current,
      targetProgress,
      2.5,
      delta
    );

    const slideDistance = 17.5 * doorProgress.current;
    if (leftDoorRef.current && rightDoorRef.current) {
      leftDoorRef.current.position.z = -8.15 - slideDistance;
      rightDoorRef.current.position.z = 8.15 + slideDistance;
    }
    if (leftDoorRbRef.current) {
      leftDoorRbRef.current.setNextKinematicTranslation({
        x: vabWorldX - 39.2,
        y: 33,
        z: vabWorldZ - 8.15 - slideDistance,
      });
    }
    if (rightDoorRbRef.current) {
      rightDoorRbRef.current.setNextKinematicTranslation({
        x: vabWorldX - 39.2,
        y: 33,
        z: vabWorldZ + 8.15 + slideDistance,
      });
    }

    // 3. Rotating Rooftop Radar Dish, Mission Control Globe & Gantry Crane (active when within range)
    if (distToVABDoor < 140) {
      if (radarDishRef.current) {
        radarDishRef.current.rotation.y = state.clock.getElapsedTime() * 0.4;
      }
      if (holoGlobeRef.current) {
        holoGlobeRef.current.rotation.y = state.clock.getElapsedTime() * 0.7;
      }
      if (craneTrolleyRef.current) {
        craneTrolleyRef.current.position.z = Math.sin(state.clock.getElapsedTime() * 0.2) * 12;
      }
    }
  });

  return (
    <group position={[vabWorldX, 0, vabWorldZ]}>
      {/* ============================================================== */}
      {/* 1. VAB MASSIVE STRUCTURAL SHELL & EXTERIOR WALLS                */}
      {/* 80m Wide (X), 110m High (Y), 100m Deep (Z)                     */}
      {/* ============================================================== */}

      {/* East Solid Rear Wall (X = +40) */}
      <RigidBody type="fixed" colliders="cuboid" position={[39, 55, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2, 110, 100]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* North Side Wall (Z = +49) with External Buttress Ribs */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 55, 49]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[80, 110, 2]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* South Side Wall (Z = -49) with Level Skybridge Portal (Y = 18.3m to 28.5m) & Insignias */}
      <RigidBody type="fixed" colliders={false}>
        {/* West Section (X: -40 to -21.5) */}
        <CuboidCollider position={[-30.75, 55, -49]} args={[9.25, 55, 1]} />
        {/* East Section (X: -15.5 to +40) */}
        <CuboidCollider position={[12.25, 55, -49]} args={[27.75, 55, 1]} />
        {/* Bottom Section below Skybridge (X: -21.5 to -15.5, Y: 0 to 18.3) */}
        <CuboidCollider position={[-18.5, 9.15, -49]} args={[3.0, 9.15, 1]} />
        {/* Top Section above Skybridge (X: -21.5 to -15.5, Y: 28.5 to 110) */}
        <CuboidCollider position={[-18.5, 69.25, -49]} args={[3.0, 40.75, 1]} />

        {/* Visual Wall Mesh with Skybridge Opening */}
        <mesh receiveShadow castShadow position={[-30.75, 55, -49]}>
          <boxGeometry args={[18.5, 110, 2]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
        </mesh>
        <mesh receiveShadow castShadow position={[12.25, 55, -49]}>
          <boxGeometry args={[55.5, 110, 2]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
        </mesh>
        <mesh receiveShadow castShadow position={[-18.5, 9.15, -49]}>
          <boxGeometry args={[6.0, 18.3, 2]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
        </mesh>
        <mesh receiveShadow castShadow position={[-18.5, 69.25, -49]}>
          <boxGeometry args={[6.0, 81.5, 2]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
        </mesh>

        {/* Architectural Portal Frame at Level Skybridge Entry (Y = 18.3 to 23.0) */}
        <group position={[-18.5, 20.65, -49]}>
          {/* Top Header Beam */}
          <mesh position={[0, 2.35, 0]}>
            <boxGeometry args={[5.2, 0.45, 2.2]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          {/* Side Jambs */}
          {[-2.5, 2.5].map((jx, ji) => (
            <mesh key={`vab-portal-jamb-${ji}`} position={[jx, 0, 0]}>
              <boxGeometry args={[0.4, 4.7, 2.2]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} />
            </mesh>
          ))}
          {/* Luminous Framed Directional Signboard */}
          <group position={[0, 2.38, -1.16]} rotation={[0, Math.PI, 0]}>
            <mesh>
              <boxGeometry args={[5.2, 0.88, 0.10]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.41, 0.04]}>
              <boxGeometry args={[5.05, 0.04, 0.04]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            <Text position={[0, 0.14, 0.07]} fontSize={0.20} maxWidth={4.8} color="#38bdf8" fontWeight="bold" anchorX="center">
              {t.signVabPortalLine1}
            </Text>
            <Text position={[0, -0.15, 0.07]} fontSize={0.18} maxWidth={4.8} color="#f8fafc" fontWeight="bold" anchorX="center">
              {t.signVabPortalLine2}
            </Text>
          </group>
        </group>

        {/* Official GGPEN and NASA Space Apps Luanda Logos on Upper South Facade (Clear of Skybridge Portal) */}
        <group position={[-14, 56, -50.05]} rotation={[0, Math.PI, 0]}>
          <GGPENLogoDecal position={[0, 0, 0]} scale={[20, 20, 1]} framed={false} />
        </group>
        <group position={[18, 56, -50.05]} rotation={[0, Math.PI, 0]}>
          <NasaSpaceAppsLuandaDecal position={[0, 0, 0]} scale={[20, 20, 1]} framed={false} />
        </group>
      </RigidBody>

      {/* West Facade Upper Fascia (Above the mega high bay doors, Y = 68 to 110) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-39, 88, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2, 44, 100]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* West Facade Left Flank Wall (Z < -16, Y = 0 to 66) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-39, 33, -33]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2, 66, 34]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.75} />
        </mesh>
      </RigidBody>

      {/* West Facade Right Flank Wall (Z > +16, Y = 0 to 66) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-39, 33, 33]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2, 66, 34]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.75} />
        </mesh>
      </RigidBody>

      {/* VAB Heavy Reinforced Concrete Floor (Inside Hangar) - Elevated solid slab with clean aerospace epoxy finish */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.10, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[78, 0.20, 98]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.25} />
        </mesh>
      </RigidBody>

      {/* Safety Demarcation Cleanroom Boundary Mat (Zero Z-fighting) */}
      <mesh position={[0, 0.205, 0]} receiveShadow>
        <boxGeometry args={[76, 0.005, 96]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.5}
          metalness={0.2}
          polygonOffset={true}
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* Center Crawlerway Transition Tracks Inside VAB (High-tech integrated rails, zero Z-fighting) */}
      {[-11, 11].map((laneZ, l) => (
        <group key={`interior-lane-${l}`} position={[0, 0.21, laneZ]}>
          <mesh receiveShadow>
            <boxGeometry args={[76, 0.005, 11.5]} />
            <meshStandardMaterial
              color="#475569"
              roughness={0.7}
              metalness={0.3}
              polygonOffset={true}
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
            />
          </mesh>
          {/* Steel Track Rail Guide Ribs */}
          {[-5.2, 5.2].map((railOffset, rIdx) => (
            <mesh key={`rail-rib-${rIdx}`} position={[0, 0.025, railOffset]}>
              <boxGeometry args={[76, 0.04, 0.35]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
            </mesh>
          ))}
          {/* Safety Yellow Hazard Stripe Border */}
          {[-5.6, 5.6].map((stripeOffset, sIdx) => (
            <mesh key={`hazard-stripe-${sIdx}`} position={[0, 0.008, stripeOffset]}>
              <boxGeometry args={[76, 0.005, 0.15]} />
              <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.2} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ============================================================== */}
      {/* 2. OFFICIAL LOGOS ON VAB WEST FACADE (ABOVE HIGH BAY DOORS)    */}
      {/* SIDE-BY-SIDE, NON-OVERLAPPING & PROPORTIONALLY BALANCED         */}
      {/* ============================================================== */}
      <group position={[-40.1, 88, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Architectural Header Text */}
        <Text
          position={[0, 15, 0.05]}
          fontSize={1.3}
          color="#334155"
          fontWeight="bold"
          letterSpacing={0.12}
          anchorX="center"
        >
          {language === 'en'
            ? 'REPUBLIC OF ANGOLA • NATIONAL SPACE PROGRAM'
            : 'REPÚBLICA DE ANGOLA • PROGRAMA ESPACIAL NACIONAL'}
        </Text>

        {/* Left Side: Authentic NASA Space Apps Luanda Logo (Height = 15.8m, Width = 29.7m) */}
        <group position={[-21, 2, 0.05]}>
          <NasaSpaceAppsLuandaDecal
            position={[0, 0, 0]}
            scale={[26, 26, 1]}
            framed={false}
          />
        </group>

        {/* Right Side: Authentic GGPEN Official Logo (Height = 15.8m, Width = 26.0m) */}
        <group position={[21, 2, 0.05]}>
          <GGPENLogoDecal
            position={[0, 0, 0]}
            scale={[26, 26, 1]}
            framed={false}
          />
        </group>

        {/* Central Facility Title Banner Directly Below Logos */}
        <Text
          position={[0, -14, 0.05]}
          fontSize={2.3}
          color="#1e293b"
          fontWeight="bold"
          letterSpacing={0.1}
          anchorX="center"
        >
          {language === 'en'
            ? 'SPACECRAFT INTEGRATION & ASSEMBLY CENTER'
            : 'CENTRO DE INTEGRAÇÃO & MONTAGEM DE VEÍCULOS ESPACIAIS'}
        </Text>

        {/* Architectural Accent Floodlights for Night Operations */}
        <pointLight position={[-21, 12, 6]} intensity={3.5} distance={35} color="#f8fafc" />
        <pointLight position={[21, 12, 6]} intensity={3.5} distance={35} color="#f8fafc" />
      </group>

      {/* ============================================================== */}
      {/* 3. MEGA HIGH BAY SLIDING DOORS (PORTAS QUE SE ABREM DE VERDADE)*/}
      {/* West Facade, Height: 65m, Open Clearance: 32m                 */}
      {/* ============================================================== */}
      <group position={[-39.2, 0, 0]}>
        {/* Door Header Steel Lintel with Industrial Warning Chevrons */}
        <mesh position={[0, 66.5, 0]}>
          <boxGeometry args={[2.5, 2.0, 36]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>

        {/* Flashing Amber Aviation Warning Beacons above Door */}
        {[-14, 0, 14].map((bx, i) => (
          <group key={`door-beacon-${i}`} position={[0.8, 68, bx]}>
            <mesh>
              <cylinderGeometry args={[0.3, 0.3, 0.8, 8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <sphereGeometry args={[0.35, 10, 10]} />
              <meshBasicMaterial color={isHabitatDoorOpen ? '#22c55e' : '#f59e0b'} />
            </mesh>
          </group>
        ))}
        <pointLight
          position={[0.8, 68.5, 0]}
          color={isHabitatDoorOpen ? '#22c55e' : '#f59e0b'}
          intensity={isHabitatDoorOpen ? 2.5 : 4}
          distance={35}
        />

        {/* Real-Time Kinematic Door Leaf Colliders: Move in lockstep with the sliding doors so nothing can pass through closed or opening door leaves */}
        <RigidBody ref={leftDoorRbRef} type="kinematicPosition" colliders={false} position={[0, 33, -8.15]}>
          <CuboidCollider args={[0.95, 32.5, 8.35]} />
        </RigidBody>
        <RigidBody ref={rightDoorRbRef} type="kinematicPosition" colliders={false} position={[0, 33, 8.15]}>
          <CuboidCollider args={[0.95, 32.5, 8.35]} />
        </RigidBody>

        {/* Door Status Signage Banner (Directly Above Portal) */}
        <group position={[-0.8, 65, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[26, 1.4, 0.2]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          <Text
            position={[0, 0, 0.1]}
            fontSize={0.65}
            color={isHabitatDoorOpen ? '#4ade80' : '#f87171'}
            fontWeight="bold"
            anchorX="center"
          >
            {language === 'en'
              ? isHabitatDoorOpen
                ? 'HANGAR GATE: OPEN • 32M CLEARANCE'
                : 'HANGAR GATE: FULLY CLOSED • SEAL ACTIVE'
              : isHabitatDoorOpen
              ? 'PORTÃO DO HANGAR: ABERTO • VÃO LIVRE 32M'
              : 'PORTÃO DO HANGAR: TOTALMENTE FECHADO • SELAGEM ATIVA'}
          </Text>
        </group>

        {/* Left Mega Sliding Door Panel (Width: 16.6m, Meets center Z = 0 flush with zero gap) */}
        <group ref={leftDoorRef} position={[0, 33, -8.15]} onClick={() => toggleHabitatDoor()}>
          {/* Main Structural Door Core */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.2, 65, 16.6]} />
            <meshStandardMaterial color="#1e222a" roughness={0.65} metalness={0.5} />
          </mesh>

          {/* High-Fidelity Exterior Corrugated Steel Blast Slat Facade with Hazard Stripes & Stencils */}
          {doorTextures.left && (
            <mesh position={[-0.61, 0, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
              <planeGeometry args={[16.6, 65]} />
              <meshStandardMaterial
                map={doorTextures.left}
                roughness={0.45}
                metalness={0.6}
              />
            </mesh>
          )}

          {/* Interior Face Facing Rocket High Bay */}
          {doorTextures.left && (
            <mesh position={[0.61, 0, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
              <planeGeometry args={[16.6, 65]} />
              <meshStandardMaterial
                map={doorTextures.left}
                roughness={0.55}
                metalness={0.5}
              />
            </mesh>
          )}

          {/* Vertical Structural I-Beam Stiffeners */}
          {[-6, -2, 2, 6].map((rz, ri) => (
            <mesh key={`rib-left-${ri}`} position={[-0.7, 0, rz]} castShadow>
              <boxGeometry args={[0.35, 65, 0.6]} />
              <meshStandardMaterial color="#333b47" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}

          {/* Center Sealing Flange & Rubber Weather Gasket */}
          <mesh position={[-0.65, 0, 8.22]}>
            <boxGeometry args={[0.2, 65, 0.25]} />
            <meshStandardMaterial color="#09090b" roughness={0.95} />
          </mesh>
          {/* Yellow/Black Safety Striping along Inner Sealing Edge */}
          <mesh position={[-0.66, 0, 8.1]}>
            <planeGeometry args={[0.4, 65]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
        </group>

        {/* Right Mega Sliding Door Panel (Width: 16.6m, Meets center Z = 0 flush with zero gap) */}
        <group ref={rightDoorRef} position={[0, 33, 8.15]} onClick={() => toggleHabitatDoor()}>
          {/* Main Structural Door Core */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.2, 65, 16.6]} />
            <meshStandardMaterial color="#1e222a" roughness={0.65} metalness={0.5} />
          </mesh>

          {/* High-Fidelity Exterior Corrugated Steel Blast Slat Facade with Hazard Stripes & Stencils */}
          {doorTextures.right && (
            <mesh position={[-0.61, 0, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
              <planeGeometry args={[16.6, 65]} />
              <meshStandardMaterial
                map={doorTextures.right}
                roughness={0.45}
                metalness={0.6}
              />
            </mesh>
          )}

          {/* Interior Face Facing Rocket High Bay */}
          {doorTextures.right && (
            <mesh position={[0.61, 0, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
              <planeGeometry args={[16.6, 65]} />
              <meshStandardMaterial
                map={doorTextures.right}
                roughness={0.55}
                metalness={0.5}
              />
            </mesh>
          )}

          {/* Vertical Structural I-Beam Stiffeners */}
          {[-6, -2, 2, 6].map((rz, ri) => (
            <mesh key={`rib-right-${ri}`} position={[-0.7, 0, rz]} castShadow>
              <boxGeometry args={[0.35, 65, 0.6]} />
              <meshStandardMaterial color="#333b47" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}

          {/* Center Sealing Flange & Rubber Weather Gasket */}
          <mesh position={[-0.65, 0, -8.22]}>
            <boxGeometry args={[0.2, 65, 0.25]} />
            <meshStandardMaterial color="#09090b" roughness={0.95} />
          </mesh>
          {/* Yellow/Black Safety Striping along Inner Sealing Edge */}
          <mesh position={[-0.66, 0, -8.1]}>
            <planeGeometry args={[0.4, 65]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
        </group>

        {/* Bottom Dual Recessed Floor Guide Rails */}
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[2.0, 0.08, 68]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Overhead Heavy Steel Door Guide Tracks */}
        <mesh position={[0, 67.5, 0]}>
          <boxGeometry args={[3.2, 0.8, 68]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* External Door Control Pedestal (Interactive for astronaut) */}
        <group position={[-2.2, 0, -17]} onClick={() => toggleHabitatDoor()}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.18, 2.2, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          <mesh position={[0, 2.2, 0]} rotation={[0, -Math.PI / 2, 0.3]} castShadow>
            <boxGeometry args={[0.9, 0.6, 0.2]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[-0.08, 2.25, 0]}>
            <circleGeometry args={[0.12, 16]} />
            <meshBasicMaterial color={isHabitatDoorOpen ? '#22c55e' : '#f59e0b'} />
          </mesh>
          <Text
            position={[-0.3, 2.6, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            fontSize={0.22}
            color="#38bdf8"
            fontWeight="bold"
            anchorX="center"
          >
            {language === 'en' ? 'HANGAR DOOR [E]' : 'PORTA DO HANGAR [E]'}
          </Text>
        </group>

        {/* Internal Door Control Pedestal */}
        <group position={[2.5, 0, -17]} onClick={() => toggleHabitatDoor()}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.18, 2.2, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 2, -0.3]} castShadow>
            <boxGeometry args={[0.9, 0.6, 0.2]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0.08, 2.25, 0]}>
            <circleGeometry args={[0.12, 16]} />
            <meshBasicMaterial color={isHabitatDoorOpen ? '#22c55e' : '#f59e0b'} />
          </mesh>
          <Text
            position={[0.3, 2.6, 0]}
            rotation={[0, Math.PI / 2, 0]}
            fontSize={0.22}
            color="#38bdf8"
            fontWeight="bold"
            anchorX="center"
          >
            {language === 'en' ? 'HANGAR DOOR [E]' : 'PORTA DO HANGAR [E]'}
          </Text>
        </group>
        {/* External & Internal Door Control Pedestal Colliders */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.45, 1.2, 0.45]} position={[-2.2, 1.2, -17]} />
          <CuboidCollider args={[0.45, 1.2, 0.45]} position={[2.5, 1.2, -17]} />
        </RigidBody>
      </group>

      {/* ============================================================== */}
      {/* 4. VAB INTERIOR: PRIMARY ROCKET ASSEMBLY & HIGH BAY CRANE       */}
      {/* Heavy gantry crane, multi-stage booster, assembly scaffolding  */}
      {/* ============================================================== */}
      <group position={[10, 0, -18]}>
        {/* Solid Collider for Primary Rocket Booster & Launch Mount Base Ring */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[6.8, 3.2, 6.8]} position={[0, 3.2, 0]} />
          <CuboidCollider args={[5.2, 42.0, 5.2]} position={[0, 45.0, 0]} />
        </RigidBody>
        {/* Assembled Rocket Booster on Vertical Stand in High Bay */}
        <group position={[0, 0, 0]}>
          {/* Launch Mount Base Ring */}
          <mesh position={[0, 3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[7, 8, 6, 24]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>

          {/* First Stage Core Tank */}
          <mesh position={[0, 26, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[5, 5, 40, 32]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.4} />
          </mesh>

          {/* Interstage Ring */}
          <mesh position={[0, 48, 0]} castShadow>
            <cylinderGeometry args={[4.8, 5, 4, 32]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>

          {/* Second Stage Booster Tank */}
          <mesh position={[0, 64, 0]} castShadow>
            <cylinderGeometry args={[4.8, 4.8, 28, 32]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.4} />
          </mesh>

          {/* Payload Fairing (Cone Nose) */}
          <mesh position={[0, 84, 0]} castShadow>
            <cylinderGeometry args={[0.2, 4.8, 14, 32]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.4} />
          </mesh>

          {/* Official Mission Logos on the Assembled Rocket in High Bay */}
          <GGPENLogoDecal position={[0, 32, 5.05]} rotation={[0, 0, 0]} scale={[8, 8, 1]} />
          <NasaSpaceAppsLuandaDecal position={[0, 22, 5.05]} rotation={[0, 0, 0]} scale={[8, 8, 1]} />
        </group>

        {/* 250-Ton Overhead Yellow Industrial Bridge Crane (Y = 96) */}
        <group position={[0, 96, 0]}>
          {/* Main Dual Box Girder Crane Bridge */}
          {[-2.5, 2.5].map((gx, i) => (
            <mesh key={`girder-${i}`} position={[gx, 0, 0]} castShadow>
              <boxGeometry args={[1.8, 3.2, 88]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.3} />
            </mesh>
          ))}

          {/* Movable Crane Trolley & Cable Hoist */}
          <group ref={craneTrolleyRef} position={[0, -0.6, 0]}>
            <mesh castShadow>
              <boxGeometry args={[7, 1.8, 6]} />
              <meshStandardMaterial color="#ca8a04" metalness={0.6} />
            </mesh>
            {/* Hoist Steel Cables */}
            {[-1.5, 1.5].map((cx, i) => (
              <mesh key={`cable-${i}`} position={[cx, -16, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 30, 8]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
              </mesh>
            ))}
            {/* Heavy-Duty Lifting Spreader Bar */}
            <mesh position={[0, -31, 0]} castShadow>
              <boxGeometry args={[8, 0.8, 2]} />
              <meshStandardMaterial color="#eab308" metalness={0.7} />
            </mesh>
          </group>
        </group>

        {/* Assembly Scaffolding Work Platforms wrapping around the booster */}
        {[20, 42, 64].map((platY, pi) => (
          <group key={`scaffold-plat-${pi}`} position={[0, platY, 0]}>
            {/* Horseshoe Catwalk Ring around booster */}
            <RigidBody type="fixed" colliders="cuboid" position={[0, 0, 0]}>
              <mesh receiveShadow>
                <boxGeometry args={[16, 0.4, 16]} />
                <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.4} />
              </mesh>
            </RigidBody>
            {/* Safety Railings on Work Platform */}
            {[-7.8, 7.8].map((rx, ri) => (
              <mesh key={`scaffold-rail-${ri}`} position={[rx, 0.6, 0]}>
                <boxGeometry args={[0.1, 1.0, 16]} />
                <meshStandardMaterial color="#eab308" metalness={0.6} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ============================================================== */}
      {/* 5. REAL-TIME SECONDARY ROCKET ASSEMBLY HIGH BAY                */}
      {/* Active crane, lowering stage 2, 4 robotic welding arms, sparks!*/}
      {/* ============================================================== */}
      <RocketAssemblyBay />

      {/* ============================================================== */}
      {/* 6. CLIMBABLE MULTI-TIER INDUSTRIAL STAIRCASE & ACCESS TOWER    */}
      {/* Detailed diamond plate steps, safety yellow railings, ramps    */}
      {/* ============================================================== */}
      <HangarStairs />

      {/* ============================================================== */}
      {/* 6. LEVEL 3 (3º PISO - Y = 24.0m): ÁREA DE INVESTIGAÇÃO &       */}
      {/* CONTROLE TÁTICO DE MISSÃO DO HANGAR                            */}
      {/* Integrada diretamente ao topo da 3ª Secção da Escada do Hangar */}
      {/* (Z = -13.6) e ao Passadiço para a Ponte Envidraçada (X = -18.5)*/}
      {/* ============================================================== */}
      <group position={[-14.5, 24.0, -1.6]}>
        {/* 3rd-Floor Investigation Deck Slab (Top surface at Y = 24.00m, Z = -13.6 to +10.4, X = -26.5 to -2.5) */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, -0.15, 0]} friction={0.0}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[24.0, 0.30, 24.0]} />
            <meshStandardMaterial color="#1e293b" roughness={0.45} metalness={0.5} />
          </mesh>
        </RigidBody>

        {/* High-Visibility Safety Yellow Perimeter Trim */}
        <mesh position={[0, 0.02, -11.9]}>
          <boxGeometry args={[24.0, 0.04, 0.2]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.4} />
        </mesh>

        {/* 4 Heavy Structural Steel Support Columns Anchored to Hangar Floor (Y = 0 to 23.7m) with Solid Colliders */}
        {[
          [-11.4, -11.4],
          [11.4, -11.4],
          [-11.4, 11.4],
          [11.4, 11.4],
        ].map(([cx, cz], ci) => (
          <RigidBody key={`lvl3-sup-col-${ci}`} type="fixed" colliders={false} position={[cx, -12.0, cz]}>
            <CuboidCollider args={[0.5, 12.0, 0.5]} />
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.38, 0.45, 23.7, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} />
            </mesh>
          </RigidBody>
        ))}

        {/* Perimeter Safety Guardrails & Physical Colliders (Leaving Stair Flight 3 & Skybridge Portals Open) */}
        <RigidBody type="fixed" colliders={false}>
          {/* East Guardrail Collider (X = +11.9) */}
          <CuboidCollider position={[11.9, 0.65, 0]} args={[0.1, 0.65, 12.0]} />
          {/* North (+Z) Guardrail Collider (Z = +11.9) */}
          <CuboidCollider position={[0, 0.65, 11.9]} args={[12.0, 0.65, 0.1]} />
          {/* West (-X) Window Wall Collider (X = -11.9) */}
          <CuboidCollider position={[-11.9, 1.5, 0]} args={[0.2, 1.5, 12.0]} />
          {/* South (-Z = -13.6) Guardrail Segments (Open at X ∈ [-6.0, -2.0] for Skybridge & X ∈ [-0.9, +2.3] for Stairs!) */}
          <CuboidCollider position={[-9.0, 0.65, -11.9]} args={[3.0, 0.65, 0.1]} />
          <CuboidCollider position={[7.15, 0.65, -11.9]} args={[4.85, 0.65, 0.1]} />
        </RigidBody>

        {/* Visual East & North Industrial Glass/Steel Guardrails */}
        <group position={[11.9, 0.6, 0]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.1, 0.08, 24.0]} />
            <meshStandardMaterial color="#eab308" metalness={0.75} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.05, 1.1, 23.9]} />
            <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.32} transmission={0.85} roughness={0.1} side={DoubleSide} />
          </mesh>
        </group>
        <group position={[0, 0.6, 11.9]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[24.0, 0.08, 0.1]} />
            <meshStandardMaterial color="#eab308" metalness={0.75} />
          </mesh>
          <mesh>
            <boxGeometry args={[23.9, 1.1, 0.05]} />
            <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.32} transmission={0.85} roughness={0.1} side={DoubleSide} />
          </mesh>
        </group>
        {/* South Guardrail Segments flanking Staircase Arrival & Skybridge Gateway */}
        <group position={[-9.0, 0.6, -11.9]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[6.0, 0.08, 0.1]} />
            <meshStandardMaterial color="#eab308" metalness={0.75} />
          </mesh>
          <mesh>
            <boxGeometry args={[5.9, 1.1, 0.05]} />
            <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.32} transmission={0.85} roughness={0.1} side={DoubleSide} />
          </mesh>
        </group>
        <group position={[7.15, 0.6, -11.9]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[9.7, 0.08, 0.1]} />
            <meshStandardMaterial color="#eab308" metalness={0.75} />
          </mesh>
          <mesh>
            <boxGeometry args={[9.6, 1.1, 0.05]} />
            <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.32} transmission={0.85} roughness={0.1} side={DoubleSide} />
          </mesh>
        </group>

        {/* Illuminated Gateway Arch at Skybridge Walkway Entrance (VAB local X = -18.5 -> deck local X = -4.0, Z = -11.9) */}
        <group position={[-4.0, 0, -11.9]}>
          {[-1.9, 1.9].map((gx, gi) => (
            <group key={`lvl3-sky-post-${gi}`} position={[gx, 1.3, 0]}>
              <mesh>
                <cylinderGeometry args={[0.09, 0.09, 2.6, 12]} />
                <meshStandardMaterial color="#0284c7" metalness={0.9} />
              </mesh>
              <mesh position={[0, 1.35, 0]}>
                <sphereGeometry args={[0.13, 12, 12]} />
                <meshBasicMaterial color="#38bdf8" />
              </mesh>
            </group>
          ))}
          <group position={[0, 2.65, 0]}>
            <mesh>
              <boxGeometry args={[4.1, 0.84, 0.12]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.39, 0.05]}>
              <boxGeometry args={[3.95, 0.04, 0.04]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            <Text position={[0, 0.14, 0.08]} fontSize={0.19} maxWidth={3.75} color="#38bdf8" fontWeight="bold" anchorX="center">
              {t.signVabDeckWalkLine1}
            </Text>
            <Text position={[0, -0.14, 0.08]} fontSize={0.16} maxWidth={3.75} color="#f8fafc" fontWeight="bold" anchorX="center">
              {t.signVabDeckWalkLine2}
            </Text>
          </group>
        </group>

        {/* Dedicated Framed Signboard at 3rd Floor Investigation Area (Clear of Skybridge Arch) */}
        <group position={[3.5, 2.95, -11.7]}>
          <mesh>
            <boxGeometry args={[4.8, 0.88, 0.10]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.41, 0.04]}>
            <boxGeometry args={[4.65, 0.04, 0.04]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
          <Text position={[0, 0.14, 0.07]} fontSize={0.20} maxWidth={4.4} color="#eab308" fontWeight="bold" anchorX="center">
            {t.signVabLevel3Line1}
          </Text>
          <Text position={[0, -0.15, 0.07]} fontSize={0.17} maxWidth={4.4} color="#f8fafc" fontWeight="bold" anchorX="center">
            {t.signVabLevel3Line2}
          </Text>
        </group>

        {/* Exterior Panoramic Observation Window looking towards Crawlerway & Launch Pad */}
        <group position={[-11.9, 2.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Aluminum Mullion Window Frame */}
          <mesh>
            <boxGeometry args={[20, 5.2, 0.35]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
          {/* Tinted Aerospace Glass Panes */}
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[19, 4.6]} />
            <meshPhysicalMaterial
              color="#38bdf8"
              transparent
              opacity={0.35}
              roughness={0.05}
              metalness={0.1}
              transmission={0.8}
            />
          </mesh>
        </group>

        {/* Central 3D Holographic Projection Table with Rotating Earth Globe */}
        <group position={[0.5, 0, -1.0]}>
          <RigidBody type="fixed" colliders="cuboid" position={[0, 0.6, 0]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[2.2, 2.6, 1.2, 24]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.2} />
            </mesh>
          </RigidBody>
          <mesh position={[0, 1.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.0, 32]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>

          {/* Rotating Glowing Holographic 3D Earth Globe */}
          <group ref={holoGlobeRef} position={[0, 2.6, 0]}>
            <mesh>
              <sphereGeometry args={[1.0, 24, 24]} />
              <meshBasicMaterial color="#38bdf8" wireframe />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.96, 24, 24]} />
              <meshBasicMaterial color="#0284c7" transparent opacity={0.65} />
            </mesh>
            <pointLight color="#38bdf8" intensity={3.5} distance={15} />
          </group>
        </group>

        {/* Flight Director, Investigation & Telemetry Consoles with 6 Monitors (Interactive Book Library!) */}
        {[-6.2, 6.8].map((cx, i) => (
          <group
            key={`console-bank-${i}`}
            position={[cx, 0, 6.2]}
            rotation={[0, Math.PI, 0]}
            onClick={(e) => {
              e.stopPropagation();
              if (!useGameStore.getState().isNearComputer) return;
              useGameStore.getState().setComputerLibraryOpen(true);
            }}
          >
            <RigidBody type="fixed" colliders="cuboid" position={[0, 0.6, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[8, 1.2, 2.2]} />
                <meshStandardMaterial color="#0f172a" roughness={0.5} />
              </mesh>
            </RigidBody>
            {/* 3 Telemetry Screens per Bank */}
            {[-2.4, 0, 2.4].map((sx, j) => (
              <group key={`screen-${j}`} position={[sx, 1.6, -0.4]}>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[2.0, 1.2, 0.1]} />
                  <meshStandardMaterial color="#020617" />
                </mesh>
                <mesh position={[0, 0, 0.06]}>
                  <planeGeometry args={[1.9, 1.1]} />
                  <meshBasicMaterial color={j % 2 === 0 ? '#0284c7' : '#10b981'} />
                </mesh>
                <Text position={[0, 0.12, 0.08]} fontSize={0.14} color="#f8fafc" fontWeight="bold" anchorX="center">
                  {j === 0
                    ? language === 'en'
                      ? 'COSMIC LANDSCAPES'
                      : 'PAISAGENS CÓSMICAS'
                    : j === 1
                    ? language === 'en'
                      ? 'ASTRONOMY & ASTROPHYSICS'
                      : 'ASTRONOMIA & ASTROFÍSICA'
                    : 'NASA DISCOVERY PROGRAM'}
                </Text>
                <Text position={[0, -0.18, 0.08]} fontSize={0.11} color="#fde047" fontWeight="bold" anchorX="center">
                  {language === 'en' ? '[CLICK TO READ BOOK]' : '[CLIQUE PARA LER LIVRO]'}
                </Text>
              </group>
            ))}
            <Text position={[0, 2.55, -0.3]} fontSize={0.24} color="#38bdf8" fontWeight="bold" anchorX="center">
              {language === 'en'
                ? 'RESEARCH COMPUTERS • SCIENTIFIC LIBRARY [CLICK / C]'
                : 'COMPUTADORES DE INVESTIGAÇÃO • BIBLIOTECA CIENTÍFICA [CLIQUE / C]'}
            </Text>
          </group>
        ))}
      </group>

      {/* ============================================================== */}
      {/* 7. ROOFTOP OPERATIONS & COMMUNICATIONS GANTRY (Y = 110)        */}
      {/* Rotating satellite dish, solar arrays, weather station, beacons*/}
      {/* ============================================================== */}
      <group position={[0, 110, 0]}>
        {/* Rooftop Parapet Safety Perimeter Walls */}
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[80.4, 1.6, 100.4]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[78, 1.8, 98]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* 4 Corner Aviation Warning Beacons */}
        {[
          [-38, 3, -48],
          [38, 3, -48],
          [-38, 3, 48],
          [38, 3, 48],
        ].map((pos, i) => (
          <group key={`vab-roof-beacon-${i}`} position={[pos[0], pos[1], pos[2]]}>
            <mesh>
              <cylinderGeometry args={[0.3, 0.3, 3, 12]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            <mesh position={[0, 1.8, 0]}>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <pointLight position={[0, 2, 0]} color="#ef4444" intensity={2.5} distance={60} />
          </group>
        ))}

        {/* Rooftop Rotating Deep Space Radar Dish */}
        <group position={[0, 2, -20]}>
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[1.5, 2.0, 6, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <group ref={radarDishRef} position={[0, 7.5, 0]}>
            <mesh rotation={[0.6, 0, 0]} castShadow>
              <sphereGeometry args={[6, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.3} side={DoubleSide} />
            </mesh>
            <mesh position={[0, 0, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 7, 8]} />
              <meshStandardMaterial color="#eab308" metalness={0.9} />
            </mesh>
          </group>
        </group>

        {/* Photovoltaic Solar Arrays on Rooftop */}
        {[-22, 22].map((ax, ai) => (
          <group key={`roof-solar-${ai}`} position={[ax, 2, 25]} rotation={[0.3, 0, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[18, 0.3, 24]} />
              <meshStandardMaterial color="#1e3a8a" roughness={0.2} metalness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
