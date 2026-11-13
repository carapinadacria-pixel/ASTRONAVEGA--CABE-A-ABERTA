import re

with open('src/components/PlanetEnvironment.tsx', 'r') as f:
    content = f.read()

# Replace all `<RigidBody type="fixed" colliders="cuboid" position={[0, -5, 0]}>` + boxGeometry with CuboidCollider
def replace_planet(match):
    color_line = match.group(1)
    return f'''      <RigidBody type="fixed" colliders={{false}} position={{[0, -5, 0]}}>
        <CuboidCollider args={{[500, 5, 500]}} />
        <mesh receiveShadow>
          <boxGeometry args={{[1000, 10, 1000]}} />
{color_line}
        </mesh>
      </RigidBody>'''

pattern = re.compile(r'      <RigidBody type="fixed" colliders="cuboid" position=\{\[0, -5, 0\]\}>\n        <mesh receiveShadow>\n          <boxGeometry args=\{\[1000, 10, 1000\]\} />\n(.*?)\n        </mesh>\n      </RigidBody>', re.DOTALL)

content = pattern.sub(replace_planet, content)

with open('src/components/PlanetEnvironment.tsx', 'w') as f:
    f.write(content)
