# Project AI Agent Instructions: Align-First Heterogeneous Triad Protocol (v3.0)

## 🛑 Phase 1: Pre-Flight Scope Alignment (Before Touching Code)
Before executing any task, present a concise 10-second Scope Snapshot:
1. **IN Scope**: Minimal lean deliverables.
2. **OUT of Scope**: What will NOT be modified (zero over-engineering).
3. **Files Touched**: Explicit file list.
4. **Calibration**: Prompt user to scale back if needed.

## 🚀 Phase 2: 100% Hands-Off Autonomous Execution (Once Aligned)
Once aligned, execute end-to-end inside the Linux Sandbox VM (`10.211.55.6`):
- **Lead Engineer (Gemini 3.7 Flash)**: Implements production code in the VM (95% token load).
- **Sandbox Inspector (Playwright)**: Captures Mobile, Tablet, and Desktop visual proof cards.
- **User Proxy Gate (Claude 3.7 / Gemini Pro)**: Evaluates diffs and gives final sign-off.
- **Git Origin**: VM commits directly to GitHub once verified.
- **Auto-Rollback**: Hard 5-iteration circuit breaker runs `git reset --hard` if unresolvable.
