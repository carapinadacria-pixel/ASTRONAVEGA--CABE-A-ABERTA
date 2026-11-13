import re

with open('src/components/Player.tsx', 'r') as f:
    content = f.read()

content = content.replace(
'''    const ray = new rapier.Ray({ x: playerPos.x, y: playerPos.y - 0.8, z: playerPos.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRayAndGetNormal(ray, 0.4, true);''',
'''    // Origin just slightly above the bottom of the capsule to prevent hitting self
    const ray = new rapier.Ray({ x: playerPos.x, y: playerPos.y - 0.91, z: playerPos.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRayAndGetNormal(ray, 0.2, true);''')

with open('src/components/Player.tsx', 'w') as f:
    f.write(content)
