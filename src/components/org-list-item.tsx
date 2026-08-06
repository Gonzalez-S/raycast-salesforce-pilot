import { Action, ActionPanel, Icon, Keyboard, List } from "@raycast/api";
import type { ReactNode } from "react";

import { FAVORITES_SECTION, HOME_PATH, RECENT_SCOPE, SETUP_PATH } from "../org/constants";
import * as presentation from "../org/presentation";
import type { Org, OrgDisplaySettings } from "../org/schemas";
import { OrgDetail } from "./org-detail";
import { EditOrgForm } from "./org-form";

type OrgListItemProps = {
  org: Org;
  sectionId: string;
  knownGroups: string[];
  addOrgAction: ReactNode;
  onToggleFavorite: () => void;
  onSaveSettings: (settings: OrgDisplaySettings) => Promise<void>;
  onOpen: (path: string) => void;
  onDelete: () => void;
};

export const OrgListItem = ({
  org,
  sectionId,
  knownGroups,
  addOrgAction,
  onToggleFavorite,
  onSaveSettings,
  onOpen,
  onDelete,
}: OrgListItemProps) => {
  const inFavorites = sectionId === FAVORITES_SECTION;
  const inRecents = sectionId === RECENT_SCOPE;

  return (
    <List.Item
      title={presentation.title(org)}
      icon={{ source: Icon.CircleFilled, tintColor: org.color }}
      keywords={[
        org.alias,
        org.username,
        org.instanceUrl,
        org.orgId ?? "",
        org.group,
        presentation.kindLabel(org.kind),
        org.orgName ?? "",
      ]}
      accessories={presentation.accessories(org, {
        showGroup: inFavorites,
        showFavoriteIcon: inRecents && org.favorite,
      })}
      detail={<OrgDetail org={org} />}
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
          <ActionPanel.Section>
            <Action
              title={org.favorite ? "Remove from Favorites" : "Add to Favorites"}
              icon={org.favorite ? Icon.StarDisabled : Icon.Star}
              shortcut={Keyboard.Shortcut.Common.Pin}
              onAction={onToggleFavorite}
            />
            <Action.Push
              title="Edit"
              icon={Icon.Pencil}
              shortcut={Keyboard.Shortcut.Common.Edit}
              target={<EditOrgForm org={org} knownGroups={knownGroups} onSave={onSaveSettings} />}
            />
            {org.orgId ? (
              <Action.CopyToClipboard
                title="Copy Org ID"
                content={org.orgId}
                shortcut={Keyboard.Shortcut.Common.Copy}
              />
            ) : null}
            <Action.CopyToClipboard
              title="Copy Username"
              content={org.username}
              shortcut={Keyboard.Shortcut.Common.CopyName}
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
