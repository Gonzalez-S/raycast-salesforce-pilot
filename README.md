# Salesforce Pilot

Raycast extension for opening and managing Salesforce orgs from your SF CLI keystore.

## Requirements

- [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) (`sf`) on your `PATH` — the extension shells out to `sf` for list, login, open, and logout

## Commands

### Salesforce Orgs

- Lists orgs from the SF CLI keystore (source of truth)
- Open Home or Setup with auto-login (frontdoor)
- Authenticate a new org into the CLI
- Edit local label, color, and group; pin orgs
- Filter by Recents, All Groups, or a manual group
- Auto-discover local DX projects / workspaces from a configured scan folder
- Open linked projects in your editor
- Delete an org from the CLI keystore (with confirmation)

## Preferences

- **Projects Scan Folder** (required) — root directory to scan for Salesforce DX projects and editor workspaces
- **Editor Command** — CLI on `PATH` used to open projects (`cursor`, `code`, …)
