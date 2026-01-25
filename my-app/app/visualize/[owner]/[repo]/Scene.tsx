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

function getLanguageFromFilename(filename: string): string {
  const lower = filename.toLowerCase();

  // handle special filenames first
  if (lower === "dockerfile" || lower.endsWith(".dockerfile")) return "Docker";
  if (lower === "makefile") return "Make";
  if (lower === "cmakelists.txt") return "CMake";

  const ext = getExtension(lower);

  switch (ext) {
    case "ts":
    case "tsx":
      return "TypeScript";
    case "js":
    case "jsx":
      return "JavaScript";
    case "css":
    case "scss":
    case "sass":
    case "less":
      return "CSS / Styles";
    case "json":
      return "JSON";
    case "md":
    case "mdx":
      return "Markdown";
    case "html":
    case "htm":
      return "HTML";
    case "yml":
    case "yaml":
      return "YAML";
    case "py":
      return "Python";
    case "go":
      return "Go";
    case "java":
      return "Java";
    case "kt":
    case "kts":
      return "Kotlin";
    case "c":
    case "h":
      return "C";
    case "cpp":
    case "cc":
    case "cxx":
    case "hpp":
      return "C++";
    case "rs":
      return "Rust";
    case "php":
      return "PHP";
    case "rb":
      return "Ruby";
    case "swift":
      return "Swift";
    case "sh":
    case "bash":
    case "zsh":
      return "Shell";
    case "xml":
      return "XML";
    case "sql":
      return "SQL";
    case "toml":
      return "TOML";
    case "env":
    case "ini":
      return "Config";
    default:
      return "Unknown";
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0 || idx === name.length - 1) return "(none)";
  return name.slice(idx + 1).toLowerCase();
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

      {/* Repo + stats */}
      <div className="absolute bottom-4 right-4 bg-black/60 p-3 text-white rounded">
        <div className="font-semibold">{label}</div>
        <div className="text-sm">
          {loading ? "Loading repo tree…" : error ? `Error: ${error}` : `Buildings: ${buildings.length}`}
        </div>
      </div>

      {/* Clicked file details (replaces legend) */}
      <div className="absolute bottom-4 left-4 bg-black/60 p-3 text-white rounded w-80">
        <div className="flex items-center justify-between">
          <div className="font-semibold">File details</div>
          {selected ? (
            <button
              className="text-xs text-white/80 hover:text-white underline"
              onClick={() => setSelected(null)}
            >
              Clear
            </button>
          ) : null}
        </div>

        {!selected ? (
          <div className="mt-2 text-sm text-white/70">Click a building to see its details.</div>
        ) : (
          <div className="mt-2 text-sm space-y-1">
            <div>
              <span className="text-white/70">Language:</span> {getLanguageFromFilename(selected.name)}
            </div>
            <div className="break-all">
              <span className="text-white/70">Path:</span> {selected.path}
            </div>
            <div>
              <span className="text-white/70">Name:</span> {selected.name}
            </div>
            <div>
              <span className="text-white/70">Type:</span> {selected.type === "blob" ? "File" : "Folder"}
            </div>
            <div>
              <span className="text-white/70">Extension:</span> {getExtension(selected.name)}
            </div>
            <div>
              <span className="text-white/70">GitHub size:</span>{" "}
              {formatBytes(selected.size)}
            </div>
            <div>
              <span className="text-white/70">Building height:</span> {(selected.y ?? 0).toFixed(2)}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-white/70">Color:</span>
              <span
                className="inline-block h-3 w-3 rounded-sm border border-white/30"
                style={{ backgroundColor: getFileColor(selected.name) }}
              />
              <span className="text-xs text-white/70">{getFileColor(selected.name)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}