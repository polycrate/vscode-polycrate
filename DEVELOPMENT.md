# Polycrate VS Code Extension - Development Guide

Dieser Guide beschreibt alle notwendigen Schritte für die Entwicklung, das Testen, Releasing und Publishing der Polycrate VS Code Extension.

---

## 🛠️ Entwicklungsumgebung Setup

### **Voraussetzungen**
```bash
# Node.js (Version 16 oder höher)
node --version

# VS Code (Version 1.74.0 oder höher)
code --version

# Git
git --version

# Polycrate CLI (für Testing)
polycrate version
```

### **Projekt Setup**
```bash
# Repository klonen
git clone https://github.com/ayedo/polycrate-vscode.git
cd polycrate-vscode

# Dependencies installieren
npm install

# TypeScript kompilieren
npm run compile

# Extension im Debug-Modus starten
# F5 drücken oder "Run Extension" in VS Code
```

### **Development Dependencies**
```json
{
  "@types/vscode": "^1.74.0",
  "@types/node": "16.x",
  "typescript": "^4.9.4",
  "webpack": "^5.75.0",
  "webpack-cli": "^5.0.1",
  "vsce": "^2.15.0"
}
```

---

## 🧪 Testing & Debugging

### **Extension Testing**
```bash
# 1. Debug-Instanz starten
# In VS Code: F5 oder Debug > Start Debugging

# 2. Test-Workspace öffnen
# File > Open Folder > test-workspace/

# 3. Features testen:
# - .poly Dateien öffnen
# - IntelliSense prüfen (Ctrl+Space)
# - Validation testen
# - Commands ausführen (Ctrl+Shift+P)
# - Hover-Dokumentation prüfen
# - Version Diff testen
# - Hub Integration testen
```

### **Manual Testing Checklist**
- [ ] **Syntax Highlighting** - `.poly` Dateien werden korrekt hervorgehoben
- [ ] **IntelliSense** - Auto-completion funktioniert in workspace.poly und block.poly
- [ ] **Validation** - Fehler werden an korrekten Positionen angezeigt
- [ ] **Hover Documentation** - Dokumentation erscheint bei Hover
- [ ] **Commands** - Alle Kommandos in Command Palette verfügbar
- [ ] **Context Menu** - Rechtsklick-Menü funktioniert für .poly Dateien
- [ ] **Version Diff** - Block-Versionsvergleich funktioniert
- [ ] **Hub Integration** - Block-Discovery aus Hub funktioniert
- [ ] **Error Positioning** - Fehler erscheinen an richtigen Stellen (nicht nur bei erstem "name")

### **Output Channel Debugging**
```bash
# VS Code Output Panel öffnen
# View > Output > "Polycrate Language Server"
# Hier werden Debug-Informationen angezeigt
```

---

## 🔄 Build Process

### **Development Build**
```bash
# TypeScript kompilieren
npm run compile

# Watch Mode für kontinuierliche Entwicklung
npm run watch

# Webpack Development Build
npm run package-dev
```

### **Production Build**
```bash
# Production Webpack Build
npm run package

# VSIX Package erstellen
npx vsce package

# Build überprüfen
ls -la *.vsix
```

### **Build Scripts (package.json)**
```json
{
  "scripts": {
    "vscode:prepublish": "npm run package",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "package": "webpack --mode production --devtool hidden-source-map",
    "package-dev": "webpack --mode development",
    "compile-tests": "tsc -p . --outDir out",
    "watch-tests": "tsc -p . -w --outDir out",
    "lint": "eslint src --ext ts"
  }
}
```

---

## 📦 Release Process

### **1. Version vorbereiten**
```bash
# Version in package.json aktualisieren
# Semantic Versioning: MAJOR.MINOR.PATCH
# 0.1.0 → 0.1.1 (Patch)
# 0.1.0 → 0.2.0 (Minor)
# 0.1.0 → 1.0.0 (Major)

# README.md Release Notes aktualisieren
# CHANGELOG.md erstellen/aktualisieren (falls vorhanden)
```

