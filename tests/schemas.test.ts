import { describe, expect, it } from "vitest";

import { DEFAULT_SECTION } from "../src/org/constants";
import { addOrgFormValuesSchema, orgDisplaySettingsSchema } from "../src/org/schemas";

describe("orgDisplaySettingsSchema", () => {
  it("trims label and falls back section to default", () => {
    expect(
      orgDisplaySettingsSchema.parse({
        label: "  Acme  ",
        color: "#007fff",
        section: "   ",
      }),
    ).toEqual({
      label: "Acme",
      color: "#007fff",
      section: DEFAULT_SECTION,
    });
  });
});

describe("addOrgFormValuesSchema", () => {
  it("requires alias and login host", () => {
    expect(
      addOrgFormValuesSchema.safeParse({ loginHost: "sandbox", alias: "", color: "#007fff", section: "Dev" }).success,
    ).toBe(false);
    expect(
      addOrgFormValuesSchema.parse({
        loginHost: "production",
        alias: "  my-org  ",
        label: "",
        color: "#007fff",
        section: "Dev",
      }),
    ).toMatchObject({
      loginHost: "production",
      alias: "my-org",
      label: undefined,
      section: "Dev",
    });
  });
});
