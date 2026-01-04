'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

type Props = {
  owner: string;
  repo: string;
};

export default function VisualizerScene({ owner, repo }: Props) {
  return (
    <div className="h-full w-full">
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        {/* Your 3D Content goes here */}
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color="orange" />
        </mesh>
        
        <OrbitControls />
      </Canvas>
      
      {/* Optional: Overlay UI inside the client component if needed */}
      <div className="absolute bottom-4 right-4 bg-black/50 p-2 text-white rounded">
        Rendering: {owner}/{repo}
      </div>
    </div>
  );
}