### **2. Pre-Release Validierung**
```bash
# Code kompilieren
npm run compile

# Linting durchführen
npm run lint

# Tests ausführen (falls vorhanden)
npm test

# VSIX Package erstellen
npx vsce package

# Package-Inhalt prüfen
npx vsce ls
```

### **3. Git Tagging**
```bash
# Änderungen committen
git add .
git commit -m "Release v0.1.1: Add new features and bug fixes"

# Git Tag erstellen
git tag v0.1.1
git push origin main
git push origin v0.1.1
```

### **4. GitHub Release (Optional)**
```bash
# GitHub CLI verwenden
gh release create v0.1.1 polycrate-vscode-0.1.1.vsix \
  --title "Polycrate VS Code Extension v0.1.1" \
  --notes "🚀 New features and improvements"

# Oder manual über GitHub Web Interface
# https://github.com/ayedo/polycrate-vscode/releases/new
```

---

## 🌐 VS Code Marketplace Publishing

### **Einmalige Setup-Schritte**

#### **1. Azure DevOps Account**
```bash
# Account erstellen: https://dev.azure.com
# Mit Ayedo E-Mail-Adresse registrieren
```

#### **2. Authentication Setup (Enterprise)**

**🏢 Option A: Service Principal (Empfohlen für Unternehmen)**
```bash
# Azure Active Directory > App registrations > New registration
# Name: "Polycrate VS Code Extension Publisher"
# Account types: "Single tenant"
# Redirect URI: Nicht erforderlich

# Nach Erstellung:
# 1. Application (client) ID notieren
# 2. Certificates & secrets > New client secret
# 3. Client Secret Value notieren (nur einmal sichtbar!)
# 4. API permissions > Add permission > Azure DevOps > Delegated permissions
```

**👤 Option B: Personal Access Token (PAT)**
```bash
# In Azure DevOps:
# User Settings > Personal Access Tokens > New Token

# Einstellungen:
# Name: "VS Code Extension Publishing"
# Organization: "All accessible organizations"  
# Scopes: "Marketplace (Manage)"
# Expiration: 1 Jahr

# ⚠️ Token sicher speichern! (z.B. in Password Manager)
```

**🔐 Option C: Managed Identity (Azure-hosted CI/CD)**
```bash
# Für Azure DevOps Pipelines oder GitHub Actions mit Azure
# System-assigned oder User-assigned Managed Identity
# Automatische Authentication ohne Secrets
```

#### **3. Publisher registrieren**
```bash
# Option A: Via VSCE Command Line
npx vsce create-publisher ayedo-cloud-solutions

# Option B: Via Web Interface
# https://marketplace.visualstudio.com/manage
# "Create Publisher" klicken
# Publisher ID: "ayedo-cloud-solutions"
# Display Name: "Ayedo Cloud Solutions GmbH"
```

#### **4. Publisher-Details konfigurieren**
```json
{
  "publisher": "ayedo-cloud-solutions",
  "author": {
    "name": "Ayedo Cloud Solutions GmbH",
    "email": "info@ayedo.de",
    "url": "https://ayedo.de"
  },
  "homepage": "https://ayedo.de",
  "repository": {
    "type": "git",
    "url": "https://github.com/ayedo/polycrate-vscode.git"
  },
  "bugs": {
    "url": "https://github.com/ayedo/polycrate-vscode/issues"
  }
}
```

### **Publishing-Prozess**

#### **1. Mit Marketplace verbinden**

**🏢 Azure Credential Authentication (Empfohlen)**
```bash
# Umgebungsvariablen setzen
export AZURE_CLIENT_ID="your-application-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export AZURE_TENANT_ID="your-tenant-id"

# Mit Azure Credentials anmelden (kein separater Login erforderlich)
# Die Credentials werden automatisch bei Publishing verwendet
npx vsce publish --azure-credential

# Hinweis: Es gibt keinen separaten Login-Schritt für Azure Credentials
# Die Authentifizierung erfolgt direkt beim Publishing über die Umgebungsvariablen
```

