'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function VisualizerPage({ params }: { params: { owner: string; repo: string } }) {
  return (
    <div className="h-screen w-full bg-slate-900">
      <div className="absolute top-4 left-4 z-10 text-white">
        <h1 className="text-xl font-bold">Visualizing: {params.owner}/{params.repo}</h1>
        <a href="/repos" className="text-sm text-gray-400 hover:text-white">← Back to Repos</a>
      </div>
      
      <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        {/* This is where your City component will go later */}
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color="orange" />
        </mesh>
        <OrbitControls />
      </Canvas>
    </div>
  );
}