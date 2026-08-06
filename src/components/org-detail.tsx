import { Clipboard, Color, Icon, List, showToast, Toast } from "@raycast/api";

import * as utils from "../lib/utils";
import * as presentation from "../org/presentation";
import type { Org } from "../org/schemas";
import * as projectPresentation from "../project/presentation";
import type { OrgAttachment } from "../project/schemas";
import * as projects from "../project/service";

const copyUsername = async (username: string) => {
  await Clipboard.copy(username);
  await showToast({ style: Toast.Style.Success, title: "Copied Username" });
};

const openProject = (attachment: OrgAttachment) =>
  utils.withClosedWindow(`Opened ${attachment.entry.name}`, () => projects.openAttachment(attachment), {
    failureTitle: "Couldn’t open project",
  });

/** Right-hand detail metadata for a list row. */
export const OrgDetail = ({ org, attachments }: { org: Org; attachments: OrgAttachment[] }) => {
  const name = presentation.orgNameLabel(org);

  return (
    <List.Item.Detail
      metadata={
        <List.Item.Detail.Metadata>
          {attachments.length > 0 ? (
            <>
              <List.Item.Detail.Metadata.TagList title="Projects">
                {attachments.map((attachment) => (
                  <List.Item.Detail.Metadata.TagList.Item
                    key={attachment.entry.id}
                    text={attachment.entry.name}
                    icon={projectPresentation.attachmentIcon(attachment)}
                    onAction={() => openProject(attachment)}
                  />
                ))}
              </List.Item.Detail.Metadata.TagList>
              <List.Item.Detail.Metadata.Separator />
            </>
          ) : null}
          <List.Item.Detail.Metadata.TagList title="Type">
            <List.Item.Detail.Metadata.TagList.Item
              text={presentation.kindLabel(org.kind)}
              icon={presentation.kindIcon(org.kind)}
              color={presentation.kindColor(org.kind)}
            />
            {org.isDefaultOrg ? (
              <List.Item.Detail.Metadata.TagList.Item text="Default Org" icon={Icon.CheckCircle} color={Color.Green} />
            ) : null}
            {org.isDefaultDevHub ? (
              <List.Item.Detail.Metadata.TagList.Item text="Default Dev Hub" icon={Icon.Hammer} color={Color.Purple} />
            ) : null}
            {org.connectedStatus ? (
              <List.Item.Detail.Metadata.TagList.Item
                text={org.connectedStatus}
                icon={org.connectedStatus === "Connected" ? Icon.Wifi : Icon.Warning}
                color={org.connectedStatus === "Connected" ? Color.Green : Color.Yellow}
              />
            ) : null}
          </List.Item.Detail.Metadata.TagList>
          <List.Item.Detail.Metadata.TagList title="Username">
            <List.Item.Detail.Metadata.TagList.Item
              text={org.username}
              icon={Icon.AtSymbol}
              color={Color.SecondaryText}
              onAction={() => copyUsername(org.username)}
            />
          </List.Item.Detail.Metadata.TagList>
          <List.Item.Detail.Metadata.Separator />
          {name ? <List.Item.Detail.Metadata.Label title="Org Name" text={name} icon={Icon.Building} /> : null}
          <List.Item.Detail.Metadata.Label
            title={org.aliases.length > 1 ? "Aliases" : "Alias"}
            text={org.aliases.length > 0 ? org.aliases.join(", ") : org.alias}
            icon={Icon.Text}
          />
          {org.orgId ? <List.Item.Detail.Metadata.Label title="Org ID" text={org.orgId} icon={Icon.Hashtag} /> : null}
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Link title="Instance" text={org.instanceUrl} target={org.instanceUrl} />
        </List.Item.Detail.Metadata>
      }
    />
  );
};
