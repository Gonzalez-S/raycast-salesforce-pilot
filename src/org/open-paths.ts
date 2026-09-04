import { Icon, type Image } from "@raycast/api";

/** Built-in shortcuts available when editing Open links (`sf org open --path`). */
export const OPEN_PATHS = [
  { name: "Lightning Home", path: "/lightning/page/home", icon: Icon.House },
  { name: "Setup", path: "/lightning/setup/SetupOneHome/home", icon: Icon.WrenchScrewdriver },
  { name: "Object Manager", path: "/lightning/setup/ObjectManager/home", icon: Icon.Box },
  { name: "Developer Console", path: "/_ui/common/apex/debug/ApexCSIPage", icon: Icon.Terminal },
  { name: "App Manager", path: "/lightning/setup/NavigationMenus/home", icon: Icon.AppWindow },
  { name: "Permission Sets", path: "/lightning/setup/PermSets/home", icon: Icon.Key },
] as const;

export type BuiltInOpenPath = (typeof OPEN_PATHS)[number];

/** Curated Raycast icons for Open link picker (value = Icon enum string). */
export const OPEN_LINK_ICON_OPTIONS = [
  { title: "Link", value: Icon.Link },
  { title: "House", value: Icon.House },
  { title: "Globe", value: Icon.Globe },
  { title: "Box", value: Icon.Box },
  { title: "Terminal", value: Icon.Terminal },
  { title: "App Window", value: Icon.AppWindow },
  { title: "Key", value: Icon.Key },
  { title: "Wrench", value: Icon.WrenchScrewdriver },
  { title: "Hammer", value: Icon.Hammer },
  { title: "Cog", value: Icon.Cog },
  { title: "Person", value: Icon.Person },
  { title: "Two People", value: Icon.TwoPeople },
  { title: "Building", value: Icon.Building },
  { title: "Folder", value: Icon.Folder },
  { title: "Document", value: Icon.BlankDocument },
  { title: "List", value: Icon.List },
  { title: "Bullet Points", value: Icon.BulletPoints },
  { title: "Check List", value: Icon.CheckList },
  { title: "Calendar", value: Icon.Calendar },
  { title: "Clock", value: Icon.Clock },
  { title: "Envelope", value: Icon.Envelope },
  { title: "Phone", value: Icon.Phone },
  { title: "Speech Bubble", value: Icon.Bubble },
  { title: "Star", value: Icon.Star },
  { title: "Heart", value: Icon.Heart },
  { title: "Bookmark", value: Icon.Bookmark },
  { title: "Tag", value: Icon.Tag },
  { title: "Hashtag", value: Icon.Hashtag },
  { title: "At Symbol", value: Icon.AtSymbol },
  { title: "Bar Chart", value: Icon.BarChart },
  { title: "Line Chart", value: Icon.LineChart },
  { title: "Bolt", value: Icon.Bolt },
  { title: "Bug", value: Icon.Bug },
  { title: "Code", value: Icon.Code },
  { title: "Eye", value: Icon.Eye },
  { title: "Finder", value: Icon.Finder },
  { title: "Image", value: Icon.Image },
  { title: "Layers", value: Icon.Layers },
  { title: "Magnifying Glass", value: Icon.MagnifyingGlass },
  { title: "Pencil", value: Icon.Pencil },
  { title: "Pin", value: Icon.Pin },
  { title: "Plus", value: Icon.Plus },
  { title: "Question Mark", value: Icon.QuestionMark },
  { title: "Receipt", value: Icon.Receipt },
  { title: "Shield", value: Icon.Shield },
  { title: "Store", value: Icon.Store },
  { title: "Trophy", value: Icon.Trophy },
  { title: "Wallet", value: Icon.Wallet },
] as const;

export type OpenLinkIcon = (typeof OPEN_LINK_ICON_OPTIONS)[number]["value"];

const OPEN_LINK_ICON_SET = new Set<string>(OPEN_LINK_ICON_OPTIONS.map((item) => item.value));

export const OPEN_LINK_ICON_VALUES = OPEN_LINK_ICON_OPTIONS.map((item) => item.value) as [
  OpenLinkIcon,
  ...OpenLinkIcon[],
];

/** One Open / Open in… menu item. */
export type OpenLink = {
  name: string;
  path: string;
  icon: OpenLinkIcon;
};

export type OpenLinkView = OpenLink & { icon: Image.ImageLike };

export const DEFAULT_OPEN_LINKS: OpenLink[] = OPEN_PATHS.map(({ name, path, icon }) => ({ name, path, icon }));

const BUILTIN_BY_PATH = new Map<string, BuiltInOpenPath>(OPEN_PATHS.map((item) => [item.path, item]));

export const isOpenLinkIcon = (value: string): value is OpenLinkIcon => OPEN_LINK_ICON_SET.has(value);

export const resolveOpenLinkIcon = (icon: string | undefined, path: string): OpenLinkIcon => {
  if (icon && isOpenLinkIcon(icon)) return icon;
  return BUILTIN_BY_PATH.get(path)?.icon ?? Icon.Link;
};

/** Trim and drop blanks; dedupe by path (first wins). */
export const normalizeOpenLinks = (links: Array<{ name: string; path: string; icon?: string }>): OpenLink[] => {
  const seen = new Set<string>();
  const result: OpenLink[] = [];
  for (const link of links) {
    const name = link.name.trim();
    const path = link.path.trim();
    if (!name || !path || seen.has(path)) continue;
    seen.add(path);
    result.push({ name, path, icon: resolveOpenLinkIcon(link.icon, path) });
  }
  return result;
};

/**
 * Links shown in Open menus.
 * Missing / empty stored list → full default catalog.
 */
export const resolveOpenLinks = (links: OpenLink[] | undefined): OpenLink[] => {
  const resolved = normalizeOpenLinks(links ?? DEFAULT_OPEN_LINKS);
  return resolved.length > 0 ? resolved : DEFAULT_OPEN_LINKS.map((link) => ({ ...link }));
};

export const toOpenLinkViews = (links: OpenLink[] | undefined): OpenLinkView[] =>
  resolveOpenLinks(links).map((link) => ({ ...link, icon: resolveOpenLinkIcon(link.icon, link.path) }));

export const moveOpenLink = (links: OpenLink[], index: number, delta: -1 | 1): OpenLink[] => {
  const nextIndex = index + delta;
  if (index < 0 || index >= links.length || nextIndex < 0 || nextIndex >= links.length) return links;
  const copy = [...links];
  const current = copy[index]!;
  copy[index] = copy[nextIndex]!;
  copy[nextIndex] = current;
  return copy;
};

/** Defaults not already present (by path). */
export const availableBuiltInOpenLinks = (links: OpenLink[]): OpenLink[] => {
  const used = new Set(links.map((link) => link.path));
  return DEFAULT_OPEN_LINKS.filter((link) => !used.has(link.path)).map((link) => ({ ...link }));
};

/**
 * Recently used first (newest timestamp wins); never-used keep configured order.
 */
export const sortOpenLinksByRecents = <T extends { path: string }>(
  links: T[],
  recents: Record<string, number>,
): T[] => {
  const indexByPath = new Map(links.map((link, index) => [link.path, index]));
  return [...links].sort((a, b) => {
    const aTime = recents[a.path] ?? 0;
    const bTime = recents[b.path] ?? 0;
    if (aTime !== bTime) return bTime - aTime;
    return (indexByPath.get(a.path) ?? 0) - (indexByPath.get(b.path) ?? 0);
  });
};
