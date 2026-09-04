import { describe, expect, it } from "vitest";

import { PRODUCTION_COLORS } from "../src/org/constants";
import { parseSettingsExport, SETTINGS_EXPORT_VERSION } from "../src/settings/transfer";

describe("parseSettingsExport", () => {
  it("accepts a valid v2 export and keeps palette colors", () => {
    const torch = PRODUCTION_COLORS[0].value;
    const payload = {
      version: SETTINGS_EXPORT_VERSION,
      exportedAt: "2026-08-07T00:00:00.000Z",
      orgSettings: {
        "user@example.com": {
          label: "Acme",
          color: torch,
          group: "US",
          pinned: true,
          openLinks: [
            { name: "Home", path: "/lightning/page/home" },
            { name: "Accounts", path: "/lightning/o/Account/list" },
          ],
        },
      },
    };

    const parsed = parseSettingsExport(JSON.stringify(payload));
    expect(parsed.version).toBe(2);
    expect(parsed.orgSettings["user@example.com"]).toEqual({
      label: "Acme",
      color: torch,
      group: "US",
      pinned: true,
      openLinks: [
        { name: "Home", path: "/lightning/page/home", icon: "house-16" },
        { name: "Accounts", path: "/lightning/o/Account/list", icon: "link-16" },
      ],
    });
  });

  it("imports v1 exports and ignores legacy manual project fields", () => {
    const torch = PRODUCTION_COLORS[0].value;
    const payload = {
      version: 1,
      exportedAt: "2026-08-07T00:00:00.000Z",
      orgSettings: {
        "user@example.com": {
          label: "Acme",
          color: torch,
          group: "US",
          pinned: true,
        },
      },
      orgProjects: {
        "user@example.com": { manualProjectIds: ["abc"] },
      },
      manualCatalog: { abc: { id: "abc", path: "/tmp", kind: "folder", source: "manual", name: "x", targetOrgs: [] } },
    };

    const parsed = parseSettingsExport(JSON.stringify(payload));
    expect(parsed.version).toBe(2);
    expect(parsed.orgSettings["user@example.com"]?.label).toBe("Acme");
    expect(parsed).not.toHaveProperty("orgProjects");
    expect(parsed).not.toHaveProperty("manualCatalog");
  });

  it("drops colors that are not in the current palette", () => {
    const payload = {
      version: SETTINGS_EXPORT_VERSION,
      exportedAt: "2026-08-07T00:00:00.000Z",
      orgSettings: {
        "user@example.com": {
          color: "#C62828",
          group: "US",
        },
      },
    };

    const parsed = parseSettingsExport(JSON.stringify(payload));
    expect(parsed.orgSettings["user@example.com"].color).toBeUndefined();
  });

  it("rejects unknown export shapes", () => {
    expect(() => parseSettingsExport("{}")).toThrow(/settings export/i);
    expect(() => parseSettingsExport("not-json")).toThrow(/valid JSON/i);
  });
});
