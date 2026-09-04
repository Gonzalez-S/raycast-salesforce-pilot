import { Action, ActionPanel, Form, Icon, Keyboard, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { useState } from "react";
import type * as z from "zod/mini";

import * as utils from "../lib/utils";
import {
  availableBuiltInOpenLinks,
  DEFAULT_OPEN_LINKS,
  moveOpenLink,
  OPEN_LINK_ICON_OPTIONS,
  resolveOpenLinkIcon,
  resolveOpenLinks,
  type OpenLink,
} from "../org/open-paths";
import { title as orgTitle } from "../org/presentation";
import {
  openLinkIconSchema,
  openLinkSchema,
  openLinksSchema,
  type OpenLinks,
  type Org,
  requiredStringSchema,
} from "../org/schemas";

type EditOpenLinksProps = {
  org: Org;
  onSave: (openLinks: OpenLinks) => Promise<void>;
};

const persist = async (links: OpenLink[], onSave: (openLinks: OpenLinks) => Promise<void>) => {
  const parsed = openLinksSchema.parse(links);
  await onSave(parsed);
  return parsed;
};

const OpenLinkForm = ({
  title,
  initial,
  existingPaths,
  onSubmit,
}: {
  title: string;
  initial?: OpenLink;
  /** Paths already used by other links (exclude current when editing). */
  existingPaths: string[];
  onSubmit: (link: OpenLink) => Promise<void>;
}) => {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const { handleSubmit, itemProps } = useForm<z.input<typeof openLinkSchema>>({
    initialValues: {
      name: initial?.name ?? "",
      path: initial?.path ?? "",
      icon: initial?.icon ?? Icon.Link,
    },
    validation: {
      name: utils.zodField(requiredStringSchema),
      icon: utils.zodField(openLinkIconSchema),
      path: (value) => {
        const required = utils.zodField(requiredStringSchema)(value);
        if (required) return required;
        const path = String(value).trim();
        if (existingPaths.includes(path)) return "A link with this path already exists";
        return undefined;
      },
    },
    onSubmit: async (formValues) => {
      const parsed = openLinkSchema.parse(formValues);
      setIsLoading(true);
      try {
        await onSubmit(parsed);
        pop();
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Couldn’t save link",
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const iconProps = utils.dropdownProps(itemProps.icon);

  return (
    <Form
      isLoading={isLoading}
      navigationTitle={title}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Link" icon={Icon.Check} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Path is passed to sf org open --path (the part after your instance URL)." />
      <Form.TextField title="Name" placeholder="Accounts" {...itemProps.name} />
      <Form.TextField title="Path" placeholder="/lightning/o/Account/list" {...itemProps.path} />
      <Form.Dropdown title="Icon" {...iconProps}>
        {OPEN_LINK_ICON_OPTIONS.map((option) => (
          <Form.Dropdown.Item key={option.value} value={option.value} title={option.title} icon={option.value} />
        ))}
      </Form.Dropdown>
    </Form>
  );
};

/** List editor: add/remove/reorder Open links for one org. */
export const EditOpenLinks = ({ org, onSave }: EditOpenLinksProps) => {
  const [links, setLinks] = useState<OpenLink[]>(() => resolveOpenLinks(org.openLinks));
  const [isSaving, setIsSaving] = useState(false);

  const apply = async (next: OpenLink[]) => {
    setIsSaving(true);
    try {
      const saved = await persist(next, onSave);
      setLinks(saved);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Couldn’t update open links",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const defaultsToAdd = availableBuiltInOpenLinks(links);

  return (
    <List
      isLoading={isSaving}
      navigationTitle={`Open Links · ${orgTitle(org)}`}
      searchBarPlaceholder="Filter open links…"
    >
      <List.EmptyView
        icon={Icon.Link}
        title="No open links"
        description="Add a Salesforce path shortcut for the Open menu."
        actions={
          <ActionPanel>
            <Action.Push
              title="Add Link…"
              icon={Icon.Plus}
              shortcut={Keyboard.Shortcut.Common.New}
              target={
                <OpenLinkForm
                  title="Add Link"
                  existingPaths={links.map((link) => link.path)}
                  onSubmit={async (link) => apply([...links, link])}
                />
              }
            />
            {defaultsToAdd.length > 0 ? (
              <ActionPanel.Submenu title="Add from Defaults…" icon={Icon.Plus}>
                {defaultsToAdd.map((link) => (
                  <Action key={link.path} title={link.name} icon={link.icon} onAction={() => apply([...links, link])} />
                ))}
              </ActionPanel.Submenu>
            ) : null}
            <Action
              title="Reset to Defaults"
              icon={Icon.ArrowCounterClockwise}
              onAction={() => apply(DEFAULT_OPEN_LINKS.map((link) => ({ ...link })))}
            />
          </ActionPanel>
        }
      />

      {links.map((link, index) => (
        <List.Item
          key={`${link.path}:${index}`}
          title={link.name}
          subtitle={link.path}
          icon={resolveOpenLinkIcon(link.icon, link.path)}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <Action.Push
                  title="Edit Link…"
                  icon={Icon.Pencil}
                  shortcut={Keyboard.Shortcut.Common.Edit}
                  target={
                    <OpenLinkForm
                      title="Edit Link"
                      initial={link}
                      existingPaths={links.filter((_, i) => i !== index).map((item) => item.path)}
                      onSubmit={async (next) => {
                        const copy = [...links];
                        copy[index] = next;
                        await apply(copy);
                      }}
                    />
                  }
                />
                <Action.Push
                  title="Add Link…"
                  icon={Icon.Plus}
                  shortcut={Keyboard.Shortcut.Common.New}
                  target={
                    <OpenLinkForm
                      title="Add Link"
                      existingPaths={links.map((item) => item.path)}
                      onSubmit={async (next) => apply([...links, next])}
                    />
                  }
                />
                {defaultsToAdd.length > 0 ? (
                  <ActionPanel.Submenu title="Add from Defaults…" icon={Icon.Plus}>
                    {defaultsToAdd.map((item) => (
                      <Action
                        key={item.path}
                        title={item.name}
                        icon={item.icon}
                        onAction={() => apply([...links, item])}
                      />
                    ))}
                  </ActionPanel.Submenu>
                ) : null}
              </ActionPanel.Section>
              <ActionPanel.Section>
                <Action
                  title="Move up"
                  icon={Icon.ArrowUp}
                  shortcut={Keyboard.Shortcut.Common.MoveUp}
                  onAction={() => apply(moveOpenLink(links, index, -1))}
                />
                <Action
                  title="Move Down"
                  icon={Icon.ArrowDown}
                  shortcut={Keyboard.Shortcut.Common.MoveDown}
                  onAction={() => apply(moveOpenLink(links, index, 1))}
                />
              </ActionPanel.Section>
              <ActionPanel.Section>
                <Action
                  title="Reset to Defaults"
                  icon={Icon.ArrowCounterClockwise}
                  onAction={() => apply(DEFAULT_OPEN_LINKS.map((item) => ({ ...item })))}
                />
                <Action
                  title="Remove"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  shortcut={Keyboard.Shortcut.Common.Remove}
                  onAction={() => {
                    if (links.length <= 1) {
                      showToast({
                        style: Toast.Style.Failure,
                        title: "Keep at least one open link",
                      });
                      return;
                    }
                    return apply(links.filter((_, i) => i !== index));
                  }}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
};
