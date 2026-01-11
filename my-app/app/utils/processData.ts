import * as d3 from 'd3-hierarchy';

export interface FileNode {
  name: string;
  path: string;
  size: number; // Represents height
  type: 'blob' | 'tree'; // file | folder
  children?: FileNode[];
  // Calculated properties for 3D
  x?: number;
  y?: number; // usually 0
  z?: number;
  width?: number;
  depth?: number;
  color?: string;
}

// Represents an item from GitHub's "git/trees" API response
type GitHubTreeItem = {
  path: string;
  type: "blob" | "tree";
  size?: number; // present for blobs (files), usually undefined for trees (folders)
};

// 1. Convert GitHub flat tree to Hierarchical Tree
export function buildHierarchy(flatFiles: GitHubTreeItem[]): FileNode {
  const root: FileNode = { name: 'root', path: '', size: 0, type: 'tree', children: [] };

  flatFiles.forEach((file) => {
    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part: string, index: number) => {
      // If it's the last part, it's the file/folder itself
      if (index === parts.length - 1) {
        // If it's a file (blob), give it a size. If folder, 0 size.
        // NOTE: GitHub tree API gives 'size' in bytes. We use this as a proxy for Lines of Code for now.
        const node: FileNode = {
          name: part,
          path: file.path,
          size: file.type === 'blob' ? (file.size ?? 0) : 0, 
          type: file.type,
          children: file.type === 'tree' ? [] : undefined
        };
        if (!current.children) current.children = [];
        current.children.push(node);
      } else {
        // Navigate down or create intermediate folder
        let existing = current.children?.find(c => c.name === part);
        if (!existing) {
          existing = { name: part, path: '', size: 0, type: 'tree', children: [] };
          if (!current.children) current.children = [];
          current.children.push(existing);
        }
        current = existing;
      }
    });
  });

  return root;
}

// 2. Calculate Layout (Treemap)
export function generateCityLayout(rootNode: FileNode) {
  const hierarchy = d3.hierarchy(rootNode)
    .sum((d) => Math.sqrt(d.size || 10)); // Sizing logic (sqrt prevents massive files from dominating)

  // Create the layout engine
  const treemap = d3.treemap<FileNode>()
    .size([100, 100]) // The total size of your city platform (100x100 units)
    .paddingOuter(1)   // Space between districts (folders)
    .paddingInner(0.5); // Space between buildings (files)

  const root = treemap(hierarchy);

  // Map D3 coordinates (x0, y0, x1, y1) to 3D coordinates (x, z, width, depth)
  const buildings: FileNode[] = [];
  
  root.descendants().forEach((node) => {
    if (node.data.type === 'blob') {
      // It's a file/building
      buildings.push({
        ...node.data,
        x: (node.x0 + node.x1) / 2 - 50, // Center it and offset to (0,0)
        z: (node.y0 + node.y1) / 2 - 50,
        width: node.x1 - node.x0,
        depth: node.y1 - node.y0,
        // Height based on file size (scaled down)
        y: (node.data.size || 100) / 500 
      });
    }
  });

  return buildings;
}