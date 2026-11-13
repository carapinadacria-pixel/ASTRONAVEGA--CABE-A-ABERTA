import re

with open('src/components/Player.tsx', 'r') as f:
    content = f.read()

# Fix scale and collider size for more realism
# CapsuleCollider args={[radius, halfHeight]}. Old: [0.5, 0.4] -> height 1.8, but wide. Let's make it args={[0.3, 0.6]} -> height 1.8, thinner.
# And position needs adjustment. If halfHeight is 0.6 and radius 0.3, center is at 0. So position [0,0,0] means bottom is at -0.9.
# The visual model will be placed at -0.9. Let's adjust.

content = content.replace('<CapsuleCollider args={[0.5, 0.4]} position={[0, -0.55, 0]} friction={0} />', 
                          '<CapsuleCollider args={[0.3, 0.6]} position={[0, 0, 0]} friction={0} />')

content = content.replace('<primitive object={astronautScene} scale={0.5} position={[0, -1.0, 0]} />',
                          '<primitive object={astronautScene} scale={0.9} position={[0, -0.9, 0]} />')

# Increase movement realistic parameters (gravity is handled by Physics world, but here we cap max speed and friction)
content = content.replace('const acceleration = 40;', 'const acceleration = 25;')
content = content.replace('const maxSpeed = 8;', 'const maxSpeed = 5;') # Human walking/jogging speed
content = content.replace('const friction = 10;', 'const friction = 8;')
content = content.replace('jumpVelocity = 10;', 'jumpVelocity = 5;') # More realistic jump

with open('src/components/Player.tsx', 'w') as f:
    f.write(content)
