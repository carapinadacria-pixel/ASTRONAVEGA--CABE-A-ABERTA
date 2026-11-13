import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Quaternion, Euler } from 'three';
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { useGameStore } from '../store';

const _carQuat = new Quaternion();
const _carEuler = new Euler();

// Module-level registry of 3D vehicle groups so Player.tsx can update the driven car's visual transform
// synchronously in the same frame BEFORE positioning the 1st/3rd person camera (zero 1-frame lag or vibration!)
export const carVisualGroups: Record<string, Group | null> = {};

// ---------------------------------------------------------------------------
// REALISTIC 5-SPOKE & 10-SPOKE ALLOY WHEEL WITH STEERING & ROLLING ANIMATION
// ---------------------------------------------------------------------------
function RealisticAlloyWheel({
  position,
  isRightSide = false,
  rimColor = '#e2e8f0',
  spokeCount = 5,
  scale = 1,
  isFront = false,
  wheelSpin = 0,
  steerAngle = 0,
}: {
  position: [number, number, number];
  isRightSide?: boolean;
  rimColor?: string;
  spokeCount?: number;
  scale?: number;
  isFront?: boolean;
  wheelSpin?: number;
  steerAngle?: number;
}) {
  const baseYaw = isRightSide ? Math.PI : 0;
  const finalYaw = baseYaw + (isFront ? steerAngle : 0);
  const spinDir = isRightSide ? -wheelSpin : wheelSpin;

  return (
    <group position={position} rotation={[0, finalYaw, 0]} scale={[scale, scale, scale]}>
      <group rotation={[spinDir, 0, Math.PI / 2]}>
        {/* Black Rubber Tire with Tread Shoulder */}
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[0.37, 0.37, 0.27, 20]} />
          <meshStandardMaterial color="#18181b" roughness={0.88} metalness={0.08} />
        </mesh>
        {/* Inner Dark Brake Disc Recess */}
        <mesh position={[0, 0.125, 0]}>
          <cylinderGeometry args={[0.27, 0.27, 0.03, 18]} />
          <meshStandardMaterial color="#09090b" roughness={0.6} metalness={0.5} />
        </mesh>
        {/* Outer Alloy Rim Barrel Lip */}
        <mesh position={[0, 0.136, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.255, 0.025, 10, 20]} />
          <meshStandardMaterial color={rimColor} metalness={0.92} roughness={0.16} />
        </mesh>
        {/* Multi-Spoke Alloy Star */}
        {Array.from({ length: spokeCount }).map((_, i) => {
          const angle = (i / spokeCount) * Math.PI * 2;
          return (
            <mesh
              key={`spoke-${i}`}
              position={[Math.cos(angle) * 0.12, 0.142, Math.sin(angle) * 0.12]}
              rotation={[0, -angle, 0]}
            >
              <boxGeometry args={[0.23, 0.024, spokeCount > 6 ? 0.036 : 0.062]} />
              <meshStandardMaterial color={rimColor} metalness={0.92} roughness={0.16} />
            </mesh>
          );
        })}
        {/* Center Hub Cap */}
        <mesh position={[0, 0.152, 0]}>
          <cylinderGeometry args={[0.068, 0.068, 0.02, 14]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// DETAILED 3D CAR COCKPIT INTERIOR (STEERING WHEEL, DASHBOARD, SEATS, GLASS)
// Visible in both 1st-Person Cockpit View and 3rd-Person Exterior View!
// ---------------------------------------------------------------------------
function CarCockpitInterior({
  steerAngle = 0,
  speedKmh = 0,
  seatColor = '#1e293b',
  accentColor = '#38bdf8',
  yOffset = 0,
  isDriven = false,
}: {
  steerAngle?: number;
  speedKmh?: number;
  seatColor?: string;
  accentColor?: string;
  yOffset?: number;
  isDriven?: boolean;
}) {
  const suitStyle = useGameStore((s) => s.suitStyle);
  const sleeveColor =
    suitStyle === 'orange' ? '#ea580c' : suitStyle === 'carbon' ? '#18181b' : '#f1f5f9';
  const gloveColor =
    suitStyle === 'orange' ? '#1c1917' : suitStyle === 'carbon' ? '#27272a' : '#1e293b';
  const steeringWheelGroupRef = useRef<Group>(null);

  useFrame(() => {
    if (!steeringWheelGroupRef.current) return;
    if (isDriven) {
      const st = useGameStore.getState();
      const activeCar = st.drivingCarId ? st.carStates[st.drivingCarId] : null;
      const liveSteer = activeCar ? activeCar.steer : steerAngle;
      steeringWheelGroupRef.current.rotation.z = -liveSteer * 3.4;
    } else {
      steeringWheelGroupRef.current.rotation.z = -steerAngle * 3.4;
    }
  });

  return (
    <group position={[0, yOffset, 0]}>
      {/* Interior Cabin Floor Carpet & Center Console Tunnel */}
      <mesh position={[0, 0.36, -0.05]} receiveShadow>
        <boxGeometry args={[1.56, 0.06, 1.85]} />
        <meshStandardMaterial color="#09090b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.50, 0.05]}>
        <boxGeometry args={[0.24, 0.24, 1.45]} />
        <meshStandardMaterial color="#18181b" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Gear Shifter Selector on Center Console */}
      <mesh position={[0, 0.67, 0.22]} rotation={[-0.18, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.018, 0.14, 10]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.74, 0.20]}>
        <sphereGeometry args={[0.036, 12, 12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} />
      </mesh>

      {/* Driver (Left: X = +0.38) & Passenger (Right: X = -0.38) Ergonomic Bucket Seats */}
      {[-0.38, 0.38].map((sx, si) => (
        <group key={`cockpit-seat-${si}`} position={[sx, 0.44, -0.22]}>
          {/* Seat Bottom Cushion */}
          <mesh position={[0, 0.04, 0.08]} castShadow>
            <boxGeometry args={[0.48, 0.10, 0.48]} />
            <meshStandardMaterial color={seatColor} roughness={0.55} />
          </mesh>
          {/* Reclined Backrest */}
          <mesh position={[0, 0.30, -0.15]} rotation={[-0.22, 0, 0]} castShadow>
            <boxGeometry args={[0.46, 0.50, 0.10]} />
            <meshStandardMaterial color={seatColor} roughness={0.55} />
          </mesh>
          {/* Contoured Headrest */}
          <mesh position={[0, 0.60, -0.22]} rotation={[-0.16, 0, 0]}>
            <boxGeometry args={[0.26, 0.15, 0.08]} />
            <meshStandardMaterial color={seatColor} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Sculpted Front Dashboard Assembly & Instrument Hood */}
      <group position={[0, 0.76, 0.56]}>
        {/* Main Dash Beam */}
        <mesh castShadow>
          <boxGeometry args={[1.54, 0.24, 0.42]} />
          <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.2} />
        </mesh>
        {/* Glowing Accent Ambient Strip Across Dashboard */}
        <mesh position={[0, 0.06, -0.212]}>
          <boxGeometry args={[1.48, 0.015, 0.01]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>

        {/* Driver Digital Instrument Cluster Hood (Directly in front of Left-Hand-Drive Steering Wheel at X = +0.38) */}
        <group position={[0.38, 0.12, -0.06]}>
          <mesh>
            <boxGeometry args={[0.42, 0.15, 0.22]} />
            <meshStandardMaterial color="#18181b" roughness={0.4} />
          </mesh>
          {/* Illuminated Digital Speedometer & Telemetry Screen */}
          <mesh position={[0, -0.01, -0.112]}>
            <planeGeometry args={[0.36, 0.11]} />
            <meshBasicMaterial color="#022c22" />
          </mesh>
          <mesh position={[-0.11, -0.01, -0.114]}>
            <ringGeometry args={[0.028, 0.038, 20]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh position={[0.11, -0.01, -0.114]}>
            <ringGeometry args={[0.028, 0.038, 20]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          {/* Real-Time Digital Speedometer Readout on 3D Dashboard */}
          <Text
            position={[0, 0.005, -0.116]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.038}
            color="#38bdf8"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            {`${Math.round(speedKmh)}`}
          </Text>
          <Text
            position={[0, -0.032, -0.116]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.016}
            color="#a7f3d0"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            KM/H
          </Text>
        </group>

        {/* Center Infotainment Navigation Display */}
        <group position={[-0.04, 0.11, -0.12]} rotation={[0.12, 0.08, 0]}>
          <mesh>
            <boxGeometry args={[0.32, 0.18, 0.03]} />
            <meshStandardMaterial color="#09090b" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, -0.017]}>
            <planeGeometry args={[0.28, 0.15]} />
            <meshBasicMaterial color="#0c4a6e" />
          </mesh>
        </group>
      </group>

      {/* Interactive 3D Steering Column & Rotating 3-Spoke Steering Wheel (Volante on Left Side X = +0.38) */}
      <group position={[0.38, 0.80, 0.24]} rotation={[0.38, 0, 0]}>
        {/* Steering Column Shaft */}
        <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.042, 0.26, 12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Rotating Steering Wheel Assembly (Turns smoothly at 60 FPS with steerAngle!) */}
        <group ref={steeringWheelGroupRef} rotation={[0, 0, -steerAngle * 3.4]}>
          {/* Outer Leather Steering Wheel Rim */}
          <mesh castShadow>
            <torusGeometry args={[0.165, 0.024, 14, 28]} />
            <meshStandardMaterial color="#09090b" roughness={0.35} metalness={0.2} />
          </mesh>
          {/* Red 12-O'Clock Top Racing Center Marker */}
          <mesh position={[0, 0.165, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.026, 0.026, 0.035, 10]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          {/* Center Airbag Hub & Emblem */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.056, 0.056, 0.032, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, -0.018]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.005, 12]} />
            <meshBasicMaterial color={accentColor} />
          </mesh>
          {/* 3 Metallic Brushed Aluminum Steering Spokes (9-o'clock, 3-o'clock, 6-o'clock) */}
          <mesh position={[-0.095, 0, 0]}>
            <boxGeometry args={[0.11, 0.028, 0.016]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0.095, 0, 0]}>
            <boxGeometry args={[0.11, 0.028, 0.016]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.095, 0]}>
            <boxGeometry args={[0.032, 0.11, 0.016]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* 3D Astronaut EVA Pressure Gloves & Forearm Cuffs Locked onto 9-O'Clock (+X Left) & 3-O'Clock (-X Right) Steering Rim! */}
          {/* Visible in BOTH 1st-Person Cockpit View and 3rd-Person Exterior View when driving! */}
          {isDriven && (
            <>
              {/* LEFT HAND (9-O'Clock: +X = +0.162) */}
              <group position={[0.162, 0.015, -0.008]} rotation={[0.12, -0.18, 0.08]}>
                {/* Gloved Palm & Back of Hand Gripping Rim */}
                <mesh castShadow>
                  <boxGeometry args={[0.058, 0.078, 0.058]} />
                  <meshStandardMaterial color={gloveColor} roughness={0.45} metalness={0.25} />
                </mesh>
                {/* Wrapped EVA Fingers around Outer Rim */}
                {[-0.022, -0.007, 0.008, 0.023].map((fy, fi) => (
                  <mesh key={`l-finger-${fi}`} position={[0.012, fy, 0.022]} rotation={[0, 0, 0.35]}>
                    <cylinderGeometry args={[0.0085, 0.008, 0.042, 8]} />
                    <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.3} />
                  </mesh>
                ))}
                {/* Thumb Hooked over Inner Spoke */}
                <mesh position={[-0.028, 0.026, -0.006]} rotation={[0, 0, -0.65]}>
                  <cylinderGeometry args={[0.010, 0.009, 0.044, 8]} />
                  <meshStandardMaterial color={gloveColor} roughness={0.45} />
                </mesh>
                {/* NASA Blue Anodized Wrist Disconnect Ring */}
                <mesh position={[0.008, -0.018, -0.046]} rotation={[Math.PI / 2 - 0.25, 0.12, 0]}>
                  <torusGeometry args={[0.032, 0.007, 10, 18]} />
                  <meshStandardMaterial color="#0284c7" metalness={0.92} roughness={0.18} />
                </mesh>
                {/* Pressurized Spacesuit Forearm Sleeve Cuff Extending Toward Driver */}
                <mesh position={[0.018, -0.048, -0.115]} rotation={[Math.PI / 2 - 0.28, 0.14, 0]} castShadow>
                  <cylinderGeometry args={[0.036, 0.044, 0.14, 14]} />
                  <meshStandardMaterial color={sleeveColor} roughness={0.5} metalness={0.15} />
                </mesh>
              </group>

              {/* RIGHT HAND (3-O'Clock: -X = -0.162) */}
              <group position={[-0.162, 0.015, -0.008]} rotation={[0.12, 0.18, -0.08]}>
                {/* Gloved Palm & Back of Hand Gripping Rim */}
                <mesh castShadow>
                  <boxGeometry args={[0.058, 0.078, 0.058]} />
                  <meshStandardMaterial color={gloveColor} roughness={0.45} metalness={0.25} />
                </mesh>
                {/* Wrapped EVA Fingers around Outer Rim */}
                {[-0.022, -0.007, 0.008, 0.023].map((fy, fi) => (
                  <mesh key={`r-finger-${fi}`} position={[-0.012, fy, 0.022]} rotation={[0, 0, -0.35]}>
                    <cylinderGeometry args={[0.0085, 0.008, 0.042, 8]} />
                    <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.3} />
                  </mesh>
                ))}
                {/* Thumb Hooked over Inner Spoke */}
                <mesh position={[0.028, 0.026, -0.006]} rotation={[0, 0, 0.65]}>
                  <cylinderGeometry args={[0.010, 0.009, 0.044, 8]} />
                  <meshStandardMaterial color={gloveColor} roughness={0.45} />
                </mesh>
                {/* NASA Red Anodized Wrist Disconnect Ring */}
                <mesh position={[-0.008, -0.018, -0.046]} rotation={[Math.PI / 2 - 0.25, -0.12, 0]}>
                  <torusGeometry args={[0.032, 0.007, 10, 18]} />
                  <meshStandardMaterial color="#dc2626" metalness={0.92} roughness={0.18} />
                </mesh>
                {/* Pressurized Spacesuit Forearm Sleeve Cuff Extending Toward Driver */}
                <mesh position={[-0.018, -0.048, -0.115]} rotation={[Math.PI / 2 - 0.28, -0.14, 0]} castShadow>
                  <cylinderGeometry args={[0.036, 0.044, 0.14, 14]} />
                  <meshStandardMaterial color={sleeveColor} roughness={0.5} metalness={0.15} />
                </mesh>
              </group>
            </>
          )}
        </group>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 1. SILVER AERODYNAMIC SEDAN / HATCHBACK (FAITHFUL TO IMG_3480_40c1f491.jpeg)
