# 🎯 AuricPass & Eve Assistant Engineering Backlog

## ✅ SPRINT 16: Red Team Security Hardening & Taint Tracking
*Objective: Eliminate prompt injection vectors, lock down unverified autonomous memory writes, sanitize action links, and introduce rate-limiting on passive listeners.*

- [x] **[P0] Human-in-the-Loop Confirmation Gate for Memory Writes (EVE-V2-047):** Prevent indirect prompt injection from poisoning the Ground-Truth executive profile. LLM-suggested memory/profile updates must enter a staged/pending state with explicit user confirmation in the UI before writing to `executiveProfile` or `eveVectorStore`.
- [x] **[P0] ActionCard Phishing & Link Sanitizer (EVE-V2-048):** Sanitize URLs in `ActionCardView.tsx`. Enforce strict HTTPS URL allowlists, strip `javascript:`, `data:`, and untrusted calendar schemes, and mitigate open redirect vectors.
- [x] **[P1] Wake-Word Rate Limiter & Token Bucket (EVE-V2-049):** Protect against acoustic denial-of-service and API quota burnout by enforcing a sliding window rate limiter (max 5 triggers/minute) on wake-word invocations.

---

## ✅ SPRINT 17: Sub-600ms Streaming Audio Pipeline
*Objective: Eliminate the turn-taking latency bottleneck by pipelining LLM generation directly into audio synthesis.*

- [x] **[P0] SSE Streaming LLM Integration (EVE-V2-050):** Migrate Groq LLaMA 3.3 call to Server-Sent Events (SSE) streaming mode.
- [x] **[P0] Punctuation Sentence Delimiter & Audio Queue (EVE-V2-051):** Synthesize speech on the first completed clause/sentence while subsequent tokens stream, achieving sub-600ms time-to-first-audio (TTFA).

---

## ✅ SPRINT 18: Client-Side ONNX Neural Embeddings
*Objective: Upgrade semantic memory from FNV-1a hash approximation to true semantic vector embeddings running entirely in-browser.*

- [x] **[P1] Web Worker MiniLM-L6-v2 Pipeline (EVE-V2-052):** Offload `@xenova/transformers` ONNX runtime to a dedicated Web Worker to compute 384-dimensional cosine embeddings without blocking the audio thread.
- [x] **[P1] IndexedDB High-Dimensional Vector Migration (EVE-V2-053):** Upgrade `eveVectorStore` schema to store and query dense cosine vectors with fast nearest-neighbor scanning.

---

## ✅ SPRINT 19: Zero-Secret Edge Proxy & Native Companion Gateway
*Objective: Decouple client application from raw API keys and enable mobile background execution.*

- [x] **[P0] Cloudflare Workers API Proxy (EVE-V2-054):** Remove raw Groq/OpenAI keys from browser `localStorage` and route requests through authenticated Cloudflare Worker edge endpoints.
- [x] **[P2] Native Companion / Ephemeral Grants (EVE-V2-055):** Plumb short-lived ephemeral session grants (`AGNT-GRANT-XXXX`) for external assistant interop.

---

## ✅ SPRINT 20: Dual-Process Cognitive Engine (System 1 / System 2 & Anaphora)
*Objective: Implement Kahneman System 1 sub-200ms heuristic conversational reflexes and System 2 deep multi-turn planning and pronoun/anaphora resolution.*

- [x] **[P0] System 1 Conversational Reflex Circuit (EVE-V2-056):** Sub-200ms instantaneous reflex responses for conversational affirmations, greetings, stop commands, and status queries.
- [x] **[P0] Anaphora & Contextual Entity Resolution (EVE-V2-057):** Track active discourse entities across recent chat turns to resolve pronouns ("it", "him", "her", "that meeting") in follow-up commands.
- [x] **[P1] System 2 Pre-Execution Conflict Auditor (EVE-V2-058):** Deep cognitive reasoning module that audits proposed calendar actions against existing commitments, family constraints, and duplicate alerts before staging.

---

## ✅ SPRINT 21: Relational Entity Graph & Family Context Engine
*Objective: Transform static text memories into an interactive relational knowledge graph.*

- [x] **[P1] Bi-directional Entity Graph in IndexedDB (EVE-V2-059):** Connect people, projects, and locations in an interconnected relational schema (`entityGraphStore.ts`).
- [x] **[P1] Visual Graph Explorer in Memory Vault (EVE-V2-060):** Interactive canvas in the Memory Vault showing entity relations and neighborhoods (`EntityGraphExplorer.tsx`).

