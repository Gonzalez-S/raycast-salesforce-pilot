import { Action, ActionPanel, Icon, Keyboard, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useCallback } from "react";

import * as utils from "../lib/utils";
import type { Org } from "../org/schemas";
import { AddProjectForm } from "./project-add-form";
import * as projectPresentation from "../project/presentation";
import * as projects from "../project/service";
import type { OrgAttachment } from "../project/schemas";

type OrgProjectsProps = {
  org: Org;
  onAttachmentsChange: () => void | Promise<void>;
  onRescan: () => Promise<void>;
};

export const OrgProjects = ({ org, onAttachmentsChange, onRescan }: OrgProjectsProps) => {
  const {
    data: attachments = [],
    isLoading,
    revalidate,
  } = useCachedPromise(() => projects.resolveAttachments(org), [org.username]);

  const refresh = useCallback(async () => {
    await revalidate();
    await onAttachmentsChange();
  }, [onAttachmentsChange, revalidate]);

  const autoAttachments = attachments.filter((attachment) => attachment.origin === "auto");
  const manualAttachments = attachments.filter((attachment) => attachment.origin === "manual");

  const openProject = (attachment: OrgAttachment) => () =>
    utils.withClosedWindow(`Opened ${attachment.entry.name}`, () => projects.openAttachment(attachment), {
      failureTitle: "Couldn’t open project",
    });

  const removeManual = (attachment: OrgAttachment) => async () => {
    await projects.removeManualProject(org, attachment.entry.id);
    await refresh();
  };

  const renderItem = (attachment: OrgAttachment, canRemove: boolean) => (
    <List.Item
      key={attachment.entry.id}
      title={attachment.entry.name}
      subtitle={attachment.entry.path}
      icon={projectPresentation.attachmentIcon(attachment)}
      accessories={[{ text: projectPresentation.attachmentSubtitle(attachment) }]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action
              title="Open in Editor"
              icon={Icon.Terminal}
              shortcut={Keyboard.Shortcut.Common.OpenWith}
              onAction={openProject(attachment)}
            />
          </ActionPanel.Section>
          {canRemove ? (
            <ActionPanel.Section>
              <Action
                title="Remove"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={Keyboard.Shortcut.Common.Remove}
                onAction={removeManual(attachment)}
              />
            </ActionPanel.Section>
          ) : null}
        </ActionPanel>
      }
    />
  );

  return (
    <List isLoading={isLoading} navigationTitle={`Projects · ${org.alias}`}>
      <List.EmptyView
        icon={Icon.Folder}
        title="No projects"
        description="Rescan your projects folder to auto-discover local projects, or add one manually."
        actions={
          <ActionPanel>
            <Action.Push title="Add Project" icon={Icon.Plus} target={<AddProjectForm org={org} onDone={refresh} />} />
            <Action
              title="Rescan Projects"
              icon={Icon.ArrowClockwise}
              onAction={() =>
                utils.withAnimatedToast("Scanning projects…", onRescan, { successTitle: "Scan complete" })
              }
            />
          </ActionPanel>
        }
      />

      {autoAttachments.length > 0 ? (
        <List.Section title="Auto" subtitle={autoAttachments.length.toString()}>
          {autoAttachments.map((attachment) => renderItem(attachment, false))}
        </List.Section>
      ) : null}

      {manualAttachments.length > 0 ? (
        <List.Section title="Manual" subtitle={manualAttachments.length.toString()}>
          {manualAttachments.map((attachment) => renderItem(attachment, true))}
        </List.Section>
      ) : null}

      <List.Section>
        <List.Item
          title="Add Project"
          icon={Icon.Plus}
          actions={
            <ActionPanel>
              <Action.Push
                title="Add Project"
                icon={Icon.Plus}
                target={<AddProjectForm org={org} onDone={refresh} />}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Rescan Projects"
          icon={Icon.ArrowClockwise}
          actions={
            <ActionPanel>
              <Action
                title="Rescan Projects"
                icon={Icon.ArrowClockwise}
                onAction={() =>
                  utils.withAnimatedToast("Scanning projects…", onRescan, { successTitle: "Scan complete" })
                }
              />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
};
