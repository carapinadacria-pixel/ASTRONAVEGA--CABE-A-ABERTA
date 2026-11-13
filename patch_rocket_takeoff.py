import re

with open('src/components/Rocket.tsx', 'r') as f:
    content = f.read()

content = content.replace("import React, { useRef } from 'react';", "import React, { useRef, useState } from 'react';")

new_logic = '''
  const changePlanet = useGameStore((state) => state.changePlanet);
  const rocketRef = useRef<Group>(null);
  const [isTakingOff, setIsTakingOff] = useState(false);
  
  useFrame((state, delta) => {
    if (rocketRef.current) {
      if (isTakingOff) {
        // Accelerate upwards
        rocketRef.current.position.y += delta * 150; // fast takeoff
        if (rocketRef.current.position.y > 400) {
          changePlanet(); // Go to space
        }
      } else {
        // Gentle floating/hover effect for the rocket
        rocketRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  const handleLaunch = () => {
    setIsTakingOff(true);
  };
'''

content = re.sub(r'  const changePlanet.*?\}\);', new_logic.strip(), content, flags=re.DOTALL)

content = content.replace("onClick={changePlanet}", "onClick={handleLaunch}")
content = content.replace("<RocketModel isFlying={false} />", "<RocketModel isFlying={isTakingOff} />")

with open('src/components/Rocket.tsx', 'w') as f:
    f.write(content)
