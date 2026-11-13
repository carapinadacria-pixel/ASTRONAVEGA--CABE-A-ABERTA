import re

with open('src/components/Rocket.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { Group } from 'three';", "import { Group, Vector3 } from 'three';")

new_logic = '''
  const changePlanet = useGameStore((state) => state.changePlanet);
  const setLaunching = useGameStore((state) => state.setLaunching);
  const isLaunching = useGameStore((state) => state.isLaunching);
  const rocketRef = useRef<Group>(null);
  
  useFrame((state, delta) => {
    if (rocketRef.current) {
      if (isLaunching) {
        // Accelerate upwards
        rocketRef.current.position.y += delta * 150; // fast takeoff
        
        // Lock camera to rocket
        const rocketWorldPos = new Vector3();
        rocketRef.current.getWorldPosition(rocketWorldPos);
        state.camera.position.lerp(new Vector3(rocketWorldPos.x, rocketWorldPos.y + 10, rocketWorldPos.z + 40), 0.1);
        state.camera.lookAt(rocketWorldPos);

        if (rocketRef.current.position.y > 600) {
          changePlanet(); // Go to space
        }
      } else {
        // Gentle floating/hover effect for the rocket
        rocketRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  const handleLaunch = () => {
    setLaunching(true);
  };
'''

content = re.sub(r'  const changePlanet.*?  const handleLaunch = \(\) => \{\n    setIsTakingOff\(true\);\n  \};', new_logic.strip(), content, flags=re.DOTALL)
content = content.replace("isFlying={isTakingOff}", "isFlying={isLaunching}")

with open('src/components/Rocket.tsx', 'w') as f:
    f.write(content)
