import re

with open('src/components/Player.tsx', 'r') as f:
    content = f.read()

# Fix Raycast
content = content.replace(
'''    const ray = new rapier.Ray({ x: playerPos.x, y: playerPos.y - 1.40, z: playerPos.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRayAndGetNormal(ray, 0.6, true);''',
'''    // Origin just slightly above the bottom of the capsule
    const ray = new rapier.Ray({ x: playerPos.x, y: playerPos.y - 0.8, z: playerPos.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRayAndGetNormal(ray, 0.4, true);''')

# Fix Jump velocity
content = content.replace(
'''    if (jump && isGrounded) {
      jumpVelocity = 5;
    }''',
'''    if (jump && isGrounded) {
      jumpVelocity = 10;
    }''')

with open('src/components/Player.tsx', 'w') as f:
    f.write(content)
