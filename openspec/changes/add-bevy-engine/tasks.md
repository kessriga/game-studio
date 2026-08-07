## 1. Research and pin the Bevy release

- [x] 1.1 Verify current Bevy minor via WebSearch (bevy.org/news, migration guides); record version, release date, and training-gap window
- [x] 1.2 Collect source URLs for the last ~3 migration guides and current API docs for use in the reference tree

## 2. Engine-reference tree (docs/engine-reference/bevy/)

- [x] 2.1 Write VERSION.md (pinned minor, verification date, knowledge-gap warning, per-minor risk timeline, verified sources)
- [x] 2.2 Write breaking-changes.md and deprecated-apis.md from the official migration guides (last ~3 minors)
- [x] 2.3 Write current-best-practices.md (ECS patterns, app/plugin structure, asset handling, headless testing)
- [x] 2.4 Write the 8 module refs (animation, audio, input, navigation, networking, physics, rendering, ui), ≤150 lines each, naming third-party crates where Bevy has no first-party module
- [x] 2.5 Check the tree against the engine-reference README contract

## 3. Bevy agent set (.claude/agents/)

- [x] 3.1 Write bevy-specialist.md (primary: ECS/app architecture, delegation map, sub-specialist orchestration, Version Awareness, ripgrep guidance for *.rs/*.wgsl/*.ron)
- [x] 3.2 Write bevy-rust-specialist.md (Rust quality: ownership, error handling, system/query idioms; mine godot-gdextension-specialist for reusable Rust conventions)
- [x] 3.3 Write bevy-render-specialist.md (wgpu/WGSL, materials, post-processing, render graph)
- [x] 3.4 Write bevy-ui-specialist.md (bevy_ui layout, widgets, focus/input routing)
- [x] 3.5 Cross-check all four for uniform frontmatter and Version Awareness sections pointing at docs/engine-reference/bevy/

## 4. Setup and routing skills

- [x] 4.1 setup-engine: add Bevy to all six enumeration sites (guided options, platform rules, tradeoffs, CLAUDE.md template, naming conventions, knowledge-gap baseline ~0.16-0.17 default HIGH)
- [x] 4.2 setup-engine: add Bevy config inline (Rust-only CLAUDE.md template, naming conventions, Engine Specialists block, File Extension Routing with explicit N/A rows) — no separate appendix needed since Bevy has one language; made §9 Version Awareness injection an explicit no-op for Bevy
- [x] 4.3 dev-story: add Bevy row to the engine→specialist table
- [x] 4.4 brainstorm: add Bevy to engine options prose

## 5. Test scaffolding

- [x] 5.1 test-setup: add cargo GitHub Actions workflow block (fmt + clippy + headless cargo test with MinimalPlugins note)
- [x] 5.2 test-helpers: add Rust/Bevy test-helper implementation
- [x] 5.3 smoke-check and soak-test: add cargo invocations; test-flakiness: add cargo/nextest log parsing
- [x] 5.4 coding-standards.md: add Bevy CI command row

## 6. Docs, rosters, and sweep

- [x] 6.1 Update agent-roster.md, agent-coordination-map.md, quick-start.md with the Bevy set
- [x] 6.2 Update README.md, WORKFLOW-GUIDE.md engine tables and examples (incl. agent-count 49→53)
- [x] 6.3 Update shader-code.md rule (WGSL naming), statusline.sh and content-audit globs (*.wgsl, *.ron), localize RTL row
- [x] 6.4 Repo-wide sweep for three-engine phrasing; fix or add explicit N/A (CLAUDE.md note, quick-start, templates, engine-reference README, docs/CLAUDE.md godot path made generic)
- [x] 6.5 Add Bevy agent specs + catalog.yaml entries to the skill/agent testing framework (`qa/`)

## 7. Verification

- [x] 7.1 Static-structure check on setup-engine, dev-story, test-setup (frontmatter/YAML/name intact) — manual equivalent of /skill-test static; full skill-test deferred to run outside the worktree
- [x] 7.2 Spot-check existing-engine behavior unchanged — confirmed via additive diff (34 deletions all intended in-place count/phrasing edits; no Godot/Unity/Unreal routing or templates removed)
- [x] 7.3 Verify every spec scenario in specs/bevy-engine-support/spec.md against the implemented state — all six requirements satisfied
- [x] 7.4 Update Backlog task-1 acceptance criteria checkboxes and record implementation notes
