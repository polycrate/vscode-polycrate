# Polycrate VS Code Extension

![Polycrate Logo](polycrate-logo.png)

Eine vollständige VS Code Extension für die Polycrate DevOps-Platform, die umfassende Unterstützung für Workspace- und Block-Dateien (`.poly`-Dateien) bietet.

---

## 🚀 Features

### **🎨 Syntax Highlighting & Language Support**
- **Vollständige Syntax-Hervorhebung** für alle `.poly` Dateien
- **Intelligent language configuration** mit automatischer Einrückung und Klammererkennung
- **Spezielle Unterstützung** für `workspace.poly`, `block.poly` und `CHANGELOG.poly`

### **🧠 IntelliSense & Auto-Completion**
- **Smart Auto-Completion** für Workspace- und Block-Konfigurationen
- **Kontextbezogene Vorschläge** basierend auf Dateityp und Position
- **Block-spezifische Completion** mit Unterstützung für verschiedene Block-Arten
- **Konfigurationshilfen** für komplexe YAML-Strukturen

### **🔍 Erweiterte Validierung**
- **Echtzeit-Validierung** aller Polycrate-Dateien mit präziser Fehlerpositionierung
- **CLI-Integration** für authentische Validierung mit dem Polycrate CLI
- **Intelligente Fehlererkennung** für:
  - Fehlende erforderliche Felder
  - Ungültige Block-Arten und Typen
  - Versionsprobleme in `from`-Feldern
  - Strukturelle YAML-Probleme
- **Warnungen für Best Practices**:
  - Fehlende Versionsangaben in Block-Referenzen
  - Verwendung von `:latest` Tags

### **📚 Dokumentation & Hover-Hilfe**
- **Umfassende Hover-Dokumentation** für alle Polycrate-Schlüsselwörter
- **Beispiele und Best Practices** direkt im Editor
- **Block-Konfigurationsvorschau** beim Arbeiten an Block-Konfigurationen
- **Kontextuelle Hilfe** für alle unterstützten Eigenschaften

### **🔄 Version Management & Vergleich**
- **Block-Versionsvergleich** zwischen verschiedenen Versionen
- **Git-Integration** für historische Versionsvergleiche
- **Registry-Vergleich** mit der neuesten Version aus dem Hub
- **Versionshistorie-Anzeige** mit detailliertem Changelog
- **Interaktive Diff-Ansicht** mit Markdown-Formatierung

### **🌐 Polycrate Hub Integration**
- **Block-Discovery** aus dem Polycrate Hub
- **Erweiterte Suchfunktionen**:
  - Suche nach Name/Stichwörtern
  - Browsen nach Kategorien (Database, Web Server, Cache, etc.)
  - Browsen nach Block-Arten (generic, k8sapp, db, kv, mq, app)
  - Beliebte und neue Blöcke anzeigen
- **Automatische Workspace-Integration** - Blöcke direkt zum Workspace hinzufügen
- **Block-Referenzen kopieren** für externe Verwendung
- **Direkter Zugang** zu Dokumentation und Quellcode

### **⚡ Integrierte Kommandos**
- **Workspace-Validierung** mit detailliertem Feedback
- **Block-Validierung** für einzelne Blöcke
- **Block-Suche** im Polycrate Hub
- **Changelog-Anzeige** für Blöcke
- **Versionsvergleich** zwischen Block-Versionen
- **Block-Discovery** mit interaktiven Auswahlmenüs

---

## 📁 Unterstützte Dateitypen

| Dateityp | Beschreibung | Features |
|----------|--------------|----------|
| `workspace.poly` | Workspace-Konfigurationsdateien | Vollständige IntelliSense, Validierung, Block-Management |
| `block.poly` | Block-Konfigurationsdateien | Block-spezifische Completion, Versionsvergleich |
| `CHANGELOG.poly` | Block-Changelog-Dateien | Syntax-Highlighting, Strukturvalidierung |
| `.workspace` | Alternative Workspace-Dateien | Grundlegende Unterstützung |

---

## 🎛️ Verfügbare Kommandos

| Kommando | Beschreibung | Verfügbar über |
|----------|--------------|----------------|
| **Polycrate: Validate Workspace** | Validiert die aktuelle Workspace-Konfiguration | Command Palette, Context Menu |
| **Polycrate: Validate Block** | Validiert die aktuelle Block-Konfiguration | Command Palette, Context Menu |
| **Polycrate: Search Blocks** | Durchsucht Blöcke im Polycrate Hub | Command Palette |
| **Polycrate: Show Block Changelog** | Zeigt Changelog für den aktuellen Block | Command Palette |
| **Polycrate: Compare Block Versions** | Vergleicht Block-Versionen | Command Palette, Context Menu |
| **Polycrate: Discover Blocks from Hub** | Entdeckt neue Blöcke im Hub | Command Palette |

---

## ⚙️ Konfiguration

Die Extension kann über VS Code-Einstellungen konfiguriert werden:

