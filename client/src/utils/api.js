/**
 * LIFELINE — API CLIENT
 */

const API_BASE = ''; // Uses Vite proxy in development

export async function fetchQueue() {
  const res = await fetch(`${API_BASE}/queue`);
  if (!res.ok) throw new Error('Failed to fetch patient queue');
  return res.json();
}

export async function fetchPatient(id) {
  const res = await fetch(`${API_BASE}/patients/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch patient ${id}`);
  return res.json();
}

export async function startIntake(payload) {
  const res = await fetch(`${API_BASE}/intake/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to initialize intake session');
  return res.json();
}

export async function submitIntake(payload) {
  const res = await fetch(`${API_BASE}/intake/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to submit intake');
  return res.json();
}

export async function overridePriority(patientId, { doctor_id, new_priority, reason }) {
  const res = await fetch(`${API_BASE}/queue/${patientId}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctor_id, new_priority, reason })
  });
  if (!res.ok) throw new Error('Failed to update priority override');
  return res.json();
}

export async function fetchDemoScenarios() {
  const res = await fetch(`${API_BASE}/demo/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch demo scenarios');
  return res.json();
}

export async function runDemoScenario(id) {
  const res = await fetch(`${API_BASE}/demo/run-scenario/${id}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to run scenario ${id}`);
  return res.json();
}

export async function resetQueue() {
  const res = await fetch(`${API_BASE}/demo/reset-queue`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset queue');
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE}/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}
