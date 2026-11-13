import re

with open('src/components/Joystick.tsx', 'r') as f:
    content = f.read()

content = content.replace("interface JoystickProps {\n  onChange: (pos: { x: number; y: number }) => void;\n}\n\n", "")
content = content.replace("export function Joystick({ onChange }: JoystickProps) {", "import { useGameStore } from '../store';\n\nexport function Joystick() {\n  const setGlobalJoystick = useGameStore(state => state.setJoystick);")

content = content.replace("onChange({", "setGlobalJoystick({")
content = content.replace("onChange({ x: 0, y: 0 });", "setGlobalJoystick({ x: 0, y: 0 });")

content = content.replace("}, [active, onChange]);", "}, [active, setGlobalJoystick]);")

with open('src/components/Joystick.tsx', 'w') as f:
    f.write(content)
