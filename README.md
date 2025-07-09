# Polycrate VS Code Extension

A VS Code extension that provides language support for Polycrate workspace and block files (`.poly` files).

## Features

- **Syntax Highlighting**: Full syntax highlighting for Polycrate `.poly` files
- **IntelliSense**: Smart auto-completion for workspace and block configurations
- **Validation**: Real-time validation of Polycrate files with error reporting
- **Hover Information**: Detailed documentation on hover for Polycrate keywords
- **Commands**: Integrated commands for workspace and block validation
- **Block Discovery**: Search and discover blocks from Polycrate Hub

## Supported File Types

- `workspace.poly` - Workspace configuration files
- `block.poly` - Block configuration files
- `CHANGELOG.poly` - Block changelog files

## Commands

- **Polycrate: Validate Workspace** - Validates the current workspace configuration
- **Polycrate: Validate Block** - Validates the current block configuration
- **Polycrate: Search Blocks** - Search for blocks in Polycrate Hub
- **Polycrate: Show Block Changelog** - Display changelog for the current block

## Configuration

The extension can be configured through VS Code settings:

```json
{
  "polycrate.validation.enable": true,
  "polycrate.completion.enable": true,
  "polycrate.hub.endpoint": "https://hub.polycrate.com",
  "polycrate.cli.path": "polycrate"
}
```

## Requirements

- VS Code 1.74.0 or higher
- Polycrate CLI installed and available in PATH (or configured path)

## Extension Settings

This extension contributes the following settings:

- `polycrate.validation.enable`: Enable/disable validation for Polycrate files
- `polycrate.completion.enable`: Enable/disable auto-completion
- `polycrate.hub.endpoint`: Polycrate Hub endpoint URL
- `polycrate.cli.path`: Path to the Polycrate CLI executable

## Known Issues

- Block version comparison features are still in development
- Some advanced YAML features may not be fully supported

## Release Notes

### 0.1.0

Initial release of Polycrate VS Code Extension:
- Basic syntax highlighting for .poly files
- IntelliSense support for workspace and block configurations
- Real-time validation with error reporting
- Hover documentation for Polycrate keywords
- Commands for workspace and block validation
- Block search functionality

## Contributing

Please report issues and feature requests on the [GitHub repository](https://github.com/ayedo/polycrate-vscode).

## License

This extension is licensed under the MIT License.