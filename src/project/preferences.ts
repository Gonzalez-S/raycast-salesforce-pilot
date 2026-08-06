import { getPreferenceValues } from "@raycast/api";

import { DEFAULT_EDITOR_COMMAND } from "./constants";
import { type ExtensionPreferences, extensionPreferencesSchema } from "./schemas";

const readPreferences = (): ExtensionPreferences & { editorCommand: string } => {
  const raw = getPreferenceValues<ExtensionPreferences>();
  const parsed = extensionPreferencesSchema.safeParse(raw);
  const prefs = parsed.success ? parsed.data : {};

  return {
    projectsRoot: prefs.projectsRoot?.trim() || undefined,
    editorCommand: prefs.editorCommand ?? DEFAULT_EDITOR_COMMAND,
  };
};

export const getExtensionPreferences = () => readPreferences();

export const getProjectsRoot = (): string | undefined => readPreferences().projectsRoot;

export const requireProjectsRoot = (): string => {
  const projectsRoot = getProjectsRoot();
  if (!projectsRoot) {
    throw new Error("Projects Scan Folder is not configured.");
  }
  return projectsRoot;
};

export const isProjectsRootConfigured = (): boolean => Boolean(getProjectsRoot());
