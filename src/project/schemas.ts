import * as z from "zod/mini";

import { EDITOR_COMMANDS } from "./constants";

export const projectKindSchema = z.enum(["folder", "workspace"]);
export type ProjectKind = z.infer<typeof projectKindSchema>;

export const projectSourceSchema = z.enum(["auto", "manual"]);
export type ProjectSource = z.infer<typeof projectSourceSchema>;

export const catalogEntrySchema = z.object({
  id: z.string(),
  path: z.string(),
  kind: projectKindSchema,
  source: projectSourceSchema,
  name: z.string(),
  targetOrgs: z.array(z.string()),
  workspaceFolders: z.optional(z.array(z.string())),
  missing: z.optional(z.boolean()),
});

export type CatalogEntry = z.infer<typeof catalogEntrySchema>;

export const projectCatalogSchema = z.object({
  rootPath: z.string(),
  scannedAt: z.string(),
  entries: z.array(catalogEntrySchema),
});

export type ProjectCatalog = z.infer<typeof projectCatalogSchema>;

export const manualCatalogSchema = z.record(z.string(), catalogEntrySchema);
export type ManualCatalog = z.infer<typeof manualCatalogSchema>;

export const orgProjectPrefsSchema = z.object({
  manualProjectIds: z.optional(z.array(z.string())),
});

export type OrgProjectPrefs = z.infer<typeof orgProjectPrefsSchema>;

export const orgProjectsMapSchema = z.record(z.string(), orgProjectPrefsSchema);
export type OrgProjectsMap = z.infer<typeof orgProjectsMapSchema>;

export const orgAttachmentSchema = z.object({
  entry: catalogEntrySchema,
  origin: z.enum(["auto", "manual"]),
});

export type OrgAttachment = z.infer<typeof orgAttachmentSchema>;

/** Serializable lookup of resolved attachments keyed by org username. */
export type OrgAttachmentsByUsername = Record<string, OrgAttachment[]>;

export const extensionPreferencesSchema = z.object({
  projectsRoot: z.optional(z.string()),
  editorCommand: z.optional(z.enum(EDITOR_COMMANDS)),
});

export type ExtensionPreferences = z.infer<typeof extensionPreferencesSchema>;
