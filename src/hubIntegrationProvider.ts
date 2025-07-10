import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

export class PolycrateHubIntegrationProvider {
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.outputChannel = vscode.window.createOutputChannel('Polycrate Hub');
    }

    public async discoverBlocks(): Promise<void> {
        try {
            this.outputChannel.show();
            this.outputChannel.appendLine('Discovering blocks from Polycrate Hub...');

            const searchOptions = [
                'Search by name',
                'Browse by category',
                'Browse by kind',
                'Show popular blocks',
                'Show recent blocks'
            ];

            const selectedOption = await vscode.window.showQuickPick(searchOptions, {
                placeHolder: 'How would you like to discover blocks?'
            });

            if (!selectedOption) {
                return;
            }

            switch (selectedOption) {
                case 'Search by name':
                    await this.searchBlocksByName();
                    break;
                case 'Browse by category':
                    await this.browseByCategory();
                    break;
                case 'Browse by kind':
                    await this.browseByKind();
                    break;
                case 'Show popular blocks':
                    await this.showPopularBlocks();
                    break;
                case 'Show recent blocks':
                    await this.showRecentBlocks();
                    break;
            }

        } catch (error) {
            this.outputChannel.appendLine(`Error discovering blocks: ${error}`);
            vscode.window.showErrorMessage(`Error discovering blocks: ${error}`);
        }
    }

    private async searchBlocksByName(): Promise<void> {
        const searchTerm = await vscode.window.showInputBox({
            prompt: 'Enter block name or keyword to search',
            placeHolder: 'e.g., postgresql, redis, nginx, nodejs'
        });

        if (!searchTerm) {
            return;
        }

        this.outputChannel.appendLine(`Searching for blocks: ${searchTerm}`);

        try {
            const blocks = await this.searchBlocks(searchTerm);
            await this.displayBlockResults(blocks, `Search results for "${searchTerm}"`);
        } catch (error) {
            this.outputChannel.appendLine(`Search failed: ${error}`);
            vscode.window.showErrorMessage(`Block search failed: ${error}`);
        }
    }

    private async browseByCategory(): Promise<void> {
        const categories = [
            'Database',
            'Web Server',
            'Application Framework',
            'Message Queue',
            'Cache',
            'Monitoring',
            'CI/CD',
            'Security',
            'Storage',
            'Networking'
        ];

        const selectedCategory = await vscode.window.showQuickPick(categories, {
            placeHolder: 'Select a category to browse'
        });

        if (!selectedCategory) {
            return;
        }

        this.outputChannel.appendLine(`Browsing blocks in category: ${selectedCategory}`);

        try {
            const blocks = await this.getBlocksByCategory(selectedCategory);
            await this.displayBlockResults(blocks, `Blocks in category: ${selectedCategory}`);
        } catch (error) {
            this.outputChannel.appendLine(`Browse by category failed: ${error}`);
            vscode.window.showErrorMessage(`Failed to browse category: ${error}`);
        }
    }

    private async browseByKind(): Promise<void> {
        const kinds = [
            'generic',
            'k8sapp',
            'k8scluster',
            'db',
            'kv',
            'mq',
            'app'
        ];

        const selectedKind = await vscode.window.showQuickPick(kinds, {
            placeHolder: 'Select a block kind to browse'
        });

        if (!selectedKind) {
            return;
        }

        this.outputChannel.appendLine(`Browsing blocks of kind: ${selectedKind}`);

        try {
            const blocks = await this.getBlocksByKind(selectedKind);
            await this.displayBlockResults(blocks, `Blocks of kind: ${selectedKind}`);
        } catch (error) {
            this.outputChannel.appendLine(`Browse by kind failed: ${error}`);
            vscode.window.showErrorMessage(`Failed to browse kind: ${error}`);
        }
    }

    private async showPopularBlocks(): Promise<void> {
        this.outputChannel.appendLine('Fetching popular blocks...');

        try {
            const blocks = await this.getPopularBlocks();
            await this.displayBlockResults(blocks, 'Popular Blocks');
        } catch (error) {
            this.outputChannel.appendLine(`Failed to get popular blocks: ${error}`);
            vscode.window.showErrorMessage(`Failed to get popular blocks: ${error}`);
        }
    }

    private async showRecentBlocks(): Promise<void> {
        this.outputChannel.appendLine('Fetching recent blocks...');

        try {
            const blocks = await this.getRecentBlocks();
            await this.displayBlockResults(blocks, 'Recent Blocks');
        } catch (error) {
            this.outputChannel.appendLine(`Failed to get recent blocks: ${error}`);
            vscode.window.showErrorMessage(`Failed to get recent blocks: ${error}`);
        }
    }

    private async searchBlocks(searchTerm: string): Promise<any[]> {
        try {
            const workspaceRoot = this.findWorkspaceRoot();
            const result = await this.runPolycrateCommand(['blocks', 'search', searchTerm], workspaceRoot || undefined);
            
            return this.parseBlockSearchResults(result);
        } catch (error) {
            this.outputChannel.appendLine(`CLI search failed, using mock data: ${error}`);
            // Return mock data for demo purposes
            return this.getMockSearchResults(searchTerm);
        }
    }

    private async getBlocksByCategory(category: string): Promise<any[]> {
        try {
            const workspaceRoot = this.findWorkspaceRoot();
            const result = await this.runPolycrateCommand(['blocks', 'list', '--category', category.toLowerCase()], workspaceRoot || undefined);
            
            return this.parseBlockSearchResults(result);
        } catch (error) {
            this.outputChannel.appendLine(`CLI category search failed, using mock data: ${error}`);
            // Return mock data for demo purposes
            return this.getMockCategoryResults(category);
        }
    }

    private async getBlocksByKind(kind: string): Promise<any[]> {
        try {
            const workspaceRoot = this.findWorkspaceRoot();
            const result = await this.runPolycrateCommand(['blocks', 'list', '--kind', kind], workspaceRoot || undefined);
            
            return this.parseBlockSearchResults(result);
        } catch (error) {
            this.outputChannel.appendLine(`CLI kind search failed, using mock data: ${error}`);
            // Return mock data for demo purposes
            return this.getMockKindResults(kind);
        }
    }

    private async getPopularBlocks(): Promise<any[]> {
        try {
            const workspaceRoot = this.findWorkspaceRoot();
            const result = await this.runPolycrateCommand(['blocks', 'list', '--popular'], workspaceRoot || undefined);
            
            return this.parseBlockSearchResults(result);
        } catch (error) {
            this.outputChannel.appendLine(`CLI popular search failed, using mock data: ${error}`);
            // Return mock data for demo purposes
            return this.getMockPopularResults();
        }
    }

    private async getRecentBlocks(): Promise<any[]> {
        try {
            const workspaceRoot = this.findWorkspaceRoot();
            const result = await this.runPolycrateCommand(['blocks', 'list', '--recent'], workspaceRoot || undefined);
            
            return this.parseBlockSearchResults(result);
        } catch (error) {
            this.outputChannel.appendLine(`CLI recent search failed, using mock data: ${error}`);
            // Return mock data for demo purposes
            return this.getMockRecentResults();
        }
    }

    private async displayBlockResults(blocks: any[], title: string): Promise<void> {
        if (!blocks || blocks.length === 0) {
            vscode.window.showInformationMessage('No blocks found matching your criteria.');
            return;
        }

        const items = blocks.map(block => ({
            label: block.name,
            description: `${block.kind || 'unknown'} - ${block.version || 'latest'}`,
            detail: block.description || 'No description available',
            block: block
        }));

        const selectedItem = await vscode.window.showQuickPick(items, {
            placeHolder: `${title} (${blocks.length} results)`
        });

        if (selectedItem) {
            await this.showBlockDetails(selectedItem.block);
        }
    }

    private async showBlockDetails(block: any): Promise<void> {
        const actions = [
            'View block details',
            'Add to workspace',
            'Copy block reference',
            'View documentation',
            'View source code'
        ];

        const selectedAction = await vscode.window.showQuickPick(actions, {
            placeHolder: `What would you like to do with ${block.name}?`
        });

        if (!selectedAction) {
            return;
        }

        switch (selectedAction) {
            case 'View block details':
                await this.viewBlockDetails(block);
                break;
            case 'Add to workspace':
                await this.addBlockToWorkspace(block);
                break;
            case 'Copy block reference':
                await this.copyBlockReference(block);
                break;
            case 'View documentation':
                await this.viewBlockDocumentation(block);
                break;
            case 'View source code':
                await this.viewBlockSource(block);
                break;
        }
    }

    private async viewBlockDetails(block: any): Promise<void> {
        const content = this.formatBlockDetails(block);
        
        const doc = await vscode.workspace.openTextDocument({
            content: content,
            language: 'markdown'
        });
        
        await vscode.window.showTextDocument(doc, {
            preview: true,
            viewColumn: vscode.ViewColumn.Beside
        });
    }

    private async addBlockToWorkspace(block: any): Promise<void> {
        const workspaceFiles = await vscode.workspace.findFiles('**/workspace.poly');
        
        if (workspaceFiles.length === 0) {
            vscode.window.showErrorMessage('No workspace.poly file found in current workspace');
            return;
        }

        let targetFile = workspaceFiles[0];
        if (workspaceFiles.length > 1) {
            const fileItems = workspaceFiles.map(file => ({
                label: path.basename(file.fsPath),
                description: path.dirname(file.fsPath),
                uri: file
            }));

            const selectedFile = await vscode.window.showQuickPick(fileItems, {
                placeHolder: 'Select workspace file to add block to'
            });

            if (!selectedFile) {
                return;
            }

            targetFile = selectedFile.uri;
        }

        try {
            const document = await vscode.workspace.openTextDocument(targetFile);
            const edit = new vscode.WorkspaceEdit();
            
            // Find the blocks section and add the new block
            const blockEntry = this.generateBlockEntry(block);
            const insertPosition = this.findBlocksInsertPosition(document);
            
            edit.insert(targetFile, insertPosition, blockEntry);
            
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                vscode.window.showInformationMessage(`Block ${block.name} added to workspace`);
                await vscode.window.showTextDocument(document);
            } else {
                vscode.window.showErrorMessage('Failed to add block to workspace');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to add block: ${error}`);
        }
    }

    private async copyBlockReference(block: any): Promise<void> {
        const reference = `${block.registry || 'hub.polycrate.io'}/${block.name}:${block.version || 'latest'}`;
        await vscode.env.clipboard.writeText(reference);
        vscode.window.showInformationMessage(`Block reference copied: ${reference}`);
    }

    private async viewBlockDocumentation(block: any): Promise<void> {
        if (block.documentation_url) {
            vscode.env.openExternal(vscode.Uri.parse(block.documentation_url));
        } else {
            vscode.window.showInformationMessage('No documentation URL available for this block');
        }
    }

    private async viewBlockSource(block: any): Promise<void> {
        if (block.git_repository_url) {
            vscode.env.openExternal(vscode.Uri.parse(block.git_repository_url));
        } else {
            vscode.window.showInformationMessage('No source repository URL available for this block');
        }
    }

    private parseBlockSearchResults(output: string): any[] {
        // Parse CLI output - this would need to be adapted based on actual CLI format
        const blocks: any[] = [];
        
        try {
            // Try to parse as YAML first
            let yaml;
            try {
                yaml = require('yaml');
                const parsed = yaml.parse(output);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
                if (parsed && parsed.blocks) {
                    return parsed.blocks;
                }
            } catch (yamlError) {
                // Fall back to line parsing
            }
            
            // Simple line-based parsing
            const lines = output.split('\n').filter(line => line.trim());
            for (const line of lines) {
                if (line.includes('Name:') || line.includes('Block:')) {
                    const parts = line.split(/[:\s]+/);
                    if (parts.length >= 2) {
                        blocks.push({
                            name: parts[1],
                            kind: 'generic',
                            version: '1.0.0',
                            description: line
                        });
                    }
                }
            }
        } catch (error) {
            this.outputChannel.appendLine(`Error parsing search results: ${error}`);
        }
        
        return blocks;
    }

    private formatBlockDetails(block: any): string {
        let content = `# ${block.name}\n\n`;
        
        if (block.display_name && block.display_name !== block.name) {
            content += `**Display Name:** ${block.display_name}\n\n`;
        }
        
        if (block.description) {
            content += `**Description:** ${block.description}\n\n`;
        }
        
        content += `## Block Information\n\n`;
        content += `| Property | Value |\n`;
        content += `|----------|-------|\n`;
        content += `| Name | ${block.name} |\n`;
        content += `| Kind | ${block.kind || 'generic'} |\n`;
        content += `| Type | ${block.type || 'N/A'} |\n`;
        content += `| Version | ${block.version || 'latest'} |\n`;
        content += `| Registry | ${block.registry || 'hub.polycrate.io'} |\n`;
        
        if (block.flavor) {
            content += `| Flavor | ${block.flavor} |\n`;
        }
        
        if (block.supports_ha !== undefined) {
            content += `| High Availability | ${block.supports_ha ? 'Yes' : 'No'} |\n`;
        }
        
        if (block.license) {
            content += `| License | ${block.license} |\n`;
        }
        
        content += `\n## Usage\n\n`;
        content += `Add this block to your workspace:\n\n`;
        content += `\`\`\`yaml\n`;
        content += `blocks:\n`;
        content += `  - name: ${block.name}\n`;
        content += `    kind: ${block.kind || 'generic'}\n`;
        content += `    from: "${block.registry || 'hub.polycrate.io'}/${block.name}:${block.version || 'latest'}"\n`;
        
        if (block.config && Object.keys(block.config).length > 0) {
            content += `    config:\n`;
            for (const [key, value] of Object.entries(block.config)) {
                content += `      ${key}: ${JSON.stringify(value)}\n`;
            }
        }
        
        content += `\`\`\`\n\n`;
        
        if (block.documentation_url) {
            content += `## Links\n\n`;
            content += `- [Documentation](${block.documentation_url})\n`;
        }
        
        if (block.git_repository_url) {
            content += `- [Source Code](${block.git_repository_url})\n`;
        }
        
        if (block.website_url) {
            content += `- [Website](${block.website_url})\n`;
        }
        
        return content;
    }

    private generateBlockEntry(block: any): string {
        let entry = `\n  - name: ${block.name}\n`;
        entry += `    kind: ${block.kind || 'generic'}\n`;
        entry += `    from: "${block.registry || 'hub.polycrate.io'}/${block.name}:${block.version || 'latest'}"\n`;
        
        if (block.description) {
            entry += `    description: "${block.description}"\n`;
        }
        
        return entry;
    }

    private findBlocksInsertPosition(document: vscode.TextDocument): vscode.Position {
        const text = document.getText();
        const lines = text.split('\n');
        
        // Find the blocks section
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === 'blocks:') {
                // Look for the end of the blocks section
                for (let j = i + 1; j < lines.length; j++) {
                    const line = lines[j];
                    if (line.trim() === '' || (!line.startsWith('  ') && line.trim() !== '')) {
                        return new vscode.Position(j, 0);
                    }
                }
                // If no end found, add at the end of the file
                return new vscode.Position(lines.length, 0);
            }
        }
        
        // If no blocks section found, add one at the end
        return new vscode.Position(lines.length, 0);
    }

    // Mock data methods for demonstration
    private getMockSearchResults(searchTerm: string): any[] {
        const mockBlocks = [
            {
                name: 'postgresql',
                kind: 'db',
                type: 'database',
                version: '13.8.0',
                description: 'PostgreSQL database server',
                registry: 'hub.polycrate.io',
                documentation_url: 'https://postgresql.org/docs',
                git_repository_url: 'https://github.com/postgres/postgres',
                supports_ha: true,
                license: 'PostgreSQL',
                config: {
                    database_name: 'myapp',
                    username: 'postgres',
                    password: 'secret'
                }
            },
            {
                name: 'redis',
                kind: 'kv',
                type: 'cache',
                version: '7.0.5',
                description: 'Redis in-memory data store',
                registry: 'hub.polycrate.io',
                documentation_url: 'https://redis.io/docs',
                git_repository_url: 'https://github.com/redis/redis',
                supports_ha: true,
                license: 'BSD-3-Clause'
            },
            {
                name: 'nginx',
                kind: 'k8sapp',
                type: 'webserver',
                version: '1.25.2',
                description: 'High-performance web server and reverse proxy',
                registry: 'hub.polycrate.io',
                documentation_url: 'https://nginx.org/docs',
                supports_ha: true,
                license: 'BSD-2-Clause'
            }
        ];
        
        return mockBlocks.filter(block => 
            block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            block.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    private getMockCategoryResults(category: string): any[] {
        const categoryMap: { [key: string]: any[] } = {
            'Database': [
                { name: 'postgresql', kind: 'db', description: 'PostgreSQL database' },
                { name: 'mysql', kind: 'db', description: 'MySQL database' },
                { name: 'mongodb', kind: 'db', description: 'MongoDB NoSQL database' }
            ],
            'Web Server': [
                { name: 'nginx', kind: 'k8sapp', description: 'Nginx web server' },
                { name: 'apache', kind: 'k8sapp', description: 'Apache HTTP server' }
            ],
            'Cache': [
                { name: 'redis', kind: 'kv', description: 'Redis cache' },
                { name: 'memcached', kind: 'kv', description: 'Memcached cache' }
            ]
        };
        
        return categoryMap[category] || [];
    }

    private getMockKindResults(kind: string): any[] {
        const kindMap: { [key: string]: any[] } = {
            'db': [
                { name: 'postgresql', kind: 'db', description: 'PostgreSQL database' },
                { name: 'mysql', kind: 'db', description: 'MySQL database' }
            ],
            'kv': [
                { name: 'redis', kind: 'kv', description: 'Redis cache' },
                { name: 'etcd', kind: 'kv', description: 'etcd key-value store' }
            ],
            'k8sapp': [
                { name: 'nginx', kind: 'k8sapp', description: 'Nginx web server' },
                { name: 'grafana', kind: 'k8sapp', description: 'Grafana monitoring' }
            ]
        };
        
        return kindMap[kind] || [];
    }

    private getMockPopularResults(): any[] {
        return [
            { name: 'postgresql', kind: 'db', description: 'Most popular database', downloads: 10000 },
            { name: 'redis', kind: 'kv', description: 'Most popular cache', downloads: 8500 },
            { name: 'nginx', kind: 'k8sapp', description: 'Most popular web server', downloads: 7500 }
        ];
    }

    private getMockRecentResults(): any[] {
        return [
            { name: 'new-framework', kind: 'app', description: 'Recently added framework', created: '2025-01-08' },
            { name: 'modern-db', kind: 'db', description: 'Recently updated database', updated: '2025-01-07' },
            { name: 'fast-cache', kind: 'kv', description: 'New caching solution', created: '2025-01-06' }
        ];
    }

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

    private findWorkspaceRoot(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }

        // Check each workspace folder for Polycrate files
        for (const folder of workspaceFolders) {
            const folderPath = folder.uri.fsPath;
            if (this.isPolycrateWorkspace(folderPath)) {
                return folderPath;
            }
        }

        return workspaceFolders[0].uri.fsPath;
    }

    private isPolycrateWorkspace(folderPath: string): boolean {
        try {
            const fs = require('fs');
            const workspaceFiles = ['workspace.poly', '.workspace', '.polycrate'];
            return workspaceFiles.some(file => fs.existsSync(path.join(folderPath, file)));
        } catch (error) {
            return false;
        }
    }
}