```json
{
  "polycrate.validation.enable": true,
  "polycrate.completion.enable": true,
  "polycrate.hub.endpoint": "https://hub.polycrate.com",
  "polycrate.cli.path": "polycrate"
}
```

### Verfügbare Einstellungen

| Einstellung | Typ | Standard | Beschreibung |
|-------------|-----|----------|--------------|
| `polycrate.validation.enable` | boolean | `true` | Aktiviert/deaktiviert Validierung für Polycrate-Dateien |
| `polycrate.completion.enable` | boolean | `true` | Aktiviert/deaktiviert Auto-Completion |
| `polycrate.hub.endpoint` | string | `"https://hub.polycrate.com"` | Polycrate Hub Endpoint-URL |
| `polycrate.cli.path` | string | `"polycrate"` | Pfad zum Polycrate CLI |

---

## 📋 Systemanforderungen

- **VS Code** 1.74.0 oder höher
- **Polycrate CLI** installiert und im PATH verfügbar (oder konfigurierter Pfad)
- **Git** (optional, für Versionsvergleiche)

---

## 🎯 Verwendung

### **Block-Discovery und -Integration**
1. Öffnen Sie die Command Palette (`Ctrl+Shift+P`)
2. Suchen Sie nach "Polycrate: Discover Blocks from Hub"
3. Wählen Sie eine Discovery-Methode:
   - Nach Name suchen
   - Nach Kategorie browsen  
   - Nach Block-Art browsen
   - Beliebte Blöcke anzeigen
4. Wählen Sie einen Block aus den Ergebnissen
5. Fügen Sie ihn direkt zu Ihrem Workspace hinzu

### **Versionsvergleich**
1. Öffnen Sie eine `workspace.poly` oder `block.poly` Datei
2. Rechtsklick → "Compare Block Versions"
3. Wählen Sie den Vergleichstyp:
   - Mit Registry-Latest vergleichen
   - Mit vorheriger Workspace-Version vergleichen
   - Versionshistorie anzeigen

### **Validierung und Fehlerbehebung**
- **Automatische Validierung** läuft kontinuierlich im Hintergrund
- **Fehler und Warnungen** werden direkt im Editor mit Unterstreichungen angezeigt
- **Hover über Fehler** für detaillierte Informationen und Lösungsvorschläge

---

## 🔧 Entwicklung und Beitrag

Dieses Projekt wird von **[Ayedo Cloud Solutions GmbH](https://ayedo.de)** entwickelt und gepflegt.

### **Feedback und Issues**
- Melden Sie Bugs und Feature-Requests im [GitHub Repository](https://github.com/ayedo/polycrate-vscode)
- Kontaktieren Sie uns unter [ayedo.de](https://ayedo.de) für Enterprise-Support

### **Beitrag leisten**
Wir freuen uns über Beiträge zur Extension! Bitte folgen Sie unserem Contribution Guide im Repository.

---

## 📊 Release Notes

### **0.1.0** - Initial Release
🎉 **Erste vollständige Version der Polycrate VS Code Extension**

**🆕 Neue Features:**
- ✅ Vollständige Syntax-Hervorhebung für `.poly` Dateien
- ✅ IntelliSense-Unterstützung für Workspace- und Block-Konfigurationen
- ✅ Echtzeit-Validierung mit präziser Fehlerpositionierung
- ✅ Hover-Dokumentation für Polycrate-Schlüsselwörter
- ✅ CLI-Integration für authentische Validierung
- ✅ Block-Versionsvergleich und -historie
- ✅ Polycrate Hub Integration mit Block-Discovery
- ✅ Automatische Workspace-Integration für entdeckte Blöcke
- ✅ Umfassende Kommando-Palette Integration
- ✅ Context-Menu-Integration für schnellen Zugriff

**🔧 Technische Verbesserungen:**
- ✅ Webpack-basierte Bundle-Optimierung
- ✅ TypeScript-basierte Entwicklung
- ✅ Umfassende Fehlerbehandlung
- ✅ Mock-Daten für Demo-Zwecke
- ✅ Konfigurierbare Hub-Endpoints

---

## 📜 Lizenz

Diese Extension ist unter der MIT-Lizenz lizenziert.

---

## 🏢 Über Ayedo Cloud Solutions GmbH

**[Ayedo Cloud Solutions GmbH](https://ayedo.de)** ist ein führender Anbieter von Cloud-nativen DevOps-Lösungen. Wir entwickeln innovative Tools und Plattformen, die Entwicklungsteams dabei helfen, schneller und effizienter zu arbeiten.

**Kontakt:**
- 🌐 Website: [ayedo.de](https://ayedo.de)
- 📧 E-Mail: info@ayedo.de
- 🔗 LinkedIn: [Ayedo Cloud Solutions](https://linkedin.com/company/ayedo)

---

**Entwickelt mit ❤️ von [Ayedo Cloud Solutions GmbH](https://ayedo.de)**