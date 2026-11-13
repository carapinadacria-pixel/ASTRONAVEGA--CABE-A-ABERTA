import re

with open('src/store.ts', 'r') as f:
    content = f.read()

# Update PlanetInfo interface
content = content.replace(
'''  distance?: number;
  mass?: number;
}''',
'''  distance?: number;
  mass?: number;
  radius?: number;
  discoveryMethod?: string;
  discoveryYear?: number;
  temperature?: number;
}''')

# Update loadExoplanets logic
new_load_logic = '''
    try {
      const query = "select pl_name,pl_rade,pl_bmasse,sy_dist,st_teff,discoverymethod,disc_year,pl_eqt from ps where default_flag=1 and pl_name in ('TRAPPIST-1 d','TRAPPIST-1 e','TRAPPIST-1 f','Kepler-186 f','Proxima Cen b','K2-18 b','Kepler-452 b','Kepler-22 b','LHS 1140 b','WASP-12 b')&format=json";
      const response = await fetch("https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" + encodeURIComponent(query).replace(/%20/g, '+'));
      if (!response.ok) return;
      const data = await response.json();
      
      const newPlanets: PlanetInfo[] = [];
      const colors = ['#2b6cb0', '#805ad5', '#c53030', '#d69e2e', '#38a169', '#319795', '#d53f8c', '#e53e3e', '#718096', '#ecc94b'];
      
      for(let i = 0; i < data.length; i++) {
        const item = data[i];
        const radius = item.pl_rade || 1;
        const mass = item.pl_bmasse || (radius * radius * radius); // rough estimate if missing
        const gravity = Math.max(1, Math.min(25, 9.8 * (mass / (radius * radius))));
        
        newPlanets.push({
          id: `exo_${i}`,
          name: item.pl_name,
          gravity: parseFloat(gravity.toFixed(2)),
          type: 'exoplanet',
          color: colors[i % colors.length],
          distance: item.sy_dist,
          mass: item.pl_bmasse,
          radius: item.pl_rade,
          discoveryMethod: item.discoverymethod,
          discoveryYear: item.disc_year,
          temperature: item.pl_eqt || (item.st_teff ? item.st_teff * 0.1 : null) // rough estimate if pl_eqt missing
        });
      }
      
      const existingIds = new Set(PLANETS.map(p => p.name));
      const additions = newPlanets.filter(p => !existingIds.has(p.name));
      if (additions.length > 0) {
        PLANETS.push(...additions);
      }
    } catch (e) {
      console.error("Failed to load NASA exoplanets", e);
    }'''

pattern = re.compile(r'    try \{\n      // Using NASA.*?    \} catch \(e\) \{\n      console\.error\("Failed to load NASA exoplanets", e\);\n    \}', re.DOTALL)
content = pattern.sub(new_load_logic.strip(), content)

with open('src/store.ts', 'w') as f:
    f.write(content)
