# Salesforce Pilot

Raycast extension for opening and managing Salesforce orgs from your SF CLI keystore.

## Requirements

- [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) (`sf`) on your `PATH`

## Commands

### Salesforce Orgs

- List orgs from the SF CLI keystore
- Open common org paths via an **Open** submenu (Home, Setup, Object Manager, …)
- Authenticate Production / Sandbox orgs (optional default org / Dev Hub)
- Set global default org or Dev Hub; manage CLI aliases
- Local label, color, group, and pins; Recents / group scopes
- Scratch expiration tags; delete scratch orgs on the Dev Hub
- Auto-discover DX projects / workspaces from the scan folder; link via `target-org`
- Open linked projects in your editor; rescan on demand
- Clickable username / Org ID tags in the detail pane
- Import / export display prefs and pins

### Salesforce Icons

- Browse [Lightning Design System](https://www.lightningdesignsystem.com/icons/) icons (utility, standard, action, custom, doctype)
- Filter by category; search by name or `category:name`
- Styled previews match SLDS (rounded-square / circle chrome + brand colors from design tokens)
- Copy icon API name, `lightning-icon` markup, or CDN SVG/PNG URLs
- Catalog, icon colors, and previews are cached locally (CDN re-fetch at most weekly)

### Salesforce Colors

- Browse [Salesforce Cosmos](https://www.lightningdesignsystem.com/) (SLDS 2) theme colors
- Diagonal swatches show **light · dark** pairs from Cosmos `light-dark()` tokens
- Filter by Semantic / Palettes / Brand & Status scales (and per-family)
- Copy `var(--slds-g-…)`, hex values, or `light-dark(light, dark)`
- Theme CSS is cached weekly

## Preferences

- **Projects Scan Folder** (required) — root to scan for Salesforce DX projects and editor workspaces
- **Editor Command** — CLI on `PATH` used to open projects (`cursor`, `code`, …)
