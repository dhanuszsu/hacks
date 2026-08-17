# LifeLine — Architecture, Clinical & Engineering Decisions Log

This document records the key assumptions, clinical protocols, and engineering trade-offs made during the implementation of LifeLine.

---

## 1. Safety & Clinical Boundary Decisions

### D-01: Absolute Primacy of the Red-Flag Rule Layer
- **Decision**: Red-flag evaluation is executed via 100% pure deterministic code with zero dependencies on LLMs or external network APIs.
- **Rationale**: Stochastic models exhibit non-zero hallucination rates and prompt manipulation vulnerability. Emergencies must be deterministic and auditable.
- **Judge Defense**: "The rule layer decides who is an emergency and can never be overridden by the AI; the LLM only ever adjudicates between same-day and routine, and only after the rule layer has cleared the patient."

### D-02: Asymmetric Fail-Safe Escalation
- **Decision**: If the LLM produces invalid JSON, encounters an API timeout, contains banned diagnostic/pharmacological tokens, or outputs uncertainty, the system defaults to `EMERGENCY`.
- **Rationale**: Over-triage costs 2 minutes of doctor time; under-triage costs human lives. The system never downgrades on failure.

### D-03: Strict Prohibition of Diagnosis and Prescriptions
- **Decision**: The LLM system prompt forbids producing medical diagnoses or medication recommendations. Output is strictly constrained to queue tier (`SAME_DAY`, `ROUTINE`, `ESCALATE_TO_EMERGENCY`) and a plain-language factual triage summary.
- **Rationale**: LifeLine is a queue prioritization assistant, not a clinical diagnostic system.

---

## 2. Technical Stack & Architectural Decisions

### D-04: Web Speech API for Zero-Setup Native Multilingual Voice Intake (Tamil, Hindi, English)
- **Decision**: Native browser `SpeechRecognition` / `webkitSpeechRecognition` API is used for real-time speech-to-text in Tamil (`ta-IN`), Hindi (`hi-IN`), and Indian English (`en-IN`), with Text-to-Speech (`speechSynthesis`) readback and Tamil font typography (`Noto Sans Tamil`).
- **Rationale**: Enables direct access for rural Tamil and Hindi speaking patients and community health workers (ASHAs) on standard Android/Chrome devices without external cloud API dependencies.

### D-05: Real-Time Polling (3s Interval) vs. WebSockets
- **Decision**: Polling the `/queue` endpoint every 3 seconds for the Doctor Dashboard instead of bidirectional WebSockets.
- **Rationale**: Extremely robust in rural PHC environments with intermittent connectivity; avoids socket connection drops, reconnection storms, and complexity while providing instantaneous UI updates.

### D-06: Hybrid Dual-Engine Classifier (API + Local Safety Engine)
- **Decision**: Provide Anthropic / Gemini API integration alongside a built-in deterministic safety classifier engine that enforces the exact same schema, prompt boundaries, and banned-word filtering.
- **Rationale**: Ensures the system is 100% demoable and testable offline or in air-gapped evaluation environments without crashing if an API key is unconfigured.

---

## 3. UI/UX Decisions for Rural Primary Health Centres

### D-07: Icon-First, Low-Literacy Tap Targets
- **Decision**: High-contrast, 48px+ tap targets, visual duration selectors (Today / Few Days / Weeks+), and large +/- number steppers for vital signs.
- **Rationale**: Target users include rural patients and Accredited Social Health Activists (ASHAs) with varying literacy levels and inexpensive Android smartphones.

### D-08: Mandatory Safety Banner on All Screens
- **Decision**: Fixed, visible banner on both Patient Intake and Doctor Dashboard: *"AI assists prioritization only. It does not diagnose or prescribe. All decisions can be overridden by clinical staff."*
- **Rationale**: Continuous cognitive reinforcement of the AI's assistive role.

### D-09: 1-Tap Clinical Override with Mandatory Reason Logging
- **Decision**: Doctors can change any patient's priority tier in 1 tap, but must select or write a reason. All overrides record `doctor_id`, `timestamp`, `from_tier`, `to_tier`, and `reason`.
- **Rationale**: Doctors retain ultimate clinical authority while maintaining an immutable audit log.
