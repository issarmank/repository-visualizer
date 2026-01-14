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
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "#3178c6";
  if (filename.endsWith(".js")) return "#f7df1e";
  if (filename.endsWith(".css")) return "#264de4";
  if (filename.endsWith(".json")) return "#ff0000";
  return "#888888";
}

export default function VisualizerScene({ owner, repo }: Props) {
  const [buildings, setBuildings] = useState<FileNode[]>([]);
  const [selected, setSelected] = useState<FileNode | null>(null);
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

        const hierarchy = buildHierarchy(flatFiles);
        const nextBuildings = generateCityLayout(hierarchy);

        if (!cancelled) {
          setBuildings(nextBuildings);
          setSelected(null);
        }
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
      <Canvas
        camera={{ position: [12, 12, 12], fov: 50 }}
        onPointerMissed={() => setSelected(null)} // click empty space to clear
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {buildings.map((b) => {
          const h = Math.max(0.2, b.y ?? 1);
          const w = Math.max(0.5, b.width ?? 1);
          const d = Math.max(0.5, b.depth ?? 1);
          const x = b.x ?? 0;
          const z = b.z ?? 0;

          const isSelected = selected?.path === b.path;

          return (
            <mesh
              key={b.path}
              position={[x, h / 2, z]}
              onPointerDown={(e) => {
                e.stopPropagation(); // prevents "missed" from firing
                setSelected(b);
              }}
            >
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color={getFileColor(b.name)} emissive={isSelected ? "#ffffff" : "#000000"} emissiveIntensity={isSelected ? 0.15 : 0} />
            </mesh>
          );
        })}

        <OrbitControls />
      </Canvas>

      {/* Repo + stats */}
      <div className="absolute bottom-4 right-4 bg-black/60 p-3 text-white rounded">
        <div className="font-semibold">{label}</div>
        <div className="text-sm">
          {loading ? "Loading repo tree…" : error ? `Error: ${error}` : `Buildings: ${buildings.length}`}
        </div>
      </div>

      {/* Selected file info */}
      <div className="absolute top-4 right-4 bg-black/60 p-3 text-white rounded w-80">
        <div className="font-semibold">Selection</div>
        {selected ? (
          <div className="mt-2 text-sm space-y-1">
            <div>
              <span className="text-white/70">Name:</span> {selected.name}
            </div>
            <div>
              <span className="text-white/70">Type:</span> {selected.type === "blob" ? "File" : "Folder"}
            </div>
            <div className="break-all">
              <span className="text-white/70">Path:</span> {selected.path}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-white/70">Click a building to see details.</div>
        )}
      </div>
    </div>
  );
}