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
  const lower = filename.toLowerCase();
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "#3178c6"; // TypeScript
  if (lower.endsWith(".js") || lower.endsWith(".jsx")) return "#f7df1e"; // JavaScript
  if (lower.endsWith(".css") || lower.endsWith(".scss") || lower.endsWith(".sass") || lower.endsWith(".less"))
    return "#264de4"; // Styles
  if (lower.endsWith(".json")) return "#ff0000"; // JSON
  if (lower.endsWith(".md") || lower.endsWith(".mdx")) return "#6b7280"; // Markdown
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "#e34f26"; // HTML
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "#0ea5e9"; // YAML
  if (lower.endsWith(".py")) return "#3776ab"; // Python
  if (lower.endsWith(".go")) return "#00add8"; // Go
  if (lower.endsWith(".java")) return "#e11d48"; // Java
  if (lower.endsWith(".kt") || lower.endsWith(".kts")) return "#7c3aed"; // Kotlin
  if (lower.endsWith(".c") || lower.endsWith(".h")) return "#a8b9cc"; // C
  if (lower.endsWith(".cpp") || lower.endsWith(".cc") || lower.endsWith(".cxx") || lower.endsWith(".hpp"))
    return "#00599c"; // C++
  if (lower.endsWith(".rs")) return "#dea584"; // Rust
  if (lower.endsWith(".php")) return "#777bb4"; // PHP
  if (lower.endsWith(".rb")) return "#cc342d"; // Ruby
  if (lower.endsWith(".swift")) return "#f05138"; // Swift
  if (lower.endsWith(".sh") || lower.endsWith(".bash") || lower.endsWith(".zsh")) return "#22c55e"; // Shell
  if (lower.endsWith(".dockerfile") || lower === "dockerfile") return "#0db7ed"; // Dockerfile
  if (lower.endsWith(".xml")) return "#f97316"; // XML
  if (lower.endsWith(".sql")) return "#a855f7"; // SQL
  if (lower.endsWith(".toml")) return "#111827"; // TOML
  if (lower.endsWith(".ini") || lower.endsWith(".env")) return "#10b981"; // Config
  return "#888888"; // Other
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
        onPointerMissed={() => setSelected(null)}
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
                e.stopPropagation();
                setSelected(b);
              }}
            >
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial
                color={getFileColor(b.name)}
                emissive={isSelected ? "#ffffff" : "#000000"}
                emissiveIntensity={isSelected ? 0.15 : 0}
              />
            </mesh>
          );
        })}

        <OrbitControls />
      </Canvas>

      {/* Legend (bottom-left) */}
      <div className="absolute bottom-4 left-4 bg-black/60 p-3 text-white rounded w-72 max-h-[50vh] overflow-auto">
        <div className="font-semibold mb-2">Legend</div>
        <div className="space-y-1">
          <LegendItem color="#3178c6" label="TypeScript (.ts, .tsx)" />
          <LegendItem color="#f7df1e" label="JavaScript (.js, .jsx)" />
          <LegendItem color="#264de4" label="Styles (.css, .scss, .sass, .less)" />
          <LegendItem color="#ff0000" label="JSON (.json)" />
          <LegendItem color="#6b7280" label="Markdown (.md, .mdx)" />
          <LegendItem color="#e34f26" label="HTML (.html, .htm)" />
          <LegendItem color="#0ea5e9" label="YAML (.yml, .yaml)" />
          <LegendItem color="#3776ab" label="Python (.py)" />
          <LegendItem color="#00add8" label="Go (.go)" />
          <LegendItem color="#e11d48" label="Java (.java)" />
          <LegendItem color="#7c3aed" label="Kotlin (.kt, .kts)" />
          <LegendItem color="#a8b9cc" label="C (.c, .h)" />
          <LegendItem color="#00599c" label="C++ (.cpp, .hpp, .cc, .cxx)" />
          <LegendItem color="#dea584" label="Rust (.rs)" />
          <LegendItem color="#777bb4" label="PHP (.php)" />
          <LegendItem color="#cc342d" label="Ruby (.rb)" />
          <LegendItem color="#f05138" label="Swift (.swift)" />
          <LegendItem color="#22c55e" label="Shell (.sh, .bash, .zsh)" />
          <LegendItem color="#0db7ed" label="Docker (Dockerfile)" />
          <LegendItem color="#f97316" label="XML (.xml)" />
          <LegendItem color="#a855f7" label="SQL (.sql)" />
          <LegendItem color="#111827" label="TOML (.toml)" />
          <LegendItem color="#10b981" label="Config (.env, .ini)" />
          <LegendItem color="#888888" label="Other" />
        </div>
        <div className="mt-2 text-xs text-white/80">Height ≈ file size (scaled)</div>
      </div>

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