**👤 Personal Access Token Authentication**
```bash
# Mit Personal Access Token anmelden
npx vsce login ayedo-cloud-solutions
# Token eingeben wenn aufgefordert

# Login Status prüfen
npx vsce verify-pat [YOUR_PAT_TOKEN]
```

**🔐 CI/CD Pipeline Authentication**
```yaml
# Azure DevOps Pipeline (azure-pipelines.yml)
steps:
- task: NodeTool@0
  inputs:
    versionSpec: '16.x'
- script: npm install -g vsce
- script: vsce publish --pat $(VSCE_PAT)
  env:
    VSCE_PAT: $(marketplace-pat)  # Secret Variable
```

#### **2. Extension veröffentlichen**
```bash
# Erste Veröffentlichung
npx vsce publish

# Mit spezifischer Version
npx vsce publish 0.1.1

# Automatische Version-Erhöhung
npx vsce publish patch  # 0.1.0 → 0.1.1
npx vsce publish minor  # 0.1.0 → 0.2.0
npx vsce publish major  # 0.1.0 → 1.0.0
```

#### **3. Veröffentlichung prüfen**
```bash
# Extension-Status prüfen
npx vsce show ayedo-cloud-solutions.polycrate-vscode

# Marketplace-URL aufrufen
# https://marketplace.visualstudio.com/items?itemName=ayedo-cloud-solutions.polycrate-vscode
```

### **Post-Publishing Checklist**
- [ ] **Marketplace-Seite** - Korrekte Anzeige von Icon, Beschreibung, Screenshots
- [ ] **Installation testen** - `code --install-extension ayedo-cloud-solutions.polycrate-vscode`
- [ ] **Funktionalität prüfen** - Alle Features in frischer Installation testen
- [ ] **Ayedo Website** - Extension auf ayedo.de bewerben
- [ ] **Dokumentation** - Links in Polycrate-Docs aktualisieren

---

## 🏢 Enterprise Authentication Optionen

### **Service Principal Setup (Detailliert)**

#### **1. Azure AD App Registration**
```bash
# 1. Azure Portal öffnen: https://portal.azure.com
# 2. Azure Active Directory > App registrations > New registration

# Einstellungen:
Name: "Polycrate VS Code Extension Publisher"
Supported account types: "Accounts in this organizational directory only (Ayedo only - Single tenant)"
Redirect URI: Leer lassen
```

#### **2. Service Principal Permissions**
```bash
# In der App Registration:
# API permissions > Add a permission > APIs my organization uses
# Suchen: "Azure DevOps" > Delegated permissions > user_impersonation
# Grant admin consent for Ayedo

# Certificates & secrets > Client secrets > New client secret
# Description: "VS Code Extension Publishing"
# Expires: 24 months
# ⚠️ Value sofort kopieren und sicher speichern!
```

#### **3. Azure DevOps Permissions**
```bash
# 1. Azure DevOps: https://dev.azure.com/ayedo
# 2. Organization Settings > Permissions > Users
# 3. Service Principal als User hinzufügen
# 4. Extensions permission: "Manage" gewähren
# 5. Marketplace permission: "Manage" gewähren
```

### **Credential Management**

#### **Development Environment**
```bash
# .env Datei erstellen (NICHT committen!)
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-secret-value
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Azure CLI Authentication (alternative)
az login --service-principal \
  --username $AZURE_CLIENT_ID \
  --password $AZURE_CLIENT_SECRET \
  --tenant $AZURE_TENANT_ID
```

