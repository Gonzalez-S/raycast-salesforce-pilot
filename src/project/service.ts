import type { Org } from "../org/schemas";
import * as catalog from "./catalog";
import * as links from "./links";
import { requireProjectsRoot } from "./preferences";
import { countMatchedOrgs, resolveAttachmentsForOrgs, resolveOrgAttachments } from "./resolve";
import { buildManualEntry, scanProjectsRoot } from "./scanner";
import type { CatalogEntry, OrgAttachment, OrgAttachmentsByUsername } from "./schemas";

export type ScanSummary = {
  projectCount: number;
  workspaceCount: number;
  matchedOrgCount: number;
};

const loadCatalogEntries = async (): Promise<CatalogEntry[]> => catalog.loadCatalogEntries();

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
  const [entries, orgProjectsMap] = await Promise.all([loadCatalogEntries(), links.getOrgProjectsMap()]);
  return resolveAttachmentsForOrgs(orgs, entries, orgProjectsMap);
};

export const resolveAttachments = async (org: Org): Promise<OrgAttachment[]> => {
  const [entries, prefs] = await Promise.all([loadCatalogEntries(), links.getOrgProjectPrefs(org.username)]);
  return resolveOrgAttachments(org, entries, prefs.manualProjectIds ?? []);
};

export const addManualProject = async (org: Org, inputPath: string): Promise<OrgAttachment[]> => {
  const entry = await catalog.upsertManualEntry(await buildManualEntry(inputPath));
  await links.addManualProject(org.username, entry.id);
  return resolveAttachments(org);
};

export const removeManualProject = async (org: Org, projectId: string): Promise<OrgAttachment[]> => {
  await links.removeManualProject(org.username, projectId);
  return resolveAttachments(org);
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
