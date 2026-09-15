---
description: Enforces synchronous, zero-latency execution inside the Parallels sandbox-vm (10.211.55.6) for all test and build workloads.
always_on: true
---

# Global Rule: Optimized Sandbox VM Execution

1. **Mandatory VM Delegation**:
   - All tests, builds, package managers (`npm`, `pip`, `cargo`), compilers, and Docker commands must run inside `sandbox-vm` via `ssh sandbox-vm "..."`.

2. **Strict Synchronous Execution (No Timers/Polling)**:
   - Always run commands synchronously with `WaitMsBeforeAsync: 10000`.
   - **DO NOT** create background tasks, poll in loops, or call the `schedule` tool to wait for command completion.

3. **Multiplexed SSH Alias**:
   - Always use the `sandbox-vm` alias (which utilizes pre-warmed `ControlMaster` sockets).
