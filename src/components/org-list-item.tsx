import { Action, ActionPanel, Icon, Keyboard, List } from "@raycast/api";
import type { ReactNode } from "react";

import * as utils from "../lib/utils";
import { PINS_SECTION, RECENT_SCOPE } from "../org/constants";
import { OPEN_PATHS } from "../org/open-paths";
import * as presentation from "../org/presentation";
import type { Org, OrgDisplaySettings } from "../org/schemas";
import * as projectPresentation from "../project/presentation";
import type { OrgAttachment } from "../project/schemas";
import { OrgDetail } from "./org-detail";
import { EditOrgForm, SetAliasForm } from "./org-form";

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
  onRescanProjects: () => Promise<void>;
  onSetDefaultOrg: () => void;
  onSetDefaultDevHub: () => void;
  onUnsetAlias: (alias: string) => void;
  onRefresh: () => void;
  onDelete: () => void;
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
  onRescanProjects,
  onSetDefaultOrg,
  onSetDefaultDevHub,
  onUnsetAlias,
  onRefresh,
  onDelete,
}: OrgListItemProps) => {
  const inPins = sectionId === PINS_SECTION;
  const inRecents = sectionId === RECENT_SCOPE;
  const projectAccessory = projectPresentation.attachmentAccessory(attachments);
  const soleProject = attachments.length === 1 ? attachments[0] : undefined;
  // Every CLI alias except the username itself (username can appear as a pseudo-alias).
  const unsettableAliases = org.aliases.filter((alias) => alias !== org.username);

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
            <ActionPanel.Submenu title="Open" icon={Icon.Globe}>
              {OPEN_PATHS.map((item) => (
                <Action key={item.path} title={item.name} icon={item.icon} onAction={() => onOpen(item.path)} />
              ))}
            </ActionPanel.Submenu>
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
            <Action
              title="Rescan Projects"
              icon={Icon.ArrowClockwise}
              shortcut={Keyboard.Shortcut.Common.Refresh}
              onAction={() =>
                utils.withAnimatedToast("Scanning projects…", onRescanProjects, { successTitle: "Scan complete" })
              }
            />
          </ActionPanel.Section>
          <ActionPanel.Section title="CLI">
            {!org.isDefaultOrg ? (
              <Action title="Set as Default Org" icon={Icon.CheckCircle} onAction={onSetDefaultOrg} />
            ) : null}
            {!org.isDefaultDevHub ? (
              <Action title="Set as Default Dev Hub" icon={Icon.Hammer} onAction={onSetDefaultDevHub} />
            ) : null}
            <Action.Push title="Set Alias…" icon={Icon.Text} target={<SetAliasForm org={org} onDone={onRefresh} />} />
            {unsettableAliases.length > 0 ? (
              <ActionPanel.Submenu title="Unset Alias" icon={Icon.Trash}>
                {unsettableAliases.map((alias) => (
                  <Action
                    key={alias}
                    title={alias}
                    style={Action.Style.Destructive}
                    onAction={() => onUnsetAlias(alias)}
                  />
                ))}
              </ActionPanel.Submenu>
            ) : null}
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
            {addOrgAction}
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title={org.kind === "scratch" ? "Delete Scratch Org" : "Delete"}
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
