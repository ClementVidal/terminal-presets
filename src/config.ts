import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import * as vscode from "vscode";
import { findFileUpward } from "./utils";

export enum TerminalColor {
  black = "black",
  white = "white",
  red = "red",
  green = "green",
  yellow = "yellow",
  blue = "blue",
  magenta = "magenta",
  cyan = "cyan",
}

export interface Terminal {
  cwd: string;
  name: string;
  icon: string;
  message: string;
  color: TerminalColor;
  env: Record<string, string>;
  shellPath: string;
  shellArgs: string[];
  command: string;
}

export interface Preset {
  name: string;
  terminals: Terminal[];
}

interface ConfigFile {
  default: Partial<Terminal>;
  presets: Preset[];
}

export interface Config {
  presets: Preset[];
}

interface Context {
  rootDir: string;
  default: Terminal;
}

/**
 * Parse a single terminal config, merge it with the default config
 */
const parseTerminal = (context: Context, config: Terminal): Terminal => {
  const terminal = Object.assign({}, context.default, config);

  if (!path.isAbsolute(terminal.cwd)) {
    terminal.cwd = path.resolve(context.rootDir, terminal.cwd);
  }

  if (!(terminal.color in TerminalColor)) {
    throw new Error(`Invalid color name: "${terminal.color}"`);
  }

  return terminal;
};

/**
 * Parse a single preset
 */
const parsePreset = (context: Context, config: Preset): Preset => {
  if (!config.name) {
    throw new Error("Misssing name for terminal preset");
  }

  return {
    name: config.name,
    terminals: config.terminals.map((t) => parseTerminal(context, t)),
  };
};

/**
 * Parse the default terminal
 */
const parseDefault = (config?: Partial<Terminal>): Terminal => {
  return Object.assign(
    {},
    {
      icon: "terminal-view-icon",
      shellArgs: ["-l"],
      message: null,
      shellPath: "/bin/bash",
      color: TerminalColor.white,
      cwd: "",
      env: {},
      name: "",
      command: null
    },
    config
  );
};

/**
 * Parse the whole config
 * @param filePath
 * @returns
 */
export const parseConfig = (filePath: string): Config => {
  let buffer: Buffer | null = null;

  try {
    buffer = fs.readFileSync(filePath);
  } catch (err) {
    throw new Error(`No config file found at: ${filePath}`);
  }

  let json: ConfigFile | null = null;

  try {
    json = JSON.parse(buffer.toString());
  } catch (err) {
    throw new Error(`Invalid JSON content in in config file: ${filePath}`);
  }

  if (json === null) {
    throw new Error("Invalid configuration file");
  }

  if (!Array.isArray(json.presets)) {
    throw new Error(
      "Malformed config file, presets field must exist and be an array"
    );
  }

  const context: Context = {
    default: parseDefault(json.default),
    rootDir: path.dirname(filePath),
  };

  return {
    presets: (json.presets as Preset[]).map((p) => parsePreset(context, p)),
  };
};

/**
 * Search for a config file by starting from a root directory and scanning parent
 * until the config file is found.
 *
 * Search will start from:
 *  - The workspace root dir if a workspace is loaded
 *  - The folder root dir if a folder is loaded
 *  - The current working dir of this vscode instance otherwise
 * @returns Path to the config file
 */
export const findConfigFile = (): string | null => {
  let root: string | null = null;
  if (vscode.workspace.workspaceFile) {
    root = vscode.workspace.workspaceFile.path;
  } else if (vscode.workspace.workspaceFolders?.length) {
    root = vscode.workspace.workspaceFolders[0].uri.path;
  } else {
    root = process.cwd();
  }
  if (root) {
    return findFileUpward(".terminal-presets.json", root);
  }
  return null;
};
