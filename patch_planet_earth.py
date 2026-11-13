import re

with open('src/components/PlanetEnvironment.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { RigidBody } from '@react-three/rapier';", "import { RigidBody, CuboidCollider } from '@react-three/rapier';\nimport { Sky } from '@react-three/drei';")

earth_old = '''      <RigidBody type="fixed" colliders="cuboid" position={[0, -5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[2000, 10, 2000]} />
          <meshStandardMaterial color="#38a169" roughness={1} metalness={0.0} />
        </mesh>
      </RigidBody>'''

earth_new = '''      <Sky distance={45000} sunPosition={[100, 20, 100]} inclination={0} azimuth={0.25} />
      <RigidBody type="fixed" colliders={false} position={[0, -5, 0]}>
        <CuboidCollider args={[1000, 5, 1000]} />
        <mesh receiveShadow>
          <boxGeometry args={[2000, 10, 2000]} />
          <meshStandardMaterial color="#38a169" roughness={1} metalness={0.0} />
        </mesh>
      </RigidBody>'''

content = content.replace(earth_old, earth_new)

with open('src/components/PlanetEnvironment.tsx', 'w') as f:
    f.write(content)
