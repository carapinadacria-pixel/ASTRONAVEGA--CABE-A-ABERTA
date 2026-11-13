import re

with open('src/store.ts', 'r') as f:
    content = f.read()

fallback_data = """
      let data;
      try {
        const query = "select pl_name,pl_rade,pl_bmasse,sy_dist,st_teff,discoverymethod,disc_year,pl_eqt from ps where default_flag=1 and pl_name in ('TRAPPIST-1 d','TRAPPIST-1 e','TRAPPIST-1 f','Kepler-186 f','Proxima Cen b','K2-18 b','Kepler-452 b','Kepler-22 b','LHS 1140 b','WASP-12 b')&format=json";
        const url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" + encodeURIComponent(query).replace(/%20/g, '+');
        // Try with corsproxy to avoid CORS issues
        const response = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
        if (!response.ok) throw new Error("Fetch failed");
        data = await response.json();
      } catch (err) {
        console.warn("Failed to fetch from NASA via proxy, using fallback static data.", err);
        // Fallback static dataset in case of CORS or network error
        data = [
          {"pl_name": "TRAPPIST-1 d","pl_rade": 0.788,"pl_bmasse": 0.388,"sy_dist": 12.1,"st_teff": 2566,"discoverymethod": "Transit","disc_year": 2016},
          {"pl_name": "TRAPPIST-1 e","pl_rade": 0.920,"pl_bmasse": 0.692,"sy_dist": 12.1,"st_teff": 2566,"discoverymethod": "Transit","disc_year": 2017},
          {"pl_name": "TRAPPIST-1 f","pl_rade": 1.045,"pl_bmasse": 1.039,"sy_dist": 12.1,"st_teff": 2566,"discoverymethod": "Transit","disc_year": 2017},
          {"pl_name": "K2-18 b","pl_rade": 2.370,"pl_bmasse": 8.920,"sy_dist": 38.0,"st_teff": 3457,"discoverymethod": "Transit","disc_year": 2015},
          {"pl_name": "LHS 1140 b","pl_rade": 1.730,"pl_bmasse": 5.600,"sy_dist": 14.9,"st_teff": 3096,"discoverymethod": "Transit","disc_year": 2017},
          {"pl_name": "WASP-12 b","pl_rade": 22.0,"pl_bmasse": 450,"sy_dist": 427.2,"st_teff": 6265,"discoverymethod": "Transit","disc_year": 2008},
          {"pl_name": "Kepler-186 f","pl_rade": 1.170,"pl_bmasse": null,"sy_dist": 177.5,"st_teff": 3755,"discoverymethod": "Transit","disc_year": 2014},
          {"pl_name": "Proxima Cen b","pl_rade": null,"pl_bmasse": 1.055,"sy_dist": 1.3,"st_teff": 2900,"discoverymethod": "Radial Velocity","disc_year": 2016},
          {"pl_name": "Kepler-452 b","pl_rade": 1.630,"pl_bmasse": null,"sy_dist": 551.7,"st_teff": 5757,"discoverymethod": "Transit","disc_year": 2015},
          {"pl_name": "Kepler-22 b","pl_rade": 2.100,"pl_bmasse": 9.100,"sy_dist": 194.6,"st_teff": 5596,"discoverymethod": "Transit","disc_year": 2011}
        ];
      }
"""

original = """      const query = "select pl_name,pl_rade,pl_bmasse,sy_dist,st_teff,discoverymethod,disc_year,pl_eqt from ps where default_flag=1 and pl_name in ('TRAPPIST-1 d','TRAPPIST-1 e','TRAPPIST-1 f','Kepler-186 f','Proxima Cen b','K2-18 b','Kepler-452 b','Kepler-22 b','LHS 1140 b','WASP-12 b')&format=json";
      const response = await fetch("https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" + encodeURIComponent(query).replace(/%20/g, '+'));
      if (!response.ok) return;
      const data = await response.json();"""

content = content.replace(original, fallback_data.strip())

with open('src/store.ts', 'w') as f:
    f.write(content)
