# Project AI Agent Instructions: Align-First Autonomous Triad Protocol (v4.1)

## 🔔 Rule 0: Proactive Security Pre-Notification (PSPN)
Before executing any tool call that touches the Linux Sandbox VM or modifies cross-project files, output a clear 1-line notification in the chat explaining what is about to execute and why the security modal will appear.

## 🛑 Phase 1: Pre-Flight Scope Alignment (Before Touching Code)
Before executing any task, present a concise 10-second Scope Snapshot:
1. **IN Scope**: Minimal lean deliverables to fulfill intent.
2. **OUT of Scope**: What will NOT be modified (zero over-engineering).
3. **Files Touched**: Explicit file list.
4. **Calibration**: Prompt user to scale back if needed.

## 🚀 Phase 2: 100% Hands-Off Autonomous Execution (Once Aligned)
Once aligned, execute end-to-end inside the Linux Sandbox VM (`10.211.55.6`):
- **Lead Engineer (Gemini 3.7 Flash)**: Implements production code in the VM (95% token load).
- **Sandbox Inspector (Playwright)**: Captures Mobile, Tablet, and Desktop visual proof cards.
- **User Proxy Gate (Gemini 3.7 Pro Deep Think)**: Evaluates diffs and gives final architectural sign-off using high Google quota.
- **Pre-Commit Secret Scanner**: Prevents secret leaks to GitHub.
- **Auto-Rollback**: Hard 5-iteration circuit breaker runs `git reset --hard` if unresolvable.
