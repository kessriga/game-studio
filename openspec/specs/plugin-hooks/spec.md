# Explicit validation specification

The former hook contract is retired for 0.4.0 by
[the host-neutral decision](../../../docs/decisions/host-neutral-layout.md).
Archived hook task outcomes remain historical, not current requirements.

## Requirements

- No host hook registration or hook script SHALL ship. No contributor host settings SHALL be installed.
- Shared workflows SHALL require explicit validation, protected-branch checks, asset checks, startup context loading,
  and file-backed handoff as described in [the host guide](../../../docs/host-runtime.md#explicit-checks).
- The Pi progress extension SHALL NOT claim automatic validation, notification, or audit-hook parity.
- Missing tooling or independent review SHALL remain visibly unverified. Role prose and saved evidence SHALL NOT be
  treated as permission grants or user approval.

## Acceptance scenarios

- Packed resources contain no retired hooks or host settings.
- Instructions retain explicit safety and evidence responsibilities without assuming automatic events.
