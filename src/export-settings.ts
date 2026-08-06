import { showHUD, showInFinder } from "@raycast/api";
import { writeFile } from "fs/promises";
import { homedir } from "os";
import path from "path";

import { buildSettingsExport } from "./settings/transfer";

const exportFileName = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `salesforce-pilot-settings-${stamp}.json`;
};

export default async function Command() {
  const payload = await buildSettingsExport();
  const filePath = path.join(homedir(), "Downloads", exportFileName());
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await showInFinder(filePath);
  await showHUD("Settings exported");
}
