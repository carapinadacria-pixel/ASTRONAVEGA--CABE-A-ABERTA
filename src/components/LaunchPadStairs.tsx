import React from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

/**
 * Grand Aerospace Industrial Front Launch Pad Stairs (Pad 39A Main Front Access)
 * Prominently facing the Crawlerway approach direction (East, towards X > 24).
 * Features:
 * - Wide 5.5m industrial stairway connecting ground (Y = 0.05) to launch deck (Y = 5.05)
 * - Heavy galvanized structural steel I-beam stringers and trestle support towers
 * - Non-slip diamond-plate aluminum treads with safety nosing
 * - High-visibility safety-yellow tubular double handrails (#eab308) with kickplates
 * - Intermediate landing platform at Y = 2.55m with concrete support piers
 * - Frictionless Rapier inclined ramp collider for smooth climbing without hitching
 */

export function LaunchPadStairs() {
  const width = 5.5;

  // Geometric coordinates for Front Stairs (Extending from Pad edge X=24.0 down to Ground X=39.0)
  // Flight 1 (Upper flight): Deck (X=24.0, Y=5.05) down to Intermediate Landing (X=31.0, Y=2.55)
  // Landing: (X=31.0 to 33.0, Y=2.55)
  // Flight 2 (Lower flight): Intermediate Landing (X=33.0, Y=2.55) down to Ground (X=40.0, Y=0.05)

  const upperStepCount = 10;
  const lowerStepCount = 10;

  const upperFlight = Array.from({ length: upperStepCount }).map((_, i) => {
    const t = i / (upperStepCount - 1);
    const x = 31.0 + (24.2 - 31.0) * t;
    const y = 2.55 + (5.05 - 2.55) * t;
    return { x, y, index: i };
  });

  const lowerFlight = Array.from({ length: lowerStepCount }).map((_, i) => {
    const t = i / (lowerStepCount - 1);
    const x = 40.0 + (33.0 - 40.0) * t;
    const y = 0.05 + (2.55 - 0.05) * t;
    return { x, y, index: i };
  });

  const slopeAngle = Math.atan2(2.5, 7.0); // ~19.6 degrees gentle comfortable climb

  return (
    <group name="launch-pad-grand-front-stairs">
      {/* ============================================================== */}
      {/* 1. UPPER STAIR FLIGHT (Y: 2.55m -> 5.05m | X: 31.0m -> 24.2m) */}
      {/* ============================================================== */}
      {upperFlight.map((step) => (
        <group key={`upper-step-${step.index}`} position={[step.x, step.y, 0]}>
          {/* Bright Galvanized Steel Diamond-Plate Tread */}
          <mesh receiveShadow>
            <boxGeometry args={[0.95, 0.22, width]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.42} />
          </mesh>
          {/* High-Visibility Safety Yellow Nosing Strip */}
          <mesh position={[0.44, 0.115, 0]}>
            <boxGeometry args={[0.08, 0.03, width]} />
            <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Industrial Galvanized Steel Riser Face */}
          <mesh position={[0.46, -0.06, 0]}>
            <boxGeometry args={[0.04, 0.18, width * 0.99]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.5} />
          </mesh>
          {/* Under-Tread Structural Gusset Bracket */}
          <mesh position={[0, -0.12, 0]}>
            <boxGeometry args={[0.75, 0.04, width * 0.96]} />
            <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Upper Flight Structural Steel Stringers & High-Visibility Yellow Handrails */}
      {[-width / 2 - 0.08, width / 2 + 0.08].map((zOffset, sideIdx) => {
        const midX = (24.2 + 31.0) / 2;
        const midY = (5.05 + 2.55) / 2;
        const len = Math.hypot(31.0 - 24.2, 5.05 - 2.55);

        return (
          <group key={`upper-stringer-${sideIdx}`} position={[midX, midY, zOffset]} rotation={[0, 0, -slopeAngle]}>
            {/* Structural Steel I-Beam Stringer */}
            <mesh receiveShadow>
              <boxGeometry args={[len + 0.35, 0.42, 0.14]} />
              <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.5} />
            </mesh>
            {/* Safety Yellow Toe-Board / Kickplate */}
            <mesh position={[0, 0.28, 0]}>
              <boxGeometry args={[len + 0.25, 0.14, 0.04]} />
              <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.3} />
            </mesh>
            {/* Top Safety Yellow Tubular Handrail */}
            <mesh position={[0, 1.12, 0]}>
              <boxGeometry args={[len + 0.35, 0.08, 0.08]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.25} />
            </mesh>
            {/* Intermediate Safety Yellow Knee-Rail */}
            <mesh position={[0, 0.60, 0]}>
              <boxGeometry args={[len + 0.35, 0.06, 0.06]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.25} />
            </mesh>
            {/* Vertical Stanchion Posts */}
            {Array.from({ length: 6 }).map((_, pIdx) => {
              const postX = (pIdx / 5 - 0.5) * (len * 0.90);
              return (
                <mesh key={`up-post-${pIdx}`} position={[postX, 0.56, 0]}>
                  <cylinderGeometry args={[0.035, 0.035, 1.12, 8]} />
                  <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.25} />
                </mesh>
              );
            })}
            {/* Highly Visible Heavy-Duty Safety Barrier Panel (Smoked ballistic shield with safety yellow frame) */}
            <mesh position={[0, 0.60, 0]}>
              <boxGeometry args={[len + 0.28, 0.92, 0.02]} />
              <meshStandardMaterial
                color="#0f172a"
                roughness={0.2}
                metalness={0.6}
                transparent
                opacity={0.88}
              />
            </mesh>
            {/* Caution Hazard Yellow Warning Trim Along Barrier Center */}
            <mesh position={[0, 0.60, 0.012]}>
              <boxGeometry args={[len + 0.26, 0.08, 0.01]} />
              <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* ============================================================== */}
      {/* 2. INTERMEDIATE REST LANDING (Y: 2.55m | X: 31.0m to 33.0m)    */}
      {/* ============================================================== */}
      <group position={[32.0, 2.55, 0]}>
        {/* Main Landing Structural Deck */}
        <mesh receiveShadow>
          <boxGeometry args={[2.4, 0.22, width + 0.2]} />
          <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Diamond Plate Floor Surface */}
        <mesh position={[0, 0.12, 0]} receiveShadow>
          <boxGeometry args={[2.35, 0.02, width + 0.16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.42} />
        </mesh>
        {/* Heavy Structural Steel Support Columns Anchored to Ground */}
        {[-width / 2, width / 2].map((z, i) => (
          <group key={`landing-leg-${i}`} position={[0, -1.275, z]}>
            <mesh receiveShadow>
              <cylinderGeometry args={[0.16, 0.20, 2.55, 10]} />
              <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.6} />
            </mesh>
            {/* Concrete Footing Pier */}
            <mesh position={[0, -1.15, 0]} receiveShadow>
              <boxGeometry args={[0.8, 0.4, 0.8]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.9} />
            </mesh>
          </group>
        ))}
        {/* Landing Side Safety Yellow Handrails & Visible Safety Barrier Panels */}
        {[-width / 2 - 0.08, width / 2 + 0.08].map((z, i) => (
          <group key={`land-rail-${i}`} position={[0, 0, z]}>
            <mesh position={[0, 1.12, 0]}>
              <boxGeometry args={[2.4, 0.08, 0.08]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.60, 0]}>
              <boxGeometry args={[2.4, 0.06, 0.06]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.25} />
            </mesh>
            {/* Toe-board */}
            <mesh position={[0, 0.28, 0]}>
              <boxGeometry args={[2.4, 0.14, 0.04]} />
              <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.3} />
            </mesh>
            {/* Visible Industrial Landing Safety Barrier Panel */}
            <mesh position={[0, 0.60, 0]}>
              <boxGeometry args={[2.35, 0.92, 0.02]} />
              <meshStandardMaterial
                color="#0f172a"
                roughness={0.2}
                metalness={0.6}
                transparent
                opacity={0.88}
              />
            </mesh>
            {/* Caution Hazard Stripe */}
            <mesh position={[0, 0.60, 0.012]}>
              <boxGeometry args={[2.32, 0.08, 0.01]} />
              <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.3} />
            </mesh>
            {[-1.0, 0, 1.0].map((px, j) => (
              <mesh key={`land-post-${j}`} position={[px, 0.56, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 1.12, 8]} />
                <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.25} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ============================================================== */}
      {/* 3. LOWER STAIR FLIGHT (Y: 0.05m -> 2.55m | X: 40.0m -> 33.0m) */}
      {/* ============================================================== */}
      {lowerFlight.map((step) => (
        <group key={`lower-step-${step.index}`} position={[step.x, step.y, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[0.95, 0.22, width]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.42} />
          </mesh>
          <mesh position={[0.44, 0.115, 0]}>
            <boxGeometry args={[0.08, 0.03, width]} />
            <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0.46, -0.06, 0]}>
            <boxGeometry args={[0.04, 0.18, width * 0.99]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.12, 0]}>
            <boxGeometry args={[0.75, 0.04, width * 0.96]} />
            <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Lower Flight Structural Steel Stringers & High-Visibility Yellow Handrails */}
      {[-width / 2 - 0.08, width / 2 + 0.08].map((zOffset, sideIdx) => {
        const midX = (33.0 + 40.0) / 2;
        const midY = (2.55 + 0.05) / 2;
        const len = Math.hypot(40.0 - 33.0, 2.55 - 0.05);

        return (
          <group key={`lower-stringer-${sideIdx}`} position={[midX, midY, zOffset]} rotation={[0, 0, -slopeAngle]}>
            <mesh receiveShadow>
              <boxGeometry args={[len + 0.35, 0.42, 0.14]} />
              <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <boxGeometry args={[len + 0.25, 0.14, 0.04]} />
              <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.3} />
            </mesh>
            <mesh position={[0, 1.12, 0]}>
              <boxGeometry args={[len + 0.35, 0.08, 0.08]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.60, 0]}>
              <boxGeometry args={[len + 0.35, 0.06, 0.06]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.25} />
            </mesh>
            {Array.from({ length: 6 }).map((_, pIdx) => {
              const postX = (pIdx / 5 - 0.5) * (len * 0.90);
              return (
                <mesh key={`low-post-${pIdx}`} position={[postX, 0.56, 0]}>
                  <cylinderGeometry args={[0.035, 0.035, 1.12, 8]} />
                  <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.25} />
                </mesh>
              );
            })}
            {/* Highly Visible Heavy-Duty Safety Barrier Panel (Lower Flight) */}
            <mesh position={[0, 0.60, 0]}>
              <boxGeometry args={[len + 0.28, 0.92, 0.02]} />
              <meshStandardMaterial
                color="#0f172a"
                roughness={0.2}
                metalness={0.6}
                transparent
                opacity={0.88}
              />
            </mesh>
            {/* Caution Hazard Yellow Warning Trim Along Lower Flight Barrier Center */}
            <mesh position={[0, 0.60, 0.012]}>
              <boxGeometry args={[len + 0.26, 0.08, 0.01]} />
              <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* Ground Base Entry Threshold Ramp */}
      <group position={[40.6, 0.05, 0]}>
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <boxGeometry args={[1.5, 0.04, width + 0.2]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.42} />
        </mesh>
        {/* High-Visibility Safety Yellow Entry Strip */}
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[1.4, 0.01, width + 0.1]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
      </group>

      {/* Top Launch Deck Gateway / Access Threshold (X = 24.0, Y = 5.05) */}
      <group position={[24.0, 5.05, 0]}>
        <mesh position={[0, -0.04, 0]} receiveShadow>
          <boxGeometry args={[1.6, 0.1, width]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.4} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 4. RAPIER PHYSICAL RAMP & SIDE BARRIER COLLIDERS               */}
      {/* ============================================================== */}
      <RigidBody type="fixed" colliders={false} friction={0.0} restitution={0}>
        {/* Upper Stair Flight Slope Ramp - Mathematically leveled flush to deck (Y=5.05) and landing (Y=2.55) */}
        <CuboidCollider
          args={[3.62, 0.06, width / 2]}
          position={[27.6, 3.7437, 0]}
          rotation={[0, 0, -slopeAngle]}
          friction={0.0}
        />
        {/* Intermediate Landing Platform - Exactly flush with deck at Y = 2.55 */}
        <CuboidCollider
          args={[1.1, 0.06, width / 2]}
          position={[32.0, 2.49, 0]}
          friction={0.0}
        />
        {/* Lower Stair Flight Slope Ramp - Leveled flush to landing (Y=2.55) and ground threshold (Y=0.05) */}
        <CuboidCollider
          args={[3.71, 0.06, width / 2]}
          position={[36.5, 1.2435, 0]}
          rotation={[0, 0, -Math.atan2(2.5, 7.0)]}
          friction={0.0}
        />
        {/* Ground Entry Threshold Pad - Seamless ramp from ground level Y=0.0 up to Y=0.05 */}
        <CuboidCollider
          args={[1.2, 0.025, width / 2]}
          position={[40.8, 0.025, 0]}
          friction={0.0}
        />
        {/* Deck Threshold Transition - Exactly flush with deck floor at Y = 5.05 */}
        <CuboidCollider
          args={[1.2, 0.06, width / 2]}
          position={[23.6, 4.99, 0]}
          friction={0.0}
        />

        {/* --- VISIBLE BARRIER MATCHING COLLIDERS (Side Guard Walls - Contained within flights so entry & exit are 100% free) --- */}
        {[-width / 2 - 0.08, width / 2 + 0.08].map((sideZ, sIdx) => (
          <React.Fragment key={`barrier-colliders-${sIdx}`}>
            {/* Upper Flight Side Barrier Collider (Shorter half-length 3.25m so it doesn't cross into the deck) */}
            <CuboidCollider
              args={[3.25, 0.65, 0.08]}
              position={[27.6, 4.40, sideZ]}
              rotation={[0, 0, -slopeAngle]}
              friction={0.0}
            />
            {/* Intermediate Landing Side Barrier Collider */}
            <CuboidCollider
              args={[1.0, 0.65, 0.08]}
              position={[32.0, 3.15, sideZ]}
              friction={0.0}
            />
            {/* Lower Flight Side Barrier Collider (Shorter half-length 3.35m so it doesn't cross into the ground entry) */}
            <CuboidCollider
              args={[3.35, 0.65, 0.08]}
              position={[36.5, 1.90, sideZ]}
              rotation={[0, 0, -Math.atan2(2.5, 7.0)]}
              friction={0.0}
            />
          </React.Fragment>
        ))}
      </RigidBody>
    </group>
  );
}
