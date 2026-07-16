import { Action, ActionPanel, Alert, confirmAlert, Icon, Keyboard, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";

import { AddOrgForm, EditOrgForm } from "./components/org-form";
import * as utils from "./lib/utils";
import { HOME_PATH, SETUP_PATH } from "./org/constants";
import * as orgs from "./org/service";
import * as presentation from "./org/presentation";
import type { Org, OrgDisplaySettings } from "./org/schemas";

export default function OrgsList() {
  const { data: orgList = [], isLoading, revalidate } = useCachedPromise(orgs.list);
  const sections = presentation.groupBySection(orgList);

  const addOrgAction = (
    <Action.Push
      title="Add Org"
      icon={Icon.Plus}
      shortcut={Keyboard.Shortcut.Common.New}
      target={<AddOrgForm onDone={revalidate} />}
    />
  );

  const onEdit = (org: Org) => async (displaySettings: OrgDisplaySettings) => {
    await orgs.saveSettings(org.username, displaySettings);
    revalidate();
  };

  const openOrg = (org: Org, path: string) => () =>
    utils.withAnimatedToast(`Opening ${presentation.title(org)}…`, () => orgs.open(org, path));

  const deleteOrg = (org: Org) => async () => {
    const confirmed = await confirmAlert({
      title: `Delete ${presentation.title(org)}?`,
      message: "Removes the org from the SF CLI keystore. You can re-authenticate later.",
      icon: Icon.Trash,
      primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;

    await utils.withAnimatedToast("Deleting…", async () => {
      await orgs.logout(org);
      revalidate();
    });
  };

  return (
    <List isLoading={isLoading} isShowingDetail={orgList.length > 0} filtering={{ keepSectionOrder: true }}>
      <List.EmptyView
        icon={Icon.Globe}
        actions={<ActionPanel>{addOrgAction}</ActionPanel>}
        title="No Salesforce orgs yet"
        description="Authenticate an org to get started. Orgs come from the SF CLI keystore."
      />

      {sections.map(({ name, sectionOrgs }) => (
        <List.Section key={name} title={name} subtitle={sectionOrgs.length.toString()}>
          {sectionOrgs.map((org) => (
            <List.Item
              key={org.username}
              title={presentation.title(org)}
              icon={{ source: Icon.CircleFilled, tintColor: org.color }}
              keywords={[org.alias, org.username, org.instanceUrl, org.section]}
              accessories={presentation.accessories(org)}
              detail={
                <List.Item.Detail
                  metadata={
                    <List.Item.Detail.Metadata>
                      <List.Item.Detail.Metadata.Label title="Alias" text={org.alias} />
                      <List.Item.Detail.Metadata.Label title="Username" text={org.username} />
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Link
                        title="Instance"
                        text={org.instanceUrl}
                        target={org.instanceUrl}
                      />
                    </List.Item.Detail.Metadata>
                  }
                />
              }
              actions={
                <ActionPanel>
                  <Action title="Open Home" icon={Icon.House} onAction={openOrg(org, HOME_PATH)} />
                  <Action
                    title="Open Setup"
                    onAction={openOrg(org, SETUP_PATH)}
                    icon={Icon.WrenchScrewdriver}
                    shortcut={Keyboard.Shortcut.Common.Save}
                  />
                  <Action.Push
                    title="Edit"
                    icon={Icon.Pencil}
                    shortcut={Keyboard.Shortcut.Common.Edit}
                    target={<EditOrgForm org={org} onSave={onEdit(org)} />}
                  />
                  {addOrgAction}
                  <Action
                    title="Delete"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    shortcut={Keyboard.Shortcut.Common.Remove}
                    onAction={deleteOrg(org)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
