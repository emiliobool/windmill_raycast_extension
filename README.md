# Windmill

Unofficial Windmill Extension for Raycast – Run flows and scripts directly from Raycast.

## Setup

Before using this extension, set up your workspace by following these steps:

1. **Workspace ID**: Enter your workspace name.
2. **Instance URL**: If you're using a self-hosted environment, enter your URL. Otherwise, retain the default setting.
3. **Access Token**: Create a token through the user settings.

Use the "Manage Workspaces" command to input your details. Once completed, the "View Flows", "View Scripts", and "View Apps" commands will become available.

## Flows Command

This primary command allows you to list all flows from your configured workspaces.

### Filters
Filter the flows by workspace using the dropdown menu (CMD + P).

### Actions

- **Open Flow Form** (Enter): Launch the built-in form to initiate a flow.
- **Open Flow** (CMD + O): Access the flow page in the Windmill web interface.
- **Edit Flow** (CMD + E): Edit the flow using the Windmill web interface.
- **Open Past Runs**: View previous runs on the Windmill web interface.
- **Add/Remove Star** (CMD + P): Modify your favorites list in the Windmill UI.
- **Refresh**: Bypass the local cache to update your flows list.

### Submit Flow Form
Review and amend all configured fields before executing the flow through Raycast.

#### Actions 
- **Submit Flow**: Commence the flow with the specified data, and then visualize the Result Page.
- **Open Flow** (CMD + O)
- **Edit Flow** (CMD + E)
- **Remove Star** (CMD + P)
- **Open Past Runs**

### Flow Result Page
View job information on this page. Once a job finishes, use cmd+enter to copy the outcome to your clipboard.

#### Actions 
- **Open Job** (Enter)
- **Copy Result** (CMD + SHIFT + C): Duplicate the result to your clipboard. (Available only after successful job completion)
- **Open Past Runs**

## View Scripts Command
Functionality mirrors the "Flows Command," facilitating the listing and submission of scripts. Supports resource inclusion during submission.

## View Apps Command
Utilize this command to enumerate all apps and access them in the Windmill web UI.
