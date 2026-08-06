import { Action, ActionPanel, Alert, confirmAlert, Icon, Keyboard, List } from "@raycast/api";
import { useCachedPromise, useCachedState } from "@raycast/utils";
import { useEffect, useMemo, useState } from "react";

import { AddOrgForm } from "./components/org-form";
import { OrgListItem } from "./components/org-list-item";
import * as utils from "./lib/utils";
import { ALL_SCOPE, RECENT_SCOPE, SCOPE_CACHE_KEY } from "./org/constants";
import * as presentation from "./org/presentation";
import type { Org, OrgDisplaySettings } from "./org/schemas";
import * as orgs from "./org/service";

export default function OrgsList() {
  const { data: remoteOrgs, isLoading, revalidate } = useCachedPromise(orgs.list);
  const [orgList, setOrgList] = useState<Org[]>([]);
  const [scope, setScope] = useCachedState(SCOPE_CACHE_KEY, ALL_SCOPE);

  // Sync from CLI only when the remote list refreshes (add / delete / manual reload).
  useEffect(() => {
    if (remoteOrgs) setOrgList(remoteOrgs);
  }, [remoteOrgs]);

  const groups = useMemo(() => presentation.scopeOptions(orgList), [orgList]);
  const knownGroupNames = useMemo(() => groups.map((option) => option.title), [groups]);
  const activeScope =
    scope === ALL_SCOPE || scope === RECENT_SCOPE || groups.some((option) => option.id === scope) ? scope : ALL_SCOPE;
  const sections = useMemo(() => presentation.listSections(orgList, activeScope), [orgList, activeScope]);

  const patchOrg = (username: string, patch: Partial<Org>) => {
    setOrgList((previous) => previous.map((org) => (org.username === username ? { ...org, ...patch } : org)));
  };

  const addOrgAction = (
    <Action.Push
      title="Add Org"
      icon={Icon.Plus}
      shortcut={Keyboard.Shortcut.Common.New}
      target={<AddOrgForm knownGroups={knownGroupNames} onDone={revalidate} />}
    />
  );

  const saveSettings = (org: Org) => async (displaySettings: OrgDisplaySettings) => {
    await orgs.saveSettings(org.username, displaySettings);
    patchOrg(org.username, displaySettings);
  };

  const toggleFavorite = (org: Org) => async () => {
    const favorite = !org.favorite;
    await orgs.setFavorite(org.username, favorite);
    patchOrg(org.username, { favorite });
  };

  const openOrg = (org: Org) => (path: string) =>
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

  const emptyTitle = orgList.length === 0 ? "No Salesforce orgs yet" : "No orgs in this scope";
  const emptyDescription =
    orgList.length === 0
      ? "Authenticate an org to get started. Assign groups when you add or edit orgs."
      : "Switch the dropdown to Recents, All Groups, or another group — or star an org to keep it on top.";

  return (
    <List
      isLoading={isLoading && orgList.length === 0}
      isShowingDetail={orgList.length > 0}
      filtering={{ keepSectionOrder: true }}
      searchBarPlaceholder="Search orgs by alias, username, or Org ID…"
      searchBarAccessory={
        <List.Dropdown tooltip="List scope" value={activeScope} onChange={setScope}>
          <List.Dropdown.Item title="Recents" value={RECENT_SCOPE} icon={Icon.Clock} />
          <List.Dropdown.Item title="All Groups" value={ALL_SCOPE} icon={Icon.Globe} />
          {groups.map((option) => (
            <List.Dropdown.Item key={option.id} title={option.title} value={option.id} />
          ))}
        </List.Dropdown>
      }
    >
      <List.EmptyView
        icon={Icon.Globe}
        actions={<ActionPanel>{addOrgAction}</ActionPanel>}
        title={emptyTitle}
        description={emptyDescription}
      />

      {sections.map((section) => (
        <List.Section key={section.id} title={section.title} subtitle={section.orgs.length.toString()}>
          {section.orgs.map((org) => (
            <OrgListItem
              key={org.username}
              org={org}
              sectionId={section.id}
              knownGroups={knownGroupNames}
              addOrgAction={addOrgAction}
              onToggleFavorite={toggleFavorite(org)}
              onSaveSettings={saveSettings(org)}
              onOpen={openOrg(org)}
              onDelete={deleteOrg(org)}
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
