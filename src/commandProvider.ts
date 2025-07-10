import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';
import { PolycrateVersionDiffProvider } from './versionDiffProvider';
import { PolycrateHubIntegrationProvider } from './hubIntegrationProvider';

export class PolycrateCommandProvider {
    private outputChannel: vscode.OutputChannel;
    private versionDiffProvider: PolycrateVersionDiffProvider;
    private hubIntegrationProvider: PolycrateHubIntegrationProvider;

    constructor(context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('Polycrate Commands');
        this.versionDiffProvider = new PolycrateVersionDiffProvider(context);
        this.hubIntegrationProvider = new PolycrateHubIntegrationProvider(context);
    }

    public validateWorkspace = async (): Promise<void> => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = activeEditor.document;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        this.outputChannel.show();
        this.outputChannel.appendLine('Validating workspace...');

        try {
            const result = await this.runPolycrateCommand(['workspace', 'inspect'], workspaceFolder.uri.fsPath);
            this.outputChannel.appendLine('Workspace validation completed successfully');
            this.outputChannel.appendLine(result);
            vscode.window.showInformationMessage('Workspace validation completed');
        } catch (error) {
            this.outputChannel.appendLine(`Workspace validation failed: ${error}`);
            vscode.window.showErrorMessage(`Workspace validation failed: ${error}`);
        }
    };

    public validateBlock = async (): Promise<void> => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = activeEditor.document;
        const fileName = path.basename(document.fileName);
        
        if (fileName !== 'block.poly') {
            vscode.window.showErrorMessage('Current file is not a block.poly file');
            return;
        }

        const blockDir = path.dirname(document.fileName);
        const blockName = path.basename(blockDir);

        this.outputChannel.show();
        this.outputChannel.appendLine(`Validating block: ${blockName}...`);

        try {
            const result = await this.runPolycrateCommand(['blocks', 'inspect', blockName], blockDir);
            this.outputChannel.appendLine('Block validation completed successfully');
            this.outputChannel.appendLine(result);
            vscode.window.showInformationMessage(`Block ${blockName} validation completed`);
        } catch (error) {
            this.outputChannel.appendLine(`Block validation failed: ${error}`);
            vscode.window.showErrorMessage(`Block validation failed: ${error}`);
        }
    };

    public searchBlocks = async (): Promise<void> => {
        const searchTerm = await vscode.window.showInputBox({
            prompt: 'Enter search term for blocks',
            placeHolder: 'e.g., postgresql, redis, nginx'
        });

        if (!searchTerm) {
            return;
        }

        this.outputChannel.show();
        this.outputChannel.appendLine(`Searching for blocks: ${searchTerm}...`);

        try {
            const result = await this.runPolycrateCommand(['blocks', 'search', searchTerm]);
            this.outputChannel.appendLine('Block search completed');
            this.outputChannel.appendLine(result);
            
            // Parse the result and show in a quick pick
            const blocks = this.parseBlockSearchResult(result);
            if (blocks.length > 0) {
                const selected = await vscode.window.showQuickPick(blocks, {
                    placeHolder: 'Select a block to view details'
                });
                
                if (selected) {
                    await this.showBlockDetails(selected.label);
                }
            } else {
                vscode.window.showInformationMessage('No blocks found matching the search term');
            }
        } catch (error) {
            this.outputChannel.appendLine(`Block search failed: ${error}`);
            vscode.window.showErrorMessage(`Block search failed: ${error}`);
        }
    };

    public showBlockChangelog = async (): Promise<void> => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = activeEditor.document;
        const fileName = path.basename(document.fileName);
        
        if (fileName !== 'block.poly') {
            vscode.window.showErrorMessage('Current file is not a block.poly file');
            return;
        }

        const blockDir = path.dirname(document.fileName);
        const changelogPath = path.join(blockDir, 'CHANGELOG.poly');

        try {
            const changelogUri = vscode.Uri.file(changelogPath);
            const changelogDoc = await vscode.workspace.openTextDocument(changelogUri);
            await vscode.window.showTextDocument(changelogDoc);
        } catch (error) {
            // If CHANGELOG.poly doesn't exist, try to fetch from remote
            const blockName = path.basename(blockDir);
            this.outputChannel.show();
            this.outputChannel.appendLine(`Fetching changelog for block: ${blockName}...`);

            try {
                const result = await this.runPolycrateCommand(['blocks', 'inspect', blockName, '--changelog']);
                this.outputChannel.appendLine('Changelog fetched successfully');
                this.outputChannel.appendLine(result);
                vscode.window.showInformationMessage(`Changelog for ${blockName} displayed in output`);
            } catch (cmdError) {
                this.outputChannel.appendLine(`Failed to fetch changelog: ${cmdError}`);
                vscode.window.showErrorMessage(`Failed to fetch changelog: ${cmdError}`);
            }
        }
    };

    public showBlockVersionDiff = async (): Promise<void> => {
        await this.versionDiffProvider.showBlockVersionDiff();
    };

    public compareBlockVersions = async (): Promise<void> => {
        // Get the current block name from active editor
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = activeEditor.document;
        const fileName = path.basename(document.fileName);
        
        if (fileName === 'block.poly') {
            // Extract block name from directory
            const blockDir = path.dirname(document.fileName);
            const blockName = path.basename(blockDir);
            await this.versionDiffProvider.showBlockVersionDiff(blockName);
        } else if (fileName === 'workspace.poly') {
            // Let user choose block from workspace
            await this.versionDiffProvider.showBlockVersionDiff();
        } else {
            vscode.window.showErrorMessage('Please open a block.poly or workspace.poly file');
        }
    };

    public discoverBlocks = async (): Promise<void> => {
        await this.hubIntegrationProvider.discoverBlocks();
    };

    private async runPolycrateCommand(args: string[], cwd?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const config = vscode.workspace.getConfiguration('polycrate');
            const cliPath = config.get('cli.path', 'polycrate');
            
            const child = spawn(cliPath, args, { 
                cwd: cwd || process.cwd(),
                stdio: 'pipe'
            });
            
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr}`));
                }
            });
            
            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    private parseBlockSearchResult(result: string): vscode.QuickPickItem[] {
        const items: vscode.QuickPickItem[] = [];
        
        // Simple parsing - this would need to be adapted based on actual CLI output format
        const lines = result.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            if (line.includes('Name:') || line.includes('Block:')) {
                const parts = line.split(':');
                if (parts.length >= 2) {
                    const name = parts[1].trim();
                    items.push({
                        label: name,
                        description: line.trim()
                    });
                }
            }
        }
        
        return items;
    }

    private async showBlockDetails(blockName: string): Promise<void> {
        try {
            const result = await this.runPolycrateCommand(['blocks', 'inspect', blockName]);
            
            // Create a new untitled document with the block details
            const doc = await vscode.workspace.openTextDocument({
                content: result,
                language: 'yaml'
            });
            
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get block details: ${error}`);
        }
    }
}