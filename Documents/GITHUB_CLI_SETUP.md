# GitHub CLI Setup

The GitHub CLI (`gh`) is required for advanced repository management, CI/CD, and automation tasks.

## Installation

### Windows

Download and run the installer from:
https://github.com/cli/cli/releases/latest

Or install via winget:

```
winget install --id GitHub.cli
```

### macOS

```
brew install gh
```

### Linux

```
sudo apt install gh
```

## Authenticate

After installation, authenticate with your GitHub account:

```
gh auth login
```

Follow the prompts to complete authentication.

## Usage Examples

- Clone repositories: `gh repo clone <owner>/<repo>`
- Create issues: `gh issue create`
- View PRs: `gh pr list`
- Run workflows: `gh workflow run <workflow>`

See the [GitHub CLI documentation](https://cli.github.com/manual/) for more details.
