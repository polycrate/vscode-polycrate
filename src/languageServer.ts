import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

export class PolycrateLanguageServer {
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.outputChannel = vscode.window.createOutputChannel('Polycrate Language Server');
    }

    public async validateFile(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        
        try {
            const content = document.getText();
            const filePath = document.uri.fsPath;
            
            // Basic YAML syntax validation
            const yamlValidation = await this.validateYamlSyntax(content);
            diagnostics.push(...yamlValidation);
            
            // Try CLI-based validation first (if available)
            const cliValidation = await this.validateWithCli(document);
            
            // Debug logging
            this.outputChannel.appendLine(`CLI validation returned ${cliValidation.length} diagnostics`);
            
            // Check if CLI validation was attempted
            const fileName = path.basename(document.uri.fsPath);
            const isPolycrateFile = fileName === 'workspace.poly' || fileName === 'block.poly' || fileName === '.workspace';
            
            if (isPolycrateFile && await this.isCliAvailable()) {
                // Always use CLI validation for Polycrate files if CLI is available
                diagnostics.push(...cliValidation);
                this.outputChannel.appendLine('Using CLI-based validation (skipping schema validation)');
            } else {
                // Fallback to basic schema validation
                this.outputChannel.appendLine('Falling back to basic schema validation');
                const polycrateValidation = await this.validatePolycrateSchema(content, filePath, document);
                diagnostics.push(...polycrateValidation);
            }
            
        } catch (error) {
            this.outputChannel.appendLine(`Error validating file: ${error}`);
        }
        
        return diagnostics;
    }

    private async validateYamlSyntax(content: string): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        
        try {
            // Try to load yaml module
            let yaml;
            try {
                yaml = require('yaml');
            } catch (requireError) {
                // If yaml module is not available, skip YAML validation
                this.outputChannel.appendLine('YAML module not available, skipping YAML validation');
                return diagnostics;
            }
            
            const doc = yaml.parseDocument(content);
            
            // Check for parsing errors
            if (doc.errors && doc.errors.length > 0) {
                for (const error of doc.errors) {
                    const line = error.pos ? error.pos[0] || 0 : 0;
                    const col = error.pos ? error.pos[1] || 0 : 0;
                    
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(line, col, line, col + 10),
                        `YAML syntax error: ${error.message}`,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostics.push(diagnostic);
                }
            }
            
            // Check for warnings
            if (doc.warnings && doc.warnings.length > 0) {
                for (const warning of doc.warnings) {
                    const line = warning.pos ? warning.pos[0] || 0 : 0;
                    const col = warning.pos ? warning.pos[1] || 0 : 0;
                    
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(line, col, line, col + 10),
                        `YAML warning: ${warning.message}`,
                        vscode.DiagnosticSeverity.Warning
                    );
                    diagnostics.push(diagnostic);
                }
            }
        } catch (error: any) {
            // Only show error if it's a real parsing issue
            if (error.name === 'YAMLParseError') {
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 0),
                    `YAML syntax error: ${error.message}`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            }
        }
        
        return diagnostics;
    }

    private async validatePolycrateSchema(content: string, filePath: string, document?: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        
        try {
            // Try to load yaml module
            let yaml;
            try {
                yaml = require('yaml');
            } catch (requireError) {
                // If yaml module is not available, skip schema validation
                this.outputChannel.appendLine('YAML module not available, skipping schema validation');
                return diagnostics;
            }
            
            const doc = yaml.parse(content);
            
            if (!doc) {
                return diagnostics;
            }
            
            // Determine file type based on filename or content
            const fileName = path.basename(filePath);
            const isWorkspace = fileName === 'workspace.poly' || doc.blocks !== undefined;
            const isBlock = fileName === 'block.poly' || doc.actions !== undefined;
            
            if (isWorkspace) {
                diagnostics.push(...this.validateWorkspaceSchema(doc, document));
            } else if (isBlock) {
                diagnostics.push(...this.validateBlockSchema(doc, document));
            }
            
        } catch (error: any) {
            this.outputChannel.appendLine(`Schema validation error: ${error.message}`);
        }
        
        return diagnostics;
    }

    private validateWorkspaceSchema(doc: any, document?: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        
        // Only truly required fields (CLI won't accept workspace without these)
        const requiredFields = ['name', 'organization'];
        
        for (const field of requiredFields) {
            if (!doc[field]) {
                const range = document ? (this.findTextInDocument(document, `${field}:`) || new vscode.Range(0, 0, 0, 0)) : new vscode.Range(0, 0, 0, 0);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `Missing required field: ${field}`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            }
        }
        
        // Validate config section only if it exists
        if (doc.config) {
            // Check for common config issues, but don't require specific fields
            // since CLI provides defaults
            if (doc.config.image && typeof doc.config.image !== 'object' && typeof doc.config.image !== 'string') {
                const range = document ? (this.findTextInDocument(document, 'image:') || new vscode.Range(0, 0, 0, 0)) : new vscode.Range(0, 0, 0, 0);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `Config field 'image' should be an object or string`,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostics.push(diagnostic);
            }
        }
        
        // Validate block definitions if they exist
        if (doc.blocks && Array.isArray(doc.blocks)) {
            for (let i = 0; i < doc.blocks.length; i++) {
                const block = doc.blocks[i];
                if (!block.name) {
                    const range = document ? (this.findTextInDocument(document, '- name:') || new vscode.Range(0, 0, 0, 0)) : new vscode.Range(0, 0, 0, 0);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `Block at index ${i} is missing required field: name`,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostics.push(diagnostic);
                }
                if (!block.kind) {
                    const range = document ? (this.findBlockFieldInDocument(document, block.name, 'kind') || 
                                            this.findBlockInDocument(document, block.name) || 
                                            new vscode.Range(0, 0, 0, 0)) : new vscode.Range(0, 0, 0, 0);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `Block '${block.name || 'unnamed'}' is missing required field: kind`,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostics.push(diagnostic);
                }
            }
        }
        
        return diagnostics;
    }

    private validateBlockSchema(doc: any, document?: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        
        // Only truly required fields for blocks
        const requiredFields = ['name'];
        
        for (const field of requiredFields) {
            if (!doc[field]) {
                const range = document ? (this.findTextInDocument(document, `${field}:`) || new vscode.Range(0, 0, 0, 0)) : new vscode.Range(0, 0, 0, 0);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `Missing required field: ${field}`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            }
        }
        
        // Validate kind values if provided
        if (doc.kind) {
            const validKinds = ['generic', 'k8sapp', 'k8scluster', 'db', 'kv', 'mq', 'app'];
            if (!validKinds.includes(doc.kind)) {
                const range = document ? (this.findTextInDocument(document, 'kind:') || new vscode.Range(0, 0, 0, 0)) : new vscode.Range(0, 0, 0, 0);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `Invalid kind value: ${doc.kind}. Valid values: ${validKinds.join(', ')}`,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostics.push(diagnostic);
            }
        }
        
        // Validate actions if they exist
        if (doc.actions && Array.isArray(doc.actions)) {
            for (let i = 0; i < doc.actions.length; i++) {
                const action = doc.actions[i];
                if (!action.name) {
                    const range = document ? (this.findTextInDocument(document, 'actions:') || new vscode.Range(0, 0, 0, 0)) : new vscode.Range(0, 0, 0, 0);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `Action at index ${i} is missing required field: name`,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostics.push(diagnostic);
                }
                
                // Check that action has either script or playbook
                if (!action.script && !action.playbook) {
                    const range = document ? (this.findTextInDocument(document, 'actions:') || new vscode.Range(0, 0, 0, 0)) : new vscode.Range(0, 0, 0, 0);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `Action '${action.name || 'unnamed'}' should have either 'script' or 'playbook' field`,
                        vscode.DiagnosticSeverity.Warning
                    );
                    diagnostics.push(diagnostic);
                }
            }
        }
        
        return diagnostics;
    }

    private async validateWithCli(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        
        try {
            const filePath = document.uri.fsPath;
            const fileName = path.basename(filePath);
            let workingDir = path.dirname(filePath);
            
            // For ALL .poly files, find the workspace root
            if (fileName === 'block.poly' || fileName === 'workspace.poly') {
                const foundWorkspaceRoot = this.findWorkspaceRoot(workingDir);
                if (!foundWorkspaceRoot) {
                    this.outputChannel.appendLine(`Could not find workspace root for ${fileName} validation`);
                    return diagnostics;
                }
                workingDir = foundWorkspaceRoot;
                this.outputChannel.appendLine(`Using workspace root: ${workingDir} for ${fileName}`);
            }
            
            this.outputChannel.appendLine(`Attempting CLI validation for ${fileName} in ${workingDir}`);
            
            // Validate all .poly files using workspace snapshot
            if (fileName === 'workspace.poly' || fileName === 'block.poly' || fileName === '.workspace') {
                this.outputChannel.appendLine(`Validating ${fileName} with CLI from workspace: ${workingDir}`);
                const snapshot = await this.getWorkspaceSnapshot(workingDir);
                if (snapshot) {
                    this.outputChannel.appendLine('Got workspace snapshot, validating...');
                    
                    if (fileName === 'block.poly') {
                        const blockDir = path.dirname(filePath);
                        const blockName = path.basename(blockDir);
                        this.outputChannel.appendLine(`Validating specific block: ${blockName}`);
                        diagnostics.push(...this.validateBlockInWorkspaceSnapshot(snapshot, blockName, document));
                        // Also validate 'from' field for block.poly files
                        diagnostics.push(...this.validateFromFieldsInBlockDocument(document));
                    } else {
                        // workspace.poly or .workspace file
                        diagnostics.push(...this.validateWorkspaceSnapshot(snapshot, document));
                    }
                } else {
                    this.outputChannel.appendLine('Failed to get workspace snapshot');
                }
            }
            
        } catch (error) {
            this.outputChannel.appendLine(`CLI validation error: ${error}`);
        }
        
        return diagnostics;
    }

    private async getWorkspaceSnapshot(workingDir: string): Promise<any> {
        try {
            const config = vscode.workspace.getConfiguration('polycrate');
            const cliPath = config.get('cli.path', 'polycrate');
            
            const result = await this.runPolycrateCommand([
                'workspace', 
                'snapshot'
            ], workingDir);
            
            // Parse YAML output
            let yaml;
            try {
                yaml = require('yaml');
            } catch (requireError) {
                this.outputChannel.appendLine('YAML module not available for CLI parsing');
                return null;
            }
            
            return yaml.parse(result);
        } catch (error) {
            this.outputChannel.appendLine(`Failed to get workspace snapshot: ${error}`);
            return null;
        }
    }

    private async getBlockSnapshot(blockName: string, workingDir: string): Promise<any> {
        try {
            const config = vscode.workspace.getConfiguration('polycrate');
            const cliPath = config.get('cli.path', 'polycrate');
            
            const result = await this.runPolycrateCommand([
                'blocks', 
                'inspect', 
                blockName
            ], workingDir);
            
            // Parse YAML output
            let yaml;
            try {
                yaml = require('yaml');
            } catch (requireError) {
                this.outputChannel.appendLine('YAML module not available for CLI parsing');
                return null;
            }
            
            return yaml.parse(result);
        } catch (error) {
            this.outputChannel.appendLine(`Failed to get block snapshot: ${error}`);
            return null;
        }
    }

    private validateWorkspaceSnapshot(snapshot: any, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        
        // The snapshot has workspace info in nested structure
        const workspace = snapshot.workspace || snapshot;
        
        // Validate workspace-level issues
        if (!workspace.name) {
            const range = this.findTextInDocument(document, 'name:') || new vscode.Range(0, 0, 0, 0);
            diagnostics.push(new vscode.Diagnostic(
                range,
                'Workspace name is missing',
                vscode.DiagnosticSeverity.Error
            ));
        }
        
        if (!workspace.organization) {
            const range = this.findTextInDocument(document, 'organization:') || new vscode.Range(0, 0, 0, 0);
            diagnostics.push(new vscode.Diagnostic(
                range,
                'Workspace organization is missing',
                vscode.DiagnosticSeverity.Error
            ));
        }
        
        // For 'from' field validation, we need to check the original document
        // not the CLI snapshot, because CLI might normalize or change the values
        diagnostics.push(...this.validateFromFieldsInDocument(document));
        
        // Validate blocks from snapshot (these include defaults and computed values)
        if (workspace.blocks && Array.isArray(workspace.blocks)) {
            for (const block of workspace.blocks) {
                // The CLI snapshot includes all blocks with their defaults
                // So we only need to check for fundamental issues
                if (!block.name) {
                    const range = this.findBlockInDocument(document, block.name || 'unnamed') || new vscode.Range(0, 0, 0, 0);
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        `Block is missing name`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }
                
                // Note: We don't validate 'from' here anymore - it's done in validateFromFieldsInDocument
                // Note: We don't validate 'kind' here because the CLI snapshot
                // includes computed values and defaults, so missing 'kind' 
                // would have been caught by the CLI itself
                
                // Check for actions without proper definition
                if (block.actions && Array.isArray(block.actions)) {
                    for (const action of block.actions) {
                        if (!action.name) {
                            const range = this.findBlockInDocument(document, block.name) || new vscode.Range(0, 0, 0, 0);
                            diagnostics.push(new vscode.Diagnostic(
                                range,
                                `Action in block '${block.name}' is missing name`,
                                vscode.DiagnosticSeverity.Error
                            ));
                        }
                    }
                }
            }
        }
        
        return diagnostics;
    }

    private validateFromFieldsInDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        
        try {
            // Parse the document directly to check 'from' fields
            let yaml;
            try {
                yaml = require('yaml');
            } catch (requireError) {
                // If yaml module is not available, skip validation
                return diagnostics;
            }
            
            const content = document.getText();
            const doc = yaml.parse(content);
            
            if (!doc || !doc.blocks || !Array.isArray(doc.blocks)) {
                return diagnostics;
            }
            
            // Check each block's 'from' field in the original document
            for (const block of doc.blocks) {
                if (block.from && block.name) {
                    this.outputChannel.appendLine(`Validating 'from' field for block '${block.name}': ${block.from}`);
                    
                    // Check if 'from' is missing version or uses problematic tags
                    if (typeof block.from === 'string') {
                        const blockRange = this.findBlockFieldInDocument(document, block.name, 'from') || 
                                          this.findBlockInDocument(document, block.name) || 
                                          new vscode.Range(0, 0, 0, 0);
                        
                        // Check if using 'latest' tag
                        if (block.from.includes(':latest') || block.from.includes('@latest')) {
                            diagnostics.push(new vscode.Diagnostic(
                                blockRange,
                                `Block '${block.name}' uses 'from: ${block.from}' with 'latest' tag. Consider using a specific version tag for reproducible builds (e.g., '${block.from.replace(/(:latest|@latest)/, ':1.0.0')}')`,
                                vscode.DiagnosticSeverity.Warning
                            ));
                        }
                        // Check if completely missing version tag
                        else {
                            const hasVersionTag = block.from.includes(':') || block.from.includes('@') || 
                                                /.*:\d+\.\d+.*/.test(block.from) || /.*@v?\d+\.\d+.*/.test(block.from);
                            
                            if (!hasVersionTag) {
                                diagnostics.push(new vscode.Diagnostic(
                                    blockRange,
                                    `Block '${block.name}' uses 'from: ${block.from}' without specifying a version. Consider using a specific version tag (e.g., '${block.from}:1.0.0')`,
                                    vscode.DiagnosticSeverity.Warning
                                ));
                            }
                        }
                    }
                }
            }
        } catch (error) {
            this.outputChannel.appendLine(`Error validating 'from' fields: ${error}`);
        }
        
        return diagnostics;
    }

    private validateFromFieldsInBlockDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        
        try {
            // Parse the document directly to check 'from' field
            let yaml;
            try {
                yaml = require('yaml');
            } catch (requireError) {
                // If yaml module is not available, skip validation
                return diagnostics;
            }
            
            const content = document.getText();
            const doc = yaml.parse(content);
            
            if (!doc || !doc.from) {
                return diagnostics;
            }
            
            // Check the block's 'from' field in the original document
            const blockName = doc.name || 'unnamed';
            this.outputChannel.appendLine(`Validating 'from' field for block '${blockName}': ${doc.from}`);
            
            // Check if 'from' is missing version or uses problematic tags
            if (typeof doc.from === 'string') {
                const fromRange = this.findTextInDocument(document, 'from:') || new vscode.Range(0, 0, 0, 0);
                
                // Check if using 'latest' tag
                if (doc.from.includes(':latest') || doc.from.includes('@latest')) {
                    diagnostics.push(new vscode.Diagnostic(
                        fromRange,
                        `Block '${blockName}' uses 'from: ${doc.from}' with 'latest' tag. Consider using a specific version tag for reproducible builds (e.g., '${doc.from.replace(/(:latest|@latest)/, ':1.0.0')}')`,
                        vscode.DiagnosticSeverity.Warning
                    ));
                }
                // Check if completely missing version tag
                else {
                    const hasVersionTag = doc.from.includes(':') || doc.from.includes('@') || 
                                        /.*:\d+\.\d+.*/.test(doc.from) || /.*@v?\d+\.\d+.*/.test(doc.from);
                    
                    if (!hasVersionTag) {
                        diagnostics.push(new vscode.Diagnostic(
                            fromRange,
                            `Block '${blockName}' uses 'from: ${doc.from}' without specifying a version. Consider using a specific version tag (e.g., '${doc.from}:1.0.0')`,
                            vscode.DiagnosticSeverity.Warning
                        ));
                    }
                }
            }
        } catch (error) {
            this.outputChannel.appendLine(`Error validating 'from' field in block document: ${error}`);
        }
        
        return diagnostics;
    }

    private findTextInDocument(document: vscode.TextDocument, searchText: string): vscode.Range | null {
        const text = document.getText();
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const index = line.indexOf(searchText);
            if (index !== -1) {
                return new vscode.Range(i, index, i, index + searchText.length);
            }
        }
        
        return null;
    }

    private findBlockInDocument(document: vscode.TextDocument, blockName: string): vscode.Range | null {
        const text = document.getText();
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Look for "- name: blockName" pattern
            if (line.includes('- name:') && line.includes(blockName)) {
                const nameIndex = line.indexOf('- name:');
                return new vscode.Range(i, nameIndex, i, line.length);
            }
        }
        
        return null;
    }

    private findBlockFieldInDocument(document: vscode.TextDocument, blockName: string, fieldName: string): vscode.Range | null {
        const text = document.getText();
        const lines = text.split('\n');
        
        let inTargetBlock = false;
        let blockIndent = -1;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            const lineIndent = line.length - line.trimStart().length;
            
            // Check if we're starting the target block
            if (trimmedLine.startsWith('- name:') && trimmedLine.includes(blockName)) {
                inTargetBlock = true;
                blockIndent = lineIndent;
                continue;
            }
            
            // Check if we've left the target block
            if (inTargetBlock && lineIndent <= blockIndent && trimmedLine.startsWith('- name:')) {
                inTargetBlock = false;
            }
            
            // If we're in the target block, look for the field
            if (inTargetBlock && trimmedLine.startsWith(`${fieldName}:`)) {
                const fieldIndex = line.indexOf(`${fieldName}:`);
                return new vscode.Range(i, fieldIndex, i, fieldIndex + fieldName.length + 1);
            }
        }
        
        return null;
    }

    private validateBlockInWorkspaceSnapshot(snapshot: any, blockName: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        
        // The snapshot has workspace info in nested structure
        const workspace = snapshot.workspace || snapshot;
        
        // Find the specific block in the workspace snapshot
        if (workspace.blocks && Array.isArray(workspace.blocks)) {
            const block = workspace.blocks.find((b: any) => b.name === blockName);
            
            if (!block) {
                // Block not found in workspace - this could be an issue
                this.outputChannel.appendLine(`Block '${blockName}' not found in workspace snapshot`);
                const range = this.findBlockInDocument(document, blockName) || new vscode.Range(0, 0, 0, 0);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `Block '${blockName}' is not recognized by the workspace`,
                    vscode.DiagnosticSeverity.Warning
                ));
                return diagnostics;
            }
            
            this.outputChannel.appendLine(`Found block '${blockName}' in workspace snapshot with kind: ${block.kind || 'undefined'}`);
            
            // The CLI snapshot includes all blocks with their defaults and computed values
            // So we only need to check for fundamental issues that the CLI would catch
            if (!block.name) {
                const range = this.findBlockInDocument(document, blockName) || new vscode.Range(0, 0, 0, 0);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `Block is missing name`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
            
            // Note: We don't validate 'from' field here anymore - it's done in validateFromFieldsInDocument
            // to ensure each block is validated independently based on the original document
            
            // Note: We don't validate 'kind' here because the CLI snapshot
            // includes computed values and defaults. If the block appears in the
            // snapshot, it means the CLI was able to process it successfully.
            
            // Check for actions without proper definition
            if (block.actions && Array.isArray(block.actions)) {
                for (const action of block.actions) {
                    if (!action.name) {
                        const range = this.findBlockInDocument(document, block.name) || new vscode.Range(0, 0, 0, 0);
                        diagnostics.push(new vscode.Diagnostic(
                            range,
                            `Action in block '${block.name}' is missing name`,
                            vscode.DiagnosticSeverity.Error
                        ));
                    }
                }
            }
        } else {
            this.outputChannel.appendLine('No blocks found in workspace snapshot');
        }
        
        return diagnostics;
    }

    private validateBlockSnapshot(snapshot: any, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        
        // Validate block from snapshot (includes defaults)
        if (!snapshot.name) {
            diagnostics.push(new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 0),
                'Block name is missing',
                vscode.DiagnosticSeverity.Error
            ));
        }
        
        // Validate actions
        if (snapshot.actions && Array.isArray(snapshot.actions)) {
            for (const action of snapshot.actions) {
                if (!action.name) {
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(0, 0, 0, 0),
                        `Action is missing name`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }
            }
        }
        
        return diagnostics;
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

    private isInWorkspaceRoot(workingDir: string): boolean {
        try {
            const fs = require('fs');
            // Check for common Polycrate workspace indicators
            const workspaceFiles = ['.workspace', 'workspace.poly', '.polycrate'];
            return workspaceFiles.some(file => fs.existsSync(path.join(workingDir, file)));
        } catch (error) {
            return false;
        }
    }

    private findWorkspaceRoot(startDir: string): string | null {
        try {
            const fs = require('fs');
            let currentDir = startDir;
            
            // Walk up the directory tree to find workspace root
            while (currentDir !== path.dirname(currentDir)) {
                // Check for workspace.poly file specifically (most reliable indicator)
                if (fs.existsSync(path.join(currentDir, 'workspace.poly'))) {
                    this.outputChannel.appendLine(`Found workspace root with workspace.poly: ${currentDir}`);
                    return currentDir;
                }
                
                // Also check for other workspace indicators
                if (this.isInWorkspaceRoot(currentDir)) {
                    this.outputChannel.appendLine(`Found workspace root: ${currentDir}`);
                    return currentDir;
                }
                
                currentDir = path.dirname(currentDir);
            }
            
            this.outputChannel.appendLine(`No workspace root found starting from: ${startDir}`);
            return null;
        } catch (error) {
            this.outputChannel.appendLine(`Error finding workspace root: ${error}`);
            return null;
        }
    }

    private async isCliAvailable(): Promise<boolean> {
        try {
            await this.runPolycrateCommand(['version'], process.cwd());
            return true;
        } catch (error) {
            this.outputChannel.appendLine(`CLI not available: ${error}`);
            return false;
        }
    }

    public async getCliVersion(): Promise<string> {
        try {
            const result = await this.runPolycrateCommand(['version'], process.cwd());
            return result.trim();
        } catch (error) {
            throw new Error(`Failed to get CLI version: ${error}`);
        }
    }
}