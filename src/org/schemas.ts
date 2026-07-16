import * as z from "zod/mini";

import { COLORS, DEFAULT_SECTION, LOGIN_URLS } from "./constants";

const colorValues = COLORS.map((c) => c.value) as [
  (typeof COLORS)[number]["value"],
  ...(typeof COLORS)[number]["value"][],
];

export const colorValueSchema = z.enum(colorValues);
export type ColorValue = z.infer<typeof colorValueSchema>;

const loginHosts = Object.keys(LOGIN_URLS) as [keyof typeof LOGIN_URLS, ...(keyof typeof LOGIN_URLS)[]];

export const loginHostSchema = z.enum(loginHosts);
export type LoginHost = z.infer<typeof loginHostSchema>;

/** Non-empty string for form fields; shared by schemas and useForm validators. */
export const requiredStringSchema = z.string().check(z.minLength(1, { error: "Required" }));

const normalizeDisplaySettings = <T extends { label?: string; color: ColorValue; section: string }>(values: T) => ({
  ...values,
  label: values.label?.trim() || undefined,
  section: values.section.trim() || DEFAULT_SECTION,
});

export const orgDisplaySettingsSchema = z.pipe(
  z.object({
    label: z.optional(z.string()),
    color: colorValueSchema,
    section: requiredStringSchema,
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
    section: requiredStringSchema,
  }),
  z.transform((values) => ({
    ...normalizeDisplaySettings(values),
    loginHost: values.loginHost,
    alias: values.alias.trim(),
  })),
);

export type AddOrgFormValues = z.infer<typeof addOrgFormValuesSchema>;

/** Partial prefs as stored in LocalStorage (missing fields are OK). */
export const storedOrgSettingsSchema = z.object({
  label: z.optional(z.string()),
  color: z.optional(colorValueSchema),
  section: z.optional(z.string()),
});

export type StoredOrgSettings = z.infer<typeof storedOrgSettingsSchema>;

export const orgSettingsMapSchema = z.record(z.string(), storedOrgSettingsSchema);

export type OrgSettingsMap = z.infer<typeof orgSettingsMapSchema>;

export const sfOrgRowSchema = z.looseObject({
  username: z.string(),
  alias: z.nullish(z.string()),
  instanceUrl: z.nullish(z.string()),
  expirationDate: z.nullish(z.string()),
  trailExpirationDate: z.nullish(z.string()),
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
  expirationDate: z.optional(z.string()),
  label: z.optional(z.string()),
  color: colorValueSchema,
  section: z.string(),
});

export type Org = z.infer<typeof orgSchema>;
