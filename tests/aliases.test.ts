import { describe, expect, it } from "vitest";

import { aliasesByUsername } from "../src/org/service";

describe("aliasesByUsername", () => {
  it("groups every alias that points at the same username", () => {
    const map = aliasesByUsername([
      { alias: "us-uat", value: "user@example.com.uat" },
      { alias: "us-67uat", value: "user@example.com.uat" },
      { alias: "us-prod", value: "user@example.com" },
    ]);

    expect(map.get("user@example.com.uat")).toEqual(["us-uat", "us-67uat"]);
    expect(map.get("user@example.com")).toEqual(["us-prod"]);
  });
});
