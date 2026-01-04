import VisualizerScene from './Scene';

type Props = {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
};

// This remains an async Server Component
export default async function VisualizerPage({ params }: Props) {
  // 1. Await the params here (Server Side)
  const { owner, repo } = await params;

  return (
    <div className="h-screen w-full bg-slate-900 relative">
      {/* Static UI (SEO friendly, renders instantly) */}
      <div className="absolute top-4 left-4 z-10 text-white pointer-events-none">
        <h1 className="text-xl font-bold">Visualizing: {owner}/{repo}</h1>
        <a href="/repos" className="text-sm text-gray-400 hover:text-white pointer-events-auto">
          ← Back to Repos
        </a>
      </div>

      {/* 2. Pass the awaited data to the Client Component */}
      <VisualizerScene owner={owner} repo={repo} />
    </div>
  );
}