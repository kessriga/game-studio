# Setup requirements

Keep the game in its own repository. Follow [Pi setup](pi.md) and [the host guide](host-runtime.md). Shared Markdown
workflows do not grant tools or configure other runtimes.

| Tool | Purpose | Setup |
| --- | --- | --- |
| Pi | Supported integration for skills and progress | [Pi guide](pi.md) |
| Node 22.17+ | Pi extension runtime | [nodejs.org](https://nodejs.org/) |
| Git | Version control and authorized worktrees | [git-scm.com](https://git-scm.com/) |
| Python 3 | Preserve-and-add project scaffolding | [python.org](https://www.python.org/) |
| Bash | Stage reporting and shell helpers | Git Bash on Windows; system Bash on macOS/Linux |

Backlog.md, OpenSpec, web tools, MCP support, subagent runners, and engines are separate integrations. Discover
available tools first. Missing integrations block dependent work, not unrelated design work. Do not install tooling or
change global settings merely because a workflow names it. Validation and session handoffs are
[explicit responsibilities](host-runtime.md#explicit-checks).

## Platform notes

On Windows, put Git Bash on PATH and use forward slashes in Bash paths, such as `C:/projects/my-game`. When launching
Bash from a program, resolve its full executable path to avoid selecting the WSL launcher. Quote paths on every platform
and run game commands from the game directory.

```sh
git --version
bash --version
python3 --version
node --version
```

Use any editor. See [CONTRIBUTING.md](../CONTRIBUTING.md) for package development dependencies and gates.