#### **CI/CD Pipeline (Azure DevOps)**
```yaml
# azure-pipelines.yml
variables:
- group: 'marketplace-secrets'  # Variable Group

stages:
- stage: Publish
  jobs:
  - job: PublishExtension
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '16.x'
    
    - script: |
        npm install
        npm run compile
        npm install -g vsce
      displayName: 'Install dependencies'
    
    - task: AzureCLI@2
      inputs:
        azureSubscription: 'ayedo-service-connection'
        scriptType: 'bash'
        scriptLocation: 'inlineScript'
        inlineScript: |
          export AZURE_CLIENT_ID=$(marketplace-client-id)
          export AZURE_CLIENT_SECRET=$(marketplace-client-secret)
          export AZURE_TENANT_ID=$(marketplace-tenant-id)
          vsce publish --azure-credential
      displayName: 'Publish Extension'
```

#### **GitHub Actions Setup (Detailliert)**

**📁 Workflow Datei erstellen**
```yaml
# .github/workflows/publish-extension.yml
name: 🚀 Publish VS Code Extension

on:
  # Automatisch bei Git Tags
  push:
    tags:
      - 'v*'
  
  # Manuell über GitHub UI
  workflow_dispatch:
    inputs:
      version_type:
        description: 'Version type to publish'
        required: true
        default: 'patch'
        type: choice
        options:
        - patch
        - minor
        - major

jobs:
  publish:
    name: 📦 Build & Publish Extension
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      id-token: write  # Für OIDC Authentication
    
    steps:
    - name: 📥 Checkout Repository
      uses: actions/checkout@v4
      with:
        fetch-depth: 0  # Für Git-basierte Version detection
    
    - name: 🚀 Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: 📦 Install Dependencies
      run: |
        npm ci
        npm install -g vsce@latest
    
    - name: 🔍 Validate Package
      run: |
        npm run lint
        npm run compile
        npm run package
    
    - name: 🧪 Run Tests (if available)
      run: |
        # npm test
        echo "Tests would run here"
    
    - name: 📋 Package Extension
      run: |
        vsce package
        echo "VSIX_FILE=$(ls *.vsix)" >> $GITHUB_ENV
    
    - name: 🔐 Azure Login (Service Principal)
      if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
      run: |
        az login --service-principal \
          --username ${{ secrets.AZURE_CLIENT_ID }} \
          --password ${{ secrets.AZURE_CLIENT_SECRET }} \
          --tenant ${{ secrets.AZURE_TENANT_ID }}
    
    - name: 🌐 Publish to Marketplace
      if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
      env:
        AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
        AZURE_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
        AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
      run: |
        echo "Publishing extension to VS Code Marketplace..."
        vsce publish --azure-credential
    
    - name: 🎯 Manual Publish (Workflow Dispatch)
      if: github.event_name == 'workflow_dispatch'
      env:
        AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
        AZURE_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
        AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
      run: |
        echo "Publishing extension with version type: ${{ github.event.inputs.version_type }}"
        vsce publish ${{ github.event.inputs.version_type }} --azure-credential
    
    - name: 📤 Upload VSIX as Artifact
      uses: actions/upload-artifact@v4
      with:
        name: extension-vsix
        path: "*.vsix"
        retention-days: 30
    
    - name: 🏷️ Create GitHub Release
      if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
      uses: softprops/action-gh-release@v2
      with:
        files: "*.vsix"
        generate_release_notes: true
        draft: false
        prerelease: false

  # Optional: Pre-release testing
  test-installation:
    name: 🧪 Test Extension Installation
    runs-on: ubuntu-latest
    needs: publish
    if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
    
    steps:
    - name: 📥 Download Extension Artifact
      uses: actions/download-artifact@v4
      with:
        name: extension-vsix
    
    - name: 🚀 Setup VS Code CLI
      run: |
        wget -O vscode.deb 'https://code.visualstudio.com/sha/download?build=stable&os=linux-deb-x64'
        sudo dpkg -i vscode.deb
    
    - name: 🔧 Test Extension Installation
      run: |
        VSIX_FILE=$(ls *.vsix)
        code --install-extension "$VSIX_FILE" --force
        code --list-extensions | grep ayedo-cloud-solutions.polycrate-vscode
```