---

## ✅ SPRINT 22: Companion Bridge & Push-to-Mobile Ecosystem
*Objective: Connect Eve to external mobile assistants and provide proactive notifications.*

- [x] **[P0] Custom Gemini/ChatGPT OpenAPI Action Endpoint (EVE-V2-062):** Edge endpoint supporting AGNT-GRANT authentication for external assistant actions (`functions/api/companion/action.ts`, `public/companion-openapi.json`).
- [x] **[P1] Web Push Notifications & Proactive Briefings (EVE-V2-063):** Background push notifications for morning briefings and reminders (`pushNotificationService.ts`).

## ✅ SPRINT 23: Two-Way Google Calendar / CalDAV Sync & Live Agenda Resolver
*Objective: Upgrade Eve from passive .ics cards to live agenda querying and dynamic slot clash detection.*

- [x] **[P0] Live Calendar Engine & Slot Indexer (EVE-V2-064):** Two-way synchronization model with IndexedDB caching, Google Calendar/CalDAV adapters, and time-window indexing (`liveCalendarService.ts`).
- [x] **[P0] Real-Time Schedule Clash Detector & Agenda Query (EVE-V2-065):** System 2 conflict auditor comparing proposed commitments against live appointments and generating daily agenda briefings (`dualProcessCortex.ts`, `liveCalendarService.ts`).
- [x] **[P1] ActionCard Visual Clash Warning Badge (EVE-V2-066):** Visual conflict pill in `ActionCardView.tsx` warning of timing overlaps before confirmation.

## ✅ SPRINT 24: Deterministic Function-Calling & Multi-Tool Dispatch Engine
*Objective: Upgrade Eve from prompt-based regex guessing to deterministic function calling with strict JSON Schemas.*

- [x] **[P0] Tool Registry & Execution Dispatcher (EVE-V2-067):** Modular registry supporting Weather, Agenda, Relational Graph, Push Notifications, and AuricPass Terminal dispatch (`toolDispatcher.ts`).
- [x] **[P0] ReAct Function-Calling Loop (EVE-V2-068):** Structured tool loop evaluating LLM function call payloads, executing tool handlers locally, and streaming final synthesized speech answers (`intelligenceBridge.ts`, `toolDispatcher.ts`).

## ✅ SPRINT 25: Desktop Ambient Hotkey & Floating Mini-Pill UI
*Objective: Enable global ambient accessibility with keyboard shortcuts and a lightweight floating heads-up display.*

- [x] **[P0] Keyboard Shortcut Service (EVE-V2-069):** Global hotkey listener (`Option + Space` / `Alt + Space`, and `Escape` dismiss) with configurable keystroke bindings (`hotkeyService.ts`).
- [x] **[P0] Floating Mini-Pill Heads-Up Display (EVE-V2-070):** Compact floating audio visualizer and quick-input bar that can be activated over any screen (`AmbientMiniPill.tsx`).
- [x] **[P1] Clipboard Context Injector (EVE-V2-071):** One-tap injection of clipboard text into conversational context for instant drafting and code explanation (`hotkeyService.ts`).

## ✅ SPRINT 26: Screen & Document Awareness Engine (Vision Context)
*Objective: Equip Eve with on-demand visual perception to explain code, analyze documents, and inspect screens.*

- [x] **[P0] Screen Capture & Frame Compression Service (EVE-V2-072):** On-demand window/display media capture and local client-side JPEG/PNG compression (`screenCaptureService.ts`).
- [x] **[P0] Multimodal Vision Bridge Integration (EVE-V2-073):** Plumb base64 vision payloads into `intelligenceBridge.ts` for multimodal models (Groq LLaMA 3.2 Vision / OpenAI GPT-4o-mini).
- [x] **[P1] One-Touch Screen Snip in Ambient Mini-Pill (EVE-V2-074):** Add screen snapshot button and preview thumbnail inside `AmbientMiniPill.tsx`.

## ✅ SPRINT 27: AudioWorklet VAD, Instant Barge-In & Sub-350ms Turn-Taking
*Objective: Eliminate acoustic turn-taking delay and enable natural conversational interruptions.*

- [x] **[P0] WebAudio / AudioWorklet Voice Activity Detector (EVE-V2-075):** Client-side RMS & Zero-Crossing Rate frame processor with sub-350ms silence detection (`vadService.ts`).
- [x] **[P0] Instant Acoustic Barge-In (EVE-V2-076):** Sub-50ms conversational interruption handler terminating active TTS and audio queues when user begins speaking (`vadService.ts`).
- [x] **[P1] Conversational Backchannel Dispatcher (EVE-V2-077):** Fast micro-filler acoustic feedback generator for low-latency feedback during tool calls (`vadService.ts`).

