/**
 * LIFELINE — IN-MEMORY CLINICAL STORE & QUEUE MANAGER
 * 
 * Manages patient queues, 5-line structured summaries, and doctor override logs.
 */

import { DEMO_SCENARIOS } from './seedScenarios.js';

let patients = [];
let nextPatientId = 1001;

// Priority ordering helper
const PRIORITY_ORDER = {
  'EMERGENCY': 1,
  'SAME_DAY': 2,
  'ROUTINE': 3
};

/**
 * Builds the standardized 5-line clinical summary required by doctors
 */
export function buildStructuredSummary(patient) {
  const intake = patient.intake || {};
  const triage = patient.triage_result || {};
  const vitals = intake.vitals || {};

  // Line 1: Chief Complaint
  const line1_chief = intake.chief_complaint || 'Not recorded';

  // Line 2: Duration
  const durationMap = {
    'today': 'Onset Today (< 24 hours)',
    'few_days': 'Few Days (2–6 days)',
    'weeks_plus': 'Persistent / Weeks or more (≥ 7 days)'
  };
  const line2_duration = durationMap[intake.duration] || intake.duration || 'Not specified';

  // Line 3: Red Flags
  let line3_red_flags = 'None (Cleared deterministic screening)';
  if (triage.rule_ids && triage.rule_ids.length > 0) {
    line3_red_flags = `FIRED: [${triage.rule_ids.join(', ')}] — ${triage.matched_rules?.map(r => r.name).join(', ') || ''}`;
  } else if (triage.decision_source?.includes('GUARDRAIL') || triage.decision_source?.includes('UNCERTAINTY')) {
    line3_red_flags = `FLAGGED BY SAFETY RAIL: ${triage.decision_source}`;
  }

  // Line 4: Relevant Context & Vitals
  const vitalsArr = [];
  if (vitals.spo2) vitalsArr.push(`SpO₂: ${vitals.spo2}%`);
  if (vitals.systolic_bp && vitals.diastolic_bp) vitalsArr.push(`BP: ${vitals.systolic_bp}/${vitals.diastolic_bp} mmHg`);
  if (vitals.temp_c) vitalsArr.push(`Temp: ${vitals.temp_c}°C`);
  const vitalsStr = vitalsArr.length > 0 ? ` [Vitals: ${vitalsArr.join(', ')}]` : ' [Vitals: Not recorded]';
  const line4_context = `Age ${intake.age || 'Unknown'}, ${intake.gender || 'Unknown gender'}, Lang: ${intake.language || 'hi-IN'}${vitalsStr}`;

  // Line 5: Priority Rationale (Explicitly Labeled Source)
  const sourceLabel = triage.decision_source === 'RULE_LAYER'
    ? 'DETERMINISTIC RULE LAYER'
    : (triage.decision_source?.includes('GUARDRAIL') || triage.decision_source?.includes('UNCERTAINTY'))
      ? 'SAFETY RAIL ESCALATION'
      : 'CONSTRAINED LLM CLASSIFIER';

  const line5_rationale = `[Source: ${sourceLabel}] ${triage.rationale || 'Awaiting evaluation'}`;

  return {
    line1_chief_complaint: line1_chief,
    line2_duration: line2_duration,
    line3_red_flags: line3_red_flags,
    line4_context: line4_context,
    line5_rationale: line5_rationale,
    display_lines: [
      { label: '1. Chief Complaint', value: line1_chief },
      { label: '2. Duration', value: line2_duration },
      { label: '3. Red Flags', value: line3_red_flags },
      { label: '4. Context & Vitals', value: line4_context },
      { label: '5. Priority Rationale', value: line5_rationale }
    ]
  };
}

export function getAllPatients() {
  return patients;
}

export function getPatientById(id) {
  return patients.find(p => p.id === id) || null;
}

export function addPatientRecord(record) {
  const patientId = `PT-${nextPatientId++}`;
  const now = new Date().toISOString();

  const fullRecord = {
    id: patientId,
    created_at: now,
    overrides: [],
    ...record
  };

  // Attach structured summary
  fullRecord.structured_summary = buildStructuredSummary(fullRecord);

  patients.unshift(fullRecord);
  return fullRecord;
}

export function getSortedQueue() {
  return [...patients].sort((a, b) => {
    const priorityA = a.current_priority || a.triage_result?.priority || 'ROUTINE';
    const priorityB = b.current_priority || b.triage_result?.priority || 'ROUTINE';

    const orderA = PRIORITY_ORDER[priorityA] || 99;
    const orderB = PRIORITY_ORDER[priorityB] || 99;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Secondary sort: Arrival time ascending (FIFO)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function logDoctorOverride(patientId, { doctor_id, new_priority, reason }) {
  const patient = getPatientById(patientId);
  if (!patient) return null;

  const previous_priority = patient.current_priority || patient.triage_result.priority;
  const timestamp = new Date().toISOString();

  const overrideEntry = {
    override_id: `OVR-${Date.now()}`,
    doctor_id: doctor_id || 'DOC-DEFAULT',
    timestamp,
    previous_priority,
    new_priority,
    reason: reason || 'Clinical judgment by attending physician'
  };

  patient.overrides.push(overrideEntry);
  patient.current_priority = new_priority;
  patient.structured_summary = buildStructuredSummary(patient);

  return patient;
}

export function clearQueue() {
  patients = [];
  nextPatientId = 1001;
}

// Pre-seed queue with demo cases
export function initSeedData() {
  if (patients.length === 0) {
    // Seed cases 1, 3, 4, 6 so initial doctor dashboard is populated
    const seeds = [DEMO_SCENARIOS[0], DEMO_SCENARIOS[2], DEMO_SCENARIOS[3], DEMO_SCENARIOS[5]];
    for (const s of seeds) {
      const isEmergency = s.expected_priority === 'EMERGENCY';
      const patientId = `PT-${nextPatientId++}`;
      const now = new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString();

      const record = {
        id: patientId,
        created_at: now,
        patient_name: s.intake.patient_name,
        age: s.intake.age,
        gender: s.intake.gender,
        language: s.intake.language,
        intake: s.intake,
        triage_result: {
          priority: s.expected_priority,
          decision_source: s.expected_source,
          rule_ids: s.expected_rule !== 'NONE' ? [s.expected_rule] : [],
          matched_rules: s.expected_rule !== 'NONE' ? [{ id: s.expected_rule, name: s.title }] : [],
          rationale: isEmergency
            ? 'Chest pain with cardiac red-flag features — possible ACS pattern. Evaluated via deterministic clinical rules.'
            : (s.expected_priority === 'SAME_DAY'
              ? 'Subacute or persistent symptoms requiring medical consultation and evaluation during today’s clinic shift.'
              : 'Mild, localized, or early-stage symptoms suitable for standard out-patient clinic queue.')
        },
        current_priority: s.expected_priority,
        overrides: []
      };

      record.structured_summary = buildStructuredSummary(record);
      patients.push(record);
    }
  }
}
