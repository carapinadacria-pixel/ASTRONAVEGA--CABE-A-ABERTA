import re

with open('src/components/Player.tsx', 'r') as f:
    content = f.read()

content = content.replace("const cameraMode = useGameStore((state) => state.cameraMode);", "const cameraMode = useGameStore((state) => state.cameraMode);\n  const isLaunching = useGameStore((state) => state.isLaunching);")

# Disable camera control if launching
content = content.replace(
'''    // Sync visual group and camera
    group.current.position.set(0, 0, 0); // We're inside the RigidBody now, so group is local
    
    // Smooth camera follow
    if (cameraMode === 'first') {''',
'''    // Sync visual group and camera
    group.current.position.set(0, 0, 0); // We're inside the RigidBody now, so group is local
    
    // Smooth camera follow
    if (isLaunching) return; // Let Rocket.tsx handle camera

    if (cameraMode === 'first') {''')

with open('src/components/Player.tsx', 'w') as f:
    f.write(content)
