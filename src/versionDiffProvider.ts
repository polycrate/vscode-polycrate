import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

export class PolycrateVersionDiffProvider {
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.outputChannel = vscode.window.createOutputChannel('Polycrate Version Diff');
    }

    public async showBlockVersionDiff(blockName?: string): Promise<void> {
        try {
            const workspaceRoot = this.findWorkspaceRoot();
            if (!workspaceRoot) {
                vscode.window.showErrorMessage('No Polycrate workspace found');
                return;
            }

            // Get current workspace blocks
            const currentBlocks = await this.getCurrentWorkspaceBlocks(workspaceRoot);
            if (!currentBlocks || currentBlocks.length === 0) {
                vscode.window.showInformationMessage('No blocks found in workspace');
                return;
            }

            // If no block specified, let user choose
            if (!blockName) {
                const blockNames = currentBlocks.map(block => block.name);
                blockName = await vscode.window.showQuickPick(blockNames, {
                    placeHolder: 'Select a block to compare versions'
                });
                
                if (!blockName) {
                    return;
                }
            }

            // Find the selected block
            const block = currentBlocks.find(b => b.name === blockName);
            if (!block) {
                vscode.window.showErrorMessage(`Block '${blockName}' not found`);
                return;
            }

            // Show version diff options
            const diffOptions = [
                'Compare with registry latest',
                'Compare with previous workspace version',
                'Show version history'
            ];

            const selectedOption = await vscode.window.showQuickPick(diffOptions, {
                placeHolder: `Select comparison type for block '${blockName}'`
            });

            if (!selectedOption) {
                return;
            }

            switch (selectedOption) {
                case 'Compare with registry latest':
                    await this.compareWithRegistryLatest(block, workspaceRoot);
                    break;
                case 'Compare with previous workspace version':
                    await this.compareWithPreviousVersion(block, workspaceRoot);
                    break;
                case 'Show version history':
                    await this.showVersionHistory(block, workspaceRoot);
                    break;
            }

        } catch (error) {
            this.outputChannel.appendLine(`Error in version diff: ${error}`);
            vscode.window.showErrorMessage(`Error showing version diff: ${error}`);
        }
    }

    private async getCurrentWorkspaceBlocks(workspaceRoot: string): Promise<any[]> {
        try {
            const result = await this.runPolycrateCommand(['workspace', 'snapshot'], workspaceRoot);
            
            let yaml;
            try {
                yaml = require('yaml');
            } catch (requireError) {
                throw new Error('YAML module not available');
            }

            const snapshot = yaml.parse(result);
            const workspace = snapshot.workspace || snapshot;
            
            return workspace.blocks || [];
        } catch (error) {
            this.outputChannel.appendLine(`Error getting workspace blocks: ${error}`);
            return [];
        }
    }

    private async compareWithRegistryLatest(block: any, workspaceRoot: string): Promise<void> {
        try {
            this.outputChannel.appendLine(`Comparing block '${block.name}' with registry latest`);
            
            // Get registry information for the block
            const registryInfo = await this.getRegistryBlockInfo(block, workspaceRoot);
            if (!registryInfo) {
                vscode.window.showInformationMessage(`No registry information found for block '${block.name}'`);
                return;
            }

            // Create diff document
            const diffContent = this.createVersionDiffContent(
                block,
                registryInfo,
                'Current Workspace',
                'Registry Latest'
            );

            // Show diff in new editor
            await this.showDiffInEditor(
                diffContent,
                `${block.name} - Version Comparison`
            );

        } catch (error) {
            this.outputChannel.appendLine(`Error comparing with registry: ${error}`);
            vscode.window.showErrorMessage(`Error comparing with registry: ${error}`);
        }
    }

    private async compareWithPreviousVersion(block: any, workspaceRoot: string): Promise<void> {
        try {
            this.outputChannel.appendLine(`Comparing block '${block.name}' with previous version`);
            
            // Get git history for the block
            const gitHistory = await this.getBlockGitHistory(block.name, workspaceRoot);
            if (!gitHistory || gitHistory.length === 0) {
                vscode.window.showInformationMessage(`No git history found for block '${block.name}'`);
                return;
            }

            // Let user choose which version to compare with
            const commits = gitHistory.map(commit => ({
                label: commit.hash.substring(0, 8),
                description: commit.message,
                detail: commit.date
            }));

            const selectedCommit = await vscode.window.showQuickPick(commits, {
                placeHolder: 'Select previous version to compare with'
            });

            if (!selectedCommit) {
                return;
            }

            // Get the block content from the selected commit
            const previousBlock = await this.getBlockFromCommit(block.name, selectedCommit.label, workspaceRoot);
            if (!previousBlock) {
                vscode.window.showInformationMessage(`Could not retrieve block from commit ${selectedCommit.label}`);
                return;
            }

            // Create diff document
            const diffContent = this.createVersionDiffContent(
                previousBlock,
                block,
                `Previous (${selectedCommit.label})`,
                'Current'
            );

            // Show diff in new editor
            await this.showDiffInEditor(
                diffContent,
                `${block.name} - Version Comparison`
            );

        } catch (error) {
            this.outputChannel.appendLine(`Error comparing with previous version: ${error}`);
            vscode.window.showErrorMessage(`Error comparing with previous version: ${error}`);
        }
    }

    private async showVersionHistory(block: any, workspaceRoot: string): Promise<void> {
        try {
            this.outputChannel.appendLine(`Showing version history for block '${block.name}'`);
            
            // Get git history for the block
            const gitHistory = await this.getBlockGitHistory(block.name, workspaceRoot);
            if (!gitHistory || gitHistory.length === 0) {
                vscode.window.showInformationMessage(`No git history found for block '${block.name}'`);
                return;
            }

            // Create version history content
            const historyContent = this.createVersionHistoryContent(block, gitHistory);

            // Show history in new editor
            await this.showContentInEditor(
                historyContent,
                `${block.name} - Version History`,
                'markdown'
            );

        } catch (error) {
            this.outputChannel.appendLine(`Error showing version history: ${error}`);
            vscode.window.showErrorMessage(`Error showing version history: ${error}`);
        }
    }

    private async getRegistryBlockInfo(block: any, workspaceRoot: string): Promise<any> {
        try {
            // Try to get registry information
            if (block.from) {
                // Extract registry URL from 'from' field
                const fromParts = block.from.split('/');
                if (fromParts.length >= 2) {
                    const result = await this.runPolycrateCommand([
                        'blocks', 'search', '--registry', fromParts[0], block.name
                    ], workspaceRoot);
                    
                    let yaml;
                    try {
                        yaml = require('yaml');
                    } catch (requireError) {
                        return null;
                    }

                    return yaml.parse(result);
                }
            }
            
            return null;
        } catch (error) {
            this.outputChannel.appendLine(`Error getting registry info: ${error}`);
            return null;
        }
    }

    private async getBlockGitHistory(blockName: string, workspaceRoot: string): Promise<any[]> {
        try {
            const blockPath = path.join('blocks', blockName);
            const result = await this.runGitCommand([
                'log', '--oneline', '--pretty=format:%H|%s|%ad', '--date=short', '--', blockPath
            ], workspaceRoot);

            return result.split('\n').filter(line => line.trim()).map(line => {
                const parts = line.split('|');
                return {
                    hash: parts[0],
                    message: parts[1] || '',
                    date: parts[2] || ''
                };
            });
        } catch (error) {
            this.outputChannel.appendLine(`Error getting git history: ${error}`);
            return [];
        }
    }

    private async getBlockFromCommit(blockName: string, commitHash: string, workspaceRoot: string): Promise<any> {
        try {
            const blockPath = path.join('blocks', blockName, 'block.poly');
            const result = await this.runGitCommand([
                'show', `${commitHash}:${blockPath}`
            ], workspaceRoot);

            let yaml;
            try {
                yaml = require('yaml');
            } catch (requireError) {
                return null;
            }

            return yaml.parse(result);
        } catch (error) {
            this.outputChannel.appendLine(`Error getting block from commit: ${error}`);
            return null;
        }
    }

    private createVersionDiffContent(leftBlock: any, rightBlock: any, leftLabel: string, rightLabel: string): string {
        let content = `# Version Comparison\n\n`;
        content += `## ${leftLabel} vs ${rightLabel}\n\n`;
        
        // Compare key fields
        const fields = ['name', 'version', 'kind', 'type', 'flavor', 'from', 'description'];
        
        content += `| Field | ${leftLabel} | ${rightLabel} | Status |\n`;
        content += `|-------|${'-'.repeat(leftLabel.length)}|${'-'.repeat(rightLabel.length)}|--------|\n`;
        
        for (const field of fields) {
            const leftValue = leftBlock[field] || 'N/A';
            const rightValue = rightBlock[field] || 'N/A';
            const status = leftValue === rightValue ? '✓ Same' : '⚠ Different';
            
            content += `| ${field} | ${leftValue} | ${rightValue} | ${status} |\n`;
        }
        
        content += `\n## Configuration Differences\n\n`;
        
        // Compare configurations
        if (leftBlock.config || rightBlock.config) {
            content += `**${leftLabel} Config:**\n\`\`\`yaml\n`;
            content += leftBlock.config ? this.formatYaml(leftBlock.config) : 'No configuration';
            content += `\n\`\`\`\n\n`;
            
            content += `**${rightLabel} Config:**\n\`\`\`yaml\n`;
            content += rightBlock.config ? this.formatYaml(rightBlock.config) : 'No configuration';
            content += `\n\`\`\`\n\n`;
        }
        
        return content;
    }

    private createVersionHistoryContent(block: any, gitHistory: any[]): string {
        let content = `# Version History for ${block.name}\n\n`;
        content += `**Current Version:** ${block.version || 'N/A'}\n`;
        content += `**Current Kind:** ${block.kind || 'N/A'}\n`;
        content += `**Current Description:** ${block.description || 'N/A'}\n\n`;
        
        content += `## Git History\n\n`;
        
        for (const commit of gitHistory) {
            content += `### ${commit.hash.substring(0, 8)} - ${commit.date}\n`;
            content += `${commit.message}\n\n`;
        }
        
        content += `\n## Analysis\n\n`;
        content += `- Total commits affecting this block: ${gitHistory.length}\n`;
        content += `- Last modified: ${gitHistory[0]?.date || 'Unknown'}\n`;
        content += `- First commit: ${gitHistory[gitHistory.length - 1]?.date || 'Unknown'}\n`;
        
        return content;
    }

    private formatYaml(obj: any): string {
        try {
            let yaml;
            try {
                yaml = require('yaml');
            } catch (requireError) {
                return JSON.stringify(obj, null, 2);
            }

            return yaml.stringify(obj);
        } catch (error) {
            return JSON.stringify(obj, null, 2);
        }
    }

    private async showDiffInEditor(content: string, title: string): Promise<void> {
        await this.showContentInEditor(content, title, 'markdown');
    }

    private async showContentInEditor(content: string, title: string, language: string = 'plaintext'): Promise<void> {
        const doc = await vscode.workspace.openTextDocument({
            content: content,
            language: language
        });
        
        await vscode.window.showTextDocument(doc, {
            preview: true,
            viewColumn: vscode.ViewColumn.Beside
        });
    }

    private async runPolycrateCommand(args: string[], cwd: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const config = vscode.workspace.getConfiguration('polycrate');
            const cliPath = config.get('cli.path', 'polycrate');
            
            const child = spawn(cliPath, args, { 
                cwd: cwd,
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

    private async runGitCommand(args: string[], cwd: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const child = spawn('git', args, { 
                cwd: cwd,
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
                    reject(new Error(`Git command failed with code ${code}: ${stderr}`));
                }
            });
            
            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    private findWorkspaceRoot(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }

        // Check each workspace folder for Polycrate files
        for (const folder of workspaceFolders) {
            const folderPath = folder.uri.fsPath;
            if (this.isPolycrateworkspace(folderPath)) {
                return folderPath;
            }
        }

        return null;
    }

    private isPolycrateworkspace(folderPath: string): boolean {
        try {
            const fs = require('fs');
            const workspaceFiles = ['workspace.poly', '.workspace', '.polycrate'];
            return workspaceFiles.some(file => fs.existsSync(path.join(folderPath, file)));
        } catch (error) {
            return false;
        }
    }
}