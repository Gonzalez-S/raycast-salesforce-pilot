import { Action, ActionPanel, Grid, Icon, open } from "@raycast/api";
import { useCachedPromise, useCachedState } from "@raycast/utils";
import { useEffect, useMemo, useState } from "react";

import { filterIcons, loadIconCatalog, type SalesforceIcon } from "./icons/catalog";
import {
  ALL_CATEGORY,
  CATEGORY_CACHE_KEY,
  CATEGORY_LABEL,
  ICON_CATEGORIES,
  SLDS_ICONS_PAGE,
  type IconCategoryFilter,
} from "./icons/constants";
import { resolveIconPreviews } from "./icons/preview";
import { invalidateSldsCache } from "./slds/cache";
import { loadIconColorMap } from "./slds/icon-colors";

const PAGE_SIZE = 72;

const loadIconsWorkspace = async () => {
  const [catalog, colors] = await Promise.all([loadIconCatalog(), loadIconColorMap()]);
  return { catalog, colors };
};

export default function SalesforceIcons() {
  const { data, isLoading, revalidate } = useCachedPromise(loadIconsWorkspace);
  const [category, setCategory] = useCachedState<IconCategoryFilter>(CATEGORY_CACHE_KEY, "utility");
  const [searchText, setSearchText] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [cacheEpoch, setCacheEpoch] = useState(0);

  const catalog = data?.catalog;
  const colors = data?.colors ?? {};

  const filtered = useMemo(() => {
    const byCategory = filterIcons(catalog ?? [], category);
    const query = searchText.trim().toLowerCase();
    if (!query) return byCategory;
    return byCategory.filter((icon) => {
      const haystack = `${icon.apiName} ${icon.name.replaceAll("_", " ")} ${icon.category}`;
      return haystack.includes(query);
    });
  }, [catalog, category, searchText]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category, searchText]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visible.length < filtered.length;
  const visibleKey = `${visible.map((icon) => icon.apiName).join(",")}|${cacheEpoch}`;

  const { data: previews, isLoading: previewsLoading } = useCachedPromise(
    async (key: string) => {
      if (!key || !catalog) return {};
      const apiNames = key.split("|")[0];
      if (!apiNames) return {};
      const wanted = new Set(apiNames.split(","));
      return resolveIconPreviews(
        catalog.filter((icon) => wanted.has(icon.apiName)),
        colors,
      );
    },
    [visibleKey],
    { execute: Boolean(catalog) && visible.length > 0, keepPreviousData: true },
  );

  const readyIcons = visible.filter((icon) => Boolean(previews?.[icon.apiName]));
  const busy = isLoading || previewsLoading || (visible.length > 0 && readyIcons.length < visible.length);

  const refresh = async () => {
    invalidateSldsCache();
    setCacheEpoch((epoch) => epoch + 1);
    await revalidate();
  };

  return (
    <Grid
      columns={8}
      inset={Grid.Inset.Small}
      isLoading={busy}
      filtering={false}
      throttle
      onSearchTextChange={setSearchText}
      navigationTitle="Salesforce Icons"
      searchBarPlaceholder="Search icons (e.g. account, utility:add)"
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="Category"
          value={category}
          onChange={(value) => setCategory(value as IconCategoryFilter)}
        >
          <Grid.Dropdown.Item title={CATEGORY_LABEL.all} value={ALL_CATEGORY} />
          {ICON_CATEGORIES.map((id) => (
            <Grid.Dropdown.Item key={id} title={CATEGORY_LABEL[id]} value={id} />
          ))}
        </Grid.Dropdown>
      }
      pagination={{
        pageSize: PAGE_SIZE,
        hasMore,
        onLoadMore: () => setVisibleCount((count) => count + PAGE_SIZE),
      }}
    >
      {readyIcons.length === 0 && !busy ? (
        <Grid.EmptyView
          icon={Icon.Image}
          title={catalog ? "No matching icons" : "No icons"}
          description={
            catalog
              ? "Try another category or clear the search."
              : "Couldn’t load the Salesforce icon catalog. Try Refresh Catalog."
          }
          actions={
            <ActionPanel>
              <Action title="Refresh Catalog" icon={Icon.ArrowClockwise} onAction={refresh} />
              <Action title="Open SLDS Icons" icon={Icon.Globe} onAction={() => open(SLDS_ICONS_PAGE)} />
            </ActionPanel>
          }
        />
      ) : (
        readyIcons.map((icon) => (
          <IconItem key={icon.apiName} icon={icon} preview={previews![icon.apiName]} onRefresh={refresh} />
        ))
      )}
    </Grid>
  );
}

function IconItem({ icon, preview, onRefresh }: { icon: SalesforceIcon; preview: string; onRefresh: () => void }) {
  return (
    <Grid.Item
      content={{ source: preview, fallback: Icon.Image }}
      title={icon.name}
      subtitle={CATEGORY_LABEL[icon.category]}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Icon Name" content={icon.apiName} />
          <Action.CopyToClipboard
            title="Copy Lightning-Icon Markup"
            content={`<lightning-icon icon-name="${icon.apiName}"></lightning-icon>`}
          />
          <Action.CopyToClipboard title="Copy SVG URL" content={icon.svgUrl} />
          <Action.CopyToClipboard title="Copy PNG URL" content={icon.pngUrl} />
          <Action.OpenInBrowser title="Open SLDS Icons" url={SLDS_ICONS_PAGE} />
          <Action title="Refresh Catalog" icon={Icon.ArrowClockwise} onAction={onRefresh} />
        </ActionPanel>
      }
    />
  );
}
