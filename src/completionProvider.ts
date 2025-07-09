import * as vscode from 'vscode';
import * as path from 'path';

export class PolycrateCompletionProvider implements vscode.CompletionItemProvider {
    
    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        
        const line = document.lineAt(position);
        const lineText = line.text;
        const linePrefix = lineText.substring(0, position.character);
        
        // Determine context based on file type
        const fileName = path.basename(document.fileName);
        const isWorkspace = fileName === 'workspace.poly';
        const isBlock = fileName === 'block.poly';
        
        if (isWorkspace) {
            return this.getWorkspaceCompletions(linePrefix, position);
        } else if (isBlock) {
            return this.getBlockCompletions(linePrefix, position);
        }
        
        return [];
    }

    private getWorkspaceCompletions(linePrefix: string, position: vscode.Position): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        
        // Root level workspace fields
        const workspaceFields = [
            { name: 'name', detail: 'Workspace name (required)', documentation: 'The name of the workspace' },
            { name: 'description', detail: 'Workspace description', documentation: 'A description of the workspace' },
            { name: 'organization', detail: 'Organization name (required)', documentation: 'The organization this workspace belongs to' },
            { name: 'labels', detail: 'Workspace labels', documentation: 'Key-value pairs for labeling the workspace' },
            { name: 'alias', detail: 'Workspace aliases', documentation: 'Alternative names for the workspace' },
            { name: 'config', detail: 'Workspace configuration (required)', documentation: 'Configuration settings for the workspace' },
            { name: 'extraenv', detail: 'Extra environment variables', documentation: 'Additional environment variables' },
            { name: 'extramounts', detail: 'Extra volume mounts', documentation: 'Additional volume mounts for containers' },
            { name: 'events', detail: 'Event handlers', documentation: 'Event handling configuration' },
            { name: 'dependencies', detail: 'Workspace dependencies', documentation: 'Dependencies required by this workspace' },
            { name: 'sync', detail: 'Sync configuration', documentation: 'Git synchronization settings' },
            { name: 'inventory', detail: 'Ansible inventory', documentation: 'Ansible inventory configuration' },
            { name: 'kubeconfig', detail: 'Kubernetes config', documentation: 'Kubernetes configuration settings' },
            { name: 'registry', detail: 'Container registry', documentation: 'Container registry configuration' },
            { name: 'blocks', detail: 'Workspace blocks', documentation: 'Blocks defined in this workspace' },
            { name: 'workflows', detail: 'Workspace workflows', documentation: 'Workflows defined in this workspace' }
        ];
        
        // Config section fields
        const configFields = [
            { name: 'image', detail: 'Container image configuration', documentation: 'Container image settings' },
            { name: 'blocksroot', detail: 'Blocks directory (required)', documentation: 'Directory containing blocks' },
            { name: 'logsroot', detail: 'Logs directory (required)', documentation: 'Directory for storing logs' },
            { name: 'blocksconfig', detail: 'Block config filename', documentation: 'Filename for block configuration' },
            { name: 'workspaceconfig', detail: 'Workspace config filename', documentation: 'Filename for workspace configuration' },
            { name: 'workflowsroot', detail: 'Workflows directory', documentation: 'Directory containing workflows' },
            { name: 'artifactsroot', detail: 'Artifacts directory', documentation: 'Directory for build artifacts' },
            { name: 'containerroot', detail: 'Container root path', documentation: 'Root path inside container' },
            { name: 'sshprivatekey', detail: 'SSH private key file', documentation: 'SSH private key filename' },
            { name: 'sshpublickey', detail: 'SSH public key file', documentation: 'SSH public key filename' },
            { name: 'remoteroot', detail: 'Remote root path', documentation: 'Root path on remote systems' },
            { name: 'dockerfile', detail: 'Dockerfile path', documentation: 'Path to custom Dockerfile' },
            { name: 'globals', detail: 'Global variables', documentation: 'Global variables for the workspace' }
        ];
        
        // Check if we're in a config section
        const isInConfig = this.isInSection(linePrefix, 'config');
        
        if (isInConfig) {
            configFields.forEach(field => {
                const item = new vscode.CompletionItem(field.name, vscode.CompletionItemKind.Property);
                item.detail = field.detail;
                item.documentation = field.documentation;
                item.insertText = `${field.name}: `;
                completions.push(item);
            });
        } else {
            workspaceFields.forEach(field => {
                const item = new vscode.CompletionItem(field.name, vscode.CompletionItemKind.Property);
                item.detail = field.detail;
                item.documentation = field.documentation;
                item.insertText = `${field.name}: `;
                completions.push(item);
            });
        }
        
        return completions;
    }

    private getBlockCompletions(linePrefix: string, position: vscode.Position): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        
        // Root level block fields
        const blockFields = [
            { name: 'name', detail: 'Block name (required)', documentation: 'The name of the block' },
            { name: 'display_name', detail: 'Display name', documentation: 'Human-readable name for the block' },
            { name: 'description', detail: 'Block description', documentation: 'A description of the block' },
            { name: 'kind', detail: 'Block kind (required)', documentation: 'The type of block (generic, k8sapp, etc.)' },
            { name: 'type', detail: 'Block type', documentation: 'The application type (db, kv, mq, etc.)' },
            { name: 'flavor', detail: 'Block flavor', documentation: 'Specific flavor or variant' },
            { name: 'version', detail: 'Block version', documentation: 'Version of the block' },
            { name: 'labels', detail: 'Block labels', documentation: 'Key-value pairs for labeling' },
            { name: 'alias', detail: 'Block aliases', documentation: 'Alternative names for the block' },
            { name: 'icon_url', detail: 'Icon URL', documentation: 'URL to block icon' },
            { name: 'git_repository_url', detail: 'Git repository URL', documentation: 'URL to the git repository' },
            { name: 'license', detail: 'License', documentation: 'License identifier' },
            { name: 'license_url', detail: 'License URL', documentation: 'URL to license text' },
            { name: 'website_url', detail: 'Website URL', documentation: 'URL to project website' },
            { name: 'documentation_url', detail: 'Documentation URL', documentation: 'URL to documentation' },
            { name: 'releases_url', detail: 'Releases URL', documentation: 'URL to releases page' },
            { name: 'config', detail: 'Block configuration', documentation: 'Configuration settings for the block' },
            { name: 'actions', detail: 'Block actions', documentation: 'Actions available for this block' },
            { name: 'supports_ha', detail: 'High availability support', documentation: 'Whether the block supports high availability' },
            { name: 'template', detail: 'Template block', documentation: 'Whether this is a template block' },
            { name: 'from', detail: 'Base block', documentation: 'Base block to inherit from' },
            { name: 'workdir', detail: 'Working directory', documentation: 'Working directory configuration' },
            { name: 'inventory', detail: 'Inventory configuration', documentation: 'Ansible inventory settings' },
            { name: 'kubeconfig', detail: 'Kubeconfig settings', documentation: 'Kubernetes configuration' },
            { name: 'artifacts', detail: 'Artifacts configuration', documentation: 'Build artifacts settings' }
        ];
        
        // Block kinds
        const blockKinds = [
            { name: 'generic', detail: 'Generic block', documentation: 'Generic application block' },
            { name: 'k8sapp', detail: 'Kubernetes app', documentation: 'Kubernetes application block' },
            { name: 'k8scluster', detail: 'Kubernetes cluster', documentation: 'Kubernetes cluster block' },
            { name: 'db', detail: 'Database', documentation: 'Database block' },
            { name: 'kv', detail: 'Key-value store', documentation: 'Key-value store block' },
            { name: 'mq', detail: 'Message queue', documentation: 'Message queue block' },
            { name: 'app', detail: 'Application', documentation: 'Application block' }
        ];
        
        // Check if we're completing a kind value
        if (linePrefix.includes('kind:')) {
            blockKinds.forEach(kind => {
                const item = new vscode.CompletionItem(kind.name, vscode.CompletionItemKind.Value);
                item.detail = kind.detail;
                item.documentation = kind.documentation;
                completions.push(item);
            });
        } else {
            blockFields.forEach(field => {
                const item = new vscode.CompletionItem(field.name, vscode.CompletionItemKind.Property);
                item.detail = field.detail;
                item.documentation = field.documentation;
                item.insertText = `${field.name}: `;
                completions.push(item);
            });
        }
        
        return completions;
    }

    private isInSection(linePrefix: string, sectionName: string): boolean {
        // Simple check to see if we're inside a specific section
        // This is a basic implementation - could be enhanced with proper YAML parsing
        return linePrefix.includes(`${sectionName}:`);
    }
}