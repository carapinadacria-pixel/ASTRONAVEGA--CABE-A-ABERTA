import React, { useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, DoubleSide } from 'three';

// ---------------------------------------------------------------------------
// HIGH-FIDELITY AEROSPACE OPEN STEEL GRATING TEXTURE (GRELHAS VAZADAS)
// Perforated diamond non-slip steel industrial mesh allowing light & view through
// ---------------------------------------------------------------------------
let cachedGratingTexture: CanvasTexture | null = null;

function getGratingTexture(): CanvasTexture | null {
  if (cachedGratingTexture) return cachedGratingTexture;
  if (typeof document === 'undefined') return null;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#334155'; // Dark industrial aerospace steel
    ctx.fillRect(0, 0, size, size);

    // Open diamond perforations
    ctx.fillStyle = '#0f172a';
    for (let y = 0; y < size; y += 16) {
      for (let x = 0; x < size; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 2);
        ctx.lineTo(x + 14, y + 8);
        ctx.lineTo(x + 8, y + 14);
        ctx.lineTo(x + 2, y + 8);
        ctx.closePath();
        ctx.fill();

        // Metallic serrated grip ridges
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }
  }

  cachedGratingTexture = new CanvasTexture(canvas);
  cachedGratingTexture.colorSpace = SRGBColorSpace;
  cachedGratingTexture.wrapS = RepeatWrapping;
  cachedGratingTexture.wrapT = RepeatWrapping;
  cachedGratingTexture.repeat.set(4, 2);
  return cachedGratingTexture;
}

interface StairFlightProps {
  steps?: number;
  stepWidth?: number;
  stepHeight?: number;
  stepDepth?: number;
  position?: [number, number, number];
  rotationY?: number;
}

