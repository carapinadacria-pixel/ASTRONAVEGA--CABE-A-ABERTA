import re

with open('src/components/Rocket.tsx', 'r') as f:
    rocket_content = f.read()

# Add import
rocket_content = rocket_content.replace("import { AngolaFlag, AngolaFlagDecal } from './AngolaFlag';", "import { AngolaFlag, AngolaFlagDecal } from './AngolaFlag';\nimport { RocketModel } from './RocketModel';")

# Replace inside rocketRef
pattern = re.compile(r'          \{/\* Engine Bells \*/\}.*?          \{/\* Fins \*/\}.*?\)\)}', re.DOTALL)
rocket_content = pattern.sub('<RocketModel isFlying={false} />', rocket_content)

with open('src/components/Rocket.tsx', 'w') as f:
    f.write(rocket_content)


with open('src/components/SpaceScene.tsx', 'r') as f:
    space_content = f.read()

space_content = space_content.replace("import { Vector3, Group } from 'three';", "import { Vector3, Group } from 'three';\nimport { RocketModel } from './RocketModel';")

pattern2 = re.compile(r'        \{/\* Simple proxy rocket for space view \*/\}.*?          </mesh>\n        \)\}', re.DOTALL)

replacement = """        <group rotation={[Math.PI / 2, Math.PI, 0]} scale={0.5}>
          <RocketModel isFlying={speed > 5} />
        </group>"""

space_content = pattern2.sub(replacement, space_content)

with open('src/components/SpaceScene.tsx', 'w') as f:
    f.write(space_content)
