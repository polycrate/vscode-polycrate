import * as vscode from 'vscode';
import { PolycrateLanguageServer } from './languageServer';

export class PolycrateValidationProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private languageServer: PolycrateLanguageServer;

    constructor(context: vscode.ExtensionContext) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('polycrate');
        this.languageServer = new PolycrateLanguageServer(context);
        
        // Listen for document changes
        vscode.workspace.onDidChangeTextDocument(this.onDocumentChange, this);
        vscode.workspace.onDidOpenTextDocument(this.onDocumentOpen, this);
        vscode.workspace.onDidCloseTextDocument(this.onDocumentClose, this);
        
        // Validate all open documents
        vscode.workspace.textDocuments.forEach(this.validateDocument, this);
    }

    private onDocumentChange(event: vscode.TextDocumentChangeEvent): void {
        if (event.document.languageId === 'polycrate') {
            this.validateDocument(event.document);
        }
    }

    private onDocumentOpen(document: vscode.TextDocument): void {
        if (document.languageId === 'polycrate') {
            this.validateDocument(document);
        }
    }

    private onDocumentClose(document: vscode.TextDocument): void {
        if (document.languageId === 'polycrate') {
            this.diagnosticCollection.delete(document.uri);
        }
    }

    private async validateDocument(document: vscode.TextDocument): Promise<void> {
        try {
            const diagnostics = await this.languageServer.validateFile(document);
            this.diagnosticCollection.set(document.uri, diagnostics);
        } catch (error) {
            console.error('Error validating document:', error);
        }
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}