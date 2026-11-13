import re

with open('src/components/SpaceScene.tsx', 'r') as f:
    content = f.read()

stars_old = '<Stars radius={300} depth={100} count={10000} factor={7} saturation={0} fade speed={1} />'
stars_new = '<Stars radius={2000} depth={1000} count={30000} factor={6} saturation={0} fade speed={0.5} />'
content = content.replace(stars_old, stars_new)

# Make planets massive and further apart
content = content.replace("pos: new Vector3(0, 0, 150)", "pos: new Vector3(0, 0, 500)")
content = content.replace("const distance = 400 + Math.random() * 800;", "const distance = 2000 + Math.random() * 3000;")
content = content.replace("<Sphere args={[20, 64, 64]}>", "<Sphere args={[100, 64, 64]}>")
content = content.replace("<ringGeometry args={[25, 45, 64]} />", "<ringGeometry args={[130, 220, 64]} />")
content = content.replace("position={[0, 35, 0]} fontSize={5}", "position={[0, 130, 0]} fontSize={15}")
content = content.replace("position={[0, 42, 0]} fontSize={3}", "position={[0, 160, 0]} fontSize={10}")

content = content.replace("<Sphere args={[60, 64, 64]}>", "<Sphere args={[300, 64, 64]}>")
content = content.replace("position={[0, 70, 0]} fontSize={8}", "position={[0, 350, 0]} fontSize={20}")
content = content.replace("distance={2000}", "distance={10000}")

# Asteroids belt: make it larger
content = content.replace("const distance = 100 + Math.random() * 800;", "const distance = 800 + Math.random() * 4000;")
content = content.replace("scale = 1 + Math.random() * 3;", "scale = 5 + Math.random() * 15;")

# Check collision distance! If planet radius is 100, landing distance should be > 100
content = content.replace("if (rocketRef.current.position.distanceTo(p.pos) < 30)", "if (rocketRef.current.position.distanceTo(p.pos) < 130)")


# "A direção de movimentação do foguete no espaço está contraria."
# Reverse the flight logic
flight_old = '''    // Smooth rotation using Quaternions or just simple Euler increments with damping
    if (forward) rocketRef.current.rotateX(delta * 1.5);
    if (backward) rocketRef.current.rotateX(-delta * 1.5);
    if (left) rocketRef.current.rotateZ(delta * 2); // Roll instead of yaw for left/right
    if (right) rocketRef.current.rotateZ(-delta * 2);

    // Add yaw on A/D as well for easier steering
    if (left) rocketRef.current.rotateY(delta * 1.0);
    if (right) rocketRef.current.rotateY(-delta * 1.0);'''

flight_new = '''    // Inverted logic to match expected flight controls
    if (forward) rocketRef.current.rotateX(-delta * 1.5); // Nose down
    if (backward) rocketRef.current.rotateX(delta * 1.5); // Nose up
    if (left) rocketRef.current.rotateZ(-delta * 2); // Roll left
    if (right) rocketRef.current.rotateZ(delta * 2); // Roll right

    // Add yaw on A/D as well for easier steering
    if (left) rocketRef.current.rotateY(delta * 1.0); // Yaw left
    if (right) rocketRef.current.rotateY(-delta * 1.0); // Yaw right'''

content = content.replace(flight_old, flight_new)

with open('src/components/SpaceScene.tsx', 'w') as f:
    f.write(content)
