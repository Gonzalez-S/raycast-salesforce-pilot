import path from "path";

import { describe, expect, it } from "vitest";

import { DEFAULT_SANDBOX_COLOR } from "../src/org/constants";
import type { Org } from "../src/org/schemas";
import { parseWorkspaceFolders, scanProjectsRoot } from "../src/project/scanner";
import { resolveAttachmentsForOrgs, resolveOrgAttachments } from "../src/project/resolve";
import type { CatalogEntry } from "../src/project/schemas";

const fixtureRoot = path.join(__dirname, "fixtures/scan-root");

const sampleOrg = (overrides: Partial<Org> = {}): Org => ({
  username: "user@example.com",
  alias: "alpha-org",
  aliases: ["alpha-org"],
  instanceUrl: "https://example.com",
  isDefaultOrg: false,
  isDefaultDevHub: false,
  kind: "sandbox",
  group: "Other",
  color: DEFAULT_SANDBOX_COLOR,
  pinned: false,
  ...overrides,
});

describe("scanProjectsRoot", () => {
  it("discovers DX folders and workspaces from a scan root", async () => {
    const entries = await scanProjectsRoot(fixtureRoot);

    expect(entries).toHaveLength(3);

    const alpha = entries.find((entry) => entry.name === "alpha");
    const beta = entries.find((entry) => entry.name === "beta");
    const workspace = entries.find((entry) => entry.kind === "workspace");

    expect(alpha).toMatchObject({
      kind: "folder",
      source: "auto",
      targetOrgs: ["alpha-org"],
    });
    expect(beta).toMatchObject({
      kind: "folder",
      targetOrgs: ["user@example.com"],
    });
    expect(workspace).toMatchObject({
      kind: "workspace",
      targetOrgs: expect.arrayContaining(["alpha-org", "user@example.com"]),
    });
  });
});

describe("parseWorkspaceFolders", () => {
  it("resolves relative workspace folder paths", () => {
    const workspacePath = path.join(fixtureRoot, "multi.code-workspace");
    const content = JSON.stringify({ folders: [{ path: "alpha" }, { path: "beta" }] });
    const folders = parseWorkspaceFolders(workspacePath, content);

    expect(folders).toEqual([path.join(fixtureRoot, "alpha"), path.join(fixtureRoot, "beta")]);
  });
});

describe("resolveOrgAttachments", () => {
  const catalog: CatalogEntry[] = [
    {
      id: "alpha",
      path: "/tmp/alpha",
      kind: "folder",
      source: "auto",
      name: "alpha",
      targetOrgs: ["alpha-org"],
    },
    {
      id: "manual",
      path: "/tmp/manual",
      kind: "folder",
      source: "manual",
      name: "manual",
      targetOrgs: [],
    },
  ];

  it("auto-links by alias and username case-insensitively", () => {
    const attachments = resolveOrgAttachments(sampleOrg(), catalog, []);
    expect(attachments).toHaveLength(1);
    expect(attachments[0].origin).toBe("auto");
  });

  it("auto-links by secondary alias when primary list alias differs", () => {
    const org = sampleOrg({
      username: "user@example.com.uat",
      alias: "us-67uat",
      aliases: ["us-uat", "us-67uat"],
    });
    const catalogWithUat: CatalogEntry[] = [
      {
        id: "uat-project",
        path: "/tmp/uat",
        kind: "folder",
        source: "auto",
        name: "uat",
        targetOrgs: ["us-uat"],
      },
    ];

    const attachments = resolveOrgAttachments(org, catalogWithUat, []);
    expect(attachments).toHaveLength(1);
    expect(attachments[0].entry.name).toBe("uat");
  });

  it("merges manual attachments without duplicating auto links", () => {
    const attachments = resolveOrgAttachments(sampleOrg(), catalog, ["alpha", "manual"]);
    expect(attachments).toHaveLength(2);
    expect(attachments.find((attachment) => attachment.entry.id === "alpha")?.origin).toBe("auto");
    expect(attachments.find((attachment) => attachment.entry.id === "manual")?.origin).toBe("manual");
  });
});

describe("resolveAttachmentsForOrgs", () => {
  it("returns a plain record suitable for useCachedPromise caching", () => {
    const org = sampleOrg();
    const catalog: CatalogEntry[] = [
      {
        id: "alpha",
        path: "/tmp/alpha",
        kind: "folder",
        source: "auto",
        name: "alpha",
        targetOrgs: ["alpha-org"],
      },
    ];

    const result = resolveAttachmentsForOrgs([org], catalog, {});

    expect(result).not.toBeInstanceOf(Map);
    expect(result[org.username]).toHaveLength(1);
    expect(typeof result[org.username]?.[0]?.entry.name).toBe("string");
  });
});
