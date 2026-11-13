import re

with open('src/components/PlanetEnvironment.tsx', 'r') as f:
    content = f.read()

# Earth Ground
content = content.replace(
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[2000, 2000]} />
          <meshStandardMaterial color="#38a169" roughness={1} metalness={0.0} />
        </mesh>
      </RigidBody>''',
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[2000, 10, 2000]} />
          <meshStandardMaterial color="#38a169" roughness={1} metalness={0.0} />
        </mesh>
      </RigidBody>''')

# Earth Crawlerway
content = content.replace(
'''      {/* Crawlerway */}
      <group position={[120, 0.1, 0]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
            <planeGeometry args={[200, 35]} />
            <meshStandardMaterial color="#4a5568" />
          </mesh>
        </RigidBody>''',
'''      {/* Crawlerway */}
      <group position={[120, 0, 0]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.1, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[200, 0.2, 35]} />
            <meshStandardMaterial color="#4a5568" />
          </mesh>
        </RigidBody>''')

# Earth Asphalt
content = content.replace(
'''      {/* Asphalt Roads and Parking Lot */}
      <RigidBody type="fixed" colliders="cuboid" position={[30, 0.1, -40]}>
        <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 40]} />
          <meshStandardMaterial color="#2d3748" roughness={0.9} />
        </mesh>
      </RigidBody>''',
'''      {/* Asphalt Roads and Parking Lot */}
      <RigidBody type="fixed" colliders="cuboid" position={[30, 0.1, -40]}>
        <mesh receiveShadow>
          <boxGeometry args={[100, 0.2, 40]} />
          <meshStandardMaterial color="#2d3748" roughness={0.9} />
        </mesh>
      </RigidBody>''')

# Mars
content = content.replace(
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000, 64, 64]} />
          <meshStandardMaterial color="#c53030" roughness={0.9} />
        </mesh>
      </RigidBody>''',
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1000, 10, 1000]} />
          <meshStandardMaterial color="#c53030" roughness={0.9} />
        </mesh>
      </RigidBody>''')

# Ice
content = content.replace(
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.1} metalness={0.2} />
        </mesh>
      </RigidBody>''',
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1000, 10, 1000]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.1} metalness={0.2} />
        </mesh>
      </RigidBody>''')

# Lava
content = content.replace(
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#1a202c" roughness={0.9} />
        </mesh>
      </RigidBody>''',
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1000, 10, 1000]} />
          <meshStandardMaterial color="#1a202c" roughness={0.9} />
        </mesh>
      </RigidBody>''')

# Crystal
content = content.replace(
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#276749" roughness={0.5} />
        </mesh>
      </RigidBody>''',
'''      <RigidBody type="fixed" colliders="cuboid" position={[0, -5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1000, 10, 1000]} />
          <meshStandardMaterial color="#276749" roughness={0.5} />
        </mesh>
      </RigidBody>''')


with open('src/components/PlanetEnvironment.tsx', 'w') as f:
    f.write(content)
