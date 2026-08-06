import { Action, ActionPanel, Alert, confirmAlert, Icon, Keyboard, List } from "@raycast/api";
import { useCachedPromise, useCachedState } from "@raycast/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AddOrgForm } from "./components/org-form";
import { OrgListItem } from "./components/org-list-item";
import * as utils from "./lib/utils";
import { ALL_SCOPE, RECENT_SCOPE, SCOPE_CACHE_KEY } from "./org/constants";
import * as presentation from "./org/presentation";
import type { Org, OrgDisplaySettings } from "./org/schemas";
import * as orgs from "./org/service";
import type { OrgAttachment } from "./project/schemas";
import * as projects from "./project/service";

const loadListData = () => projects.loadOrgsListData(orgs.list);

export default function OrgsList() {
  const { data, isLoading, revalidate } = useCachedPromise(loadListData);
  const [orgList, setOrgList] = useState<Org[]>([]);
  const [scope, setScope] = useCachedState(SCOPE_CACHE_KEY, ALL_SCOPE);

  // Apply remote orgs only when the shared load finishes (with projects in the same snapshot).
  useEffect(() => {
    if (data) setOrgList(data.orgs);
  }, [data]);

  const attachmentsByOrg = data?.attachmentsByOrg ?? {};
  const groups = useMemo(() => presentation.scopeOptions(orgList), [orgList]);
  const knownGroupNames = useMemo(() => groups.map((option) => option.title), [groups]);
  const activeScope =
    scope === ALL_SCOPE || scope === RECENT_SCOPE || groups.some((option) => option.id === scope) ? scope : ALL_SCOPE;
  const sections = useMemo(() => presentation.listSections(orgList, activeScope), [orgList, activeScope]);
  const ready = data !== undefined;

  const patchOrg = (username: string, patch: Partial<Org>) => {
    setOrgList((previous) => previous.map((org) => (org.username === username ? { ...org, ...patch } : org)));
  };

  const getAttachments = useCallback(
    (org: Org): OrgAttachment[] => attachmentsByOrg[org.username] ?? [],
    [attachmentsByOrg],
  );

  const rescanProjects = useCallback(async () => {
    await projects.scanProjects(orgList);
    await revalidate();
  }, [orgList, revalidate]);

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

  const togglePin = (org: Org) => async () => {
    const pinned = !org.pinned;
    await orgs.setPinned(org.username, pinned);
    patchOrg(org.username, { pinned });
  };

  const openOrg = (org: Org) => (path: string) =>
    utils.withClosedWindow(`Opened ${presentation.title(org)}`, () => orgs.open(org, path), {
      failureTitle: "Couldn’t open org",
    });

  const handleOpenProject = useCallback(
    (attachment: OrgAttachment) =>
      utils.withClosedWindow(`Opened ${attachment.entry.name}`, () => projects.openAttachment(attachment), {
        failureTitle: "Couldn’t open project",
      }),
    [],
  );

  const handleAttachmentsChange = useCallback(async () => {
    await revalidate();
  }, [revalidate]);

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
      await revalidate();
    });
  };

  const emptyTitle = orgList.length === 0 ? "No Salesforce orgs yet" : "No orgs in this scope";
  const emptyDescription =
    orgList.length === 0
      ? "Authenticate an org to get started. Assign groups when you add or edit orgs."
      : "Switch the dropdown to Recents, All Groups, or another group — or pin an org to keep it on top.";

  return (
    <List
      isLoading={isLoading || !ready}
      isShowingDetail={ready && orgList.length > 0}
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

      {ready
        ? sections.map((section) => (
            <List.Section key={section.id} title={section.title} subtitle={section.orgs.length.toString()}>
              {section.orgs.map((org) => (
                <OrgListItem
                  key={org.username}
                  org={org}
                  sectionId={section.id}
                  knownGroups={knownGroupNames}
                  attachments={getAttachments(org)}
                  addOrgAction={addOrgAction}
                  onTogglePin={togglePin(org)}
                  onSaveSettings={saveSettings(org)}
                  onOpen={openOrg(org)}
                  onOpenProject={handleOpenProject}
                  onAttachmentsChange={handleAttachmentsChange}
                  onRescanProjects={rescanProjects}
                  onDelete={deleteOrg(org)}
                />
              ))}
            </List.Section>
          ))
        : null}
    </List>
  );
}
