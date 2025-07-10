import * as vscode from 'vscode';
import { PolycrateLanguageServer } from './languageServer';
import { PolycrateCompletionProvider } from './completionProvider';
import { PolycrateHoverProvider } from './hoverProvider';
import { PolycrateValidationProvider } from './validationProvider';
import { PolycrateCommandProvider } from './commandProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Polycrate extension is now active!');

    const config = vscode.workspace.getConfiguration('polycrate');
    
    // Language server
    const languageServer = new PolycrateLanguageServer(context);
    
    // Completion provider
    if (config.get('completion.enable', true)) {
        const completionProvider = new PolycrateCompletionProvider();
        context.subscriptions.push(
            vscode.languages.registerCompletionItemProvider(
                { language: 'polycrate' },
                completionProvider,
                ':', '"', "'", '-', ' '
            )
        );
    }
    
    // Hover provider
    const hoverProvider = new PolycrateHoverProvider();
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { language: 'polycrate' },
            hoverProvider
        )
    );
    
    // Validation provider
    if (config.get('validation.enable', true)) {
        const validationProvider = new PolycrateValidationProvider(context);
        context.subscriptions.push(validationProvider);
    }
    
    // Command provider
    const commandProvider = new PolycrateCommandProvider(context);
    context.subscriptions.push(
        vscode.commands.registerCommand('polycrate.validateWorkspace', commandProvider.validateWorkspace),
        vscode.commands.registerCommand('polycrate.validateBlock', commandProvider.validateBlock),
        vscode.commands.registerCommand('polycrate.searchBlocks', commandProvider.searchBlocks),
        vscode.commands.registerCommand('polycrate.showBlockChangelog', commandProvider.showBlockChangelog),
        vscode.commands.registerCommand('polycrate.showBlockVersionDiff', commandProvider.showBlockVersionDiff),
        vscode.commands.registerCommand('polycrate.compareBlockVersions', commandProvider.compareBlockVersions),
        vscode.commands.registerCommand('polycrate.discoverBlocks', commandProvider.discoverBlocks)
    );
}

export function deactivate() {
    console.log('Polycrate extension is now deactivated!');
}