import re

with open('src/components/PlanetEnvironment.tsx', 'r') as f:
    content = f.read()

# Add import for RigidBody
if 'import { RigidBody }' not in content:
    content = content.replace("import { Plane, Sphere, Cylinder, Text, useTexture } from '@react-three/drei';", 
                              "import { Plane, Sphere, Cylinder, Text, useTexture } from '@react-three/drei';\nimport { RigidBody } from '@react-three/rapier';")

# Find the ground meshes and wrap them in RigidBody
# Earth
content = content.replace(
'''      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#38a169" roughness={1} metalness={0.0} />
      </mesh>''',
'''      {/* Ground Plane */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[2000, 2000]} />
          <meshStandardMaterial color="#38a169" roughness={1} metalness={0.0} />
        </mesh>
      </RigidBody>''')

content = content.replace(
'''      {/* Crawlerway */}
      <group position={[120, 0.1, 0]}>
        <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 35]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>''',
'''      {/* Crawlerway */}
      <group position={[120, 0.1, 0]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
            <planeGeometry args={[200, 35]} />
            <meshStandardMaterial color="#4a5568" />
          </mesh>
        </RigidBody>''')

content = content.replace(
'''      {/* Asphalt Roads and Parking Lot */}
      <mesh position={[30, 0.1, -40]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 40]} />
        <meshStandardMaterial color="#2d3748" roughness={0.9} />
      </mesh>''',
'''      {/* Asphalt Roads and Parking Lot */}
      <RigidBody type="fixed" colliders="cuboid" position={[30, 0.1, -40]}>
        <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 40]} />
          <meshStandardMaterial color="#2d3748" roughness={0.9} />
        </mesh>
      </RigidBody>''')

# Mars
content = content.replace(
'''      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000, 64, 64]} />
        <meshStandardMaterial color="#c53030" roughness={0.9} />
      </mesh>''',
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000, 64, 64]} />
          <meshStandardMaterial color="#c53030" roughness={0.9} />
        </mesh>
      </RigidBody>''')

# Ice
content = content.replace(
'''      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.1} metalness={0.2} />
      </mesh>''',
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.1} metalness={0.2} />
        </mesh>
      </RigidBody>''')

# Lava
content = content.replace(
'''      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#1a202c" roughness={0.9} />
      </mesh>''',
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#1a202c" roughness={0.9} />
        </mesh>
      </RigidBody>''')

# Crystal
content = content.replace(
'''      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#276749" roughness={0.5} />
      </mesh>''',
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#276749" roughness={0.5} />
        </mesh>
      </RigidBody>''')


with open('src/components/PlanetEnvironment.tsx', 'w') as f:
    f.write(content)
