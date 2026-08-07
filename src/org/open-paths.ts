import { Icon } from "@raycast/api";

/** Paths available in the Open submenu (`sf org open --path`). */
export const OPEN_PATHS = [
  { name: "Lightning Home", path: "/lightning/page/home", icon: Icon.House },
  { name: "Setup", path: "/lightning/setup/SetupOneHome/home", icon: Icon.WrenchScrewdriver },
  { name: "Object Manager", path: "/lightning/setup/ObjectManager/home", icon: Icon.Box },
  { name: "Developer Console", path: "/_ui/common/apex/debug/ApexCSIPage", icon: Icon.Terminal },
  { name: "App Manager", path: "/lightning/setup/NavigationMenus/home", icon: Icon.AppWindow },
  { name: "Permission Sets", path: "/lightning/setup/PermSets/home", icon: Icon.Key },
] as const;
