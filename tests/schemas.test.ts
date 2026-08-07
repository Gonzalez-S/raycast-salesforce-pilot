import { describe, expect, it } from "vitest";

import { DEFAULT_GROUP, DEFAULT_SANDBOX_COLOR, LOGIN_URLS } from "../src/org/constants";
import { addOrgFormValuesSchema, orgDisplaySettingsSchema } from "../src/org/schemas";

describe("orgDisplaySettingsSchema", () => {
  it("trims label and falls back group to default", () => {
    expect(
      orgDisplaySettingsSchema.parse({
        label: "  Acme  ",
        color: DEFAULT_SANDBOX_COLOR,
        group: "   ",
      }),
    ).toEqual({
      label: "Acme",
      color: DEFAULT_SANDBOX_COLOR,
      group: DEFAULT_GROUP,
    });
  });
});

describe("addOrgFormValuesSchema", () => {
  it("requires alias and login host", () => {
    expect(
      addOrgFormValuesSchema.safeParse({
        loginHost: "sandbox",
        alias: "",
        color: DEFAULT_SANDBOX_COLOR,
        group: "US",
      }).success,
    ).toBe(false);
    expect(
      addOrgFormValuesSchema.parse({
        loginHost: "production",
        alias: "  my-org  ",
        label: "",
        color: DEFAULT_SANDBOX_COLOR,
        group: "US",
        setDefault: true,
      }),
    ).toMatchObject({
      loginHost: "production",
      instanceUrl: LOGIN_URLS.production,
      alias: "my-org",
      label: undefined,
      color: DEFAULT_SANDBOX_COLOR,
      group: "US",
      setDefault: true,
      setDefaultDevHub: false,
    });
  });
});
