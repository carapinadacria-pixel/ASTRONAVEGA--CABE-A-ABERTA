import re

with open('src/store.ts', 'r') as f:
    content = f.read()

content = content.replace(
'''  setLaunching: (val: boolean) => void;
}''',
'''  setLaunching: (val: boolean) => void;
  joystick: { x: number; y: number };
  setJoystick: (pos: { x: number; y: number }) => void;
}''')

content = content.replace(
'''  isLaunching: false,
  setLaunching: (val) => set({ isLaunching: val }),''',
'''  isLaunching: false,
  setLaunching: (val) => set({ isLaunching: val }),
  joystick: { x: 0, y: 0 },
  setJoystick: (pos) => set({ joystick: pos }),''')

with open('src/store.ts', 'w') as f:
    f.write(content)
