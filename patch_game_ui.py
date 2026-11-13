import re

with open('src/components/Game.tsx', 'r') as f:
    content = f.read()

# Add a panel for Exoplanet Data
exoplanet_ui = """
        {/* Exoplanet Data */}
        {currentPlanet.type === 'exoplanet' && showSettings && (
          <div className="flex flex-col gap-2 w-72 bg-blue-900/40 p-4 rounded-xl backdrop-blur-md border border-blue-400/30 pointer-events-auto mt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-300 border-b border-blue-400/30 pb-1 mb-1">NASA Exoplanet Archive</h3>
            <div className="text-xs text-blue-100 flex justify-between">
               <span>Distância:</span> <span>{currentPlanet.distance ? currentPlanet.distance.toFixed(1) + ' parsecs' : 'Desconhecida'}</span>
            </div>
            <div className="text-xs text-blue-100 flex justify-between">
               <span>Massa (Terra=1):</span> <span>{currentPlanet.mass ? currentPlanet.mass.toFixed(2) : 'Estimada'}</span>
            </div>
            <div className="text-xs text-blue-100 flex justify-between">
               <span>Raio (Terra=1):</span> <span>{currentPlanet.radius ? currentPlanet.radius.toFixed(2) : 'Estimado'}</span>
            </div>
            <div className="text-xs text-blue-100 flex justify-between">
               <span>Descoberta:</span> <span>{currentPlanet.discoveryYear || 'N/A'} ({currentPlanet.discoveryMethod})</span>
            </div>
            <div className="text-xs text-blue-100 flex justify-between">
               <span>Temp. Equilíbrio:</span> <span>{currentPlanet.temperature ? currentPlanet.temperature.toFixed(0) + ' K' : 'Desconhecida'}</span>
            </div>
            <a href="https://exoplanetarchive.ipac.caltech.edu/" target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 text-center hover:underline mt-2">
               Dados fornecidos por NASA Caltech
            </a>
          </div>
        )}
"""

content = content.replace("{/* Vitals */}", exoplanet_ui + "\n        {/* Vitals */}")

with open('src/components/Game.tsx', 'w') as f:
    f.write(content)
