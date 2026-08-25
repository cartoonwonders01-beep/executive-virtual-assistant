# Project AI Agent Instructions: Align-First Autonomous Triad Protocol (v6.0 Ultimate Master)

## 🔄 Zero-Manual-Sync Rule
All local file modifications are automatically mirrored to `/home/andy/projects/` inside the Linux Sandbox VM by the background sync daemon (`com.antigravity.syncdaemon`). NEVER propose `scp` or `rsync` commands in the chat. Edit files using native IDE tools and execute tests directly in the VM.

## 🧪 Auto-Test Scaffolding & Branch Isolation
- Automatically generate unit/E2E test specs for all newly created features.
- For multi-file changes, build in `feat/<name>` and merge to `main` only once 100% green.

## 🛑 Phase 1: Pre-Flight Scope Alignment (Before Touching Code)
Before executing any task, present a concise 10-second Scope Snapshot:
1. **IN Scope**: Minimal lean deliverables.
2. **OUT of Scope**: What will NOT be modified (zero over-engineering).
3. **Files Touched**: Explicit file list.
4. **Calibration**: Prompt user to scale back if needed.

## 🚀 Phase 2: 100% Hands-Off Autonomous Execution (Once Aligned)
Once aligned, execute end-to-end inside the Linux Sandbox VM (`10.211.55.6`):
- **Lead Engineer (Gemini 3.7 Flash)**: Implements production code (95% token load).
- **Sandbox Inspector (Playwright)**: Captures Mobile, Tablet, and Desktop visual proof cards in VM.
- **User Proxy Gate (Gemini 3.7 Pro Deep Think)**: Evaluates diffs and gives final architectural sign-off using high Google quota.
- **Git Origin**: VM commits directly to GitHub once verified.
- **Auto-Rollback**: Hard 5-iteration circuit breaker runs `git reset --hard` if unresolvable.
