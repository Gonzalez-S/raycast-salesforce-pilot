import { Action, ActionPanel, type Application, Icon } from "@raycast/api";
import { useEffect, useState } from "react";

import { getOpenLinkRecents } from "../org/open-link-recents";
import { sortOpenLinksByRecents, type OpenLinkView } from "../org/open-paths";
import * as orgs from "../org/service";

type OpenSubmenuProps = {
  username: string;
  links: OpenLinkView[];
  onOpen: (path: string) => void;
};

/** Open menu; resorts by this org's recently used links when opened. */
export const OpenSubmenu = ({ username, links, onOpen }: OpenSubmenuProps) => {
  const [sorted, setSorted] = useState(links);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSorted(links);
  }, [links]);

  return (
    <ActionPanel.Submenu
      title="Open"
      icon={Icon.Globe}
      isLoading={isLoading}
      onOpen={() => {
        if (isLoading) return;
        setIsLoading(true);
        getOpenLinkRecents(username)
          .then((recents) => setSorted(sortOpenLinksByRecents(links, recents)))
          .finally(() => setIsLoading(false));
      }}
    >
      {sorted.map((item) => (
        <Action key={item.path} title={item.name} icon={item.icon} onAction={() => onOpen(item.path)} />
      ))}
    </ActionPanel.Submenu>
  );
};

type OpenInSubmenuProps = {
  username: string;
  links: OpenLinkView[];
  onOpenIn: (browser: Application, path: string) => void;
};

/** Lazily lists browsers (recent first); nests this org's open links (recent first). */
export const OpenInSubmenu = ({ username, links, onOpenIn }: OpenInSubmenuProps) => {
  const [browsers, setBrowsers] = useState<Application[]>([]);
  const [sortedLinks, setSortedLinks] = useState(links);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSortedLinks(links);
  }, [links]);

  return (
    <ActionPanel.Submenu
      title="Open in…"
      icon={Icon.AppWindow}
      isLoading={isLoading}
      onOpen={() => {
        if (isLoading) return;
        setIsLoading(true);
        Promise.all([orgs.listBrowsers(), getOpenLinkRecents(username)])
          .then(([nextBrowsers, recents]) => {
            setBrowsers(nextBrowsers);
            setSortedLinks(sortOpenLinksByRecents(links, recents));
          })
          .finally(() => setIsLoading(false));
      }}
    >
      {browsers.map((browser) => (
        <ActionPanel.Submenu key={browser.path} title={browser.name} icon={{ fileIcon: browser.path }}>
          {sortedLinks.map((item) => (
            <Action key={item.path} title={item.name} icon={item.icon} onAction={() => onOpenIn(browser, item.path)} />
          ))}
        </ActionPanel.Submenu>
      ))}
    </ActionPanel.Submenu>
  );
};
