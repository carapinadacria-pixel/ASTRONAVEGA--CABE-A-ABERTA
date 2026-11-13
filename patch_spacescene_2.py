import re

with open('src/components/SpaceScene.tsx', 'r') as f:
    content = f.read()

# Change planet distance logic
old_pos = '''      if (p.type === 'earth') return { ...p, pos: new Vector3(0, 0, 100) };
      const angle = (i / PLANETS.length) * Math.PI * 2;
      const distance = 300 + Math.random() * 500;'''
new_pos = '''      if (p.type === 'earth') return { ...p, pos: new Vector3(0, 0, 150) };
      const angle = (i / PLANETS.length) * Math.PI * 2;
      const distance = 400 + Math.random() * 800;'''

content = content.replace(old_pos, new_pos)

# Also fix Rocket Steering
# I'll use Euler angles and velocity instead of just moving locally Z to make it feel better,
# or simply adjust the current simple flight model to be smoother.
flight_logic_old = '''    // Rotation
    if (forward) rocketRef.current.rotateX(delta * 2);
    if (backward) rocketRef.current.rotateX(-delta * 2);
    if (left) rocketRef.current.rotateY(delta * 2);
    if (right) rocketRef.current.rotateY(-delta * 2);

    // Movement
    rocketRef.current.translateZ(-speed * delta);'''

flight_logic_new = '''    // Smooth rotation using Quaternions or just simple Euler increments with damping
    if (forward) rocketRef.current.rotateX(delta * 1.5);
    if (backward) rocketRef.current.rotateX(-delta * 1.5);
    if (left) rocketRef.current.rotateZ(delta * 2); // Roll instead of yaw for left/right
    if (right) rocketRef.current.rotateZ(-delta * 2);

    // Add yaw on A/D as well for easier steering
    if (left) rocketRef.current.rotateY(delta * 1.0);
    if (right) rocketRef.current.rotateY(-delta * 1.0);

    // Movement
    rocketRef.current.translateZ(-speed * delta);'''

content = content.replace(flight_logic_old, flight_logic_new)

with open('src/components/SpaceScene.tsx', 'w') as f:
    f.write(content)
