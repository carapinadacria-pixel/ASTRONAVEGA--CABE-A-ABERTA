import re

with open('src/store.ts', 'r') as f:
    content = f.read()

# Make loadExoplanets trigger a state change so that components re-render when the exoplanets are loaded
content = content.replace(
'''      if (additions.length > 0) {
        PLANETS.push(...additions);
      }''',
'''      if (additions.length > 0) {
        PLANETS.push(...additions);
        // Force a state update to trigger re-renders by incrementing a generic counter or resetting a state variable
        set((state) => ({ planetIndex: state.planetIndex }));
      }''')

with open('src/store.ts', 'w') as f:
    f.write(content)
