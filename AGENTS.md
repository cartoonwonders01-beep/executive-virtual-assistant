# Agent Operational Guidelines (Universal Standard v4.1)

## 🏛️ 1. Core Protocol: Align-First Heterogeneous Triad (v4.1)

All agents working in this workspace must adhere to the following workflow:

### A. Proactive Security Pre-Notification (PSPN) 🔔
Before proposing any command that executes against the Linux Sandbox VM via `ssh`, modifies cross-workspace files, or performs Git operations, the agent **MUST output an explicit pre-notification in the chat**:
> 🔔 **[Security Pre-Notification]**: *"I am about to execute [Action Purpose] on [Target Environment]. You will see a security confirmation prompt for [Command Detail]."*

### B. Pre-Flight Scope Alignment (Before Touching Code) 🎯
Present a concise 10-second Scope Snapshot before making code changes:
1. 🎯 **IN Scope**: Minimal lean deliverables to fulfill intent.
2. ❌ **OUT of Scope**: What will NOT be modified (zero over-engineering).
3. 📁 **Files Touched**: Explicit file list.
4. 👂 **Calibration Check**: *"Does this match what you want, or should we scale it back?"*

### C. Inline-First Triad Execution (Parallel-Only Subagents) 🤖
To eliminate latency, avoid thread serialization delays, and protect host RAM:
1. **Inline by Default (Sequential Tasks):**
   - Software development is inherently sequential ($\text{Code} \rightarrow \text{Test} \rightarrow \text{Audit}$).
   - The primary agent MUST execute all Triad perspectives **inline directly** within the active session rather than spawning child subagents.
   - **Role 1 — Lead Engineer:** Execute implementation, refactoring, and code changes directly inline with warm repository context.
   - **Role 2 — Sandbox Inspector:** Trigger verification tests or VM Playwright runs directly and evaluate results inline.
   - **Role 3 — User Proxy Gate:** Perform diff analysis, security invariant audits, and sign-off inline.
2. **Subagents Reserved for True Parallelism Only:**
   - Subagents via `invoke_subagent` are **strictly forbidden** for sequential dependent tasks.
   - Subagents MAY ONLY be spawned when tasks are genuinely independent, non-blocking, and concurrent (e.g., executing multiple parallel web searches, benchmarking competing algorithms concurrently, or isolated long-running background research).


---

## 🛠️ 2. Architectural Boundaries: Host vs VM

- **Host (macOS):**
  - Source code editing and Git version control.
  - Antigravity IDE and chat interface.
  - Never run unvetted npm packages, build tools, or heavy daemons directly on macOS.
  - **No Polling Timers / Daemons:** Never set infinite polling timers (`schedule` loops) or continuous background sync scripts. Sync on-demand before testing.

- **Sandbox VM (`10.211.55.6`):**
  - All runtime execution, `npm install`, dependencies, build compilation, and local dev servers.
  - Playwright visual regression testing across viewports inside virtual memory buffers (`Xvfb`).

---

## 🌐 3. Multi-Environment CI/CD & Deployment Standards

All projects managed by Antigravity must implement the standard two-branch deployment pattern:

1. **Branch Standards:**
   - **`develop` branch:** Target for active development. Automatically runs test suites and deploys to **Staging/Alpha** environment (`--env staging`).
   - **`main` branch:** Target for verified releases. Automatically runs cryptographic/build verification and deploys to **Production** environment (`--env production`).
2. **Automated Package Artifacts:**
   - CI/CD pipelines must automatically compile and upload release artifacts (.zip / .tar.gz / extension packages) as GitHub Action artifacts.
3. **Pre-Release Access Gating & Privacy:**
   - **Private Repositories:** Always create repositories as strictly `PRIVATE`.
   - **Access Gating:** Enforce OAuth Testing Mode or Cloudflare Zero Trust One-Time PIN walls during pre-release.
   - **Dynamic Staging Badge:** Inject an amber `STAGING ALPHA` badge when running in non-production environments.

---

## 🛡️ 4. Security & Safety Rules

- **Zero Secret Leaks:** Never stage `.env` files, API keys, or credentials to Git (enforced by `~/.gitignore_global`).
- **Circuit Breaker:** Hard 5-iteration limit on automated test/repair loops. If unresolvable, stop and ask the user.
- **Atomic Commits:** Keep Git commits clean, meaningful, and isolated to single logical changes.

---

## 🧱 5. Modular Architecture & Zero-Monolith Protocol

1. **Max File Size:** Keep files strictly under **300 lines**. If a file exceeds this threshold, decompose it into smaller, single-responsibility modules.
2. **Zero Monolithic Files:** Never embed large inline `<style>` or `<script>` blocks inside `index.html`. `index.html` must remain lean (< 150 lines), serving only as the DOM entry point.
3. **Separation of Concerns:**
   - Styles belong in `/css/*.css` or scoped CSS modules.
   - Logic belongs in `/src/*.js` (e.g. `state.js`, `api.js`, `crypto.js`, `ui/`).
4. **Fast AI Agent Tooling:** Organize code into clean, isolated modules so edits execute in single, targeted tool calls without scanning multi-thousand-line files.

---

## ⚡ 6. Reactive Zero-Timer & Subagent Hygiene Standard

1. **Inline-First Concurrency Standard:**
   - Never spawn subagents for tasks with serial dependencies. Sequential handoffs waste 500 MB+ RAM per thread, trigger cold-start context reloading, and cause unnecessary system lag. Execute sequential tasks inline.
2. **Mandatory Subagent Garbage Collection:**
   - Whenever parallel subagents ARE legitimately used, every subagent spawned via `invoke_subagent` MUST be terminated (`manage_subagents -> kill`) immediately upon delivering its report.
   - At the conclusion of any multi-agent workflow, always execute `manage_subagents -> kill_all` to reclaim all host RAM and process threads.
   - Never allow background subagents to accumulate or linger indefinitely in memory.
3. **Reactive Zero-Timer Protocol:**
   - **Strictly Forbidden:** Setting polling timers (`schedule` / `sleep` loops) while waiting for subagents, background tasks, or builds.
   - **Native Event-Driven Push:** Antigravity operates on a native reactive event bus. After launching any background command (`run_command`), the agent MUST stop calling tools immediately and yield.
   - **Automatic Wakeup:** The system automatically pushes a webhook event to wake the parent agent when the command finishes.




