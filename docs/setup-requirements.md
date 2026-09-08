# Setup Requirements

Game Studio needs a supported coding assistant and the local tools below. Choose [Pi setup](pi.md),
[Claude Code setup](claude-code.md), or [Codex setup](codex.md). Keep your game in its own repository.

## Required

| Tool | Purpose | Setup |
| ------ | --------- | ------- |
| Pi, Claude Code, or Codex | Runs the skills and specialist workflows | Follow the host guide linked above |
| Git | Version control and worktrees | [git-scm.com](https://git-scm.com/) |
| Python 3 | Adds missing project scaffold files | [python.org](https://www.python.org/) |
| Bash | Stage reporting and shell helpers | Git Bash on Windows; system Bash on macOS and Linux |

Backlog.md, OpenSpec, and engine tools are separate integrations. Only the workflows that use them require them.
Discover the tools available in the current session before attempting tracker updates or engine validation.

## Optional Claude hook tools

The Claude hooks use `jq` for JSON event input and Python for data validation. Missing optional tools can make
individual checks skip validation; a successful hook exit alone does not establish that the game passed its checks. Pi
and Codex do not register these hooks and follow the explicit checks in
[the host guide](host-runtime.md#explicit-checks).

Install `jq` with your package manager if you use the Claude hooks:

| Platform | Example |
| ---------- | --------- |
| Windows | `winget install jqlang.jq` |
| macOS | `brew install jq` |
| Debian or Ubuntu | `sudo apt install jq` |
| Fedora | `sudo dnf install jq` |
| Arch | `sudo pacman -S jq` |

Python remains required for scaffolding, regardless of hook use.

## Platform notes

On Windows, make Git Bash available on PATH. Use forward slashes in paths passed to Bash, such as `C:/projects/my-game`.
When invoking Bash from a program, resolve its full executable path: Windows may otherwise select the WSL launcher even
when a PATH lookup finds Git Bash.

On macOS and Linux, use the system Bash. See [the hook reference](hooks-reference.md) for platform limits of individual
Claude hooks.

## Verify the local tools

```sh
git --version
bash --version
python3 --version
jq --version           # Optional; used by Claude hooks
```

Use any editor you prefer. The plugin's shared workflows do not depend on a particular editor extension.