### **GitHub Actions Repository Setup**

#### **1. Repository Secrets konfigurieren**
```bash
# GitHub Repository > Settings > Secrets and variables > Actions

# Secrets hinzufügen:
AZURE_CLIENT_ID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_CLIENT_SECRET: "your-service-principal-secret"
AZURE_TENANT_ID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Optional: Personal Access Token als Fallback
VSCE_PAT: "your-personal-access-token"
```

#### **2. Repository Permissions**
```bash
# Repository > Settings > Actions > General
# Workflow permissions: "Read and write permissions"
# Allow GitHub Actions to create and approve pull requests: ✅

# Repository > Settings > Secrets and variables > Actions
# Environment protection rules (Optional):
# - Required reviewers für Production releases
# - Deployment branches: nur main/master
```

#### **3. Branch Protection (Empfohlen)**
```bash
# Repository > Settings > Branches > Add rule
# Branch name pattern: main
# Protections:
# ✅ Require a pull request before merging
# ✅ Require status checks to pass before merging
# ✅ Require branches to be up to date before merging
# ✅ Include administrators
```

### **GitHub Actions Workflow Trigger**

#### **Automatisches Publishing bei Git Tags**
```bash
# Version in package.json aktualisieren
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.0 → 0.2.0  
npm version major  # 0.1.0 → 1.0.0

# Tag erstellen und pushen
git push origin main
git push origin --tags

# GitHub Actions wird automatisch getriggert
```

#### **Manuelles Publishing über GitHub UI**
```bash
# GitHub Repository > Actions > "🚀 Publish VS Code Extension"
# "Run workflow" Button klicken
# Version type auswählen: patch/minor/major
# "Run workflow" bestätigen
```

#### **Pull Request Workflow (Optional)**
```yaml
# .github/workflows/validate-pr.yml
name: 🔍 Validate Pull Request

on:
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install and Test
      run: |
        npm ci
        npm run lint
        npm run compile
        npm run package
    
    - name: Package Validation
      run: |
        npx vsce package
        npx vsce ls
```

### **Monitoring & Notifications**

#### **Slack/Teams Benachrichtigung (Optional)**
```yaml
# Am Ende des publish jobs hinzufügen:
    - name: 📢 Notify Success
      if: success()
      uses: 8398a7/action-slack@v3
      with:
        status: success
        text: "✅ Polycrate VS Code Extension v${{ github.ref_name }} erfolgreich veröffentlicht!"
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
    
    - name: 📢 Notify Failure
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        text: "❌ Publishing der Polycrate Extension fehlgeschlagen!"
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### **Security Best Practices**

#### **Credential Rotation**
```bash
# Client Secrets rotieren (alle 12-24 Monate)
# 1. Neues Client Secret in Azure AD erstellen
# 2. Pipeline/CI-Secrets aktualisieren
# 3. Altes Secret testen und löschen
```

#### **Least Privilege**
```bash
# Service Principal nur mit minimal nötigen Berechtigungen:
# - Azure DevOps: Extensions (Manage)
# - Marketplace: Publish/Update Extensions
# - Keine Admin-Rechte auf Organization-Ebene
```

#### **Monitoring & Auditing**
```bash
# Azure AD > Sign-in logs > Service Principal activity
# Azure DevOps > Audit log > Extension publishing events
# Regelmäßige Access Reviews
```

---

## 🔄 Update Process

### **Minor Updates (Bug Fixes)**
```bash
# 1. Änderungen implementieren
# 2. Version in package.json erhöhen (z.B. 0.1.0 → 0.1.1)
# 3. Build und Test
npm run compile && npm run package
npx vsce package

# 4. Veröffentlichen
npx vsce publish patch
```

### **Feature Updates**
```bash
# 1. Neue Features implementieren
# 2. README.md aktualisieren
# 3. Version erhöhen (z.B. 0.1.0 → 0.2.0)
# 4. Release Notes aktualisieren
# 5. Build und Test
# 6. Git Tag erstellen
git tag v0.2.0 && git push origin v0.2.0

