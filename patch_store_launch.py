import re

with open('src/store.ts', 'r') as f:
    content = f.read()

content = content.replace("scene: 'surface' | 'space';", "scene: 'surface' | 'space';\n  isLaunching: boolean;\n  setLaunching: (val: boolean) => void;")
content = content.replace("scene: 'surface',", "scene: 'surface',\n  isLaunching: false,")
content = content.replace("export const useGameStore = create<GameState>((set, get) => ({", "export const useGameStore = create<GameState>((set, get) => ({\n  setLaunching: (val) => set({ isLaunching: val }),")
content = content.replace("return { scene: 'space' };", "return { scene: 'space', isLaunching: false };")

with open('src/store.ts', 'w') as f:
    f.write(content)
