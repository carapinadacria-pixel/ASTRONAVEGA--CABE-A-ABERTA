with open('src/components/Player.tsx', 'r') as f:
    content = f.read()

content = content.replace('bodyRef.current.position.y = Math.sin(walkTime.current) * 0.05 - 1.0;',
                          'bodyRef.current.position.y = Math.sin(walkTime.current) * 0.05 - 0.9;')
content = content.replace('bodyRef.current.position.y = -1.0;',
                          'bodyRef.current.position.y = -0.9;')

with open('src/components/Player.tsx', 'w') as f:
    f.write(content)
