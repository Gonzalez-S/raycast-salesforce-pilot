export const PROJECT_CATALOG_KEY = "salesforce-pilot-project-catalog";
export const MANUAL_CATALOG_KEY = "salesforce-pilot-manual-catalog";
export const ORG_PROJECTS_KEY = "salesforce-pilot-org-projects";

export const DX_PROJECT_MANIFESTS = ["sfdx-project.json", "sf-project.json"] as const;

export const WORKSPACE_EXTENSION = ".code-workspace";

/** Directories skipped during recursive scan (not DX roots themselves). */
export const SCAN_SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".sfdx",
  ".sf",
  "dist",
  "coverage",
  "force-app",
  ".husky",
  ".vscode",
  ".cursor",
  ".qodo",
]);

export const EDITOR_COMMANDS = ["cursor", "code", "codium", "windsurf"] as const;
export type EditorCommand = (typeof EDITOR_COMMANDS)[number];

export const DEFAULT_EDITOR_COMMAND: EditorCommand = "cursor";
