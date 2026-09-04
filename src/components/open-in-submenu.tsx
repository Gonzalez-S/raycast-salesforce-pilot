import { Action, ActionPanel, type Application, Icon } from "@raycast/api";
import { useState } from "react";

import { OPEN_PATHS } from "../org/open-paths";
import * as orgs from "../org/service";

type OpenInSubmenuProps = {
  onOpenIn: (browser: Application, path: string) => void;
};

/** Lazily lists installed browsers; each browser nests the usual org open paths. */
export const OpenInSubmenu = ({ onOpenIn }: OpenInSubmenuProps) => {
  const [browsers, setBrowsers] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <ActionPanel.Submenu
      title="Open in…"
      icon={Icon.AppWindow}
      isLoading={isLoading}
      onOpen={() => {
        if (isLoading) return;
        setIsLoading(true);
        orgs
          .listBrowsers()
          .then(setBrowsers)
          .finally(() => setIsLoading(false));
      }}
    >
      {browsers.map((browser) => (
        <ActionPanel.Submenu key={browser.path} title={browser.name} icon={{ fileIcon: browser.path }}>
          {OPEN_PATHS.map((item) => (
            <Action key={item.path} title={item.name} icon={item.icon} onAction={() => onOpenIn(browser, item.path)} />
          ))}
        </ActionPanel.Submenu>
      ))}
    </ActionPanel.Submenu>
  );
};
