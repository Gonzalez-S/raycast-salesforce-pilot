import { execFile } from "child_process";
import { promisify } from "util";

import { getExtensionPreferences } from "./preferences";
import type { OrgAttachment } from "./schemas";

const execFileAsync = promisify(execFile);

let resolvedEditor: { command: string; path: string } | undefined;

/** Resolve an editor CLI the same way a login shell does (Raycast's PATH is often incomplete). */
const resolveEditorBinary = async (command: string): Promise<string> => {
  if (resolvedEditor?.command === command) return resolvedEditor.path;

  let path: string;
  if (process.platform === "win32") {
    const { stdout } = await execFileAsync("where.exe", [command], { encoding: "utf8" });
    path = stdout.trim().split(/\r?\n/)[0]?.trim();
  } else {
    const shell = process.env.SHELL || "/bin/zsh";
    const { stdout } = await execFileAsync(shell, ["-lic", `command -v ${JSON.stringify(command)}`], {
      encoding: "utf8",
    });
    path = stdout.trim().split("\n").at(-1)?.trim() ?? "";
  }

  if (!path) {
    throw new Error(
      `Editor command "${command}" was not found on PATH. Install its CLI or change Editor Command in extension preferences.`,
    );
  }

  resolvedEditor = { command, path };
  return path;
};

export const openInEditor = async (projectPath: string) => {
  const { editorCommand } = getExtensionPreferences();
  const binary = await resolveEditorBinary(editorCommand);

  try {
    await execFileAsync(binary, [projectPath], { env: process.env });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new Error(
        `Editor command "${editorCommand}" was not found on PATH. Install its CLI or change Editor Command in extension preferences.`,
      );
    }
    throw error;
  }
};

export const openAttachment = async (attachment: OrgAttachment) => {
  if (attachment.entry.missing) {
    throw new Error("Project path no longer exists. Rescan or remove it.");
  }
  await openInEditor(attachment.entry.path);
};
