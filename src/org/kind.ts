import { Color, Icon } from "@raycast/api";

import type { OrgKind } from "./constants";
import type { SfOrgRow } from "./schemas";

export const ORG_KIND_ICON: Record<OrgKind, Icon> = {
  devhub: Icon.Hammer,
  production: Icon.Globe,
  sandbox: Icon.Box,
  scratch: Icon.Terminal,
  other: Icon.QuestionMark,
};

export const ORG_KIND_COLOR: Record<OrgKind, Color> = {
  devhub: Color.Purple,
  production: Color.Red,
  sandbox: Color.Blue,
  scratch: Color.Green,
  other: Color.SecondaryText,
};

/** Classify using SF CLI flags; bucket is only a fallback for sparse rows. */
export const classifyKind = (row: SfOrgRow, bucket?: string): OrgKind => {
  if (row.isScratch) return "scratch";
  if (row.isSandbox) return "sandbox";
  if (row.isDevHub) return "devhub";

  switch (bucket) {
    case "scratchOrgs":
      return "scratch";
    case "sandboxes":
      return "sandbox";
    case "devHubs":
      return "devhub";
    case "nonScratchOrgs":
      return "production";
    default:
      return row.isSandbox === false && row.isScratch === false ? "production" : "other";
  }
};
