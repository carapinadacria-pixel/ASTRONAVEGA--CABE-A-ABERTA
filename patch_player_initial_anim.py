import re

with open('src/components/Player.tsx', 'r') as f:
    content = f.read()

# Add useEffect for initial animation
init_anim = '''  useEffect(() => {
    if (actions && actions['idle']) {
      actions['idle'].play();
    }
  }, [actions]);'''

content = content.replace("const walkTime = useRef(0);", init_anim)

with open('src/components/Player.tsx', 'w') as f:
    f.write(content)
