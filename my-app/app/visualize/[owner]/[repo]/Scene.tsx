"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { buildHierarchy, generateCityLayout } from "@/app/utils/processData";
import type { FileNode } from "@/app/utils/processData";

type Props = {
  owner: string;
  repo: string;
};

type GitHubTreeItem = {
  path: string;
  type: "blob" | "tree";
  size?: number;
};

type GitHubTreeResponse = GitHubTreeItem[] | { tree: GitHubTreeItem[] };

function extractFlatFiles(payload: GitHubTreeResponse): GitHubTreeItem[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.tree)) return payload.tree;
  return [];
}

function getFileColor(filename: string) {
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "#3178c6"; // TypeScript Blue
  if (filename.endsWith(".js")) return "#f7df1e"; // JS Yellow
  if (filename.endsWith(".css")) return "#264de4"; // CSS Blue
  if (filename.endsWith(".json")) return "#ff0000"; // JSON Red
  return "#888888"; // Grey default
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-3 w-3 rounded-sm border border-white/30"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export default function VisualizerScene({ owner, repo }: Props) {
  const [buildings, setBuildings] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const label = useMemo(() => `${owner}/${repo}`, [owner, repo]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/github/tree?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to fetch tree (${res.status})`);
        }

        const payload = (await res.json()) as GitHubTreeResponse;
        const flatFiles = extractFlatFiles(payload);

        if (flatFiles.length === 0) {
          throw new Error("GitHub tree payload was not an array (expected [] or { tree: [] }).");
        }

        const hierarchy: FileNode = buildHierarchy(flatFiles);
        const nextBuildings = generateCityLayout(hierarchy);

        if (!cancelled) setBuildings(nextBuildings);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [owner, repo]);

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [12, 12, 12], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {buildings.map((b) => (
          <mesh key={b.path} position={[b.x ?? 0, (b.y ?? 1) / 2, b.z ?? 0]}>
            <boxGeometry args={[b.width ?? 1, b.y ?? 1, b.depth ?? 1]} />
            <meshStandardMaterial color={getFileColor(b.name)} />
          </mesh>
        ))}

        <OrbitControls />
      </Canvas>

      {/* Repo + stats */}
      <div className="absolute bottom-4 right-4 bg-black/60 p-3 text-white rounded">
        <div className="font-semibold">{label}</div>
        <div className="text-sm">
          {loading ? "Loading repo tree…" : error ? `Error: ${error}` : `Buildings: ${buildings.length}`}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/60 p-3 text-white rounded w-56">
        <div className="font-semibold mb-2">Legend</div>
        <div className="space-y-1">
          <LegendItem color="#3178c6" label="TypeScript (.ts / .tsx)" />
          <LegendItem color="#f7df1e" label="JavaScript (.js)" />
          <LegendItem color="#264de4" label="CSS (.css)" />
          <LegendItem color="#ff0000" label="JSON (.json)" />
          <LegendItem color="#888888" label="Other file types" />
        </div>
        <div className="mt-2 text-xs text-white/80">
          Height ≈ file size (scaled)
        </div>
      </div>
    </div>
  );
}