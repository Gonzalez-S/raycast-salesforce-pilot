import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { SF_MAX_BUFFER } from "../org/constants";

type Parsable<T> = { parse: (data: unknown) => T };

const execFileAsync = promisify(execFile);

let resolvedSf: string | undefined;

/** Resolve `sf` the same way your login shell does (Raycast's PATH is often empty of brew/local bins). */
const resolveSf = async (): Promise<string> => {
  if (resolvedSf) return resolvedSf;

  if (process.platform === "win32") {
    const { stdout } = await execFileAsync("where.exe", ["sf"], { encoding: "utf8" });
    resolvedSf = stdout.trim().split(/\r?\n/)[0].trim();
  } else {
    const shell = process.env.SHELL || "/bin/zsh";
    const { stdout } = await execFileAsync(shell, ["-lic", "command -v sf"], { encoding: "utf8" });
    const path = stdout.trim().split("\n").at(-1)?.trim();
    if (!path) throw new Error("Salesforce CLI (`sf`) was not found.");
    resolvedSf = path;
  }

  return resolvedSf;
};

const tryParseJson = (text: string): unknown => {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  // SF may print warnings before JSON; take the last `{...}` blob.
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return undefined;
  }
};

/** Pull a human message out of SF CLI `--json` error payloads (often on stdout). */
export const messageFromSfOutput = (text: string): string | undefined => {
  const parsed = tryParseJson(text);
  if (!parsed || typeof parsed !== "object") return undefined;
  const record = parsed as { message?: unknown; actions?: unknown };
  if (typeof record.message !== "string" || !record.message.trim()) return undefined;

  const message = record.message.replace(/\s+/g, " ").trim();
  const actions = Array.isArray(record.actions)
    ? record.actions.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  if (actions.length === 0) return message;
  return `${message} ${actions[0]}`;
};

const toError = (error: unknown): Error => {
  if (!(error instanceof Error)) return new Error(String(error));

  const withOutput = error as Error & { stdout?: string; stderr?: string };
  const fromSf = messageFromSfOutput(withOutput.stdout ?? "") ?? messageFromSfOutput(withOutput.stderr ?? "");
  if (fromSf) return new Error(fromSf);
  return error;
};

export async function exec(args: string[], json: false): Promise<void>;
export async function exec<T>(args: string[], schema: Parsable<T>): Promise<T>;
export async function exec<T>(args: string[], schemaOrJson: Parsable<T> | false): Promise<T | void> {
  const bin = await resolveSf();
  const json = schemaOrJson !== false;

  try {
    const { stdout } = await execFileAsync(bin, json ? [...args, "--json"] : args, {
      encoding: "utf8",
      env: { ...process.env, SF_DISABLE_LOG_FILE: "true" },
      maxBuffer: SF_MAX_BUFFER,
    });

    if (schemaOrJson === false) return;
    const parsed = tryParseJson(stdout);
    if (!parsed || typeof parsed !== "object" || !("result" in parsed)) {
      throw new Error("Salesforce CLI returned unexpected JSON.");
    }
    return schemaOrJson.parse((parsed as { result: unknown }).result);
  } catch (error) {
    throw toError(error);
  }
}