// Open-interior cabin with A/B/C pillars, translucent windshield, and 3D cockpit
// ---------------------------------------------------------------------------
export function SilverAeroSedan({
  wheelSpin = 0,
  steerAngle = 0,
  speedKmh = 0,
  isDriven = false,
}: {
  wheelSpin?: number;
  steerAngle?: number;
  speedKmh?: number;
  isDriven?: boolean;
}) {
  const bodySilver = '#dde3ea';
  const darkGlass = '#0f172a';

  return (
    <group>
      {/* Lower Sculpted Chassis & Bumper Sill */}
      <mesh position={[0, 0.30, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.88, 0.22, 4.35]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Front Engine Bay & Sloping Aerodynamic Hood */}
      <mesh position={[0, 0.58, 1.40]} castShadow receiveShadow>
        <boxGeometry args={[1.88, 0.38, 1.50]} />
        <meshStandardMaterial color={bodySilver} metalness={0.82} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.74, 1.38]} rotation={[0.14, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.82, 0.22, 1.48]} />
        <meshStandardMaterial color={bodySilver} metalness={0.82} roughness={0.18} />
      </mesh>

      {/* Rear Trunk & Quarter Panels */}
      <mesh position={[0, 0.62, -1.45]} castShadow receiveShadow>
        <boxGeometry args={[1.88, 0.44, 1.42]} />
        <meshStandardMaterial color={bodySilver} metalness={0.82} roughness={0.18} />
      </mesh>

      {/* Left & Right Lower Doors (Leaving Interior Cabin Open Above Beltline!) */}
      {[-0.88, 0.88].map((dx, di) => (
        <mesh key={`sedan-door-${di}`} position={[dx, 0.60, -0.05]} castShadow receiveShadow>
          <boxGeometry args={[0.14, 0.42, 1.65]} />
          <meshStandardMaterial color={bodySilver} metalness={0.82} roughness={0.18} />
        </mesh>
      ))}

      {/* Full 3D Interior Cockpit (Dashboard, Rotating Volante, Seats) */}
      <CarCockpitInterior steerAngle={steerAngle} speedKmh={speedKmh} seatColor="#1e293b" accentColor="#38bdf8" yOffset={0.02} isDriven={isDriven} />

      {/* Rounded Front Bumper Nose & Black Radiator Grille */}
      <mesh position={[0, 0.48, 2.18]} castShadow>
        <boxGeometry args={[1.80, 0.38, 0.22]} />
        <meshStandardMaterial color={bodySilver} metalness={0.82} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.56, 2.29]}>
        <boxGeometry args={[0.98, 0.20, 0.04]} />
        <meshStandardMaterial color="#09090b" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.33, 2.28]}>
        <boxGeometry args={[1.45, 0.08, 0.04]} />
        <meshStandardMaterial color="#09090b" roughness={0.7} />
      </mesh>

      {/* Swept Headlights with Amber Corner Indicators */}
      {[-0.68, 0.68].map((lx, li) => (
        <group key={`sedan-hl-${li}`} position={[lx, 0.66, 2.16]} rotation={[0, li === 0 ? -0.22 : 0.22, 0]}>
          <mesh>
            <boxGeometry args={[0.42, 0.16, 0.12]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[li === 0 ? -0.14 : 0.14, 0.02, 0.02]}>
            <boxGeometry args={[0.12, 0.12, 0.13]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
        </group>
      ))}

      {/* Solid Metallic Painted Roof, Headers & Side Rails (Teto Sólido Pintado no Sedan) */}
      {[-0.69, 0.69].map((rx, ri) => (
        <mesh key={`sedan-roof-rail-${ri}`} position={[rx, 1.40, -0.20]} castShadow receiveShadow>
          <boxGeometry args={[0.18, 0.08, 1.88]} />
          <meshStandardMaterial color={bodySilver} metalness={0.82} roughness={0.18} />
        </mesh>
      ))}
      <mesh position={[0, 1.41, -0.20]} castShadow receiveShadow>
        <boxGeometry args={[1.48, 0.08, 1.86]} />
        <meshStandardMaterial color={bodySilver} metalness={0.82} roughness={0.18} />
      </mesh>
      {/* Front Windshield Top Roof Header & Rear Roof Header */}
      <mesh position={[0, 1.38, 0.68]} rotation={[0.28, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.52, 0.07, 0.20]} />
        <meshStandardMaterial color={bodySilver} metalness={0.82} roughness={0.18} />
      </mesh>
      <mesh position={[0, 1.38, -1.06]} rotation={[-0.28, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.50, 0.07, 0.20]} />
        <meshStandardMaterial color={bodySilver} metalness={0.82} roughness={0.18} />
      </mesh>
      <mesh position={[0, 1.36, -0.20]}>
        <boxGeometry args={[1.38, 0.02, 1.78]} />
        <meshStandardMaterial color={darkGlass} roughness={0.85} />
      </mesh>
      {/* Front A-Pillars & Rear C-Pillars */}
      {[-0.76, 0.76].map((px, pi) => (
        <group key={`sedan-pillars-${pi}`}>
          <mesh position={[px, 1.10, 0.82]} rotation={[-0.58, 0, 0]}>
            <boxGeometry args={[0.08, 0.78, 0.08]} />
            <meshStandardMaterial color={bodySilver} metalness={0.82} roughness={0.18} />
          </mesh>
          <mesh position={[px, 1.10, -0.10]}>
            <boxGeometry args={[0.07, 0.58, 0.12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[px, 1.10, -1.22]} rotation={[0.56, 0, 0]}>
            <boxGeometry args={[0.12, 0.76, 0.14]} />
            <meshStandardMaterial color={bodySilver} metalness={0.82} roughness={0.18} />
          </mesh>
        </group>
      ))}

      {/* Translucent Front Windshield (Vidro) - Clear view from 1st & 3rd person! */}
      <mesh position={[0, 1.10, 0.86]} rotation={[-0.58, 0, 0]}>
        <boxGeometry args={[1.48, 0.78, 0.03]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.26}
          roughness={0.06}
          metalness={0.85}
          depthWrite={false}
        />
      </mesh>

      {/* Translucent Fastback Rear Window */}
      <mesh position={[0, 1.10, -1.26]} rotation={[0.56, 0, 0]}>
        <boxGeometry args={[1.44, 0.74, 0.03]} />
        <meshStandardMaterial
          color="#1e293b"
          transparent
          opacity={0.32}
          roughness={0.08}
          metalness={0.85}
          depthWrite={false}
        />
      </mesh>

      {/* Translucent Side Windows */}
      {[-0.80, 0.80].map((sx, si) => (
        <mesh key={`sedan-side-win-${si}`} position={[sx, 1.12, -0.18]}>
          <boxGeometry args={[0.02, 0.52, 1.78]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.22}
            roughness={0.08}
            metalness={0.85}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Sculpted Door Handles & Side Mirrors */}
      {[-0.96, 0.96].map((dx, di) =>
        [-0.45, 0.35].map((dz, dzi) => (
          <mesh key={`handle-${di}-${dzi}`} position={[dx, 0.76, dz]}>
            <boxGeometry args={[0.04, 0.05, 0.18]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
          </mesh>
        ))
      )}
      {[-1.00, 1.00].map((mx, mi) => (
        <mesh key={`sedan-mirror-${mi}`} position={[mx, 0.92, 0.58]}>
          <boxGeometry args={[0.20, 0.11, 0.16]} />
          <meshStandardMaterial color={bodySilver} metalness={0.85} roughness={0.18} />
        </mesh>
      ))}

      {/* Red Wrap-Around Taillights */}
      {[-0.78, 0.78].map((tx, ti) => (
        <mesh key={`sedan-tail-${ti}`} position={[tx, 0.76, -2.14]}>
          <boxGeometry args={[0.34, 0.22, 0.16]} />
          <meshBasicMaterial color="#dc2626" />
        </mesh>
      ))}

      {/* 4 Realistic 5-Spoke Alloy Wheels */}
      <RealisticAlloyWheel position={[-0.92, 0.37, 1.32]} isRightSide={false} isFront={true} wheelSpin={wheelSpin} steerAngle={steerAngle} />
      <RealisticAlloyWheel position={[0.92, 0.37, 1.32]} isRightSide={true} isFront={true} wheelSpin={wheelSpin} steerAngle={steerAngle} />
      <RealisticAlloyWheel position={[-0.92, 0.37, -1.32]} isRightSide={false} isFront={false} wheelSpin={wheelSpin} />
      <RealisticAlloyWheel position={[0.92, 0.37, -1.32]} isRightSide={true} isFront={false} wheelSpin={wheelSpin} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2. LIGHT-BLUE FUTURISTIC SUPERCAR (FAITHFUL TO IMG_3481_4a0f563a.jpeg)
// Open-interior cockpit with racing steering wheel, sport seats & glass canopy
// ---------------------------------------------------------------------------
export function LightBlueSupercar({
  wheelSpin = 0,
  steerAngle = 0,
  speedKmh = 0,
  isDriven = false,
}: {
  wheelSpin?: number;
  steerAngle?: number;
  speedKmh?: number;
  isDriven?: boolean;
}) {
  const supercarBlue = '#60a5fa';
  const carbonBlack = '#09090b';

  return (
    <group>
      {/* Ultra-Low Carbon Fiber Aerodynamic Floor Pan & Side Skirts */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.08, 0.16, 4.55]} />
        <meshStandardMaterial color={carbonBlack} roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Front Nose & Plunging Hood */}
      <mesh position={[0, 0.48, 1.42]} castShadow receiveShadow>
        <boxGeometry args={[2.00, 0.34, 1.55]} />
        <meshStandardMaterial color={supercarBlue} metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.56, 1.45]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[1.92, 0.22, 1.55]} />
        <meshStandardMaterial color={supercarBlue} metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Rear Engine Deck & Haunches */}
      <mesh position={[0, 0.54, -1.45]} castShadow receiveShadow>
        <boxGeometry args={[2.04, 0.42, 1.52]} />
        <meshStandardMaterial color={supercarBlue} metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Left & Right Flush Aerodynamic Blue Supercar Doors with Discreet Recessed Trim & Handle */}
      {[-0.92, 0.92].map((dx, di) => (
        <group key={`super-door-${di}`} position={[dx, 0.51, -0.02]}>
          {/* Main Flush Painted Blue Door Panel bridging Front Fender and Rear Quarter */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.42, 1.56]} />
            <meshStandardMaterial color={supercarBlue} metalness={0.85} roughness={0.15} />
          </mesh>
          {/* Upper Sculpted Door Beltline Sill */}
          <mesh position={[0, 0.21, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.14, 0.04, 1.54]} />
            <meshStandardMaterial color={supercarBlue} metalness={0.88} roughness={0.12} />
          </mesh>
          {/* Discreet Horizontal Recessed Carbon Trim Line (Flush & Level) */}
          <mesh position={[di === 0 ? -0.082 : 0.082, -0.02, -0.04]}>
            <boxGeometry args={[0.012, 0.055, 1.18]} />
            <meshStandardMaterial color={carbonBlack} roughness={0.35} metalness={0.7} />
          </mesh>
          {/* Flush Brushed-Metal Door Handle */}
          <mesh position={[di === 0 ? -0.084 : 0.084, 0.12, -0.36]}>
            <boxGeometry args={[0.016, 0.032, 0.18]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
          </mesh>
        </group>
      ))}

      {/* Full 3D Supercar Cockpit Interior (Sport Seats, Carbon Dash, Rotating Volante) */}
      <CarCockpitInterior steerAngle={steerAngle} speedKmh={speedKmh} seatColor="#0f172a" accentColor="#38bdf8" yOffset={-0.02} isDriven={isDriven} />

      {/* Aggressive Front Carbon Splitter & Twin Corner Air Intakes */}
      <mesh position={[0, 0.22, 2.28]}>
        <boxGeometry args={[1.98, 0.08, 0.28]} />
        <meshStandardMaterial color={carbonBlack} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.36, 2.25]}>
        <boxGeometry args={[0.92, 0.22, 0.12]} />
        <meshStandardMaterial color={carbonBlack} roughness={0.5} />
      </mesh>
      {[-0.68, 0.68].map((ix, ii) => (
        <mesh key={`super-intake-${ii}`} position={[ix, 0.38, 2.22]} rotation={[0, ii === 0 ? -0.25 : 0.25, 0]}>
          <boxGeometry args={[0.48, 0.22, 0.14]} />
          <meshStandardMaterial color={carbonBlack} roughness={0.4} />
        </mesh>
      ))}

      {/* Razor-Thin Multi-LED Matrix Headlights */}
      {[-0.66, 0.66].map((lx, li) => (
        <mesh key={`super-hl-${li}`} position={[lx, 0.55, 2.15]} rotation={[0, li === 0 ? -0.25 : 0.25, 0]}>
          <boxGeometry args={[0.46, 0.06, 0.12]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
      ))}

      {/* Solid Painted Roof Canopy, Headers & Carbon Side Rails (Teto Sólido Pintado no Supercar) */}
      {[-0.65, 0.65].map((rx, ri) => (
        <mesh key={`super-roof-rail-${ri}`} position={[rx, 1.32, -0.20]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.07, 1.48]} />
          <meshStandardMaterial color={supercarBlue} metalness={0.85} roughness={0.15} />
        </mesh>
      ))}
      <mesh position={[0, 1.33, -0.20]} castShadow receiveShadow>
        <boxGeometry args={[1.36, 0.075, 1.46]} />
        <meshStandardMaterial color={supercarBlue} metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0, 1.30, 0.48]} rotation={[0.32, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.40, 0.065, 0.22]} />
        <meshStandardMaterial color={supercarBlue} metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0, 1.30, -0.88]} rotation={[-0.28, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.36, 0.065, 0.22]} />
        <meshStandardMaterial color={supercarBlue} metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0, 1.28, -0.20]}>
        <boxGeometry args={[1.26, 0.02, 1.38]} />
        <meshStandardMaterial color={carbonBlack} roughness={0.8} />
      </mesh>
      {[-0.72, 0.72].map((px, pi) => (
        <mesh key={`super-apillar-${pi}`} position={[px, 1.02, 0.68]} rotation={[-0.68, 0, 0]}>
          <boxGeometry args={[0.07, 0.82, 0.07]} />
          <meshStandardMaterial color={carbonBlack} metalness={0.85} roughness={0.15} />
        </mesh>
      ))}
      <mesh position={[0, 1.02, 0.72]} rotation={[-0.68, 0, 0]}>
        <boxGeometry args={[1.44, 0.82, 0.03]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.26}
          roughness={0.05}
          metalness={0.9}
          depthWrite={false}
        />
      </mesh>
      {/* Translucent Side Canopy Glass */}
      {[-0.74, 0.74].map((sx, si) => (
        <mesh key={`super-side-glass-${si}`} position={[sx, 1.05, -0.15]}>
          <boxGeometry args={[0.02, 0.48, 1.45]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.22}
            roughness={0.06}
            metalness={0.9}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Rear Translucent Canopy Window & Side Flying Buttresses */}
      {[-0.64, 0.64].map((bx, bi) => (
        <mesh key={`super-buttress-${bi}`} position={[bx, 0.96, -1.25]} rotation={[0.52, 0, 0]} castShadow>
          <boxGeometry args={[0.18, 0.82, 0.08]} />
          <meshStandardMaterial color={supercarBlue} metalness={0.85} roughness={0.15} />
        </mesh>
      ))}
      <mesh position={[0, 0.96, -1.25]} rotation={[0.52, 0, 0]}>
        <boxGeometry args={[1.10, 0.80, 0.03]} />
        <meshStandardMaterial
          color="#0f172a"
          transparent
          opacity={0.24}
          metalness={0.85}
          roughness={0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Aerodynamic Stalk Side Mirrors */}
      {[-1.04, 1.04].map((mx, mi) => (
        <mesh key={`super-mirror-${mi}`} position={[mx, 0.82, 0.58]}>
          <boxGeometry args={[0.18, 0.09, 0.15]} />
          <meshStandardMaterial color={supercarBlue} metalness={0.88} roughness={0.14} />
        </mesh>
      ))}

      {/* Rear Diffuser & Continuous Red LED Taillight Strip */}
      <mesh position={[0, 0.62, -2.23]}>
        <boxGeometry args={[1.86, 0.07, 0.06]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 0.28, -2.25]}>
        <boxGeometry args={[1.85, 0.22, 0.12]} />
        <meshStandardMaterial color={carbonBlack} roughness={0.4} />
      </mesh>

      {/* 4 Black Multi-Spoke Performance Wheels */}
      <RealisticAlloyWheel
        position={[-0.98, 0.38, 1.36]}
        isRightSide={false}
        rimColor="#1e293b"
        spokeCount={8}
        scale={1.04}
        isFront={true}
        wheelSpin={wheelSpin}
        steerAngle={steerAngle}
      />
      <RealisticAlloyWheel
        position={[0.98, 0.38, 1.36]}
        isRightSide={true}
        rimColor="#1e293b"
        spokeCount={8}
        scale={1.04}
        isFront={true}
        wheelSpin={wheelSpin}
        steerAngle={steerAngle}
      />
      <RealisticAlloyWheel
        position={[-0.98, 0.38, -1.38]}
        isRightSide={false}
        rimColor="#1e293b"
        spokeCount={8}
        scale={1.06}
        isFront={false}
        wheelSpin={wheelSpin}
      />
      <RealisticAlloyWheel
        position={[0.98, 0.38, -1.38]}
        isRightSide={true}
        rimColor="#1e293b"
        spokeCount={8}
        scale={1.06}
        isFront={false}
        wheelSpin={wheelSpin}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// 3. YELLOW CONVERTIBLE ROADSTER (FAITHFUL TO IMG_3482_1f55e943.jpeg)
// Open-top yellow roadster, tan leather seats, rotating steering wheel & glass
// ---------------------------------------------------------------------------
export function YellowConvertibleRoadster({
  wheelSpin = 0,
  steerAngle = 0,
  speedKmh = 0,
  isDriven = false,
}: {
  wheelSpin?: number;
  steerAngle?: number;
  speedKmh?: number;
  isDriven?: boolean;
}) {
  const roadsterYellow = '#facc15';
  const archDark = '#3f3f46';

  return (
    <group>
      {/* Lower Dark Chassis Sill */}
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.82, 0.20, 4.10]} />
        <meshStandardMaterial color={archDark} roughness={0.75} />
      </mesh>

      {/* Front Hood & Forward Body Section */}
      <mesh position={[0, 0.62, 1.32]} castShadow receiveShadow>
        <boxGeometry args={[1.86, 0.46, 1.60]} />
        <meshStandardMaterial color={roadsterYellow} metalness={0.55} roughness={0.24} />
      </mesh>

      {/* Rear Trunk Deck Section */}
      <mesh position={[0, 0.64, -1.38]} castShadow receiveShadow>
        <boxGeometry args={[1.86, 0.50, 1.40]} />
        <meshStandardMaterial color={roadsterYellow} metalness={0.55} roughness={0.24} />
      </mesh>

      {/* Left & Right Convertible Doors (Open Top) */}
      {[-0.86, 0.86].map((dx, di) => (
        <mesh key={`conv-door-${di}`} position={[dx, 0.60, -0.05]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.46, 1.25]} />
          <meshStandardMaterial color={roadsterYellow} metalness={0.55} roughness={0.24} />
        </mesh>
      ))}

      {/* Full 3D Convertible Cockpit (Warm Tan Leather Seats, Rotating Volante, Dash) */}
      <CarCockpitInterior steerAngle={steerAngle} speedKmh={speedKmh} seatColor="#b45309" accentColor="#facc15" yOffset={0.02} isDriven={isDriven} />

      {/* Grey Folded Soft-Top Boot Cover Behind Seats */}
      <mesh position={[0, 0.88, -0.78]} castShadow>
        <boxGeometry args={[1.54, 0.22, 0.58]} />
        <meshStandardMaterial color="#52525b" roughness={0.65} />
      </mesh>

      {/* Raked Yellow Windshield Frame & Translucent Glass (Vidro) */}
      <group position={[0, 1.06, 0.56]} rotation={[-0.56, 0, 0]}>
        {[-0.80, 0.80].map((px, pi) => (
          <mesh key={`ws-pillar-${pi}`} position={[px, 0, 0]} castShadow>
            <boxGeometry args={[0.10, 0.68, 0.09]} />
            <meshStandardMaterial color={roadsterYellow} metalness={0.55} roughness={0.24} />
          </mesh>
        ))}
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[1.70, 0.09, 0.09]} />
          <meshStandardMaterial color={roadsterYellow} metalness={0.55} roughness={0.24} />
        </mesh>
        <mesh>
          <boxGeometry args={[1.52, 0.58, 0.03]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.28}
            roughness={0.06}
            metalness={0.88}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Dark Charcoal Wheel Arch Flares around all 4 wheels */}
      {[
        [-0.92, 0.38, 1.24],
        [0.92, 0.38, 1.24],
        [-0.92, 0.38, -1.24],
        [0.92, 0.38, -1.24],
      ].map((pos, idx) => (
        <mesh
          key={`arch-flare-${idx}`}
          position={pos as [number, number, number]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry args={[0.44, 0.065, 10, 18, Math.PI]} />
          <meshStandardMaterial color={archDark} roughness={0.75} />
        </mesh>
      ))}

      {/* Chrome / Silver Front & Rear Bumpers */}
      <mesh position={[0, 0.44, 2.14]} castShadow>
        <boxGeometry args={[1.72, 0.24, 0.16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.44, -2.08]} castShadow>
        <boxGeometry args={[1.72, 0.26, 0.18]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Headlights & Red Oval Corner Lights */}
      {[-0.64, 0.64].map((lx, li) => (
        <group key={`conv-hl-${li}`} position={[lx, 0.68, 2.10]}>
          <mesh>
            <boxGeometry args={[0.30, 0.14, 0.08]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[li === 0 ? -0.18 : 0.18, 0.02, -0.02]}>
            <boxGeometry args={[0.10, 0.08, 0.12]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      ))}
      {[-0.68, 0.68].map((tx, ti) => (
        <mesh key={`conv-tl-${ti}`} position={[tx, 0.68, -2.08]}>
          <boxGeometry args={[0.32, 0.14, 0.08]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      ))}

      {/* 4 Classic 5-Spoke Alloy Wheels */}
      <RealisticAlloyWheel position={[-0.90, 0.37, 1.24]} isRightSide={false} isFront={true} wheelSpin={wheelSpin} steerAngle={steerAngle} />
      <RealisticAlloyWheel position={[0.90, 0.37, 1.24]} isRightSide={true} isFront={true} wheelSpin={wheelSpin} steerAngle={steerAngle} />
      <RealisticAlloyWheel position={[-0.90, 0.37, -1.24]} isRightSide={false} isFront={false} wheelSpin={wheelSpin} />
      <RealisticAlloyWheel position={[0.90, 0.38, -1.24]} isRightSide={true} isFront={false} wheelSpin={wheelSpin} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// 4. DARK METALLIC GREY SUV / CROSSOVER WAGON (FAITHFUL TO IMG_3483_0513253d.jpeg)
// Open-interior SUV cabin with roof rack rails, rotating steering wheel & glass
// ---------------------------------------------------------------------------
export function DarkGreyCrossoverSUV({
  wheelSpin = 0,
  steerAngle = 0,
  speedKmh = 0,
  isDriven = false,
}: {
  wheelSpin?: number;
  steerAngle?: number;
  speedKmh?: number;
  isDriven?: boolean;
}) {
  const charcoalGrey = '#3f3f46';
  const hoodGrey = '#52525b';

  return (
    <group>
      {/* Lower Protective Chassis Skirt */}
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.98, 0.24, 4.52]} />
        <meshStandardMaterial color="#18181b" roughness={0.8} />
      </mesh>

      {/* Contoured Metallic Front Engine Bay & Hood */}
      <mesh position={[0, 0.64, 1.42]} castShadow receiveShadow>
        <boxGeometry args={[1.94, 0.44, 1.52]} />
        <meshStandardMaterial color={charcoalGrey} metalness={0.78} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.80, 1.38]} rotation={[0.12, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.86, 0.24, 1.52]} />
        <meshStandardMaterial color={hoodGrey} metalness={0.80} roughness={0.20} />
      </mesh>

      {/* Rear Cargo Trunk Section */}
      <mesh position={[0, 0.66, -1.50]} castShadow receiveShadow>
        <boxGeometry args={[1.94, 0.48, 1.48]} />
        <meshStandardMaterial color={charcoalGrey} metalness={0.78} roughness={0.22} />
      </mesh>

      {/* Left & Right Lower SUV Doors */}
      {[-0.90, 0.90].map((dx, di) => (
        <mesh key={`suv-door-${di}`} position={[dx, 0.64, -0.05]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.46, 1.65]} />
          <meshStandardMaterial color={charcoalGrey} metalness={0.78} roughness={0.22} />
        </mesh>
      ))}

      {/* Full 3D SUV Cockpit Interior (Seats, Dash, Rotating Volante) */}
      <CarCockpitInterior steerAngle={steerAngle} speedKmh={speedKmh} seatColor="#27272a" accentColor="#10b981" yOffset={0.05} isDriven={isDriven} />

      {/* Diamond-Mesh Front Grille & Swept-Back Bright White Headlights */}
      <mesh position={[0, 0.62, 2.25]}>
        <boxGeometry args={[1.02, 0.24, 0.05]} />
        <meshStandardMaterial color="#18181b" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.62, 2.26]}>
        <boxGeometry args={[0.98, 0.20, 0.04]} />
        <meshStandardMaterial color="#71717a" wireframe />
      </mesh>
      {[-0.72, 0.72].map((lx, li) => (
        <mesh key={`suv-hl-${li}`} position={[lx, 0.72, 2.15]} rotation={[0, li === 0 ? -0.26 : 0.26, 0]}>
          <boxGeometry args={[0.44, 0.18, 0.14]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Solid Metallic Painted SUV Roof, Headers & Side Rails (Teto Sólido Pintado no SUV) */}
      {[-0.73, 0.73].map((rx, ri) => (
        <mesh key={`suv-roof-rail-beam-${ri}`} position={[rx, 1.48, -0.28]} castShadow receiveShadow>
          <boxGeometry args={[0.20, 0.085, 2.24]} />
          <meshStandardMaterial color={charcoalGrey} metalness={0.78} roughness={0.22} />
        </mesh>
      ))}
      <mesh position={[0, 1.49, -0.28]} castShadow receiveShadow>
        <boxGeometry args={[1.54, 0.085, 2.22]} />
        <meshStandardMaterial color={charcoalGrey} metalness={0.78} roughness={0.22} />
      </mesh>
      <mesh position={[0, 1.45, 0.78]} rotation={[0.25, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.56, 0.075, 0.22]} />
        <meshStandardMaterial color={charcoalGrey} metalness={0.78} roughness={0.22} />
      </mesh>
      <mesh position={[0, 1.45, -1.32]} rotation={[-0.25, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.54, 0.075, 0.22]} />
        <meshStandardMaterial color={charcoalGrey} metalness={0.78} roughness={0.22} />
      </mesh>
      <mesh position={[0, 1.44, -0.28]}>
        <boxGeometry args={[1.42, 0.02, 2.12]} />
        <meshStandardMaterial color="#09090b" roughness={0.85} />
      </mesh>
      {[-0.80, 0.80].map((px, pi) => (
        <group key={`suv-pillars-${pi}`}>
          <mesh position={[px, 1.16, 0.84]} rotation={[-0.52, 0, 0]}>
            <boxGeometry args={[0.08, 0.78, 0.08]} />
            <meshStandardMaterial color={charcoalGrey} metalness={0.78} roughness={0.22} />
          </mesh>
          <mesh position={[px, 1.16, -0.15]}>
            <boxGeometry args={[0.07, 0.62, 0.12]} />
            <meshStandardMaterial color="#18181b" />
          </mesh>
          <mesh position={[px, 1.16, -1.35]} rotation={[0.48, 0, 0]}>
            <boxGeometry args={[0.12, 0.78, 0.14]} />
            <meshStandardMaterial color={charcoalGrey} metalness={0.78} roughness={0.22} />
          </mesh>
        </group>
      ))}

      {/* Longitudinal Roof Rack Rails on Top of Roof */}
      {[-0.66, 0.66].map((rx, ri) => (
        <group key={`suv-rail-${ri}`} position={[rx, 1.56, -0.32]}>
          <mesh castShadow>
            <boxGeometry args={[0.05, 0.05, 1.95]} />
            <meshStandardMaterial color="#71717a" metalness={0.9} roughness={0.2} />
          </mesh>
          {[-0.85, 0, 0.85].map((rz, rzi) => (
            <mesh key={`rail-foot-${rzi}`} position={[0, -0.04, rz]}>
              <boxGeometry args={[0.06, 0.06, 0.12]} />
              <meshStandardMaterial color="#18181b" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Translucent Front Windshield (Vidro), Rear Tailgate Glass & Side Windows */}
      <mesh position={[0, 1.16, 0.88]} rotation={[-0.52, 0, 0]}>
        <boxGeometry args={[1.54, 0.78, 0.03]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.26}
          roughness={0.06}
          metalness={0.85}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 1.16, -1.42]} rotation={[0.48, 0, 0]}>
        <boxGeometry args={[1.50, 0.76, 0.03]} />
        <meshStandardMaterial
          color="#18181b"
          transparent
          opacity={0.32}
          roughness={0.08}
          metalness={0.85}
          depthWrite={false}
        />
      </mesh>
      {[-0.82, 0.82].map((sx, si) => (
        <mesh key={`suv-win-${si}`} position={[sx, 1.16, -0.26]}>
          <boxGeometry args={[0.02, 0.56, 2.05]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.22}
            roughness={0.08}
            metalness={0.85}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Chrome Door Handles & Side Mirrors */}
      {[-0.99, 0.99].map((dx, di) =>
        [-0.55, 0.30].map((dz, dzi) => (
          <mesh key={`suv-handle-${di}-${dzi}`} position={[dx, 0.82, dz]}>
            <boxGeometry args={[0.04, 0.05, 0.18]} />
            <meshStandardMaterial color="#a1a1aa" metalness={0.9} roughness={0.2} />
          </mesh>
        ))
      )}
      {[-1.02, 1.02].map((mx, mi) => (
        <mesh key={`suv-mirror-${mi}`} position={[mx, 0.98, 0.62]}>
          <boxGeometry args={[0.20, 0.12, 0.16]} />
          <meshStandardMaterial color={charcoalGrey} metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* Vertical Red Rear Taillights */}
      {[-0.82, 0.82].map((tx, ti) => (
        <mesh key={`suv-tail-${ti}`} position={[tx, 0.88, -2.22]}>
          <boxGeometry args={[0.24, 0.38, 0.12]} />
          <meshBasicMaterial color="#dc2626" />
        </mesh>
      ))}

      {/* 4 Multi-Spoke 10-Spoke Silver Alloy Wheels */}
      <RealisticAlloyWheel
        position={[-0.95, 0.38, 1.35]}
        isRightSide={false}
        spokeCount={10}
        scale={1.04}
        isFront={true}
        wheelSpin={wheelSpin}
        steerAngle={steerAngle}
      />
      <RealisticAlloyWheel
        position={[0.95, 0.38, 1.35]}
        isRightSide={true}
        spokeCount={10}
        scale={1.04}
        isFront={true}
        wheelSpin={wheelSpin}
        steerAngle={steerAngle}
      />
      <RealisticAlloyWheel
        position={[-0.95, 0.38, -1.35]}
        isRightSide={false}
        spokeCount={10}
        scale={1.04}
        isFront={false}
        wheelSpin={wheelSpin}
      />
      <RealisticAlloyWheel
        position={[0.95, 0.38, -1.35]}
        isRightSide={true}
        spokeCount={10}
        scale={1.04}
        isFront={false}
        wheelSpin={wheelSpin}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// INTERACTIVE DRIVEABLE VEHICLE INSTANCE
// Syncs real-time position, yaw rotation, steering angle, wheel spin,
// and renders the seated astronaut holding the steering wheel in 3rd-person!
// ---------------------------------------------------------------------------
function DriveableVehicleInstance({ carId }: { carId: string }) {
  const groupRef = useRef<Group>(null);
  const colliderRbRef = useRef<RapierRigidBody>(null);
  const promptRef = useRef<Group>(null);
  const initialCar = useGameStore.getState().carStates[carId];

  const [wheelAnim, setWheelAnim] = React.useState({ spin: 0, steer: 0, kmh: 0 });
  const lastAnimUpdate = useRef(0);

  React.useEffect(() => {
    carVisualGroups[carId] = groupRef.current;
    return () => {
      delete carVisualGroups[carId];
    };
  }, [carId]);

  useFrame((state) => {
    const store = useGameStore.getState();
    const car = store.carStates[carId];
    if (!car || !groupRef.current) return;

    carVisualGroups[carId] = groupRef.current;
    groupRef.current.position.set(car.x, car.y, car.z);
    groupRef.current.rotation.set(0, car.rot, 0);

    // Sync solid Rapier kinematic collider for parked cars so astronaut & vehicles cannot walk/drive through them!
    if (colliderRbRef.current) {
      if (store.drivingCarId === carId) {
        // Move collider below ground while actively driving this specific vehicle
        colliderRbRef.current.setNextKinematicTranslation({ x: car.x, y: -50, z: car.z });
      } else {
        colliderRbRef.current.setNextKinematicTranslation({ x: car.x, y: car.y, z: car.z });
        _carQuat.setFromEuler(_carEuler.set(0, car.rot, 0));
        colliderRbRef.current.setNextKinematicRotation(_carQuat);
      }
    }

    // Show floating 3D interaction badge when player is near this car and not yet driving
    if (promptRef.current) {
      const isNearThisCar = store.nearCarId === carId && !store.drivingCarId;
      promptRef.current.visible = isNearThisCar;
      if (isNearThisCar) {
        promptRef.current.position.y = 2.25 + Math.sin(state.clock.getElapsedTime() * 4.0) * 0.08;
        promptRef.current.lookAt(state.camera.position);
      }
    }

    // Update wheel spin/steer & dashboard KM/H when actively driving or decelerating
    if (store.drivingCarId === carId || Math.abs(car.speed) > 0.04 || Math.abs(car.steer) > 0.01) {
      const now = state.clock.getElapsedTime();
      if (now - lastAnimUpdate.current > 0.05) {
        lastAnimUpdate.current = now;
        setWheelAnim({
          spin: car.wheelSpin,
          steer: car.steer,
          kmh: Math.abs(Math.round(car.speed * 3.6)),
        });
      }
    }
  });

  const isDriven = useGameStore((s) => s.drivingCarId === carId);

  if (!initialCar) return null;

  return (
    <>
      {/* Solid Kinematic Physics Collider for this Vehicle */}
      <RigidBody
        ref={colliderRbRef}
        type="kinematicPosition"
        colliders={false}
        position={[initialCar.x, initialCar.y, initialCar.z]}
        rotation={[0, initialCar.rot, 0]}
        friction={0.8}
      >
        <CuboidCollider args={[0.96, 0.72, 2.22]} position={[0, 0.74, 0]} />
      </RigidBody>

      <group ref={groupRef} position={[initialCar.x, initialCar.y, initialCar.z]} rotation={[0, initialCar.rot, 0]}>
        {initialCar.type === 'sedan' && (
          <SilverAeroSedan wheelSpin={wheelAnim.spin} steerAngle={wheelAnim.steer} speedKmh={wheelAnim.kmh} isDriven={isDriven} />
        )}
        {initialCar.type === 'supercar' && (
          <LightBlueSupercar wheelSpin={wheelAnim.spin} steerAngle={wheelAnim.steer} speedKmh={wheelAnim.kmh} isDriven={isDriven} />
        )}
        {initialCar.type === 'convertible' && (
          <YellowConvertibleRoadster wheelSpin={wheelAnim.spin} steerAngle={wheelAnim.steer} speedKmh={wheelAnim.kmh} isDriven={isDriven} />
        )}
        {initialCar.type === 'suv' && (
          <DarkGreyCrossoverSUV wheelSpin={wheelAnim.spin} steerAngle={wheelAnim.steer} speedKmh={wheelAnim.kmh} isDriven={isDriven} />
        )}

        {/* Floating 3D Prompt when Astronaut approaches the car (Key R) */}
        <group ref={promptRef} position={[0, 2.25, 0]} visible={false}>
          <mesh>
            <planeGeometry args={[2.9, 0.56]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          <Text position={[0, 0.08, 0.02]} fontSize={0.18} color="#38bdf8" fontWeight="bold" anchorX="center">
            [TECLA R] DIRIGIR VEÍCULO
          </Text>
          <Text position={[0, -0.14, 0.02]} fontSize={0.12} color="#facc15" fontWeight="bold" anchorX="center">
            {initialCar.name.toUpperCase()}
          </Text>
        </group>
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------
// EV CHARGING FAST STATION (WITH SOLID PHYSICS COLLIDER)
// ---------------------------------------------------------------------------
function EVChargingStation({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 1.1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.65, 2.2, 0.45]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 1.85, 0.24]}>
        <planeGeometry args={[0.45, 0.18]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      <mesh position={[0, 1.35, 0.24]}>
        <planeGeometry args={[0.45, 0.55]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      <mesh position={[0.36, 1.1, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// COMPLETE SPACEPORT PAVED ROAD NETWORK
// Connects Main Runway/Crawlerway (Z = -20) ➔ Laboratory West Main Entrance (X = 188, Z = -78)
// ➔ North & East Boulevards ➔ Spaceport Parking Lot (Z = -107 to -163)
// ---------------------------------------------------------------------------
function SpaceportRoadNetwork() {
  return (
    <group>
      {/* 1. WEST MAIN ARTERIAL ROAD (X = 188, Z = -20 to -135, width = 12m, length = 115m) */}
      {/* Branches off the Crawlerway (pista), passes directly in front of the Lab West Main Entrance, and enters the Parking Lot! */}
      <group position={[188, 0, -77.5]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.04, 0]} friction={0.0}>
          <mesh receiveShadow>
            <boxGeometry args={[12, 0.08, 115]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
        </RigidBody>
        {/* Side Curbs (East curb stops before the parking lot entrance curve so turning in is wide and smooth!) */}
        <mesh position={[-6.15, 0.10, 0]} receiveShadow>
          <boxGeometry args={[0.3, 0.14, 115]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
        <mesh position={[6.15, 0.10, 8.5]} receiveShadow>
          <boxGeometry args={[0.3, 0.14, 98]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
        {/* Dashed White Center Lane Dividers */}
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh
            key={`west-dash-${i}`}
            position={[0, 0.09, -52 + i * 8]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.22, 4.2]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        ))}
        {/* Pedestrian Crosswalk Stripes directly in front of the Laboratory West Main Entrance (Z = -78, Local Z = -0.5) */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh
            key={`west-crosswalk-${i}`}
            position={[-4.2 + i * 1.68, 0.095, -0.5]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.75, 4.2]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        ))}
      </group>

      {/* 2. LABORATORY NORTH BOULEVARD (Z = -55.5, X = 182 to 272, width = 11m, length = 90m) */}
      <group position={[227, 0, -55.5]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.04, 0]} friction={0.0}>
          <mesh receiveShadow>
            <boxGeometry args={[90, 0.08, 11]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
        </RigidBody>
        {/* North Curb along Boulevard */}
        <mesh position={[0, 0.10, 5.65]} receiveShadow>
          <boxGeometry args={[90, 0.14, 0.3]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
        {/* Dashed White Center Line */}
        {Array.from({ length: 11 }).map((_, i) => (
          <mesh
            key={`lab-blvd-dash-${i}`}
            position={[-40 + i * 8, 0.09, 0]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          >
            <planeGeometry args={[0.22, 4.2]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        ))}
        {/* Pedestrian Crosswalk Stripes */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh
            key={`crosswalk-${i}`}
            position={[3, 0.095, -4.2 + i * 1.65]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[3.4, 0.7]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        ))}
      </group>

      {/* 3. EAST CONNECTOR ROAD TO PARKING LOT (X = 266.5, Z = -55.5 to -108, width = 11m, length = 53m) */}
      <group position={[266.5, 0, -81.75]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.04, 0]} friction={0.0}>
          <mesh receiveShadow>
            <boxGeometry args={[11, 0.08, 53]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
        </RigidBody>
        {[-5.65, 5.65].map((cx, ci) => (
          <mesh key={`east-road-curb-${ci}`} position={[cx, 0.10, 0]} receiveShadow>
            <boxGeometry args={[0.3, 0.14, 53]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
          </mesh>
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh
            key={`east-dash-${i}`}
            position={[0, 0.09, -20 + i * 8]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.22, 4.2]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        ))}
      </group>

      {/* 4. WIDE WEST PARKING LOT ENTRY CURVE APRON (Z = -120 to -142, X = 182 to 206) */}
      <group position={[194, 0, -131]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.04, 0]} friction={0.0}>
          <mesh receiveShadow>
            <boxGeometry args={[24, 0.08, 22]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
        </RigidBody>
      </group>

      {/* Road Signage & Streetlights along the Laboratory & Parking Lot Route */}
      {[
        [181, -30],
        [181, -55],
        [181, -90],
        [212, -49],
        [248, -49],
        [273, -75],
      ].map(([lx, lz], idx) => (
        <group key={`road-lamp-${idx}`} position={[lx, 0, lz]}>
          <mesh position={[0, 4.2, 0]} castShadow>
            <cylinderGeometry args={[0.10, 0.14, 8.4, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.85} />
          </mesh>
          <mesh position={[0.6, 8.3, 0]}>
            <boxGeometry args={[1.4, 0.14, 0.45]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0.7, 8.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.9, 0.35]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// COMPLETE REALISTIC PARKING LOT COMPLEX & DRIVEABLE VEHICLES
// ---------------------------------------------------------------------------
export function RealisticParkingLot() {
  const carIds = Object.keys(useGameStore.getState().carStates);

  return (
    <group>
      {/* Complete Road Network from Crawlerway (Pista) past Lab Entrance to Parking Lot */}
      <SpaceportRoadNetwork />

      {/* Main Parking Lot Asphalt Complex at [260, 0, -135] */}
      <group position={[260, 0, -135]}>
        {/* Heavy Paved Asphalt Ground Slab */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.05, 0]} friction={0.0}>
          <mesh receiveShadow>
            <boxGeometry args={[116, 0.1, 56]} />
            <meshStandardMaterial color="#1e293b" roughness={0.92} />
          </mesh>
        </RigidBody>

        {/* Painted White Parking Stall Stripes (Row 1: Z = +18 / World -117, Row 2: Z = -18 / World -153) */}
        {Array.from({ length: 11 }).map((_, i) => {
          const x = -43 + i * 10;
          return (
            <group key={`stall-mark-${i}`}>
              <mesh position={[x, 0.11, 18]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[0.2, 7.5]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
              </mesh>
              <mesh position={[x, 0.11, -18]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[0.2, 7.5]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
              </mesh>
            </group>
          );
        })}

        {/* EV Charging Stalls at West End */}
        {[-38, -28].map((evX, i) => (
          <group key={`ev-spot-${i}`}>
            <mesh position={[evX, 0.11, 18]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[8.5, 7.2]} />
              <meshStandardMaterial color="#065f46" roughness={0.8} />
            </mesh>
            <EVChargingStation position={[evX, 0.1, 22.5]} />
          </group>
        ))}

        {/* Central Driving Lane White Directional Arrows */}
        {[-24, 0, 24].map((ax, ai) => (
          <group key={`arrow-${ai}`} position={[ax, 0.11, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
            <mesh>
              <planeGeometry args={[3.2, 0.6]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[2.0, 0, 0]}>
              <coneGeometry args={[1.0, 1.4, 3]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>
        ))}

        {/* High-Mast LED Parking Lot Lampposts */}
        {[-30, 0, 30].map((lx, li) => (
          <group key={`lot-light-${li}`} position={[lx, 0, 0]}>
            <mesh position={[0, 5, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.18, 10, 12]} />
              <meshStandardMaterial color="#334155" metalness={0.9} />
            </mesh>
            {[-1, 1].map((dir, di) => (
              <group key={`lum-${di}`} position={[0, 9.8, dir * 1.2]} rotation={[dir * 0.3, 0, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[0.7, 0.15, 1.2]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
                <mesh position={[0, -0.09, 0]}>
                  <planeGeometry args={[0.6, 1.0]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
            ))}
          </group>
        ))}
      </group>

      {/* Render All 16 Driveable Realistic Cars in World Coordinates */}
      {carIds.map((carId) => (
        <DriveableVehicleInstance key={carId} carId={carId} />
      ))}
    </group>
  );
}
