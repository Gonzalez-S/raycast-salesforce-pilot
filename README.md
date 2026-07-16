# Salesforce Pilot

Raycast extension for opening and managing Salesforce orgs from your SF CLI keystore.

## Requirements

- [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) (`sf`) on your `PATH` — the extension shells out to `sf` for list, login, open, and logout

## Commands

### Salesforce Orgs

- Lists orgs from the SF CLI keystore (source of truth)
- Open Home or Setup with auto-login (frontdoor)
- Authenticate a new org into the CLI
- Edit local label, color, and section
- Delete an org from the CLI keystore (with confirmation)
