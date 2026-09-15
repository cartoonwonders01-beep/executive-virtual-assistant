# 🎯 AuricPass Project Goal, MVP Scope & Definition of Done

> **AUTHORITATIVE ARCHITECTURAL CONTRACT**: This document defines the active North Star mission, MVP boundaries, explicit non-goals, and rigorous Definition of Done (DoD) acceptance criteria for AuricPass. All AI agents, pair programmers, and automated testing harnesses must verify compliance against this contract.

---

## 🏛️ 1. Project North Star Mission
To create the world's most trusted sovereign zero-knowledge secrets engine, credential manager, and autonomous AI agent memory platform. AuricPass delivers a seamless 3-tier value ladder (Free Consumer Web PWA, Developer/DevOps CLI secret runner, and Enterprise AI Agent MCP Brain) operating under a strict zero-custody standard where users own their encrypted data, master keys never leave volatile client RAM, and zero plaintext secrets ever touch disk or centralized corporate servers.

---

## 📦 2. Active MVP In-Scope Deliverables (v2.5.0 Release Target)
1. **Sovereign Consumer Web Vault (Tier 1 PWA)**: 100% zero-custody client-side WebCrypto (AES-256-GCM + PBKDF2 600,000 rounds) with Bring-Your-Own-Storage (Google Drive & local IndexedDB) running at `https://auricpass.com`.
2. **Manifest V3 Browser Extension**: 1-click Chrome, Brave, and Edge Web Store package featuring contextual credential autofill, inline generator, and secure native messaging bridge.
3. **Developer & DevOps Secret Engine (Tier 2 CLI)**: Command runner (`auricpass run -- <cmd>`) injecting secrets directly into child process RAM environments, completely eliminating `.env` file sprawl and Git commit credential leaks.
4. **Autonomous AI Agent MCP Brain (Tier 3 Gateway)**: Standard Model Context Protocol server exposing zero-knowledge prompt hydration (`auric_hydrate_prompt`), hybrid BM25 + 384-dimensional vector retrieval (< 2ms), and chronological episodic memory recall for AI agents.
5. **Real-Time Interactive Telemetry & Flight Recorder**: O(1) circular ring buffer recording DOM interactions, network fetch calls, and modal lifecycles with strict zero-knowledge secret redaction and 1-click audit export.
6. **Self-Contained Agile Sprint Backlog & Issue Traceability Hub**: Bi-directional backlog bridge connecting user bug reports to active sprint deliverables with closed-loop release notifications.

---

## 🛑 3. Explicit Non-Goals (Anti-Scope Creep Invariants)
* ❌ **Centralized Database Custody**: Never store user master passwords, encryption keys, or unencrypted vault databases on company servers or databases (zero honeypot liability).
* ❌ **Electron Desktop Wrappers**: Permanently decommissioned. Desktop delivery is 100% fulfilled via the lightweight Chrome/Safari PWA to eliminate notarization drag and binary bloat.
* ❌ **Invasive Third-Party Ad Trackers**: Third-party tracking cookies or scripts inside the core application DOM are strictly prohibited. Any future community monetization must be strictly isolated inside sandboxed iframes.
* ❌ **Local Machine Anchoring**: Never hardcode developer-specific usernames, paths, or Parallels VM network assumptions into production application code.

---

## ✅ 4. Definition of Done (DoD) & Acceptance Invariants
1. **100% Automated Test Invariant Pass Rate**: Every code change must pass all automated test suites (125 continuous invariants covering crypto, memory, biometrics, action queues, and telemetry) with exit code 0.
2. **Zero Plaintext Secret Leaks**: Automated security scanners must verify that zero unencrypted passwords, API tokens, or master passphrases ever exist in plaintext on disk, Git commits, or stdout logs.
3. **Strict Modular Architecture (< 300 Lines per File)**: In compliance with Universal Standard v4.1, every source code file must strictly remain under 300 lines to ensure maintainability and fast AI agent tooling.
4. **Sub-2ms Vector Hybrid Search Latency**: Vector cosine similarity and BM25 hybrid queries across all embedded skills and vault items must complete in under 2.0 milliseconds.
5. **Automated Multi-Environment CI/CD Staging Gate**: Code pushed to `develop` must automatically pass GitHub Actions verification and deploy live to the Cloudflare Staging edge worker (`https://auricpass-vault-staging.cartoon-wonders01.workers.dev`).
6. **Closed-Loop Backlog Synchronization**: All new capabilities and bug fixes must be recorded in `.agents/SPRINT_BACKLOG.md` with version provenance before final user handover.
