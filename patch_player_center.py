import re

with open('src/components/Player.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useKeyboardControls, Environment, OrbitControls, useGLTF } from '@react-three/drei';", "import { useKeyboardControls, Environment, OrbitControls, useGLTF, Center } from '@react-three/drei';")

old_mesh = "<primitive object={astronautScene} scale={0.9} position={[0, -0.9, 0]} />"
new_mesh = '''<Center position={[0, -1.0, 0]} bottom>
              <primitive object={astronautScene} scale={1.2} />
            </Center>'''

content = content.replace(old_mesh, new_mesh)

# Update CapsuleCollider
content = content.replace("<CapsuleCollider args={[0.6, 0.3]} position={[0, 0, 0]} friction={0} />", "<CapsuleCollider args={[0.6, 0.4]} position={[0, 0, 0]} friction={0} />")

# Update Raycast
old_ray = '''    // Origin just slightly above the bottom of the capsule to prevent hitting self
    const ray = new rapier.Ray({ x: playerPos.x, y: playerPos.y - 0.91, z: playerPos.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRayAndGetNormal(ray, 0.2, true);'''

new_ray = '''    // Origin 0.1 units above the bottom of the capsule (bottom is at -1.0 with halfHeight 0.6 + radius 0.4)
    const ray = new rapier.Ray({ x: playerPos.x, y: playerPos.y - 0.9 }, { x: 0, y: -1, z: 0 });
    const hit = world.castRayAndGetNormal(ray, 0.25, true);'''

content = content.replace(old_ray, new_ray)

with open('src/components/Player.tsx', 'w') as f:
    f.write(content)
