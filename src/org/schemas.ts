import * as z from "zod/mini";

import { COLORS, DEFAULT_GROUP, LOGIN_URLS, ORG_KINDS, type OrgKind } from "./constants";

const colorValues = COLORS.map((c) => c.value) as [
  (typeof COLORS)[number]["value"],
  ...(typeof COLORS)[number]["value"][],
];

export const colorValueSchema = z.enum(colorValues);
export type ColorValue = z.infer<typeof colorValueSchema>;

const loginHosts = Object.keys(LOGIN_URLS) as [keyof typeof LOGIN_URLS, ...(keyof typeof LOGIN_URLS)[]];

export const loginHostSchema = z.enum(loginHosts);
export type LoginHost = z.infer<typeof loginHostSchema>;

export const orgKindSchema = z.enum(ORG_KINDS);
export type { OrgKind };

/** Non-empty string for form fields; shared by schemas and useForm validators. */
export const requiredStringSchema = z.string().check(z.minLength(1, { error: "Required" }));

const normalizeDisplaySettings = <T extends { label?: string; color: ColorValue; group: string }>(values: T) => ({
  ...values,
  label: values.label?.trim() || undefined,
  group: values.group.trim() || DEFAULT_GROUP,
});

export const orgDisplaySettingsSchema = z.pipe(
  z.object({
    label: z.optional(z.string()),
    color: colorValueSchema,
    group: requiredStringSchema,
  }),
  z.transform(normalizeDisplaySettings),
);

export type OrgDisplaySettings = z.infer<typeof orgDisplaySettingsSchema>;

export const addOrgFormValuesSchema = z.pipe(
  z.object({
    loginHost: loginHostSchema,
    alias: requiredStringSchema,
    label: z.optional(z.string()),
    color: colorValueSchema,
    group: requiredStringSchema,
  }),
  z.transform((values) => ({
    ...normalizeDisplaySettings(values),
    loginHost: values.loginHost,
    alias: values.alias.trim(),
  })),
);

export type AddOrgFormValues = z.infer<typeof addOrgFormValuesSchema>;

/** Partial prefs as stored in LocalStorage. */
export const storedOrgSettingsSchema = z.object({
  label: z.optional(z.string()),
  color: z.optional(colorValueSchema),
  group: z.optional(z.string()),
  favorite: z.optional(z.boolean()),
});

export type StoredOrgSettings = z.infer<typeof storedOrgSettingsSchema>;

export const orgSettingsMapSchema = z.record(z.string(), storedOrgSettingsSchema);

export type OrgSettingsMap = z.infer<typeof orgSettingsMapSchema>;

export const sfOrgRowSchema = z.looseObject({
  username: z.string(),
  alias: z.nullish(z.string()),
  instanceUrl: z.nullish(z.string()),
  orgId: z.nullish(z.string()),
  name: z.nullish(z.string()),
  orgEdition: z.nullish(z.string()),
  connectedStatus: z.nullish(z.string()),
  expirationDate: z.nullish(z.string()),
  trailExpirationDate: z.nullish(z.string()),
  lastUsed: z.nullish(z.string()),
  isDevHub: z.nullish(z.boolean()),
  isSandbox: z.nullish(z.boolean()),
  isScratch: z.nullish(z.boolean()),
  isDefaultUsername: z.nullish(z.boolean()),
  isDefaultDevHubUsername: z.nullish(z.boolean()),
});

export type SfOrgRow = z.infer<typeof sfOrgRowSchema>;

export const orgListResultSchema = z.object({
  other: z.optional(z.array(sfOrgRowSchema)),
  sandboxes: z.optional(z.array(sfOrgRowSchema)),
  nonScratchOrgs: z.optional(z.array(sfOrgRowSchema)),
  scratchOrgs: z.optional(z.array(sfOrgRowSchema)),
  devHubs: z.optional(z.array(sfOrgRowSchema)),
});

export type OrgListResult = z.infer<typeof orgListResultSchema>;

export const orgAuthResultSchema = z.object({
  username: z.string(),
});

export const orgSchema = z.object({
  username: z.string(),
  alias: z.string(),
  instanceUrl: z.string(),
  orgId: z.optional(z.string()),
  orgName: z.optional(z.string()),
  orgEdition: z.optional(z.string()),
  connectedStatus: z.optional(z.string()),
  expirationDate: z.optional(z.string()),
  lastUsed: z.optional(z.string()),
  isDefaultOrg: z.boolean(),
  isDefaultDevHub: z.boolean(),
  kind: orgKindSchema,
  group: z.string(),
  label: z.optional(z.string()),
  color: colorValueSchema,
  favorite: z.boolean(),
});

export type Org = z.infer<typeof orgSchema>;
