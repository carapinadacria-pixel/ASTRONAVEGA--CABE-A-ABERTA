import re

with open('src/components/SpaceScene.tsx', 'r') as f:
    content = f.read()

flight_old = '''    // Inverted logic to match expected flight controls
    if (forward) rocketRef.current.rotateX(-delta * 1.5); // Nose down
    if (backward) rocketRef.current.rotateX(delta * 1.5); // Nose up
    if (left) rocketRef.current.rotateZ(-delta * 2); // Roll left
    if (right) rocketRef.current.rotateZ(delta * 2); // Roll right

    // Add yaw on A/D as well for easier steering
    if (left) rocketRef.current.rotateY(delta * 1.0); // Yaw left
    if (right) rocketRef.current.rotateY(-delta * 1.0); // Yaw right'''

flight_new = '''    // Flight controls - Z points backwards, so negative Z is forward
    if (forward) rocketRef.current.rotateX(-delta * 1.5); // Nose down
    if (backward) rocketRef.current.rotateX(delta * 1.5); // Nose up
    
    // Roll (Z axis)
    if (left) rocketRef.current.rotateZ(delta * 2); // Roll left (counter-clockwise)
    if (right) rocketRef.current.rotateZ(-delta * 2); // Roll right
    
    // Yaw (Y axis)
    if (left) rocketRef.current.rotateY(delta * 1.0); // Yaw left
    if (right) rocketRef.current.rotateY(-delta * 1.0); // Yaw right'''

content = content.replace(flight_old, flight_new)

with open('src/components/SpaceScene.tsx', 'w') as f:
    f.write(content)
