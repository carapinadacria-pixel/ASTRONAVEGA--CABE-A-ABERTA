import re

with open('src/components/SpaceScene.tsx', 'r') as f:
    content = f.read()

flight_old = '''    // Flight controls - Z points backwards, so negative Z is forward
    if (forward) rocketRef.current.rotateX(-delta * 1.5); // Nose down
    if (backward) rocketRef.current.rotateX(delta * 1.5); // Nose up
    
    // Roll (Z axis)
    if (left) rocketRef.current.rotateZ(delta * 2); // Roll left (counter-clockwise)
    if (right) rocketRef.current.rotateZ(-delta * 2); // Roll right
    
    // Yaw (Y axis)
    if (left) rocketRef.current.rotateY(delta * 1.0); // Yaw left
    if (right) rocketRef.current.rotateY(-delta * 1.0); // Yaw right'''

flight_new = '''    // Casual Flight controls - W goes up, S goes down
    if (forward) rocketRef.current.rotateX(delta * 1.5); // Nose up
    if (backward) rocketRef.current.rotateX(-delta * 1.5); // Nose down
    
    // Roll (Z axis) for visual flair
    if (left) rocketRef.current.rotateZ(delta * 1.5); // Roll left
    if (right) rocketRef.current.rotateZ(-delta * 1.5); // Roll right
    
    // Yaw (Y axis) for actual steering
    if (left) rocketRef.current.rotateY(delta * 1.5); // Yaw left
    if (right) rocketRef.current.rotateY(-delta * 1.5); // Yaw right'''

content = content.replace(flight_old, flight_new)

with open('src/components/SpaceScene.tsx', 'w') as f:
    f.write(content)
