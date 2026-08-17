# LifeLine — System Architecture

**"The rule layer decides who is an emergency and can never be overridden by the AI; the LLM only ever adjudicates between same-day and routine, and only after the rule layer has cleared the patient."**

---

## 1. Architectural Philosophy & Safety Separation

LifeLine is engineered from the ground up on the principle of **Asymmetric Clinical Risk**:
1. **Under-triaging an emergency kills patients.**
2. **Over-triaging non-emergencies only incurs clinical queue overhead.**

Because stochastic Language Models (LLMs) are susceptible to hallucinations, edge-case regressions, and prompt injections, **no generative AI component is permitted to determine an emergency status or downgrade an emergency condition**.

```
+-----------------------------------------------------------------------------------+
|                            PATIENT / HEALTH WORKER                                |
|   Voice (Hindi/English Web Speech API) or High-Contrast Tap-Target PWA UI         |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         ADAPTIVE INTAKE ENGINE                                    |
|   1. Chief Complaint (Voice / Text)                                               |
|   2. Duration (Tap Options: Today / Few Days / Weeks+)                            |
|   3. 2-3 Clinically Constrained Follow-ups (Pain, Breathing, Pregnancy, Child, etc)   |
|   4. Optional Vitals (Big Steppers: SpO2, BP, Temp)                               |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        STRUCTURED SYMPTOM OBJECT (JSON)                           |
|   { chief_complaint, duration, red_flag_answers, vitals, language, raw_transcript }|
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+===================================================================================+
||                   DETERMINISTIC RED-FLAG RULE LAYER (100% CODE)                 ||
||                   - Pure JavaScript / TypeScript Evaluation                     ||
||                   - Zero external API calls, Zero LLM inference                 ||
||                   - Evaluates 9+ Critical Emergency Protocols                   ||
+=========================================+=========================================+
                                          |
                     +--------------------+--------------------+
                     |                                         |
            [ANY Rule Matches]                         [NO Rules Match]
                     |                                         |
                     v                                         v
+-----------------------------------------+   +-------------------------------------+
|         PRIORITY: EMERGENCY             |   |        LLM CLASSIFIER ENGINE        |
| - Hardcoded Priority: EMERGENCY         |   | - Input: Structured Data Only       |
| - Rule IDs & Clinical Rationale Attached|   | - System Prompt Guardrails Active   |
| - LLM Priority Classifier BYPASSED      |   | - Output Enum: {SAME_DAY, ROUTINE}  |
|                                         |   |   or ESCALATE_TO_EMERGENCY          |
|                                         |   | - Banned Words & Schema Validation  |
|                                         |   | - Uncertainty / Failure Escalation  |
+--------------------+--------------------+   +------------------+------------------+
                     |                                           |
                     +--------------------+----------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           PRIORITY QUEUE SERVICE                                  |
|   - Real-time Sorted Queue: EMERGENCY (1) -> SAME_DAY (2) -> ROUTINE (3)          |
|   - Secondary Sort: Chronological Arrival Time                                    |
|   - Immutable Audit Logger: Records all rule outputs, LLM I/O, timestamps        |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        DOCTOR DASHBOARD & OVERRIDE UI                             |
|   - 3-Second Poll / Instant Live Queue Synchronization                            |
|   - 5-Line Structured Summary per Patient                                         |
|   - 1-Tap Override Mechanism with Doctor ID, Reason & Audit Trail                 |
|   - Persistent Safety Disclaimer Banner                                           |
+-----------------------------------------+-----------------------------------------+
```

---

## 2. Component Breakdown

### A. Patient Intake (Voice-First PWA)
- **Bilingual Speech-to-Text**: Employs the native browser Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) supporting Hindi (`hi-IN`) and Indian English (`en-IN`), with keyboard fallback.
- **Low-Literacy UI**: Large 48px+ tap targets, high contrast icons, visual duration selectors, and number steppers for vitals.
- **Audio Verification**: Text-to-Speech (TTS) readback verifies patient symptom capture before submission.

### B. Deterministic Red-Flag Rule Engine (`evaluateRedFlags`)
- Pure synchronous function executing deterministic boolean logic and regex token matching on chief complaints, structured answers, and vitals.
- Evaluates critical clinical indicators:
  - **RF-CHEST-01**: Chest pain with onset < 24h, radiation to arm/jaw, or dyspnea.
  - **RF-BREATH-01**: Severe breathlessness, inability to complete full sentences.
  - **RF-CONSC-01**: Syncope, loss of consciousness, altered mental state, confusion.
  - **RF-BLEED-01**: Uncontrolled hemorrhage, hematemesis, melena, or rectal bleeding.
  - **RF-PREG-01**: Pregnancy accompanied by vaginal bleeding, severe abdominal cramps, or decreased fetal movement.
  - **RF-STROKE-01**: FAST signs (facial droop, unilateral motor weakness, acute dysarthria).
  - **RF-CHILD-01**: Pediatric danger signs (inability to feed/drink, lethargy, convulsions).
  - **RF-VITALS-01**: Critical vitals thresholds ($SpO_2 < 90\%$, Systolic $BP < 90$ or $> 180\text{ mmHg}$, $\text{Temp} > 40^\circ\text{C}$).
  - **RF-SELFHARM-01**: Suicidal ideation or deliberate self-harm signals.

### C. Constrained LLM Classifier & Guardrail Layer
- Executed **only** when the Red-Flag Rule Engine clears the patient (`fired: false`).
- **Prompt Isolation**: Patient-provided text is injected strictly as JSON data fields within a strongly isolated block; prompt text instructions are strictly separated from data.
- **Allowed Output Enum**: `{ "priority": "SAME_DAY" | "ROUTINE" | "ESCALATE_TO_EMERGENCY", "rationale": "...", "confidence": "HIGH" | "MEDIUM" | "LOW" }`.
- **Safety Filters & Banned Words**:
  - Automatically scans raw output for diagnostic claims ("you have...", "diagnosed with") or medical prescriptions ("paracetamol", "amoxicillin", "mg", "tablets", "take twice daily").
  - If banned terms appear or JSON parsing fails, the system executes **Fail-Safe Auto-Escalation** to `EMERGENCY`.

### D. Priority Queue & Doctor Audit Trail
- Queue ordering algorithm: Priority tier (`EMERGENCY` = 1, `SAME_DAY` = 2, `ROUTINE` = 3), then `arrival_timestamp` ascending.
- Doctor overrides capture: `doctor_id`, `timestamp`, `previous_priority`, `new_priority`, and `override_reason`.
