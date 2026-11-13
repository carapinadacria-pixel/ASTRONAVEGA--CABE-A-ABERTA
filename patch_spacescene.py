import re

with open('src/components/SpaceScene.tsx', 'r') as f:
    content = f.read()

# Add RingGeometry and InstancedMesh for asteroids
content = content.replace("import { Text, Stars, Sphere, useKeyboardControls } from '@react-three/drei';", "import { Text, Stars, Sphere, Ring, useKeyboardControls, Instances, Instance } from '@react-three/drei';\nimport { MathUtils, InstancedMesh, Object3D } from 'three';")

# Inside SpaceScene, add asteroid logic
asteroid_logic = '''
  // Generate random asteroid positions
  const asteroids = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 500; i++) {
      const distance = 100 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.sin(phi) * Math.sin(theta) * 0.2; // flatten the belt slightly
      const z = distance * Math.cos(phi);
      
      const scale = 1 + Math.random() * 3;
      arr.push({ x, y, z, scale, rx: Math.random() * Math.PI, ry: Math.random() * Math.PI });
    }
    return arr;
  }, []);
  
  const tempObj = useMemo(() => new Object3D(), []);
'''

content = content.replace("const [, getKeys] = useKeyboardControls();", "const [, getKeys] = useKeyboardControls();\n" + asteroid_logic)

# Replace the planets mapping to include Sun and special planet geometry
planets_render = '''      {/* Sun at Center */}
      <group position={[0, 0, 0]}>
        <Sphere args={[60, 64, 64]}>
          <meshBasicMaterial color="#ffcc00" />
        </Sphere>
        <pointLight intensity={3} distance={2000} color="#ffcc00" />
        <Text position={[0, 70, 0]} fontSize={8} color="white" outlineWidth={0.2} outlineColor="black">
          Sol
        </Text>
      </group>

      {/* Asteroid Belt */}
      <Instances limit={500} range={500}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#888888" roughness={0.9} metalness={0.1} />
        {asteroids.map((a, i) => (
          <Instance
            key={i}
            position={[a.x, a.y, a.z]}
            scale={[a.scale, a.scale, a.scale]}
            rotation={[a.rx, a.ry, 0]}
          />
        ))}
      </Instances>

      {/* Planets */}
      {planetPositions.map((p, i) => {
        // Skip sun position overlap by shifting everything away from center
        const isSaturn = p.type === 'saturn';
        return (
          <group key={p.id} position={p.pos}>
            <Sphere args={[20, 64, 64]}>
              <meshStandardMaterial color={p.color || '#fff'} metalness={0.2} roughness={0.8} />
            </Sphere>
            {isSaturn && (
              <mesh rotation={[Math.PI / 2.2, 0, 0]}>
                <ringGeometry args={[25, 45, 64]} />
                <meshStandardMaterial color="#e0c38c" side={2} transparent opacity={0.8} />
              </mesh>
            )}
            <Text position={[0, 35, 0]} fontSize={5} color="white" outlineWidth={0.2} outlineColor="black">
              {p.name}
            </Text>
            {p.type === 'exoplanet' && (
              <Text position={[0, 42, 0]} fontSize={3} color="#00ffcc" outlineWidth={0.1} outlineColor="black">
                Exoplaneta (NASA)
              </Text>
            )}
          </group>
        );
      })}'''

content = re.sub(r'      \{/\* Planets \*/\}.*?      \{/\* Player Rocket \*/\}', planets_render + '\n      {/* Player Rocket */}', content, flags=re.DOTALL)

with open('src/components/SpaceScene.tsx', 'w') as f:
    f.write(content)
