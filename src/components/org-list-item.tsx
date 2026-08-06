import { Action, ActionPanel, Clipboard, Icon, Keyboard, List, showToast, Toast } from "@raycast/api";
import type { ReactNode } from "react";

import * as utils from "../lib/utils";
import { HOME_PATH, PINS_SECTION, RECENT_SCOPE, SETUP_PATH } from "../org/constants";
import * as presentation from "../org/presentation";
import type { Org, OrgDisplaySettings } from "../org/schemas";
import * as projectPresentation from "../project/presentation";
import type { OrgAttachment } from "../project/schemas";
import { OrgDetail } from "./org-detail";
import { EditOrgForm } from "./org-form";
import { OrgProjects } from "./org-projects";

type OrgListItemProps = {
  org: Org;
  sectionId: string;
  knownGroups: string[];
  attachments: OrgAttachment[];
  addOrgAction: ReactNode;
  onTogglePin: () => void;
  onSaveSettings: (settings: OrgDisplaySettings) => Promise<void>;
  onOpen: (path: string) => void;
  onOpenProject: (attachment: OrgAttachment) => void;
  onAttachmentsChange: () => void | Promise<void>;
  onRescanProjects: () => Promise<void>;
  onDelete: () => void;
};

const copyToClipboard = async (title: string, content: string) => {
  await Clipboard.copy(content);
  await showToast({ style: Toast.Style.Success, title });
};

export const OrgListItem = ({
  org,
  sectionId,
  knownGroups,
  attachments,
  addOrgAction,
  onTogglePin,
  onSaveSettings,
  onOpen,
  onOpenProject,
  onAttachmentsChange,
  onRescanProjects,
  onDelete,
}: OrgListItemProps) => {
  const inPins = sectionId === PINS_SECTION;
  const inRecents = sectionId === RECENT_SCOPE;
  const projectAccessory = projectPresentation.attachmentAccessory(attachments);
  const soleProject = attachments.length === 1 ? attachments[0] : undefined;

  const manageProjectsAction = (
    <Action.Push
      title="Manage Projects"
      icon={Icon.List}
      target={<OrgProjects org={org} onAttachmentsChange={onAttachmentsChange} onRescan={onRescanProjects} />}
    />
  );

  return (
    <List.Item
      title={presentation.title(org)}
      icon={{ source: Icon.CircleFilled, tintColor: org.color }}
      keywords={[
        org.alias,
        ...org.aliases,
        org.username,
        org.instanceUrl,
        org.orgId ?? "",
        org.group,
        presentation.kindLabel(org.kind),
        org.orgName ?? "",
        ...attachments.map((attachment) => attachment.entry.name),
      ]}
      accessories={[
        ...presentation.accessories(org, {
          showGroup: inPins,
          showPinIcon: inRecents && org.pinned,
        }),
        ...(projectAccessory ? [projectAccessory] : []),
      ]}
      detail={<OrgDetail org={org} attachments={attachments} />}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action title="Open Home" icon={Icon.House} onAction={() => onOpen(HOME_PATH)} />
            <Action
              title="Open Setup"
              icon={Icon.WrenchScrewdriver}
              shortcut={Keyboard.Shortcut.Common.Save}
              onAction={() => onOpen(SETUP_PATH)}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title="Projects">
            {soleProject ? (
              <Action
                title={`Open Project · ${projectPresentation.kindLabel(soleProject.entry.kind)}`}
                icon={projectPresentation.attachmentIcon(soleProject)}
                shortcut={Keyboard.Shortcut.Common.OpenWith}
                onAction={() => onOpenProject(soleProject)}
              />
            ) : null}
            {attachments.length > 1 ? (
              <ActionPanel.Submenu title="Open Project" icon={Icon.Folder} shortcut={Keyboard.Shortcut.Common.OpenWith}>
                {attachments.map((attachment) => (
                  <Action
                    key={attachment.entry.id}
                    title={`${attachment.entry.name} · ${projectPresentation.kindLabel(attachment.entry.kind)}`}
                    icon={projectPresentation.attachmentIcon(attachment)}
                    onAction={() => onOpenProject(attachment)}
                  />
                ))}
              </ActionPanel.Submenu>
            ) : null}
            {manageProjectsAction}
            <Action
              title="Rescan Projects"
              icon={Icon.ArrowClockwise}
              shortcut={Keyboard.Shortcut.Common.Refresh}
              onAction={() =>
                utils.withAnimatedToast("Scanning projects…", onRescanProjects, { successTitle: "Scan complete" })
              }
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title={org.pinned ? "Unpin" : "Pin"}
              icon={Icon.Pin}
              shortcut={Keyboard.Shortcut.Common.Pin}
              onAction={onTogglePin}
            />
            <Action.Push
              title="Edit"
              icon={Icon.Pencil}
              shortcut={Keyboard.Shortcut.Common.Edit}
              target={<EditOrgForm org={org} knownGroups={knownGroups} onSave={onSaveSettings} />}
            />
            {org.orgId ? (
              <Action
                title="Copy Org ID"
                icon={Icon.Clipboard}
                shortcut={Keyboard.Shortcut.Common.Copy}
                onAction={() => copyToClipboard("Copied Org ID", org.orgId!)}
              />
            ) : null}
            <Action
              title="Copy Username"
              icon={Icon.Clipboard}
              shortcut={Keyboard.Shortcut.Common.CopyName}
              onAction={() => copyToClipboard("Copied Username", org.username)}
            />
            {addOrgAction}
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="Delete"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              shortcut={Keyboard.Shortcut.Common.Remove}
              onAction={onDelete}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
};
