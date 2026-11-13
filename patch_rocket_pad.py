import re

with open('src/components/Rocket.tsx', 'r') as f:
    content = f.read()

old_pad = '''          {/* Launch Pad Base */}
          <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[6, 6.5, 0.4, 32]} />
            <meshStandardMaterial color="#222222" metalness={0.6} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.5, 0]} receiveShadow castShadow>
             <boxGeometry args={[4, 0.2, 4]} />
             <meshStandardMaterial color="#eb7734" metalness={0.4} roughness={0.6} />
          </mesh>'''

new_pad = '''          {/* Improved Launch Pad Base */}
          <group position={[0, 0, 0]}>
            {/* Main Concrete Platform */}
            <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
              <cylinderGeometry args={[8, 9, 0.5, 8]} /> {/* Octagonal base */}
              <meshStandardMaterial color="#333333" metalness={0.2} roughness={0.9} />
            </mesh>
            
            {/* Blast Deflector (Trench Area) */}
            <mesh position={[0, 0.5, 0]} receiveShadow castShadow>
              <boxGeometry args={[6, 0.1, 6]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Warning Stripes Ring */}
            <mesh position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <ringGeometry args={[6, 7.5, 32]} />
              <meshStandardMaterial color="#eb7734" metalness={0.3} roughness={0.8} side={2} />
            </mesh>
            
            {/* Gantry Tower / Umbilical Tower */}
            <group position={[-5, 0, -5]}>
              {/* Main pillar */}
              <mesh position={[0, 15, 0]} castShadow>
                <boxGeometry args={[2, 30, 2]} />
                <meshStandardMaterial color="#550000" metalness={0.6} roughness={0.4} />
              </mesh>
              
              {/* Support arms extending to rocket */}
              <mesh position={[2, 10, 2]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <boxGeometry args={[4, 0.5, 0.5]} />
                <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
              </mesh>
              <mesh position={[2, 20, 2]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <boxGeometry args={[4, 0.5, 0.5]} />
                <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
              </mesh>
              
              {/* Crew access arm (Bridge) */}
              <mesh position={[2.5, 26, 2.5]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <boxGeometry args={[5.5, 1.2, 1.5]} />
                <meshStandardMaterial color="#cccccc" metalness={0.3} roughness={0.7} />
              </mesh>
            </group>
            
            {/* Small light posts */}
            {[-7, 7].map((x, i) => (
              <group key={`light-${i}`} position={[x, 0.5, 6]}>
                <mesh position={[0, 2, 0]} castShadow>
                  <cylinderGeometry args={[0.1, 0.1, 4]} />
                  <meshStandardMaterial color="#222" />
                </mesh>
                <mesh position={[0, 4, 0]}>
                  <sphereGeometry args={[0.3]} />
                  <meshBasicMaterial color="#ffffaa" />
                </mesh>
                <pointLight position={[0, 4, 0]} color="#ffffaa" intensity={2} distance={15} />
              </group>
            ))}
          </group>'''

content = content.replace(old_pad, new_pad)

with open('src/components/Rocket.tsx', 'w') as f:
    f.write(content)
