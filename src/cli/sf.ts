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

export async function exec(args: string[], json: false): Promise<void>;
export async function exec<T>(args: string[], schema: Parsable<T>): Promise<T>;
export async function exec<T>(args: string[], schemaOrJson: Parsable<T> | false): Promise<T | void> {
  const bin = await resolveSf();
  const json = schemaOrJson !== false;
  const { stdout } = await execFileAsync(bin, json ? [...args, "--json"] : args, {
    encoding: "utf8",
    env: { ...process.env, SF_DISABLE_LOG_FILE: "true" },
    maxBuffer: SF_MAX_BUFFER,
  });

  if (schemaOrJson === false) return;
  return schemaOrJson.parse((JSON.parse(stdout) as { result: unknown }).result);
}
