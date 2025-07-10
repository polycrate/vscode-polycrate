import * as vscode from 'vscode';
import * as path from 'path';

export class PolycrateHoverProvider implements vscode.HoverProvider {
    
    public async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return null;
        }
        
        const word = document.getText(range);
        const line = document.lineAt(position);
        const lineText = line.text;
        
        // Check if we're in a block config section
        const blockConfigPreview = await this.getBlockConfigPreview(document, position);
        if (blockConfigPreview) {
            return new vscode.Hover(blockConfigPreview, range);
        }
        
        // Check if the word is a Polycrate keyword
        const hoverInfo = this.getHoverInfo(word, lineText);
        
        if (hoverInfo) {
            return new vscode.Hover(hoverInfo, range);
        }
        
        return null;
    }

    private async getBlockConfigPreview(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.MarkdownString | null> {
        try {
            const fileName = path.basename(document.uri.fsPath);
            
            // Only show preview for workspace.poly files
            if (fileName !== 'workspace.poly') {
                return null;
            }
            
            // Check if we're in a block config section
            const blockInfo = this.getBlockContextAtPosition(document, position);
            if (!blockInfo) {
                return null;
            }
            
            // Find the block.poly file for this block
            const blockConfig = await this.loadBlockConfig(blockInfo.blockName, document.uri.fsPath);
            if (!blockConfig) {
                return null;
            }
            
            // Create preview markdown
            const markdown = new vscode.MarkdownString();
            markdown.isTrusted = true;
            markdown.supportHtml = true;
            
            markdown.appendMarkdown(`**Block Config Preview for '${blockInfo.blockName}'**\n\n`);
            
            if (blockConfig.config) {
                markdown.appendMarkdown('**Available configuration options:**\n\n');
                markdown.appendCodeblock(this.formatConfigPreview(blockConfig.config), 'yaml');
            } else {
                markdown.appendMarkdown('*No configuration options defined in block.poly*');
            }
            
            if (blockConfig.description) {
                markdown.appendMarkdown(`\n\n**Description:** ${blockConfig.description}`);
            }
            
            return markdown;
            
        } catch (error) {
            console.error('Error generating block config preview:', error);
            return null;
        }
    }

    private getBlockContextAtPosition(document: vscode.TextDocument, position: vscode.Position): { blockName: string; isInConfig: boolean } | null {
        const text = document.getText();
        let currentBlockName: string | null = null;
        let isInConfig = false;
        
        // Parse the document to find which block we're in
        const lines = text.split('\n');
        let currentLine = 0;
        let blockIndent = -1;
        let configIndent = -1;
        
        for (let i = 0; i <= position.line; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            const lineIndent = line.length - line.trimStart().length;
            
            // Check if we're starting a new block
            if (trimmedLine.startsWith('- name:')) {
                const nameMatch = trimmedLine.match(/- name:\s*(.+)/);
                if (nameMatch) {
                    currentBlockName = nameMatch[1].replace(/['"]/g, '');
                    blockIndent = lineIndent;
                    isInConfig = false;
                    configIndent = -1;
                }
            }
            // Check if we're in a config section
            else if (currentBlockName && trimmedLine === 'config:' && lineIndent > blockIndent) {
                isInConfig = true;
                configIndent = lineIndent;
            }
            // Check if we've left the config section
            else if (isInConfig && lineIndent <= configIndent && trimmedLine !== '') {
                isInConfig = false;
            }
            // Check if we've left the current block
            else if (currentBlockName && lineIndent <= blockIndent && trimmedLine !== '' && !trimmedLine.startsWith('- name:')) {
                currentBlockName = null;
                isInConfig = false;
            }
        }
        
        if (currentBlockName && isInConfig) {
            return { blockName: currentBlockName, isInConfig: true };
        }
        
        return null;
    }

    private async loadBlockConfig(blockName: string, workspaceFilePath: string): Promise<any> {
        try {
            const workspaceDir = path.dirname(workspaceFilePath);
            const blockDir = path.join(workspaceDir, 'blocks', blockName);
            const blockPolyPath = path.join(blockDir, 'block.poly');
            
            // Try to read the block.poly file
            const fs = require('fs');
            if (!fs.existsSync(blockPolyPath)) {
                return null;
            }
            
            const blockContent = fs.readFileSync(blockPolyPath, 'utf8');
            
            // Parse YAML
            let yaml;
            try {
                yaml = require('yaml');
            } catch (requireError) {
                return null;
            }
            
            return yaml.parse(blockContent);
            
        } catch (error) {
            console.error('Error loading block config:', error);
            return null;
        }
    }

    private formatConfigPreview(config: any, indent: string = ''): string {
        let result = '';
        
        if (typeof config === 'object' && config !== null) {
            for (const [key, value] of Object.entries(config)) {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    result += `${indent}${key}:\n`;
                    result += this.formatConfigPreview(value, indent + '  ');
                } else if (Array.isArray(value)) {
                    result += `${indent}${key}:\n`;
                    result += `${indent}  - # Array items\n`;
                } else {
                    result += `${indent}${key}: ${value}\n`;
                }
            }
        }
        
        return result;
    }

    private getHoverInfo(word: string, lineText: string): vscode.MarkdownString | null {
        const hoverMap: { [key: string]: { description: string; example?: string } } = {
            // Workspace fields
            'name': {
                description: 'The name of the workspace. This is a required field that identifies the workspace.',
                example: 'name: my-workspace'
            },
            'organization': {
                description: 'The organization this workspace belongs to. This is a required field.',
                example: 'organization: my-org'
            },
            'description': {
                description: 'A human-readable description of the workspace.',
                example: 'description: "My production workspace"'
            },
            'labels': {
                description: 'Key-value pairs for labeling and organizing the workspace.',
                example: 'labels:\n  environment: production\n  team: backend'
            },
            'config': {
                description: 'Configuration settings for the workspace. This is a required section.',
                example: 'config:\n  image:\n    reference: "registry.example.com/polycrate"\n    version: "latest"'
            },
            'blocks': {
                description: 'Blocks defined in this workspace. Each block represents a deployable component.',
                example: 'blocks:\n  - name: my-app\n    kind: k8sapp\n    version: "1.0.0"'
            },
            'workflows': {
                description: 'Workflows defined in this workspace. Workflows orchestrate multiple blocks.',
                example: 'workflows:\n  - name: deploy\n    steps:\n      - name: install\n        block: my-app'
            },
            
            // Block fields
            'kind': {
                description: 'The type of block. Valid values: generic, k8sapp, k8scluster, db, kv, mq, app',
                example: 'kind: k8sapp'
            },
            'type': {
                description: 'The application type. Common values: db, kv, mq, app, generic',
                example: 'type: db'
            },
            'flavor': {
                description: 'Specific flavor or variant of the block type.',
                example: 'flavor: postgresql'
            },
            'version': {
                description: 'Version of the block or application.',
                example: 'version: "1.0.0"'
            },
            'actions': {
                description: 'Actions available for this block. Actions define what operations can be performed.',
                example: 'actions:\n  - name: install\n    script:\n      - "helm install app chart/"'
            },
            'supports_ha': {
                description: 'Whether the block supports high availability deployment.',
                example: 'supports_ha: true'
            },
            
            // Config fields
            'image': {
                description: 'Container image configuration for the workspace.',
                example: 'image:\n  reference: "registry.example.com/polycrate"\n  version: "latest"'
            },
            'blocksroot': {
                description: 'Directory containing blocks. This is a required field.',
                example: 'blocksroot: "blocks"'
            },
            'logsroot': {
                description: 'Directory for storing execution logs. This is a required field.',
                example: 'logsroot: "logs"'
            },
            'globals': {
                description: 'Global variables available to all blocks in the workspace.',
                example: 'globals:\n  environment: production\n  region: us-east-1'
            },
            
            // Block kinds
            'generic': {
                description: 'Generic application block that can be used for any type of application.',
                example: 'kind: generic'
            },
            'k8sapp': {
                description: 'Kubernetes application block for deploying applications to Kubernetes.',
                example: 'kind: k8sapp'
            },
            'k8scluster': {
                description: 'Kubernetes cluster block for managing Kubernetes clusters.',
                example: 'kind: k8scluster'
            },
            'db': {
                description: 'Database block for database applications.',
                example: 'kind: db'
            },
            'kv': {
                description: 'Key-value store block for key-value databases.',
                example: 'kind: kv'
            },
            'mq': {
                description: 'Message queue block for message queuing systems.',
                example: 'kind: mq'
            },
            'app': {
                description: 'Application block for general applications.',
                example: 'kind: app'
            },
            
            // Action fields
            'script': {
                description: 'Shell scripts to execute for this action.',
                example: 'script:\n  - "echo Starting deployment"\n  - "kubectl apply -f manifests/"'
            },
            'playbook': {
                description: 'Ansible playbook to execute for this action.',
                example: 'playbook: "install.yml"'
            },
            'interactive': {
                description: 'Whether this action requires user interaction.',
                example: 'interactive: true'
            },
            'prompt': {
                description: 'Configuration for user prompts in interactive actions.',
                example: 'prompt:\n  message: "Continue with deployment?"'
            },
            
            // Chart fields
            'chart': {
                description: 'Helm chart configuration for Kubernetes applications.',
                example: 'chart:\n  name: postgresql\n  version: "11.0.0"\n  repo:\n    url: "https://charts.bitnami.com/bitnami"'
            },
            'persistence': {
                description: 'Storage persistence configuration for stateful applications.',
                example: 'persistence:\n  enabled: true\n  size: "10Gi"\n  storage_class: "standard"'
            },
            'ingress': {
                description: 'Ingress configuration for exposing services.',
                example: 'ingress:\n  enabled: true\n  host: "app.example.com"\n  class: "nginx"'
            },
            'monitoring': {
                description: 'Monitoring configuration for observability.',
                example: 'monitoring:\n  enabled: true\n  vmservicescrape:\n    enabled: true'
            }
        };
        
        const info = hoverMap[word];
        if (!info) {
            return null;
        }
        
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.supportHtml = true;
        
        markdown.appendMarkdown(`**${word}**\n\n`);
        markdown.appendMarkdown(info.description);
        
        if (info.example) {
            markdown.appendMarkdown('\n\n**Example:**\n\n');
            markdown.appendCodeblock(info.example, 'yaml');
        }
        
        return markdown;
    }
}