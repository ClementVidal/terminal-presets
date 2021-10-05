# Terminal presets

Quickly create presets of preconfigured terminals (including terminal name, icon, color...)

This extension can be usefull when working in a monorepo where you work with multiple terminals open at the same time:

Instead of creating each terminal manually, write a config file that will describe your "terminal presets".

Each terminal preset consist of a name and a list of terminal to create.
For each terminal in a preset you can configure:

- It's name, icon, color
- It's shell process and args
- Environment variables
- A default command to execute once the terminal is started

## How to use it

First create a config file named `.terminal-presets.json` in your root folder.

Search in the command palette for the `Terminal presets` command.

Once invoked this command will ask you to select a preset and will create the appropriate terminals.

## Config file search algorithm

The extension will look for a config file named `.terminal-presets.json` that will contain your preset description.

Search is done with the following logic:

- If a folder is open in vscode, search will start at the root of that folder and search in parent directory recursively until the file is found.

- If workspace is open in vscode, search will start in the same directory as the one containing the `*.code-workspace` file and search in parent directory recursively until the file is found.

- If nothing is open in vscode, search will start in the current working directory (i.e the directory where vscode was started) and search in parent directory recursively until the file is found.

## Config file layout

Here is the "typescript" version of the expected config file layout:

```typescript
// Configuration object for a single terminal
interface Terminal {
  // The working directory of the terminal
  cwd?: string;
  // The name of the terminal
  name?: string;
  // The icon of the terminal
  // See https://code.visualstudio.com/api/references/icons-in-labels#icon-listing for a list of available icon
  icon?: string;
  // A message to display before the prompt is displayed
  message?: string;
  // The color of the terminal icon
  // See below for a list of available color
  color?: TerminalColor;
  // A map of enironment variable to pass to the terminal
  env?: Record<string, string>;
  // The path to your favorite shell
  shellPath?: string;
  // Args to pass to the shell process
  shellArgs?: string[];
  // A bash command executed in the terminal on startup
  command?: string;
}

// Configuration object for a whole preset
interface Preset {
  // Name displayed in the preset picker
  name: string;
  // The list of terminal to instanciate for that profile
  terminals: Terminal[];
}

// The config file layout
interface ConfigFile {
  // A default terminal configuration that will be merged with each individual terminal config in a preset
  default: Partial<Terminal>;
  // The list of available presets
  presets: Partial<Preset>[];
}
```

Note that every fields are optional.  
Once a terminal configuration is merged with the `default` config, if some fields are still missing they will be populated with the following values:

```json
{
  "icon": "terminal-view-icon",
  "color": "white",
}
```

### Available icons

You can provide any icon listed here:  
https://code.visualstudio.com/api/references/icons-in-labels#icon-listing

### Available colors

- "black"
- "white"
- "red"
- "green"
- "yellow"
- "blue"
- "magenta"
- "cyan"

## Configuration file example

```json
{
  "default": {
    "shellPath": "/opt/homebrew/bin/zsh",
    "shellArgs": ["-l"]
  },
  "presets": [
    {
      "name": "My App",
      "terminals": [
        {
          "icon": "default-view-icon",
          "name": "api",
          "color": "red",
          "cwd": "packages/api"
        },
        {
          "icon": "default-view-icon",
          "name": "app",
          "color": "green",
          "cwd": "packages/app",
          "env": {
            "api_url": "https://myapi.dev"
          }
        }
      ]
    }
  ]
}
```
