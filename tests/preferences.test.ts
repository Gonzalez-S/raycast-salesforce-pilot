import { describe, expect, it, vi, beforeEach } from "vitest";
import { getPreferenceValues } from "@raycast/api";

import {
  getProjectsRoot,
  isProjectsRootConfigured,
  requireProjectsRoot,
} from "../src/project/preferences";

describe("project preferences", () => {
  beforeEach(() => {
    vi.mocked(getPreferenceValues).mockReset();
  });

  it("treats blank projectsRoot as unset", () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ projectsRoot: "   ", editorCommand: "code" });
    expect(getProjectsRoot()).toBeUndefined();
    expect(isProjectsRootConfigured()).toBe(false);
  });

  it("throws when scan folder is required but missing", () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ editorCommand: "cursor" });
    expect(() => requireProjectsRoot()).toThrow(/Projects Scan Folder/);
  });

  it("returns the configured scan folder", () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ projectsRoot: "/tmp/projects", editorCommand: "cursor" });
    expect(requireProjectsRoot()).toBe("/tmp/projects");
  });
});
