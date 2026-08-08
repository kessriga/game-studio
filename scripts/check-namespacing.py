#!/usr/bin/env python3
"""Namespacing gate: fail if any shipped file references a framework skill or agent
by its bare name in invocation position instead of the gamedev: namespace.

Roster is derived from the filesystem (skills/<name>/, agents/<name>.md), so it
stays correct as skills/agents are added or removed. Run from the repo root.
Exit 0 = clean, exit 1 = bare references found (printed with location)."""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def roster(kind):
    base = os.path.join(ROOT, kind)
    if kind == "skills":
        return sorted(d for d in os.listdir(base)
                      if os.path.isdir(os.path.join(base, d)))
    return sorted(f[:-3] for f in os.listdir(base) if f.endswith(".md"))

skills = roster("skills")
agents = roster("agents")

# bare /skill invocation (not a path, not already gamedev:)
re_slash = re.compile(r'(?<![\w./:-])/(' + "|".join(map(re.escape, sorted(skills, key=len, reverse=True))) + r')(?![\w/-])')
# bare subagent_type: agent
re_sub = re.compile(r'subagent_type\s*[:=]\s*["\']?(' + "|".join(map(re.escape, sorted(set(skills) | set(agents), key=len, reverse=True))) + r')["\']?')

SCOPE = ["skills", "agents", "hooks", "docs", "templates", "qa"]
FILES = ["README.md", "CONTRIBUTING.md"]
EXTS = (".md", ".yaml", ".yml", ".txt", ".sh")

def scan():
    for base in SCOPE:
        for dp, _, fns in os.walk(os.path.join(ROOT, base)):
            for fn in fns:
                if fn.endswith(EXTS):
                    yield os.path.join(dp, fn)
    for fn in FILES:
        p = os.path.join(ROOT, fn)
        if os.path.exists(p):
            yield p

hits = 0
for path in scan():
    rel = os.path.relpath(path, ROOT)
    with open(path, encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            for m in re_slash.finditer(line):
                print(f"{rel}:{i}: bare skill invocation /{m.group(1)}")
                hits += 1
            for m in re_sub.finditer(line):
                print(f"{rel}:{i}: bare subagent_type {m.group(1)}")
                hits += 1

if hits:
    print(f"\nFAIL: {hits} bare framework reference(s) — expected gamedev: namespace")
    sys.exit(1)
print("OK: no bare framework references in shipped files")
