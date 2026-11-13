import re

with open('src/components/Player.tsx', 'r') as f:
    content = f.read()

new_return = """  return (
    <>
      <OrbitControls ref={controlsRef} makeDefault enablePan={false} minDistance={2} maxDistance={20} maxPolarAngle={Math.PI / 2 - 0.1} />
      <RigidBody ref={rb} type="dynamic" colliders={false} enabledRotations={[false, false, false]} mass={80} position={[0, 10, 0]}>
        <CapsuleCollider args={[0.5, 0.4]} position={[0, -0.55, 0]} friction={0} />
        
        <group ref={group}>
        {cameraMode === 'third' && (
          <group ref={bodyRef}>
            <primitive object={astronautScene} scale={0.5} position={[0, -1.0, 0]} />
            <pointLight position={[0, 1.0, 0.2]} intensity={1} distance={15} color="#ffffff" />
            <spotLight position={[0, 1.0, 0.2]} angle={0.6} penumbra={0.5} intensity={3} distance={30} castShadow target-position={[0, 0, 10]} />
          </group>
        )}
        </group>
      </RigidBody>
    </>
  );"""

pattern = re.compile(r'  return \(\n    <>\n.*?  \);\n', re.DOTALL)
content = pattern.sub(new_return + '\n', content)

with open('src/components/Player.tsx', 'w') as f:
    f.write(content)
