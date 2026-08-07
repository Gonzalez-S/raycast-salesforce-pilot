import { access, readdir, readFile, stat } from "fs/promises";
import path from "path";

import { DX_PROJECT_MANIFESTS, SCAN_SKIP_DIRS, WORKSPACE_EXTENSION } from "./constants";
import type { CatalogEntry } from "./schemas";

const parseJson = (content: string): unknown => {
  try {
    return JSON.parse(content);
  } catch {
    return JSON.parse(content.replace(/,\s*([\]}])/g, "$1"));
  }
};

export const normalizeProjectPath = (inputPath: string): string => path.resolve(inputPath);

export const entryIdForPath = (inputPath: string): string => normalizeProjectPath(inputPath);

const entryName = (inputPath: string, kind: CatalogEntry["kind"]): string => {
  const base = path.basename(inputPath);
  return kind === "workspace" ? base.replace(/\.code-workspace$/i, "") : base;
};

const isDxProjectDir = async (dirPath: string): Promise<boolean> => {
  for (const manifest of DX_PROJECT_MANIFESTS) {
    try {
      await access(path.join(dirPath, manifest));
      return true;
    } catch {
      // try next manifest
    }
  }
  return false;
};

const readTargetOrgFromConfig = async (dirPath: string): Promise<string | undefined> => {
  const sfConfigPath = path.join(dirPath, ".sf", "config.json");
  try {
    const raw = await readFile(sfConfigPath, "utf8");
    const data = parseJson(raw) as { "target-org"?: string; targetOrg?: string };
    const target = data["target-org"] ?? data.targetOrg;
    if (typeof target === "string" && target.trim()) return target.trim();
  } catch {
    // fall through to legacy config
  }

  const legacyConfigPath = path.join(dirPath, ".sfdx", "sfdx-config.json");
  try {
    const raw = await readFile(legacyConfigPath, "utf8");
    const data = parseJson(raw) as { defaultusername?: string; "target-org"?: string };
    const target = data["target-org"] ?? data.defaultusername;
    if (typeof target === "string" && target.trim()) return target.trim();
  } catch {
    // no config
  }

  return undefined;
};

type WorkspaceFile = {
  folders?: { path?: string }[];
};

const resolveWorkspaceFolderPath = (workspacePath: string, folderPath: string): string => {
  if (path.isAbsolute(folderPath)) return normalizeProjectPath(folderPath);
  return normalizeProjectPath(path.resolve(path.dirname(workspacePath), folderPath));
};

export const parseWorkspaceFolders = (workspacePath: string, content: string): string[] => {
  const data = parseJson(content) as WorkspaceFile;
  const folders = data.folders ?? [];
  const resolved: string[] = [];

  for (const folder of folders) {
    if (!folder.path?.trim()) continue;
    resolved.push(resolveWorkspaceFolderPath(workspacePath, folder.path.trim()));
  }

  return resolved;
};

const buildFolderEntry = async (dirPath: string): Promise<CatalogEntry> => {
  const normalized = normalizeProjectPath(dirPath);
  const targetOrg = await readTargetOrgFromConfig(normalized);

  return {
    id: entryIdForPath(normalized),
    path: normalized,
    kind: "folder",
    name: entryName(normalized, "folder"),
    targetOrgs: targetOrg ? [targetOrg] : [],
  };
};

const buildWorkspaceEntry = async (workspacePath: string): Promise<CatalogEntry> => {
  const normalized = normalizeProjectPath(workspacePath);
  const raw = await readFile(normalized, "utf8");
  const workspaceFolders = parseWorkspaceFolders(normalized, raw);

  const targetOrgs = new Set<string>();
  for (const folderPath of workspaceFolders) {
    if (!(await isDxProjectDir(folderPath))) continue;
    const target = await readTargetOrgFromConfig(folderPath);
    if (target) targetOrgs.add(target);
  }

  return {
    id: entryIdForPath(normalized),
    path: normalized,
    kind: "workspace",
    name: entryName(normalized, "workspace"),
    targetOrgs: [...targetOrgs],
    workspaceFolders,
  };
};

const shouldSkipDir = (name: string): boolean => name.startsWith(".") || SCAN_SKIP_DIRS.has(name);

const walkDirectory = async (dirPath: string, entries: CatalogEntry[]): Promise<void> => {
  const normalized = normalizeProjectPath(dirPath);

  let dirStat;
  try {
    dirStat = await stat(normalized);
  } catch {
    return;
  }
  if (!dirStat.isDirectory()) return;

  if (await isDxProjectDir(normalized)) {
    entries.push(await buildFolderEntry(normalized));
    return;
  }

  let children: string[];
  try {
    children = await readdir(normalized);
  } catch {
    return;
  }

  for (const child of children) {
    if (child.endsWith(WORKSPACE_EXTENSION)) {
      const workspacePath = path.join(normalized, child);
      try {
        const workspaceStat = await stat(workspacePath);
        if (workspaceStat.isFile()) {
          entries.push(await buildWorkspaceEntry(workspacePath));
        }
      } catch {
        // skip unreadable workspace
      }
    }
  }

  for (const child of children) {
    if (shouldSkipDir(child)) continue;
    if (child.endsWith(WORKSPACE_EXTENSION)) continue;

    const childPath = path.join(normalized, child);
    try {
      const childStat = await stat(childPath);
      if (childStat.isDirectory()) {
        await walkDirectory(childPath, entries);
      }
    } catch {
      // skip unreadable child
    }
  }
};

/** Recursively scan a root directory for DX projects and editor workspaces. */
export const scanProjectsRoot = async (rootPath: string): Promise<CatalogEntry[]> => {
  const normalizedRoot = normalizeProjectPath(rootPath);

  let rootStat;
  try {
    rootStat = await stat(normalizedRoot);
  } catch {
    throw new Error(`Scan folder not found: ${normalizedRoot}`);
  }
  if (!rootStat.isDirectory()) {
    throw new Error(`Scan path is not a directory: ${normalizedRoot}`);
  }

  const entries: CatalogEntry[] = [];
  await walkDirectory(normalizedRoot, entries);

  const byId = new Map<string, CatalogEntry>();
  for (const entry of entries) {
    byId.set(entry.id, entry);
  }
  return [...byId.values()];
};