// Modern Aerospace Open-Grate Stair Flight with Ample Headroom & High-Tech Railings
function ModernStairFlight({
  steps = 16,
  stepWidth = 3.2,
  stepHeight = 0.5,
  stepDepth = 0.90,
  position = [0, 0, 0],
  rotationY = 0,
}: StairFlightProps) {
  const totalHeight = steps * stepHeight;
  const totalLength = steps * stepDepth;
  const slopeAngle = Math.atan2(totalHeight, totalLength);
  const rampLength = Math.hypot(totalHeight, totalLength);

  const gratingMap = useMemo(() => getGratingTexture(), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 
        Precision Continuous Angled Physics Ramp Collider:
        Provides an ultra-smooth uninterrupted sliding incline matching the exact stair angle,
        so the astronaut capsule glides up and down with ZERO stutter, zero bumps, and zero snagging!
      */}
      <RigidBody type="fixed" colliders={false} friction={0.0} restitution={0}>
        {/* Main Angled Incline Collider - Seamless continuous incline meeting landing flush */}
        <CuboidCollider
          position={[0, totalHeight / 2 - 0.05 * Math.cos(slopeAngle), totalLength / 2]}
          rotation={[-slopeAngle, 0, 0]}
          args={[stepWidth / 2 + 0.02, 0.05, rampLength / 2]}
          friction={0.0}
          restitution={0}
        />
        {/* Smooth Bottom Entry Transition Wedge (Floor to Ramp) */}
        <CuboidCollider
          position={[0, 0.015, -0.35]}
          args={[stepWidth / 2 + 0.02, 0.015, 0.55]}
          friction={0.0}
          restitution={0}
        />
        {/* Smooth Top Transition Landing flush with floor */}
        <CuboidCollider
          position={[0, totalHeight - 0.02, totalLength + 0.35]}
          args={[stepWidth / 2 + 0.02, 0.02, 0.55]}
          friction={0.0}
          restitution={0}
        />
        {/* Solid Side Safety Barrier Colliders (Left & Right) */}
        {[-stepWidth / 2 - 0.06, stepWidth / 2 + 0.06].map((sx, si) => (
          <CuboidCollider
            key={`flight-barrier-col-${si}`}
            position={[sx, totalHeight / 2 + 0.65, totalLength / 2]}
            rotation={[-slopeAngle, 0, 0]}
            args={[0.08, 0.70, rampLength / 2 - 0.35]}
            friction={0.0}
            restitution={0}
          />
        ))}
      </RigidBody>

      {/* Structural Sleek C-Channel Steel Stringers (Left & Right) */}
      {[-stepWidth / 2 - 0.06, stepWidth / 2 + 0.06].map((sx, si) => (
        <group
          key={`stringer-${si}`}
          position={[sx, totalHeight / 2 - 0.12, totalLength / 2]}
          rotation={[-slopeAngle, 0, 0]}
        >
          {/* Main Web */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.10, 0.44, rampLength + 0.25]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Top Flange */}
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.16, 0.04, rampLength + 0.25]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Bottom Flange */}
          <mesh position={[0, -0.22, 0]}>
            <boxGeometry args={[0.16, 0.04, rampLength + 0.25]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* Individual Open Steel Grating Treads (Grelhas Vazadas - NO solid riser backing!) */}
      {Array.from({ length: steps }).map((_, step) => {
        const y = step * stepHeight;
        const z = step * stepDepth;
        return (
          <group key={`step-${step}`} position={[0, y, z]}>
            {/* Open Perforated Grating Tread Plate */}
            <mesh position={[0, 0.02, stepDepth / 2]} receiveShadow>
              <boxGeometry args={[stepWidth, 0.04, stepDepth - 0.04]} />
              <meshStandardMaterial
                map={gratingMap || undefined}
                color="#64748b"
                metalness={0.85}
                roughness={0.3}
              />
            </mesh>

            {/* High-Visibility Safety Yellow Front Nosing Bar */}
            <mesh position={[0, 0.045, stepDepth - 0.04]}>
              <boxGeometry args={[stepWidth, 0.018, 0.07]} />
              <meshStandardMaterial color="#eab308" roughness={0.35} metalness={0.2} />
            </mesh>

            {/* High-Tech Cyan Navigation LED Strip on Front Lip */}
            <mesh position={[0, 0.052, stepDepth - 0.015]}>
              <boxGeometry args={[stepWidth - 0.1, 0.008, 0.02]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>
        );
      })}

      {/* Outer Side Safety Handrails (Left & Right) in Vivid Safety Yellow */}
      {[-stepWidth / 2, stepWidth / 2].map((hx, hi) => {
        const postInterval = 3;
        const postCount = Math.floor(steps / postInterval) + 1;
        return (
          <group key={`handrail-${hi}`} position={[hx, 0, 0]}>
            {/* Vertical Stanchion Posts anchored to stringers */}
            {Array.from({ length: postCount }).map((_, p) => {
              const pStep = Math.min(steps - 1, p * postInterval);
              const pz = pStep * stepDepth + stepDepth / 2;
              const py = (pz / totalLength) * totalHeight;
              return (
                <group key={`post-grp-${p}`} position={[0, py, pz]}>
                  {/* Flange Mounting Plate */}
                  <mesh position={[0, 0.02, 0]}>
                    <boxGeometry args={[0.08, 0.03, 0.08]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.9} />
                  </mesh>
                  {/* Stanchion Tube */}
                  <mesh position={[0, 0.55, 0]}>
                    <cylinderGeometry args={[0.028, 0.028, 1.1, 10]} />
                    <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.25} />
                  </mesh>
                </group>
              );
            })}

            {/* Continuous Top Handrail (Y = +1.10m above tread line) - Perfectly parallel to stair slope */}
            <mesh
              position={[0, totalHeight / 2 + 1.10, totalLength / 2]}
              rotation={[-slopeAngle, 0, 0]}
            >
              <boxGeometry args={[0.05, 0.05, rampLength + 0.25]} />
              <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.25} />
            </mesh>

            {/* Continuous Intermediate Knee Rail (Y = +0.55m above tread line) - Perfectly parallel to slope */}
            <mesh
              position={[0, totalHeight / 2 + 0.55, totalLength / 2]}
              rotation={[-slopeAngle, 0, 0]}
            >
              <boxGeometry args={[0.035, 0.035, rampLength + 0.25]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
            </mesh>

            {/* Safety Yellow Kickplate (Toe-board) along stringer */}
            <mesh
              position={[0, totalHeight / 2 + 0.12, totalLength / 2]}
              rotation={[-slopeAngle, 0, 0]}
            >
              <boxGeometry args={[0.015, 0.16, rampLength + 0.25]} />
              <meshStandardMaterial color="#ca8a04" metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Heavy Industrial Platform Railing Component for Landings
interface PlatformRailingProps {
  length: number;
  position?: [number, number, number];
  rotationY?: number;
}

function ModernPlatformRailing({ length, position = [0, 0, 0], rotationY = 0 }: PlatformRailingProps) {
  const postCount = Math.max(2, Math.round(length / 1.8));

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Top Handrail */}
      <mesh position={[0, 1.10, 0]}>
        <boxGeometry args={[length, 0.06, 0.06]} />
        <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Mid Knee Rail */}
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[length, 0.04, 0.04]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Bottom Kickplate / Toe-board */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[length, 0.14, 0.02]} />
        <meshStandardMaterial color="#ca8a04" metalness={0.6} />
      </mesh>

      {/* Vertical Stanchion Posts */}
      {Array.from({ length: postCount }).map((_, i) => {
        const x = -length / 2 + (i / (postCount - 1)) * length;
        return (
          <mesh key={`pl-post-${i}`} position={[x, 0.55, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 1.1, 10]} />
            <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.25} />
          </mesh>
        );
      })}

      {/* Physical Barrier Collider */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          position={[0, 0.55, 0]}
          args={[length / 2, 0.55, 0.08]}
          friction={0.0}
          restitution={0}
        />
      </RigidBody>
    </group>
  );
}

// ---------------------------------------------------------------------------
// MULTI-TIER REALISTIC AEROSPACE GANTRY TOWER
// Connects Ground (Y=0) -> Level 1 (Y=8) -> Level 2 Mission Control (Y=16) ->
// Level 3 High Bay Observation & Gantry (Y=26)
// SPACIOUS LATERAL CLEARANCE & AMPLE HEADROOM (> 3.8m above all steps!)
// ---------------------------------------------------------------------------
export function HangarStairs() {
  const gratingMap = useMemo(() => getGratingTexture(), []);

  return (
    <group position={[-25, 0, -28]}>
      {/* ============================================================== */}
      {/* 1. FLIGHT 1: GROUND (Y = 0) TO INTERMEDIATE LANDING 1 (Y = 8)  */}
      {/* Heading towards +Z along X = 0 (Z = 0.0 to 14.4)               */}
      {/* ============================================================== */}
      <ModernStairFlight
        steps={16}
        stepWidth={3.0}
        stepHeight={0.5}
        stepDepth={0.90}
        position={[0, 0, 0]}
        rotationY={0}
      />

      {/* Landing Platform 1 (Y = 8): Starts at Z = 14.40 (100% flush with top of Flight 1 & start of Flight 2!) */}
      <RigidBody type="fixed" colliders="cuboid" position={[2.8, 7.85, 17.0]} friction={0.0}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[10.0, 0.3, 5.2]} />
          <meshStandardMaterial
            map={gratingMap || undefined}
            color="#334155"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      </RigidBody>

      {/* Landing 1 Perimeter Handrails on South, West and East edges */}
      <group position={[2.8, 8, 17.0]}>
        {/* Outer South Safety Railing */}
        <ModernPlatformRailing length={10.0} position={[0, 0, 2.55]} rotationY={0} />
        {/* West end cap railing */}
        <ModernPlatformRailing length={5.1} position={[-4.95, 0, 0]} rotationY={Math.PI / 2} />
        {/* East end cap railing */}
        <ModernPlatformRailing length={5.1} position={[4.95, 0, 0]} rotationY={Math.PI / 2} />
        <Text position={[-3.2, 1.45, 2.45]} fontSize={0.28} color="#eab308" fontWeight="bold">
          NÍVEL 01 • PLATAFORMA INTERMEDIÁRIA (8m)
        </Text>
      </group>

      {/* ============================================================== */}
      {/* 2. FLIGHT 2: SWITCHBACK FROM LANDING 1 (Y = 8) TO LEVEL 2 (Y = 16) */}
      {/* Heading back towards -Z along middle lane at X = 5.6 (Z = 14.4 to 0.0) */}
      {/* ============================================================== */}
      <ModernStairFlight
        steps={16}
        stepWidth={3.0}
        stepHeight={0.5}
        stepDepth={0.90}
        position={[5.6, 8, 14.4]}
        rotationY={Math.PI}
      />

      {/* Level 2 Landing Platform (Y = 16): Starts at Z = 0.00 (100% flush with top of Flight 2 & start of Flight 3!) */}
      <RigidBody type="fixed" colliders="cuboid" position={[8.4, 15.85, -2.6]} friction={0.0}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[10.5, 0.3, 5.2]} />
          <meshStandardMaterial
            map={gratingMap || undefined}
            color="#334155"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      </RigidBody>

      {/* Level 2 Perimeter Handrails on Outer North, West and East Edges */}
      <group position={[8.4, 16, -2.6]}>
        <ModernPlatformRailing length={10.5} position={[0, 0, -2.55]} rotationY={0} />
        <ModernPlatformRailing length={5.1} position={[-5.20, 0, 0]} rotationY={Math.PI / 2} />
        <ModernPlatformRailing length={5.1} position={[5.20, 0, 0]} rotationY={Math.PI / 2} />
        <Text position={[-3.2, 1.45, -2.45]} fontSize={0.32} color="#38bdf8" fontWeight="bold">
          NÍVEL 02 • PATAMAR DE TRANSIÇÃO (16m)
        </Text>
      </group>

      {/* ============================================================== */}
      {/* 3. FLIGHT 3: LEVEL 2 (Y = 16) TO 3º PISO INVESTIGATION DECK (Y = 24) */}
      {/* Dedicated lane at X = 11.2 heading towards +Z (Z = 0.0 to 14.4) */}
      {/* Connects 100% flush into the Level 3 Investigation & Gantry Deck */}
      {/* ============================================================== */}
      <ModernStairFlight
        steps={16}
        stepWidth={3.0}
        stepHeight={0.5}
        stepDepth={0.90}
        position={[11.2, 16, 0]}
        rotationY={0}
      />
    </group>
  );
}
