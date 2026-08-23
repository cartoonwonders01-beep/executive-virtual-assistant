# Project AI Agent Instructions & Air-Gapped Sandbox Protocol

## 🔒 1. Air-Gapped Security & Ingress-Execute-Egress (IEE) Protocol
The macOS host is strictly an **air-gapped storage & git origin**. 
**100% of all development, package installations, file editing, builds, test execution, and daemon servers must occur exclusively inside the Parallels Linux Sandbox VM (`sandbox-vm` / `10.211.55.6`).**

### The 4-Phase Pipeline:
1. **Ingress (Pre-Flight)**: Sync project folder from Mac to VM:
   `rsync -avz --exclude="node_modules" --exclude=".git/objects" --exclude="dist" --exclude=".venv" . sandbox-vm:/home/andy/projects/$(basename "$PWD")/`
2. **100% Sandbox Execution**: All coding, `npm install`, `uv pip`, `docker`, and test runners execute exclusively in `/home/andy/projects/` inside the VM.
3. **Autonomous Self-Correction**: If tests or builds fail in the VM, the agent self-corrects and iterates (max 3 loops) until 100% green without stopping for manual intervention.
4. **Egress (Return)**: Only when 100% of tests are green does the agent sync clean, verified source files back to the Mac folder and commit to Git.

## 💰 2. Cost & Token Governance (Flash-First)
- Build and self-heal on **Gemini 3.7 Flash (Medium)** (~$0.02/feature).
- Max 3 fix attempts per error (circuit-breaker).
- Optional 1-prompt Senior Architect review on **Gemini Pro** or **Claude 3.7**.