## ✅ SPRINT 28: Autonomous Multi-Day Habit, Daily Executive Journaling & Evening Debrief Engine
*Objective: Equip Eve with longitudinal executive habit tracking, proactive evening debriefs, and open loop management.*

- [x] **[P0] Sovereign IndexedDB Executive Journal Store (EVE-V2-078):** Multi-day schema tracking intentions, wins, open loops, and habit streaks (`eveJournalStore.ts`).
- [x] **[P0] Autonomous Evening Debrief Synthesizer (EVE-V2-079):** Correlates today's agenda commitments with reflection summaries and habit streak progression (`journalService.ts`).
- [x] **[P1] Executive Journal ReAct Tools (EVE-V2-080):** Deterministic tool registration for `record_executive_journal` and `query_executive_journal` in `toolDispatcher.ts`.

## ✅ SPRINT 29: Sovereign Loopback Daemon Bridge & Acoustic Cadence Modulation
*Objective: Connect Eve to local desktop daemon runners and dynamically modulate voice cadence and emotional prosody.*

- [x] **[P0] Sovereign Loopback Daemon Bridge (EVE-V2-081):** Localhost HTTP/WebSocket bridge executing local shell scripts and inspecting files (`loopbackBridge.ts`).
- [x] **[P0] Acoustic Cadence & Contextual Prosody Modulation (EVE-V2-082):** Dynamic speech rate and pitch presets inferred from conversational urgency and context (`voiceCadenceService.ts`).
- [x] **[P1] Loopback Sidecar ReAct Tools (EVE-V2-083):** Tool dispatch registration for `execute_local_shell` and `read_local_workspace_file` in `toolDispatcher.ts`.

## ✅ SPRINT 30: Sovereign Offline STT Fallback & WebAudio Waveform Visualizer
*Objective: Provide resilient local speech-to-text fallback and live dynamic waveform rendering in the ambient heads-up display.*

- [x] **[P0] Sovereign Offline STT Fallback Engine (EVE-V2-084):** Local client-side speech decoding adapter for resilient offline operation (`offlineSttService.ts`).
- [x] **[P0] WebAudio Frequency Spectrum & Waveform Renderer (EVE-V2-085):** Real-time multi-band FFT frequency extraction and canvas waveform rendering (`audioVisualizerService.ts`).
- [x] **[P1] Ambient Mini-Pill Live Waveform Integration (EVE-V2-086):** Embedded responsive waveform canvas in the floating heads-up pill (`AmbientMiniPill.tsx`).

---

## ✅ COMPLETED SPRINTS

### Sprints 13–15 (Eve v2 Production Stabilization)
*Objective: Deliver enterprise test coverage, hands-free wake word, and Cloudflare CI/CD.*
- [x] **[P0] Vitest Automated Service Suite (12/12 Tests Passing):** Unit & phonetic regression tests covering AEC, multilingual detection, speech cleaning, and briefing engine.
- [x] **[P0] Hands-Free "Hey Eve" Wake-Word Engine:** Passive Web Speech API wake-word detector with instant trailing query execution.
- [x] **[P0] Multi-Environment CI/CD Workflow (`deploy.yml`):** GitHub Actions pipeline with build verification, staging preview, and Cloudflare Pages deployment.

### Sprints 8–12 (Eve v2 Voice, Briefing, AEC & Multilingual)
*Objective: Build high-agency speech interactions with natural phonetics and ambient awareness.*
- [x] Phonetic speech cleaner for TTS (`cleanTextForSpeech`).
- [x] Executive Morning Briefing engine (`briefingEngine.ts`).
- [x] Acoustic Echo Cancellation (`nativeTts.isAcousticEcho`).
- [x] Trilingual Auto-Detection (EN, FR, NL).
- [x] Action Cards with Google Calendar & .ics export.

### Sprints 5–7 (AuricPass Vault & Perimeter Security)
*Objective: Zero-Knowledge client enclaves and DOM security.*
- [x] Subresource Integrity (SRI) bootstrapper.
- [x] Broker Pattern MCP Egress Allowlist.
- [x] Secure Note Tombstone Deletion.
- [x] WebAuthn TouchID/FaceID Enclave Binding.
- [x] DOM XSS Eradication (`document.createElement` refactor).
