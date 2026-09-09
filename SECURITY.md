# Security Policy

## Supported Versions

Only the `main` branch receives security fixes. Forks and older releases are not supported.

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

Use GitHub's private vulnerability reporting instead:

**[Report a vulnerability →](https://github.com/kessriga/game-studio/security/advisories/new)**

Include as much detail as possible:

- Description of the vulnerability and what it affects
- Steps to reproduce
- Potential impact and attack scenarios
- Any suggested mitigations

**What to expect:**

- Acknowledgment within **48 hours**
- Status update within **7 days**
- Resolution within **90 days** for confirmed vulnerabilities

## What Is In Scope

Game Studio is a **local development tool**. Its skills and scripts can act on project files and run local commands
through available authorized tools. The Pi extension also runs local package code. No host validation hooks are bundled.
Security issues include contributed code that executes in users' environments without their awareness; role prose never
grants permissions.

### High Severity

- Scripts or Pi extension code that execute malicious or undisclosed shell commands on user machines
- Skills or agents that exfiltrate environment variables, API keys, or secrets
- Prompt injection via skill or agent definitions that causes the assistant to bypass safety measures or take
  unauthorized destructive actions
- Contributions that silently alter behavior in ways users cannot audit

### Medium Severity

- Skills that make undisclosed outbound network requests
- Agent definitions that escalate permissions or bypass user confirmation prompts
- Scripts that behave differently across platforms to conceal behavior
- Skills that write outside their documented scope without an explicit user approval step

### Out of Scope

- The behavior of the underlying model, coding assistant, or its editor extension (report those issues to the provider
  of the affected host)
- Theoretical vulnerabilities with no realistic attack path
- Issues requiring physical access to the user's machine

## Security Guidelines for Contributors

When contributing scripts, the Pi extension, skills, or roles:

- **Shell helpers must be portable** — use `grep -E`, not `grep -P`; avoid platform-specific syntax that behaves
  differently across operating systems
- **No silent network calls** from scripts, extensions, or workflows unless explicitly documented and opt-in by the user
- **No reading secrets or environment variables** beyond what is minimally required and clearly documented in the
  skill's header
- **Skills must not write outside their documented scope** without an explicit user confirmation step

## Disclosure Policy

We follow a **90-day coordinated disclosure** timeline:

1. You submit the vulnerability privately
2. We acknowledge within 48 hours
3. We confirm and assess severity within 7 days
4. We develop and test a fix
5. We notify you before any public disclosure
6. Public disclosure happens after the fix ships, or at 90 days — whichever comes first

We credit reporters in release notes unless you prefer to remain anonymous.
