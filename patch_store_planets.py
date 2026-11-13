import re

with open('src/store.ts', 'r') as f:
    content = f.read()

new_planets = '''export let PLANETS: PlanetInfo[] = [
  { id: 'earth', name: 'Earth', gravity: 9.8, type: 'earth', color: '#1e3820' },
  { id: 'moon', name: 'Moon', gravity: 1.62, type: 'moon', color: '#666666' },
  { id: 'mars', name: 'Mars', gravity: 3.72, type: 'mars', color: '#c1440e' },
  { id: 'venus', name: 'Venus', gravity: 8.87, type: 'venus', color: '#e08d3c' },
  { id: 'titan', name: 'Titan', gravity: 1.35, type: 'titan', color: '#ffcc66' },
  { id: 'saturn', name: 'Saturn', gravity: 10.44, type: 'saturn', color: '#f4d03f' },
  { id: 'neptune', name: 'Neptune', gravity: 11.15, type: 'neptune', color: '#2980b9' }
];'''

content = re.sub(r'export let PLANETS: PlanetInfo\[\] = \[.*?\];', new_planets, content, flags=re.DOTALL)

# Also update type in PlanetInfo
content = content.replace(
    "type: 'earth' | 'moon' | 'mars' | 'venus' | 'titan' | 'exoplanet';",
    "type: 'earth' | 'moon' | 'mars' | 'venus' | 'titan' | 'saturn' | 'neptune' | 'exoplanet';"
)

with open('src/store.ts', 'w') as f:
    f.write(content)
