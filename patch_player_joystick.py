import re

with open('src/components/Player.tsx', 'r') as f:
    content = f.read()

content = content.replace("interface PlayerProps {\n  joystick: { x: number; y: number };\n  onAction: (action: string) => void;", "interface PlayerProps {\n  onAction: (action: string) => void;")
content = content.replace("export function Player({ joystick = { x: 0, y: 0 }, onAction, actionRequested }: PlayerProps) {", "export function Player({ onAction, actionRequested }: PlayerProps) {\n  const joystick = useGameStore((state) => state.joystick);")

# Update animation
old_anim = '''      if (isMoving) {
        // Simple bobbing for walking
        const horizontalSpeed = currentVel.length();
        walkTime.current += delta * horizontalSpeed * 2;
        if (bodyRef.current) {
          bodyRef.current.position.y = Math.sin(walkTime.current) * 0.05 - 0.9;
        }
      } else {
        if (bodyRef.current) {
          bodyRef.current.position.y = -0.9;
        }
      }'''

new_anim = '''      if (isMoving) {
        // Walk animation (waddling and bobbing)
        const horizontalSpeed = currentVel.length();
        walkTime.current += delta * horizontalSpeed * 3;
        if (bodyRef.current) {
          bodyRef.current.position.y = Math.abs(Math.sin(walkTime.current)) * 0.1 - 0.9;
          bodyRef.current.rotation.z = Math.sin(walkTime.current) * 0.15; // Waddle side to side
          bodyRef.current.rotation.x = Math.min(horizontalSpeed * 0.05, 0.2); // Lean forward
        }
      } else {
        if (bodyRef.current) {
          // Reset to idle
          bodyRef.current.position.y = -0.9;
          bodyRef.current.rotation.z = 0;
          bodyRef.current.rotation.x = 0;
        }
      }'''

content = content.replace(old_anim, new_anim)

with open('src/components/Player.tsx', 'w') as f:
    f.write(content)
