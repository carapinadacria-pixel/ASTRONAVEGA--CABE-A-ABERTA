import re

with open('src/store.ts', 'r') as f:
    content = f.read()

# Add to interface
content = content.replace(
'''  loadExoplanets: () => Promise<void>;
}''',
'''  loadExoplanets: () => Promise<void>;
  joystick: { x: number; y: number };
  setJoystick: (pos: { x: number; y: number }) => void;
}''')

# Add to implementation
content = content.replace(
'''  isLaunching: false,
  resources: {''',
'''  isLaunching: false,
  joystick: { x: 0, y: 0 },
  setJoystick: (pos) => set({ joystick: pos }),
  resources: {''')

with open('src/store.ts', 'w') as f:
    f.write(content)
