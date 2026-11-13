import re

with open('src/components/PlanetEnvironment.tsx', 'r') as f:
    content = f.read()

content = content.replace(
'''      {/* Shuttle Landing Facility (Runway) */}
      <group position={[200, 0.2, 300]}>
        <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
          <planeGeometry args={[600, 40]} />
          <meshStandardMaterial color="#1a202c" />
        </mesh>''',
'''      {/* Shuttle Landing Facility (Runway) */}
      <group position={[200, 0.2, 300]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
            <planeGeometry args={[600, 40]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>
        </RigidBody>''')

content = content.replace(
'''      {/* Large Parking Lot & Ops Buildings */}
      <group position={[260, 0, -120]}>
        <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow position={[0, 0.2, 0]}>
          <planeGeometry args={[120, 60]} />
          <meshStandardMaterial color="#2d3748" />
        </mesh>''',
'''      {/* Large Parking Lot & Ops Buildings */}
      <group position={[260, 0, -120]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow position={[0, 0.2, 0]}>
            <planeGeometry args={[120, 60]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
        </RigidBody>''')

# For gas environment:
content = content.replace(
'''      {/* Floating Platforms instead of ground */}
      {Array.from({ length: 50 }).map((_, i) => (
        <mesh 
          key={`plat-${i}`} 
          position={[(Math.random() - 0.5) * 400, Math.random() * 50 - 25, (Math.random() - 0.5) * 400]}
          castShadow receiveShadow
        >
          <cylinderGeometry args={[15, 10, 4, 8]} />
          <meshStandardMaterial color="#805ad5" roughness={0.7} />
        </mesh>
      ))}''',
'''      {/* Floating Platforms instead of ground */}
      {Array.from({ length: 50 }).map((_, i) => (
        <RigidBody key={`plat-${i}`} type="fixed" colliders="hull" position={[(Math.random() - 0.5) * 400, Math.random() * 50 - 25, (Math.random() - 0.5) * 400]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[15, 10, 4, 8]} />
            <meshStandardMaterial color="#805ad5" roughness={0.7} />
          </mesh>
        </RigidBody>
      ))}''')

with open('src/components/PlanetEnvironment.tsx', 'w') as f:
    f.write(content)