# 7. Veröffentlichen
npx vsce publish minor
```

### **Breaking Changes (Major Version)**
```bash
# 1. Breaking Changes implementieren
# 2. Migration Guide in README hinzufügen
# 3. Major Version erhöhen (z.B. 0.9.0 → 1.0.0)
# 4. Ausführliche Release Notes
# 5. Community benachrichtigen
# 6. Veröffentlichen
npx vsce publish major
```

---

## 🚨 Troubleshooting

### **Häufige Build-Probleme**
```bash
# TypeScript Compilation Errors
npm run compile 2>&1 | grep error

# Webpack Bundle Errors
npm run package -- --verbose

# VSIX Package Errors
npx vsce package --debug
```

### **Publishing-Probleme**
```bash
# PAT Token abgelaufen
npx vsce login ayedo-cloud-solutions

# Publisher-Rechte prüfen
npx vsce verify-pat

# Extension bereits existiert
npx vsce show ayedo-cloud-solutions.polycrate-vscode
```

### **Runtime-Debugging**
```bash
# Extension Host Log öffnen
# Help > Toggle Developer Tools > Console

# Output Channel prüfen
# View > Output > "Polycrate Language Server"

# VS Code Logs
~/.vscode/logs/
```

---

## 📊 Marketplace Analytics

### **Extension Metrics überwachen**
```bash
# Über VS Code Marketplace Portal
# https://marketplace.visualstudio.com/manage

# Metriken:
# - Install Count
# - Download Count
# - Ratings & Reviews
# - Daily Active Users
```

### **User Feedback**
- **GitHub Issues** - Bugs und Feature Requests
- **Marketplace Reviews** - Nutzer-Feedback
- **Ayedo Support** - Enterprise-Kunden Feedback

---

## 🏢 Ayedo-spezifische Hinweise

### **Branding Guidelines**
- **Publisher**: Immer "ayedo-cloud-solutions"
- **Logo**: Polycrate PNG-Logo verwenden
- **Farben**: Polycrate-Brandfarben (#68369b)
- **Links**: Alle Links zu ayedo.de

### **Support & Maintenance**
- **Issues**: GitHub Repository für Community-Support
- **Enterprise**: Direkter Support über info@ayedo.de
- **Updates**: Regelmäßige Updates alle 2-4 Wochen
- **Security**: Abhängigkeiten monatlich prüfen

### **Compliance**
- **Lizenz**: MIT License
- **Datenschutz**: Keine Nutzer-Daten sammeln
- **Telemetry**: VS Code Standard-Telemetry verwenden

---

## 📝 Development Notes

### **Architektur-Übersicht**
```
src/
├── extension.ts              # Extension Entry Point
├── languageServer.ts         # Validation & CLI Integration
├── completionProvider.ts     # IntelliSense Auto-Completion
├── hoverProvider.ts          # Hover Documentation
├── versionDiffProvider.ts    # Block Version Comparison
├── hubIntegrationProvider.ts # Polycrate Hub Integration
├── commandProvider.ts        # VS Code Commands
└── validationProvider.ts     # Document Validation
```

### **Wichtige Extension Points**
- **Languages**: `.poly` file association
- **Commands**: Command Palette integration
- **Menus**: Context menu items
- **Configuration**: User settings
- **Grammars**: Syntax highlighting

### **Testing Strategy**
- **Unit Tests**: Für individuelle Provider (TODO)
- **Integration Tests**: Extension Host testing (TODO)
- **Manual Testing**: Complete feature testing
- **User Acceptance**: Ayedo team testing

---

**Entwickelt mit ❤️ von [Ayedo Cloud Solutions GmbH](https://ayedo.de)**

*Für Fragen zur Entwicklung: engineering@ayedo.de*