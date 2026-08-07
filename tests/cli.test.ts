import { describe, expect, it } from "vitest";

import { messageFromSfOutput } from "../src/cli/sf";

describe("messageFromSfOutput", () => {
  it("extracts message and first action from SF JSON errors", () => {
    const stdout = JSON.stringify({
      name: "NamedOrgNotFoundError",
      message: "No authorization information found for x.",
      actions: ["Did you mean litifyOrg?"],
      status: 2,
    });

    expect(messageFromSfOutput(stdout)).toBe(
      "No authorization information found for x. Did you mean litifyOrg?",
    );
  });

  it("ignores non-JSON output", () => {
    expect(messageFromSfOutput("not json")).toBeUndefined();
  });
});
