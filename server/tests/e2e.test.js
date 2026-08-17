import test from 'node:test';
import assert from 'node:assert';

const BASE = 'http://localhost:5000';

test('E2E: Fetch demo scenarios', async () => {
  const res = await fetch(`${BASE}/demo/scenarios`);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.scenarios.length, 8);
});

test('E2E Scenario 1: Emergency Acute Chest Pain', async () => {
  const res = await fetch(`${BASE}/demo/run-scenario/1`, { method: 'POST' });
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.actual.priority, 'EMERGENCY');
  assert.strictEqual(data.actual.source, 'RULE_LAYER');
  assert.ok(data.actual.rationale.includes('ACS'));
});

test('E2E Scenario 2: Emergency Pediatric Seizure', async () => {
  const res = await fetch(`${BASE}/demo/run-scenario/2`, { method: 'POST' });
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.actual.priority, 'EMERGENCY');
  assert.strictEqual(data.actual.source, 'RULE_LAYER');
});

test('E2E Scenario 3: Same-Day Persistent Cough', async () => {
  const res = await fetch(`${BASE}/demo/run-scenario/3`, { method: 'POST' });
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.actual.priority, 'SAME_DAY');
  assert.strictEqual(data.actual.source, 'LLM_CLASSIFIER');
});

test('E2E Scenario 4: Routine Mild Cold', async () => {
  const res = await fetch(`${BASE}/demo/run-scenario/4`, { method: 'POST' });
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.actual.priority, 'ROUTINE');
  assert.strictEqual(data.actual.source, 'LLM_CLASSIFIER');
});

test('E2E Scenario 5: Same-Day Moderate Abdominal Pain', async () => {
  const res = await fetch(`${BASE}/demo/run-scenario/5`, { method: 'POST' });
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.actual.priority, 'SAME_DAY');
  assert.strictEqual(data.actual.source, 'LLM_CLASSIFIER');
});

test('E2E Scenario 6: Routine Skin Rash', async () => {
  const res = await fetch(`${BASE}/demo/run-scenario/6`, { method: 'POST' });
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.actual.priority, 'ROUTINE');
  assert.strictEqual(data.actual.source, 'LLM_CLASSIFIER');
});

test('E2E Scenario 7: Edge Case Ambiguity Escalates on Uncertainty', async () => {
  const res = await fetch(`${BASE}/demo/run-scenario/7`, { method: 'POST' });
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.actual.priority, 'EMERGENCY');
  assert.strictEqual(data.actual.source, 'LLM_UNCERTAINTY_ESCALATION');
});

test('E2E Scenario 8: Adversarial Injection Handled and Escalated Safely', async () => {
  const res = await fetch(`${BASE}/demo/run-scenario/8`, { method: 'POST' });
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.actual.priority, 'EMERGENCY');
});

test('E2E: Doctor Override and Audit Logging', async () => {
  // 1. Get queue
  const queueRes = await fetch(`${BASE}/queue`);
  const queueData = await queueRes.json();
  assert.strictEqual(queueData.success, true);
  assert.ok(queueData.queue.length > 0);

  const targetPatient = queueData.queue[0];

  // 2. Perform override
  const ovrRes = await fetch(`${BASE}/queue/${targetPatient.id}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doctor_id: 'DOC-VERIFIED-01',
      new_priority: 'SAME_DAY',
      reason: 'Physical exam shows no acute distress. ECG normal.'
    })
  });
  const ovrData = await ovrRes.json();
  assert.strictEqual(ovrData.success, true);
  assert.strictEqual(ovrData.patient.current_priority, 'SAME_DAY');
  assert.ok(ovrData.patient.overrides.length > 0);
  assert.strictEqual(ovrData.patient.overrides[0].doctor_id, 'DOC-VERIFIED-01');
});
