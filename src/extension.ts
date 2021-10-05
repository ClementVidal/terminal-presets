import * as vscode from "vscode"

import { command } from "./command"

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand(
        "terminal-presets.terminal-presets",
        command
    )

    context.subscriptions.push(disposable)
}

export function deactivate() {}
