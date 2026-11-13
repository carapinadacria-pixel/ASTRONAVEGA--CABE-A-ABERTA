import re

with open('src/components/Player.tsx', 'r') as f:
    content = f.read()

old_anim = '''      if (bodyRef.current) {
        bodyRef.current.position.y = Math.abs(Math.sin(walkTime.current)) * 0.1;
        bodyRef.current.rotation.z = Math.sin(walkTime.current) * 0.15;
        bodyRef.current.rotation.x = Math.min(horizontalSpeed * 0.05, 0.2);
      }'''

new_anim = '''      if (bodyRef.current) {
        // Movimento suave de caminhada (sem o salto/bounce)
        bodyRef.current.position.y = Math.sin(walkTime.current * 2) * 0.03;
        bodyRef.current.rotation.z = Math.sin(walkTime.current) * 0.05; // balanço lateral reduzido
        bodyRef.current.rotation.x = Math.min(horizontalSpeed * 0.05, 0.15); // inclinação pra frente
      }'''

content = content.replace(old_anim, new_anim)

with open('src/components/Player.tsx', 'w') as f:
    f.write(content)
