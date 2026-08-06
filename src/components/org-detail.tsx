import { Clipboard, Color, Icon, List, showHUD } from "@raycast/api";

import * as presentation from "../org/presentation";
import type { Org } from "../org/schemas";

const copyUsername = async (username: string) => {
  await Clipboard.copy(username);
  await showHUD("Copied Username");
};

/** Right-hand detail metadata for a list row. */
export const OrgDetail = ({ org }: { org: Org }) => (
  <List.Item.Detail
    markdown={presentation.detailMarkdown(org)}
    metadata={
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.TagList title="Type">
          <List.Item.Detail.Metadata.TagList.Item
            text={presentation.kindLabel(org.kind)}
            icon={presentation.kindIcon(org.kind)}
            color={presentation.kindColor(org.kind)}
          />
          {org.favorite ? (
            <List.Item.Detail.Metadata.TagList.Item text="Favorite" icon={Icon.Star} color={org.color} />
          ) : null}
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
        <List.Item.Detail.Metadata.Label title="Alias" text={org.alias} icon={Icon.Text} />
        {org.orgId ? <List.Item.Detail.Metadata.Label title="Org ID" text={org.orgId} icon={Icon.Hashtag} /> : null}
        <List.Item.Detail.Metadata.Label title="Group" text={org.group} icon={Icon.Folder} />
        {org.orgEdition ? (
          <List.Item.Detail.Metadata.Label title="Edition" text={org.orgEdition} icon={Icon.Info} />
        ) : null}
        <List.Item.Detail.Metadata.Separator />
        <List.Item.Detail.Metadata.Link title="Instance" text={org.instanceUrl} target={org.instanceUrl} />
      </List.Item.Detail.Metadata>
    }
  />
);
