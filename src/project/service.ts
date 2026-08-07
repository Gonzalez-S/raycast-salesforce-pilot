import type { Org } from "../org/schemas";
import * as catalog from "./catalog";
import { requireProjectsRoot } from "./preferences";
import { countMatchedOrgs, resolveAttachmentsForOrgs } from "./resolve";
import { scanProjectsRoot } from "./scanner";
import type { OrgAttachmentsByUsername } from "./schemas";

export type ScanSummary = {
  projectCount: number;
  workspaceCount: number;
  matchedOrgCount: number;
};

export const scanProjects = async (orgs: Org[]): Promise<ScanSummary> => {
  const projectsRoot = requireProjectsRoot();

  const entries = await scanProjectsRoot(projectsRoot);
  await catalog.saveProjectCatalog({
    rootPath: projectsRoot,
    scannedAt: new Date().toISOString(),
    entries,
  });

  const projectCount = entries.filter((entry) => entry.kind === "folder").length;
  const workspaceCount = entries.filter((entry) => entry.kind === "workspace").length;
  const matchedOrgCount = countMatchedOrgs(entries, orgs);

  return { projectCount, workspaceCount, matchedOrgCount };
};

/** Scan when the catalog is missing or the configured root changed, then resolve attachments. */
export const ensureScannedAndResolve = async (orgs: Org[]): Promise<OrgAttachmentsByUsername> => {
  const projectsRoot = requireProjectsRoot();
  const existing = await catalog.getProjectCatalog();

  if (!existing || existing.rootPath !== projectsRoot) {
    await scanProjects(orgs);
  }

  return resolveAllAttachments(orgs);
};

export const resolveAllAttachments = async (orgs: Org[]): Promise<OrgAttachmentsByUsername> => {
  const entries = await catalog.loadCatalogEntries();
  return resolveAttachmentsForOrgs(orgs, entries);
};

export { openAttachment } from "./open";

export type OrgsListData = {
  orgs: Org[];
  attachmentsByOrg: OrgAttachmentsByUsername;
};

/** Single shot used by the org list: CLI orgs + project catalog/attachments. */
export const loadOrgsListData = async (listOrgs: () => Promise<Org[]>): Promise<OrgsListData> => {
  const orgs = await listOrgs();
  const attachmentsByOrg = await ensureScannedAndResolve(orgs);
  return { orgs, attachmentsByOrg };
};
