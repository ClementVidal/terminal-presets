import * as fs from "fs"
import * as vscode from "vscode"
import {
    findConfigFile,
    parseConfig,
    Terminal,
    Config,
    TerminalColor,
} from "./config"
import { isNonEmptyString } from "./utils"

/**
 * Convert a terminal definition to a valid object that can be given to vscode.window.createTerminal
 */
function convertToTerminalOptions(terminal: Terminal): vscode.TerminalOptions {
    const colorMap = {
        [TerminalColor.black]: "terminal.ansiBlack",
        [TerminalColor.blue]: "terminal.ansiBlue",
        [TerminalColor.cyan]: "terminal.ansiCyan",
        [TerminalColor.green]: "terminal.ansiGreen",
        [TerminalColor.magenta]: "terminal.ansiMagenta",
        [TerminalColor.red]: "terminal.ansiRed",
        [TerminalColor.white]: "terminal.ansiWhite",
        [TerminalColor.yellow]: "terminal.ansiYellow",
    }
    return {
        color: terminal.color
            ? new vscode.ThemeColor(colorMap[terminal.color])
            : undefined,
        cwd: terminal.cwd,
        name: terminal.name,
        env: terminal.env,
        message: isNonEmptyString(terminal.message)
            ? terminal.message
            : undefined,
        shellArgs: terminal.shellArgs,
        shellPath: terminal.shellPath,
        iconPath: terminal.icon
            ? new vscode.ThemeIcon(terminal.icon)
            : undefined,
    }
}

export const command = async () => {
    // Find the config file in the currently open workspace or folder
    const configFile = findConfigFile()
    if (!configFile) {
        vscode.window.showErrorMessage("No config file found")
        return
    }
    let config: Config | null = null

    // Parse the config and assert everything is correct
    try {
        config = parseConfig(configFile as string)
    } catch (err) {
        if (err instanceof Error) {
            vscode.window.showErrorMessage(err.message)
        } else {
            vscode.window.showErrorMessage("Failled to load configuration file")
        }
        return
    }

    if (!config) {
        vscode.window.showErrorMessage("Failled to load configuration file")
        return
    }

    // Ask the user to select the desired preset
    const presets = config.presets
    const selectedPreset = await vscode.window.showQuickPick(
        presets.map((p) => p.name),
        { title: "Select a terminal preset" }
    )

    const preset = presets.find((p) => p.name === selectedPreset)
    if (!preset) {
        vscode.window.showErrorMessage("Invalid preset")
        return
    }

    // Create each terminals
    preset.terminals.forEach((terminal) => {
        if (terminal.cwd && !fs.existsSync(terminal.cwd)) {
            vscode.window.showErrorMessage(
                `Invalid working dir "${terminal.cwd}" for terminal "${terminal.name}" in preset "${preset.name}"`
            )
        } else {
            const t = convertToTerminalOptions(terminal)
            if (typeof t.shellPath === "string" && t.shellPath.length > 0) {
                const terminalInstance = vscode.window.createTerminal(t)
                if (terminal.command) {
                    terminalInstance.sendText(terminal.command, true)
                }
                terminalInstance.show()
            } else {
                vscode.window.showErrorMessage(
                    `Invalid shell path for terminal "${terminal.name}" in preset "${preset.name}"`
                )
            }
        }
    })
}
