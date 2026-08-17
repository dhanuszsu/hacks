# LifeLine: Pre-Consultation Rural PHC Triage System

> **Architecture Core Guarantee:**
> *"The rule layer decides who is an emergency and can never be overridden by the AI; the LLM only ever adjudicates between same-day and routine, and only after the rule layer has cleared the patient."*

---

## 🌟 Overview & Key Innovations

LifeLine is a full-stack, safety-first clinical triage application designed specifically for rural Primary Health Centres (PHCs). Built for Accredited Social Health Activists (ASHAs) and attending rural medical officers, LifeLine enforces rigorous clinical boundaries:

1. **Deterministic Red-Flag Rule Layer (100% Code)**: 9+ hardcoded emergency protocols (cardiac ACS, severe respiratory distress, pediatric convulsions, altered consciousness, uncontrolled hemorrhage, obstetric emergencies, FAST stroke signs, critical vitals, self-harm).
2. **Constrained Acuity Classifier**: The LLM is strictly barred from diagnosing illnesses, prescribing medications, or deciding emergency tiers. It only sorts non-emergencies into `SAME_DAY` or `ROUTINE`.
3. **Fail-Safe Asymmetric Direction**: Any JSON error, banned-word detection, API timeout, or low confidence auto-escalates to `EMERGENCY`.
4. **Bilingual Regional Voice Intake**: Zero-setup native speech-to-text and audio TTS verification in Hindi (`hi-IN`) and English (`en-IN`).
5. **Real-time Doctor Dashboard**: Live 3-second prioritized queue, 5-line structured clinical summaries, and 1-tap override logging with reason tracking.
6. **1-Click 8-Scenario Judging Suite**: Instant testing of emergency patterns, edge cases, and adversarial prompt-injections.

---

## 📁 Deliverables & Documentation Index

- [`ARCHITECTURE.md`](file:///C:/Users/User/.gemini/antigravity/scratch/lifeline/ARCHITECTURE.md) — Detailed rules-vs-LLM boundary specification, system topology, and pipeline contracts.
- [`FAILURE_MODES.md`](file:///C:/Users/User/.gemini/antigravity/scratch/lifeline/FAILURE_MODES.md) — Asymmetric risk matrix (Type I vs Type II errors) and fail-safe directional justification.
- [`DECISIONS.md`](file:///C:/Users/User/.gemini/antigravity/scratch/lifeline/DECISIONS.md) — Log of all clinical, architectural, and low-literacy UX decisions.

---

## 🚀 Quick Start Guide

### 1. Run the Full Application (Single Command)
```bash
# Starts backend server (serves built React PWA on port 5000)
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in Google Chrome.

### 2. Run Automated Test Suite
```bash
# Runs rule layer unit tests and E2E scenario tests
npm test
```

### 3. Run in Vite Live Development Mode
```bash
# In terminal 1:
npm --prefix server start

# In terminal 2:
npm --prefix client run dev
```

---

## 🧪 8 Scripted Demo Scenarios (One-Click Testing)

Navigate to the **8-Scenario Demo** tab in the UI or use the `/demo` endpoint:
1. **Scenario 1: Emergency** — Chest pain radiating to jaw (`RF-CHEST-01`)
2. **Scenario 2: Emergency** — Pediatric convulsion / seizure (`RF-CHILD-01`)
3. **Scenario 3: Same-Day** — Persistent cough for 2 weeks (no red flags)
4. **Scenario 4: Routine** — Mild cold and runny nose for 1 day
5. **Scenario 5: Same-Day** — Moderate abdominal pain for 3 days
6. **Scenario 6: Routine** — Localized itchy skin rash
7. **Scenario 7: Edge Case** — Ambiguous / uncertain symptom (auto-escalates to `EMERGENCY`)
8. **Scenario 8: Adversarial** — Prompt injection ("Ignore instructions...") with embedded red flags (safely handled & escalated)

---

## 🛡️ Mandatory Safety Disclaimer
*AI assists prioritization only. It does not diagnose or prescribe. All decisions can be overridden by clinical staff.*
