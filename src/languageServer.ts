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
            
            // Polycrate-specific validation
            const polycrateValidation = await this.validatePolycrateSchema(content, filePath);
            diagnostics.push(...polycrateValidation);
            
        } catch (error) {
            this.outputChannel.appendLine(`Error validating file: ${error}`);
        }
        
        return diagnostics;
    }

    private async validateYamlSyntax(content: string): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        
        try {
            const yaml = require('yaml');
            yaml.parse(content);
        } catch (error: any) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 0),
                `YAML syntax error: ${error.message}`,
                vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
        }
        
        return diagnostics;
    }

    private async validatePolycrateSchema(content: string, filePath: string): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        
        try {
            const yaml = require('yaml');
            const doc = yaml.parse(content);
            
            if (!doc) {
                return diagnostics;
            }
            
            // Determine file type based on filename or content
            const fileName = path.basename(filePath);
            const isWorkspace = fileName === 'workspace.poly' || doc.blocks !== undefined;
            const isBlock = fileName === 'block.poly' || doc.actions !== undefined;
            
            if (isWorkspace) {
                diagnostics.push(...this.validateWorkspaceSchema(doc));
            } else if (isBlock) {
                diagnostics.push(...this.validateBlockSchema(doc));
            }
            
        } catch (error: any) {
            this.outputChannel.appendLine(`Schema validation error: ${error.message}`);
        }
        
        return diagnostics;
    }

    private validateWorkspaceSchema(doc: any): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        
        // Required fields for workspace
        const requiredFields = ['name', 'organization', 'config'];
        
        for (const field of requiredFields) {
            if (!doc[field]) {
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 0),
                    `Missing required field: ${field}`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            }
        }
        
        // Validate config section
        if (doc.config) {
            const requiredConfigFields = ['image', 'blocksroot', 'logsroot'];
            
            for (const field of requiredConfigFields) {
                if (!doc.config[field]) {
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(0, 0, 0, 0),
                        `Missing required config field: ${field}`,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostics.push(diagnostic);
                }
            }
        }
        
        return diagnostics;
    }

    private validateBlockSchema(doc: any): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        
        // Required fields for block
        const requiredFields = ['name', 'kind'];
        
        for (const field of requiredFields) {
            if (!doc[field]) {
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 0),
                    `Missing required field: ${field}`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            }
        }
        
        // Validate kind values
        if (doc.kind) {
            const validKinds = ['generic', 'k8sapp', 'k8scluster', 'db', 'kv', 'mq', 'app'];
            if (!validKinds.includes(doc.kind)) {
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 0),
                    `Invalid kind value: ${doc.kind}. Valid values: ${validKinds.join(', ')}`,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostics.push(diagnostic);
            }
        }
        
        return diagnostics;
    }

    public async getCliVersion(): Promise<string> {
        return new Promise((resolve, reject) => {
            const config = vscode.workspace.getConfiguration('polycrate');
            const cliPath = config.get('cli.path', 'polycrate');
            
            const child = spawn(cliPath, ['version'], { stdio: 'pipe' });
            
            let output = '';
            child.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(output.trim());
                } else {
                    reject(new Error(`CLI returned exit code ${code}`));
                }
            });
            
            child.on('error', (error) => {
                reject(error);
            });
        });
    }
}