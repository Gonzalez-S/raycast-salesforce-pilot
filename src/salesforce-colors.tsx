import { Action, ActionPanel, Grid, Icon, open } from "@raycast/api";
import { useCachedPromise, useCachedState } from "@raycast/utils";
import { useMemo, useState } from "react";

import {
  colorDisplayName,
  colorFamilies,
  filterColors,
  loadCosmosColors,
  type ColorGroup,
  type SalesforceColor,
} from "./slds/colors";
import { invalidateSldsCache } from "./slds/cache";

const SLDS2_COLORS_DOCS = "https://www.lightningdesignsystem.com/";
const GROUP_CACHE_KEY = "salesforce-pilot-colors-group";
const FAMILY_CACHE_KEY = "salesforce-pilot-colors-family";

type GroupFilter = ColorGroup | "all";

const GROUP_LABEL: Record<GroupFilter, string> = {
  all: "All",
  semantic: "Semantic",
  palette: "Palettes",
  scale: "Brand & Status Scales",
};

const familyLabel = (family: string) =>
  family
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function SalesforceColors() {
  const { data: colors, isLoading, revalidate } = useCachedPromise(loadCosmosColors);
  const [group, setGroup] = useCachedState<GroupFilter>(GROUP_CACHE_KEY, "semantic");
  const [family, setFamily] = useCachedState(FAMILY_CACHE_KEY, "all");
  const [searchText, setSearchText] = useState("");

  const families = useMemo(() => colorFamilies(colors ?? [], group), [colors, group]);
  const activeFamily = family === "all" || families.includes(family) ? family : "all";

  const filtered = useMemo(() => {
    const base = filterColors(colors ?? [], group, activeFamily);
    const query = searchText.trim().toLowerCase();
    if (!query) return base;
    return base.filter((color) => {
      const haystack = `${color.cssVar} ${color.name} ${color.family} ${color.light} ${color.dark}`;
      return haystack.includes(query);
    });
  }, [colors, group, activeFamily, searchText]);

  const sections = useMemo(() => {
    const byFamily = new Map<string, SalesforceColor[]>();
    for (const color of filtered) {
      const list = byFamily.get(color.family) ?? [];
      list.push(color);
      byFamily.set(color.family, list);
    }
    return [...byFamily.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const refresh = async () => {
    invalidateSldsCache();
    await revalidate();
  };

  return (
    <Grid
      columns={6}
      inset={Grid.Inset.Small}
      isLoading={isLoading}
      filtering={false}
      throttle
      onSearchTextChange={setSearchText}
      navigationTitle="Salesforce Colors"
      searchBarPlaceholder="Search Cosmos colors (e.g. surface-1, #0176d3)"
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="Category"
          value={`${group}:${activeFamily}`}
          onChange={(value) => {
            const [nextGroup, nextFamily = "all"] = value.split(":") as [GroupFilter, string];
            setGroup(nextGroup);
            setFamily(nextFamily);
          }}
        >
          <Grid.Dropdown.Section title="Browse">
            <Grid.Dropdown.Item title="All Colors" value="all:all" />
            <Grid.Dropdown.Item title="Semantic (UI hooks)" value="semantic:all" />
            <Grid.Dropdown.Item title="Palettes" value="palette:all" />
            <Grid.Dropdown.Item title="Brand & Status Scales" value="scale:all" />
          </Grid.Dropdown.Section>
          {group !== "all" && families.length > 0 ? (
            <Grid.Dropdown.Section title={`${GROUP_LABEL[group]} families`}>
              {families.map((id) => (
                <Grid.Dropdown.Item key={id} title={familyLabel(id)} value={`${group}:${id}`} />
              ))}
            </Grid.Dropdown.Section>
          ) : null}
        </Grid.Dropdown>
      }
    >
      {filtered.length === 0 && !isLoading ? (
        <Grid.EmptyView
          icon={Icon.Swatch}
          title={colors ? "No matching colors" : "No colors"}
          description={
            colors ? "Try another category or clear the search." : "Couldn’t load the Cosmos theme. Try Refresh Colors."
          }
          actions={
            <ActionPanel>
              <Action title="Refresh Colors" icon={Icon.ArrowClockwise} onAction={refresh} />
              <Action title="Open SLDS Docs" icon={Icon.Globe} onAction={() => open(SLDS2_COLORS_DOCS)} />
            </ActionPanel>
          }
        />
      ) : (
        sections.map(([sectionFamily, items]) => (
          <Grid.Section key={sectionFamily} title={familyLabel(sectionFamily)} subtitle={`${items.length}`}>
            {items.map((color) => (
              <ColorItem key={color.cssVar} color={color} onRefresh={refresh} />
            ))}
          </Grid.Section>
        ))
      )}
    </Grid>
  );
}

function ColorItem({ color, onRefresh }: { color: SalesforceColor; onRefresh: () => void }) {
  const subtitle = color.dual ? `${color.light} · ${color.dark}` : color.light;

  return (
    <Grid.Item
      content={{ source: color.swatchUrl, fallback: Icon.Swatch }}
      title={colorDisplayName(color.cssVar)}
      subtitle={subtitle}
      keywords={[color.name, color.cssVar, color.family, color.light, color.dark, color.group]}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy CSS Variable" content={`var(${color.cssVar})`} />
          <Action.CopyToClipboard title="Copy Token Name" content={color.cssVar} />
          {color.dual ? (
            <>
              <Action.CopyToClipboard title="Copy Light Hex" content={color.light} />
              <Action.CopyToClipboard title="Copy Dark Hex" content={color.dark} />
              <Action.CopyToClipboard
                title="Copy Light-Dark() Value"
                content={`light-dark(${color.light}, ${color.dark})`}
              />
            </>
          ) : (
            <Action.CopyToClipboard title="Copy Hex" content={color.light} />
          )}
          <Action.OpenInBrowser title="Open SLDS Docs" url={SLDS2_COLORS_DOCS} />
          <Action title="Refresh Colors" icon={Icon.ArrowClockwise} onAction={onRefresh} />
        </ActionPanel>
      }
    />
  );
}
