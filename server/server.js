/**
 * LIFELINE — TRIAGE BACKEND SERVER (Node / Express)
 * 
 * Pre-consultation rural triage system with hardcoded deterministic safety rules,
 * constrained LLM classification, live doctor queue, and audit trails.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { evaluateRedFlags } from './rules/redFlagRules.js';
import { classifyPatientAcuity, LLM_AUDIT_LOGS } from './llm/classifier.js';
import { getAdaptiveQuestions } from './llm/adaptiveQuestions.js';
import {
  addPatientRecord,
  getSortedQueue,
  getPatientById,
  logDoctorOverride,
  initSeedData,
  clearQueue
} from './data/store.js';
import { DEMO_SCENARIOS } from './data/seedScenarios.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize seed data
initSeedData();

// Serve built frontend assets if present
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'LifeLine Triage Backend',
    timestamp: new Date().toISOString()
  });
});

/**
 * 1. POST /intake/start
 * Generates tailored follow-up questions based on initial chief complaint
 */
app.post('/intake/start', (req, res) => {
  try {
    const { chief_complaint, age, gender, language, notes } = req.body;
    const questions = getAdaptiveQuestions({ chief_complaint, age, gender, notes });

    res.json({
      success: true,
      adaptive_questions: questions,
      duration_options: [
        { id: 'today', label_en: 'Today (< 24 hours)', label_hi: 'आज ही शुरू हुआ', label_ta: 'இன்றே தொடங்கியது (< 24 மணி)' },
        { id: 'few_days', label_en: 'Few Days (2–6 days)', label_hi: 'कुछ दिनों से (2-6 दिन)', label_ta: 'சில நாட்களாக (2-6 நாட்கள்)' },
        { id: 'weeks_plus', label_en: 'Weeks or more (≥ 7 days)', label_hi: 'हफ्तों या महीनों से', label_ta: 'வாரங்கள் அல்லது அதற்கு மேல் (≥ 7 நாட்கள்)' }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. POST /intake/submit
 * THE CORE TRIAGE PIPELINE:
 * Step A: Execute Deterministic Red-Flag Rule Layer (100% Code)
 *         If ANY rule fires -> Priority = EMERGENCY. LLM classifier is bypassed!
 * Step B: If NO rules fire -> Pass to Constrained LLM Classifier
 * Step C: Store into live prioritized queue with 5-line structured summary
 */
app.post('/intake/submit', async (req, res) => {
  try {
    const intake = req.body;
    const startTime = Date.now();

    // -------------------------------------------------------------
    // STEP A: Deterministic Red-Flag Rule Layer Evaluation
    // -------------------------------------------------------------
    const ruleEvaluation = evaluateRedFlags(intake);

    let triageResult = {};

    if (ruleEvaluation.fired) {
      // Emergency rule fired: Priority is hardcoded to EMERGENCY
      // LLM is structurally forbidden from overriding or deciding priority here
      triageResult = {
        priority: 'EMERGENCY',
        decision_source: 'RULE_LAYER',
        rule_ids: ruleEvaluation.rules,
        matched_rules: ruleEvaluation.matchedDetails,
        rationale: ruleEvaluation.rationale,
        execution_time_ms: Date.now() - startTime
      };
    } else {
      // -----------------------------------------------------------
      // STEP B: Constrained LLM Classifier (Non-Emergency Acuity)
      // -----------------------------------------------------------
      const llmResult = await classifyPatientAcuity(intake);

      triageResult = {
        priority: llmResult.priority, // SAME_DAY, ROUTINE, or EMERGENCY on fail-safe
        decision_source: llmResult.decision_source,
        rule_ids: [],
        matched_rules: [],
        rationale: llmResult.rationale,
        confidence: llmResult.confidence,
        clinical_observations: llmResult.clinical_observations || [],
        audit_id: llmResult.audit_id,
        execution_time_ms: Date.now() - startTime
      };
    }

    // -------------------------------------------------------------
    // STEP C: Record patient into live queue with 5-line summary
    // -------------------------------------------------------------
    const patientRecord = addPatientRecord({
      patient_name: intake.patient_name || 'Walk-in Patient',
      age: intake.age || null,
      gender: intake.gender || 'Unknown',
      language: intake.language || 'hi-IN',
      intake,
      triage_result: triageResult,
      current_priority: triageResult.priority
    });

    res.json({
      success: true,
      patient: patientRecord
    });
  } catch (err) {
    console.error('Triage pipeline error:', err);
    res.status(500).json({
      success: false,
      error: 'Triage processing failed',
      fallback_escalation: {
        priority: 'EMERGENCY',
        rationale: 'System processing exception occurred — auto-escalated for safety.'
      }
    });
  }
});

/**
 * 3. GET /queue
 * Live sorted patient queue for Doctor Dashboard
 */
app.get('/queue', (req, res) => {
  try {
    const queue = getSortedQueue();
    res.json({
      success: true,
      total: queue.length,
      counts: {
        emergency: queue.filter(p => (p.current_priority || p.triage_result.priority) === 'EMERGENCY').length,
        same_day: queue.filter(p => (p.current_priority || p.triage_result.priority) === 'SAME_DAY').length,
        routine: queue.filter(p => (p.current_priority || p.triage_result.priority) === 'ROUTINE').length
      },
      queue
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4. POST /queue/:id/override
 * Doctor 1-tap re-prioritize with mandatory reason logging
 */
app.post('/queue/:id/override', (req, res) => {
  try {
    const { id } = req.params;
    const { doctor_id, new_priority, reason } = req.body;

    if (!['EMERGENCY', 'SAME_DAY', 'ROUTINE'].includes(new_priority)) {
      return res.status(400).json({ success: false, error: 'Invalid priority tier specified' });
    }

    const updated = logDoctorOverride(id, { doctor_id, new_priority, reason });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.json({
      success: true,
      patient: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 5. GET /patients/:id
 * Detailed patient inspection view
 */
app.get('/patients/:id', (req, res) => {
  const patient = getPatientById(req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  res.json({ success: true, patient });
});

/**
 * 6. GET /demo/scenarios
 * Returns the 8 predefined demo test scenarios
 */
app.get('/demo/scenarios', (req, res) => {
  res.json({
    success: true,
    scenarios: DEMO_SCENARIOS
  });
});

/**
 * 7. POST /demo/run-scenario/:id
 * Directly runs a demo scenario through the real pipeline
 */
app.post('/demo/run-scenario/:id', async (req, res) => {
  try {
    const scenario = DEMO_SCENARIOS.find(s => s.id === req.params.id || s.number === Number(req.params.id));
    if (!scenario) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }

    const intake = { ...scenario.intake };
    const startTime = Date.now();

    // 1. Evaluate Red Flags
    const ruleEvaluation = evaluateRedFlags(intake);
    let triageResult = {};

    if (ruleEvaluation.fired) {
      triageResult = {
        priority: 'EMERGENCY',
        decision_source: 'RULE_LAYER',
        rule_ids: ruleEvaluation.rules,
        matched_rules: ruleEvaluation.matchedDetails,
        rationale: ruleEvaluation.rationale,
        execution_time_ms: Date.now() - startTime
      };
    } else {
      const llmResult = await classifyPatientAcuity(intake);
      triageResult = {
        priority: llmResult.priority,
        decision_source: llmResult.decision_source,
        rule_ids: [],
        matched_rules: [],
        rationale: llmResult.rationale,
        confidence: llmResult.confidence,
        clinical_observations: llmResult.clinical_observations || [],
        audit_id: llmResult.audit_id,
        execution_time_ms: Date.now() - startTime
      };
    }

    const patientRecord = addPatientRecord({
      patient_name: intake.patient_name,
      age: intake.age,
      gender: intake.gender,
      language: intake.language,
      intake,
      triage_result: triageResult,
      current_priority: triageResult.priority,
      demo_scenario_id: scenario.id
    });

    res.json({
      success: true,
      scenario_matched: scenario.title,
      expected: {
        priority: scenario.expected_priority,
        source: scenario.expected_source
      },
      actual: {
        priority: triageResult.priority,
        source: triageResult.decision_source,
        rationale: triageResult.rationale
      },
      patient: patientRecord
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 8. POST /demo/reset-queue
 * Resets queue to initial state
 */
app.post('/demo/reset-queue', (req, res) => {
  clearQueue();
  initSeedData();
  res.json({ success: true, message: 'Queue reset and reseeded.' });
});

/**
 * 9. GET /audit-logs
 * Immutable audit logs of all LLM inferences and guardrail actions
 */
app.get('/audit-logs', (req, res) => {
  res.json({
    success: true,
    total: LLM_AUDIT_LOGS.length,
    logs: LLM_AUDIT_LOGS
  });
});

// SPA fallback for any unmatched GET route
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`[LifeLine] Triage Server running on http://localhost:${PORT}`);
  console.log(`[LifeLine] Deterministic Red-Flag Rule Layer: ACTIVE`);
  console.log(`[LifeLine] Safety Guardrails & Audit Logger: ACTIVE`);
});
