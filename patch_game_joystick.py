import re

with open('src/components/Game.tsx', 'r') as f:
    content = f.read()

# Remove useState for joystick
content = re.sub(r'const \[joystick, setJoystick\] = useState\(\{ x: 0, y: 0 \}\);\n', '', content)

# Replace <Player joystick={joystick} ... /> with <Player onAction={...} />
content = re.sub(r'<Player joystick=\{joystick\} (.*?)\/>', r'<Player \1/>', content)

# The Joystick component will use the store directly
content = content.replace('<Joystick onChange={setJoystick} />', '<Joystick />')

with open('src/components/Game.tsx', 'w') as f:
    f.write(content)
