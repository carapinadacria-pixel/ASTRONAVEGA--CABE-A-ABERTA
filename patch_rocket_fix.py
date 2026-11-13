import re

with open('src/components/Rocket.tsx', 'r') as f:
    content = f.read()

correct_rocket = '''import React, { useRef } from 'react';
import { useGameStore } from '../store';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { RigidBody, CylinderCollider } from '@react-three/rapier';
import { AngolaFlag, AngolaFlagDecal } from './AngolaFlag';
import { RocketModel } from './RocketModel';

export function Rocket() {
  const changePlanet = useGameStore((state) => state.changePlanet);
  const setLaunching = useGameStore((state) => state.setLaunching);
  const isLaunching = useGameStore((state) => state.isLaunching);
  const rocketRef = useRef<Group>(null);
  
  useFrame((state, delta) => {
    if (rocketRef.current) {
      if (isLaunching) {
        // Accelerate upwards
        rocketRef.current.position.y += delta * 150; // fast takeoff
        
        // Lock camera to rocket
        const rocketWorldPos = new Vector3();
        rocketRef.current.getWorldPosition(rocketWorldPos);
        state.camera.position.lerp(new Vector3(rocketWorldPos.x, rocketWorldPos.y + 10, rocketWorldPos.z + 40), 0.1);
        state.camera.lookAt(rocketWorldPos);

        if (rocketRef.current.position.y > 600) {
          changePlanet(); // Go to space
        }
      } else {
        // Gentle floating/hover effect for the rocket
        rocketRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  const handleLaunch = () => {
    setLaunching(true);
  };

  return (
    <RigidBody type="fixed" colliders={false}>
      <CylinderCollider args={[30, 8]} position={[15, 30, -15]} />
      <group position={[15, 0, -15]} onClick={handleLaunch}>
        <group ref={rocketRef} scale={2}>
          {/* Launch Pad Base */}
          <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[6, 6.5, 0.4, 32]} />
            <meshStandardMaterial color="#222222" metalness={0.6} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.5, 0]} receiveShadow castShadow>
             <boxGeometry args={[4, 0.2, 4]} />
             <meshStandardMaterial color="#eb7734" metalness={0.4} roughness={0.6} />
          </mesh>
          <RocketModel isFlying={isLaunching} />
        </group>
      </group>
    </RigidBody>
  );
}
'''

with open('src/components/Rocket.tsx', 'w') as f:
    f.write(correct_rocket)
