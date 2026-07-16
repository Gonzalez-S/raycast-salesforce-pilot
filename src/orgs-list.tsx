import { Action, ActionPanel, Icon, Keyboard, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";

import { AddOrgForm, EditOrgForm } from "./components/org-form";
import { HOME_PATH, SETUP_PATH } from "./shared/constants";
import * as orgs from "./shared/orgs";

export default function OrgsList() {
  const { data: orgList = [], isLoading, revalidate, mutate } = useCachedPromise(orgs.list);
  const sections = orgs.groupBySection(orgList);

  const addOrgAction = (
    <Action.Push
      title="Add Org"
      icon={Icon.Plus}
      shortcut={Keyboard.Shortcut.Common.New}
      target={<AddOrgForm onDone={revalidate} />}
    />
  );

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
              title={orgs.title(org)}
              icon={{ source: Icon.CircleFilled, tintColor: org.color }}
              keywords={[org.alias, org.username, org.instanceUrl, org.section]}
              accessories={orgs.accessories(org)}
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
                  <Action title="Open Home" icon={Icon.House} onAction={() => orgs.open(org, HOME_PATH)} />
                  <Action
                    title="Open Setup"
                    onAction={() => orgs.open(org, SETUP_PATH)}
                    icon={Icon.WrenchScrewdriver}
                    shortcut={Keyboard.Shortcut.Common.Save}
                  />
                  <Action.Push
                    title="Edit"
                    icon={Icon.Pencil}
                    shortcut={Keyboard.Shortcut.Common.Edit}
                    target={
                      <EditOrgForm
                        org={org}
                        onSave={async (settings) => {
                          await mutate(orgs.saveSettings(org.username, settings), {
                            optimisticUpdate: (data) => orgs.applySettings(data ?? [], org.username, settings),
                            shouldRevalidateAfter: false,
                          });
                        }}
                      />
                    }
                  />
                  {addOrgAction}
                  <Action
                    title="Delete"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    shortcut={Keyboard.Shortcut.Common.Remove}
                    onAction={() => orgs.remove(org, revalidate)}
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
