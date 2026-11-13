import re

with open('src/components/Game.tsx', 'r') as f:
    content = f.read()

# I want to add some UI hint when in space
hud_addition = """
        {scene === 'space' && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 p-4 rounded-xl border border-blue-500/30 backdrop-blur text-center pointer-events-none">
            <h2 className="text-xl font-bold text-blue-400 mb-1">CONTROLE DE VOO</h2>
            <p className="text-sm">Use <strong>W, A, S, D</strong> para rotacionar a nave.</p>
            <p className="text-sm">Segure <strong>ESPAÇO</strong> para acelerar os propulsores.</p>
            <p className="text-xs text-gray-400 mt-2">Voe até a órbita de um planeta para pousar.</p>
          </div>
        )}
"""

# Let's insert it before the closing </div> of the main container
content = content.replace("      {/* Settings Menu */}", hud_addition + "\n      {/* Settings Menu */}")

with open('src/components/Game.tsx', 'w') as f:
    f.write(content)
