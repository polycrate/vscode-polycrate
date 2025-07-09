import * as vscode from 'vscode';

export class PolycrateHoverProvider implements vscode.HoverProvider {
    
    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return null;
        }
        
        const word = document.getText(range);
        const line = document.lineAt(position);
        const lineText = line.text;
        
        // Check if the word is a Polycrate keyword
        const hoverInfo = this.getHoverInfo(word, lineText);
        
        if (hoverInfo) {
            return new vscode.Hover(hoverInfo, range);
        }
        
        return null;
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