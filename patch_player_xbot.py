import re

with open('src/components/Player.tsx', 'r') as f:
    content = f.read()

# Add useAnimations
content = content.replace("import { useKeyboardControls, Environment, OrbitControls, useGLTF, Center } from '@react-three/drei';", 
                          "import { useKeyboardControls, Environment, OrbitControls, useGLTF, Center, useAnimations } from '@react-three/drei';")

# Replace astronaut with Xbot
old_load = "const { scene: astronautScene } = useGLTF('https://modelviewer.dev/shared-assets/models/Astronaut.glb');"
new_load = '''const { scene: astronautScene, animations } = useGLTF('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Xbot.glb');
  const { actions } = useAnimations(animations, bodyRef);
  const currentAction = useRef('idle');'''

content = content.replace(old_load, new_load)

# Add animation logic in useFrame
old_anim = '''      // Walk animation
      const horizontalSpeed = currentVel.length();
      walkTime.current += delta * horizontalSpeed * 2;
      
      if (bodyRef.current) {
        // Movimento suave de caminhada (sem o salto/bounce)
        bodyRef.current.position.y = Math.sin(walkTime.current * 2) * 0.03;
        bodyRef.current.rotation.z = Math.sin(walkTime.current) * 0.05; // balanço lateral reduzido
        bodyRef.current.rotation.x = Math.min(horizontalSpeed * 0.05, 0.15); // inclinação pra frente
      }
    } else {
      walkTime.current = 0;
      if (bodyRef.current) {
         bodyRef.current.position.y = 0;
         bodyRef.current.rotation.z = 0;
         bodyRef.current.rotation.x = 0;
      }
    }'''

new_anim = '''      const horizontalSpeed = currentVel.length();
      if (actions) {
        const nextAction = horizontalSpeed > 3.5 ? 'run' : 'walk';
        if (currentAction.current !== nextAction && actions[nextAction]) {
          actions[currentAction.current]?.fadeOut(0.2);
          actions[nextAction].reset().fadeIn(0.2).play();
          currentAction.current = nextAction;
        }
        // Adjust animation speed based on movement
        if (actions[currentAction.current]) {
           actions[currentAction.current].timeScale = Math.max(0.5, horizontalSpeed / (nextAction === 'run' ? 5 : 2.5));
        }
      }
    } else {
      if (actions && currentAction.current !== 'idle' && actions['idle']) {
        actions[currentAction.current]?.fadeOut(0.2);
        actions['idle'].reset().fadeIn(0.2).play();
        currentAction.current = 'idle';
      }
    }'''

content = content.replace(old_anim, new_anim)

# Remove preload Astronaut
content = content.replace("useGLTF.preload('https://modelviewer.dev/shared-assets/models/Astronaut.glb');", "useGLTF.preload('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Xbot.glb');")

# Make sure primitive is inside bodyRef with correct scale for Xbot
old_primitive = '''            <Center position={[0, -1.0, 0]} bottom>
              <primitive object={astronautScene} scale={1.2} />
            </Center>'''

new_primitive = '''            <group position={[0, -1.0, 0]}>
              <primitive object={astronautScene} scale={1.0} />
            </group>'''

content = content.replace(old_primitive, new_primitive)

with open('src/components/Player.tsx', 'w') as f:
    f.write(content)
