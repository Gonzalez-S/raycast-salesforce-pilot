import { Icon } from "@raycast/api";

import type { OrgAttachment, ProjectKind } from "./schemas";

export const kindLabel = (kind: ProjectKind): string => (kind === "workspace" ? "Workspace" : "Folder");

export const attachmentIcon = (attachment: OrgAttachment) =>
  attachment.entry.kind === "workspace" ? Icon.Window : Icon.Folder;

/** List accessory: folder icon alone for one project; icon + count for many. */
export const attachmentAccessory = (attachments: OrgAttachment[]) => {
  if (attachments.length === 0) return undefined;

  if (attachments.length === 1) {
    return {
      icon: attachmentIcon(attachments[0]),
      tooltip: `Project: ${attachments[0].entry.name}`,
    };
  }

  return {
    icon: Icon.Folder,
    text: String(attachments.length),
    tooltip: `${attachments.length} local projects`,
  };
};
