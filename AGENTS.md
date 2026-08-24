# Project AI Agent Instructions: Heterogeneous Autonomous Triad & Air-Gapped Sandbox Protocol

## 🏛️ 1. Heterogeneous Triad Architecture
All tasks in this repository operate under the **Heterogeneous Autonomous Triad**:
1. **Lead Engineer (Gemini 3.7 Flash)**: Implements 100% complete production code (zero TODOs/mocks) and handles heavy build iterations in the Linux VM (95% token load).
2. **Sandbox Inspector (Playwright)**: Audits live dev servers across Mobile (390px), Tablet (820px), and Desktop (1440px) inside the Linux VM (`10.211.55.6`).
3. **User Proxy Critic Gate (Claude 3.7 Sonnet / Gemini 3.7 Pro)**: Receives compact git diffs + Visual Proof Cards (5% token load). Evaluates architectural integrity with zero model monoculture bias.

## 🔒 2. Air-Gapped Sandbox Safeguards
- **Host Protection**: macOS is an air-gapped storage & git origin. All package managers (`pnpm`, `uv`, `npm`), compilers, and test runners run inside Linux Sandbox VM.
- **Port Scavenger**: Pre-flight port cleaner `/home/andy/tools/port_cleaner.sh` clears stale dev servers automatically.
- **Auto-Rollback**: Hard 5-iteration circuit breaker runs `git reset --hard` if an unrecoverable failure occurs.
