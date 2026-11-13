import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { Text } from '@react-three/drei';
import { useGameStore } from '../store';

// ---------------------------------------------------------------------------
// PROCEDURAL HUMAN AEROSPACE TECHNICIAN MODEL
// Complete articulated 3D character with:
// - Safety Hard Hat / Cleanroom Headset
// - High-Vis Fluorescent Safety Vest with Silver Reflective Chevrons
// - Aerospace Technician Jumpsuit (GGPEN / NASA Space Apps Luanda)
// - Articulated Arms, Legs, Torso & Head
// - Interactive Work Props (Diagnostic Tablet, Welding Torch, Tool Carts)
// ---------------------------------------------------------------------------

interface TechnicianProps {
  id: string;
  name: string;
  role: string;
  position: [number, number, number];
  rotationY?: number;
  activity: 'inspecting_tablet' | 'welding_joint' | 'operating_valves' | 'directing_crane' | 'typing_console';
  vestColor?: string; // e.g. '#eab308' (yellow) or '#f97316' (orange)
}

export function Technician({
  name,
  role,
  position,
  rotationY = 0,
  activity,
  vestColor = '#eab308',
}: TechnicianProps) {
  const rootRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftForearmRef = useRef<Group>(null);
  const rightForearmRef = useRef<Group>(null);
  const torsoRef = useRef<Group>(null);
  const propRef = useRef<Group>(null);
  const sparkFlashRef = useRef<Group>(null);

  useFrame((state) => {
    if (!useGameStore.getState().isNearVAB) return;
    const t = state.clock.getElapsedTime();
    // Unique phase offset based on position to avoid synchronized robotic breathing
    const phase = position[0] * 1.3 + position[2] * 2.1;
    const time = t + phase;

    // 1. Natural breathing & torso idle
    if (torsoRef.current) {
      torsoRef.current.position.y = 0.95 + Math.sin(time * 2.2) * 0.015;
    }

    // 2. Head subtle scanning & observation movements
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.8) * 0.18 + Math.cos(time * 0.3) * 0.12;
      headRef.current.rotation.x = Math.sin(time * 1.1) * 0.08 + 0.12; // Looking slightly down at work
    }

    // 3. Activity-specific arm kinematics
    if (activity === 'inspecting_tablet') {
      // Holds diagnostic tablet in left hand, right index finger scrolls/taps screen
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -1.15 + Math.sin(time * 1.4) * 0.04;
        leftArmRef.current.rotation.z = 0.28;
      }
      if (leftForearmRef.current) {
        leftForearmRef.current.rotation.x = -0.75;
      }
      if (rightArmRef.current) {
        const tapCycle = Math.sin(time * 3.2);
        rightArmRef.current.rotation.x = -1.05 + (tapCycle > 0.4 ? 0.08 : 0);
        rightArmRef.current.rotation.z = -0.32;
      }
      if (rightForearmRef.current) {
        rightForearmRef.current.rotation.x = -0.85;
      }
    } else if (activity === 'welding_joint') {
      // Both hands gripping high-precision structural welding torch with subtle vibration
      const weldJitter = (Math.sin(time * 24.0) * 0.015);
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -1.25 + weldJitter;
        leftArmRef.current.rotation.z = 0.35;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -1.22 + weldJitter;
        rightArmRef.current.rotation.z = -0.25;
      }
      if (sparkFlashRef.current) {
        // Intermittent welding arc light flashing
        const isArcActive = Math.sin(time * 1.8) > -0.2 && Math.sin(time * 7.5) > 0;
        sparkFlashRef.current.visible = isArcActive;
      }
    } else if (activity === 'operating_valves') {
      // Turning cryogenic valve wheel: rhythmic circular arm rotation
      const turnCycle = time * 2.2;
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.95 + Math.sin(turnCycle) * 0.22;
        rightArmRef.current.rotation.z = -0.20 + Math.cos(turnCycle) * 0.15;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.75;
        leftArmRef.current.rotation.z = 0.35;
      }
    } else if (activity === 'directing_crane') {
      // High bay operations director: signaling crane operator with arm gestures
      const signalCycle = Math.sin(time * 1.8);
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = -1.45 + signalCycle * 0.35;
        rightArmRef.current.rotation.x = Math.cos(time * 1.8) * 0.25;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.4;
        leftArmRef.current.rotation.z = 0.3;
      }
    } else if (activity === 'typing_console') {
      // Typing rapidly on telemetry console workstation
      const typeL = Math.sin(time * 6.5) * 0.06;
      const typeR = Math.cos(time * 7.2) * 0.06;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.85 + typeL;
        leftArmRef.current.rotation.z = 0.22;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.85 + typeR;
        rightArmRef.current.rotation.z = -0.22;
      }
    }
  });

  return (
    <group ref={rootRef} position={position} rotation={[0, rotationY, 0]}>
      {/* 1. Animated Torso & Chest */}
      <group ref={torsoRef} position={[0, 0.95, 0]}>
        {/* Aerospace technician jumpsuit inner body */}
        <mesh castShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.42, 0.52, 0.24]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>

        {/* High-Visibility Fluorescent Safety Vest */}
        <mesh castShadow position={[0, 0.01, 0]}>
          <boxGeometry args={[0.44, 0.48, 0.26]} />
          <meshStandardMaterial color={vestColor} roughness={0.5} />
        </mesh>

        {/* Silver High-Reflectivity Safety Stripes (Front & Back Chevrons) */}
        <mesh position={[0, 0.12, 0.133]}>
          <planeGeometry args={[0.38, 0.04]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[0, -0.06, 0.133]}>
          <planeGeometry args={[0.38, 0.04]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.12, -0.133]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.38, 0.04]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[0, -0.06, -0.133]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.38, 0.04]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.1} metalness={0.9} />
        </mesh>

        {/* GGPEN / NASA Luanda ID Card Badge on chest */}
        <mesh position={[-0.12, 0.14, 0.134]}>
          <planeGeometry args={[0.07, 0.09]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.5} />
        </mesh>

        {/* Heavy-duty Industrial Tool Belt with Pouches & Radio */}
        <mesh position={[0, -0.24, 0]}>
          <boxGeometry args={[0.46, 0.08, 0.28]} />
          <meshStandardMaterial color="#0f172a" metalness={0.4} />
        </mesh>
        {/* Tool Holster Left */}
        <mesh position={[-0.24, -0.26, 0]}>
          <boxGeometry args={[0.06, 0.12, 0.14]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {/* Walkie-Talkie Radio Right */}
        <mesh position={[0.24, -0.22, 0]}>
          <boxGeometry args={[0.05, 0.14, 0.07]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Radio Antenna */}
        <mesh position={[0.24, -0.12, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.08, 6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>

        {/* 2. Neck & Head with Hard Hat / Cleanroom Cap */}
        <group ref={headRef} position={[0, 0.32, 0]}>
          {/* Neck */}
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.08, 0.09, 0.08, 12]} />
            <meshStandardMaterial color="#d4a373" roughness={0.8} />
          </mesh>

          {/* Head / Face */}
          <mesh castShadow position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.13, 14, 14]} />
            <meshStandardMaterial color="#d4a373" roughness={0.8} />
          </mesh>

          {/* Safety Hard Hat (Aerospace White or Yellow) */}
          <group position={[0, 0.14, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.155, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Hard Hat Protective Brim */}
            <mesh position={[0, -0.01, 0.04]}>
              <cylinderGeometry args={[0.17, 0.17, 0.02, 16]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>
            {/* Hard Hat Front Headlamp */}
            <mesh position={[0, 0.05, 0.15]}>
              <boxGeometry args={[0.06, 0.03, 0.03]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 0.05, 0.166]}>
              <circleGeometry args={[0.02, 10]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>

          {/* Protective Communications Headset with Boom Mic */}
          <mesh position={[-0.14, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 10]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} />
          </mesh>
          <mesh position={[0.14, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 10]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} />
          </mesh>
          {/* Headset Top Band */}
          <mesh position={[0, 0.19, 0]}>
            <torusGeometry args={[0.145, 0.012, 6, 16, Math.PI]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* Boom Microphone */}
          <mesh position={[0.13, 0.03, 0.10]} rotation={[0.3, -0.2, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.11, 6]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>

        {/* 3. Left Arm & Shoulder */}
        <group ref={leftArmRef} position={[-0.26, 0.20, 0]}>
          {/* Shoulder Cap */}
          <mesh castShadow position={[0, -0.04, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Upper Arm */}
          <mesh castShadow position={[0, -0.16, 0]}>
            <cylinderGeometry args={[0.06, 0.055, 0.22, 10]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>

          {/* Left Forearm */}
          <group ref={leftForearmRef} position={[0, -0.28, 0]}>
            <mesh castShadow position={[0, -0.14, 0]}>
              <cylinderGeometry args={[0.052, 0.046, 0.24, 10]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Work Glove */}
            <mesh castShadow position={[0, -0.27, 0]}>
              <boxGeometry args={[0.08, 0.08, 0.05]} />
              <meshStandardMaterial color="#475569" roughness={0.6} />
            </mesh>

            {/* If inspecting tablet: render tablet held in left hand */}
            {activity === 'inspecting_tablet' && (
              <group position={[0.06, -0.28, 0.10]} rotation={[0.4, 0.2, 0]}>
                {/* Ruggedized Aerospace Tablet */}
                <mesh castShadow>
                  <boxGeometry args={[0.26, 0.18, 0.018]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.7} />
                </mesh>
                {/* Glowing Diagnostic Screen */}
                <mesh position={[0, 0, 0.01]}>
                  <planeGeometry args={[0.23, 0.15]} />
                  <meshBasicMaterial color="#38bdf8" />
                </mesh>
              </group>
            )}
          </group>
        </group>

        {/* 4. Right Arm & Shoulder */}
        <group ref={rightArmRef} position={[0.26, 0.20, 0]}>
          {/* Shoulder Cap */}
          <mesh castShadow position={[0, -0.04, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Upper Arm */}
          <mesh castShadow position={[0, -0.16, 0]}>
            <cylinderGeometry args={[0.06, 0.055, 0.22, 10]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>

          {/* Right Forearm */}
          <group ref={rightForearmRef} position={[0, -0.28, 0]}>
            <mesh castShadow position={[0, -0.14, 0]}>
              <cylinderGeometry args={[0.052, 0.046, 0.24, 10]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Work Glove */}
            <mesh castShadow position={[0, -0.27, 0]}>
              <boxGeometry args={[0.08, 0.08, 0.05]} />
              <meshStandardMaterial color="#475569" roughness={0.6} />
            </mesh>

            {/* If welding: render welding torch in right hand */}
            {activity === 'welding_joint' && (
              <group ref={propRef} position={[0, -0.30, 0.08]} rotation={[0.2, 0, 0]}>
                {/* Torch Handle */}
                <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.22, 8]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
                {/* Ceramic Nozzle */}
                <mesh position={[0, 0, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.015, 0.025, 0.05, 8]} />
                  <meshStandardMaterial color="#d97706" />
                </mesh>
                {/* Arc flash at torch tip */}
                <group ref={sparkFlashRef} position={[0, 0, 0.16]}>
                  <mesh>
                    <sphereGeometry args={[0.08, 8, 8]} />
                    <meshBasicMaterial color="#e0f2fe" />
                  </mesh>
                  <pointLight distance={3.5} intensity={4.0} color="#38bdf8" />
                </group>
              </group>
            )}
          </group>
        </group>
      </group>

      {/* 5. Legs & Heavy Duty Safety Boots */}
      {/* Left Leg */}
      <group position={[-0.12, 0.50, 0]}>
        {/* Thigh */}
        <mesh castShadow position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.38, 10]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Shin */}
        <mesh castShadow position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.08, 0.075, 0.36, 10]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Steel-Toe Safety Boot */}
        <mesh castShadow position={[0, -0.44, 0.04]}>
          <boxGeometry args={[0.14, 0.11, 0.25]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        {/* Yellow Safety Sole Accent */}
        <mesh position={[0, -0.49, 0.04]}>
          <boxGeometry args={[0.145, 0.02, 0.255]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.12, 0.50, 0]}>
        {/* Thigh */}
        <mesh castShadow position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.38, 10]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Shin */}
        <mesh castShadow position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.08, 0.075, 0.36, 10]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Steel-Toe Safety Boot */}
        <mesh castShadow position={[0, -0.44, 0.04]}>
          <boxGeometry args={[0.14, 0.11, 0.25]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        {/* Yellow Safety Sole Accent */}
        <mesh position={[0, -0.49, 0.04]}>
          <boxGeometry args={[0.145, 0.02, 0.255]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
      </group>

      {/* 6. Floating Holographic Tech ID Badge */}
      <group position={[0, 1.95, 0]}>
        <Text
          position={[0, 0.14, 0]}
          fontSize={0.16}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {name}
        </Text>
        <Text
          position={[0, 0, 0]}
          fontSize={0.11}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          {role}
        </Text>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// COMPLETE HANGAR CREW & SPECIALIST CORPS
// Deployed strategically across the VAB and Rocket Assembly Bay
// ---------------------------------------------------------------------------
export function HangarTechnicians() {
  return (
    <group name="hangar-technicians-squad">
      {/* 1. Eng. Mateus • Propulsion Specialist inspecting Rocket Engine Nozzles */}
      <Technician
        id="tech-mateus"
        name="Eng. Mateus Silva"
        role="Especialista em Propulsão • GGPEN"
        position={[257.5, 0, 18.5]}
        rotationY={-Math.PI * 0.75}
        activity="inspecting_tablet"
        vestColor="#eab308"
      />

      {/* 2. Eng. Lukoki • Cryogenic Propellant Lead operating manifolds */}
      <Technician
        id="tech-lukoki"
        name="Eng. Lukoki Daniel"
        role="Sistemas Criogénicos LOX/RP-1"
        position={[247.0, 0, 12.0]}
        rotationY={Math.PI * 0.5}
        activity="operating_valves"
        vestColor="#f97316"
      />

      {/* 3. Eng. Teresa • High Bay Assembly Operations Chief on Level 1 Catwalk */}
      <Technician
        id="tech-teresa"
        name="Eng. Teresa Bento"
        role="Chefe de Montagem de Veículos"
        position={[237.2, 8.0, -12.0]}
        rotationY={Math.PI * 0.25}
        activity="directing_crane"
        vestColor="#eab308"
      />

      {/* 4. Eng. Nzinga • Structural Welder on Booster Mount */}
      <Technician
        id="tech-nzinga"
        name="Eng. Nzinga Manuel"
        role="Integração e Soldadura Estrutural"
        position={[252.0, 4.0, 26.0]}
        rotationY={-Math.PI * 0.35}
        activity="welding_joint"
        vestColor="#f97316"
      />

      {/* 5. Eng. Paulo • Telemetry & Diagnostics Operator at Ground Station */}
      <Technician
        id="tech-paulo"
        name="Eng. Paulo Gaspar"
        role="Diagnóstico e Telemetria de Baía"
        position={[242.5, 0, 4.5]}
        rotationY={Math.PI}
        activity="typing_console"
        vestColor="#38bdf8"
      />

      {/* 6. Eng. Aida • Avionics Integration Specialist */}
      <Technician
        id="tech-aida"
        name="Eng. Aida Domingos"
        role="Aviónica e Guiamento • NASA Space Apps"
        position={[263.0, 0, 24.5]}
        rotationY={-Math.PI * 0.85}
        activity="inspecting_tablet"
        vestColor="#eab308"
      />
    </group>
  );
}
