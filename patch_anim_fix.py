import re

with open('src/components/Player.tsx', 'r') as f:
    content = f.read()

# Fix bodyRef offset
old_anim = '''      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(walkTime.current) * 0.05 - 0.9;
        bodyRef.current.rotation.x = Math.min(horizontalSpeed * 0.05, 0.2);
      }
    } else {
      walkTime.current = 0;
      if (bodyRef.current) {
         bodyRef.current.position.y = -0.9;
         bodyRef.current.rotation.x = 0;
      }
    }'''

new_anim = '''      if (bodyRef.current) {
        bodyRef.current.position.y = Math.abs(Math.sin(walkTime.current)) * 0.1;
        bodyRef.current.rotation.z = Math.sin(walkTime.current) * 0.15;
        bodyRef.current.rotation.x = Math.min(horizontalSpeed * 0.05, 0.2);
      }
    } else {
      walkTime.current = 0;
      if (bodyRef.current) {
         bodyRef.current.position.y = 0;
         bodyRef.current.rotation.z = 0;
         bodyRef.current.rotation.x = 0;
      }
    }'''

content = content.replace(old_anim, new_anim)

with open('src/components/Player.tsx', 'w') as f:
    f.write(content)
