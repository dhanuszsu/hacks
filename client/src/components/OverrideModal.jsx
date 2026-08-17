import React, { useState } from 'react';
import { overridePriority } from '../utils/api';

const QUICK_REASONS = [
  'ECG / Bedside clinical examination shows acute anomaly',
  'Patient visibly in greater distress than initial report',
  'Atypical presentation requiring urgent doctor evaluation',
  'Stable after brief observation, safe for routine consultation',
  'Chronic symptom exacerbation requiring same-day laboratory workup'
];

export default function OverrideModal({ patient, onClose, onOverrideSuccess }) {
  const [selectedPriority, setSelectedPriority] = useState(patient.current_priority || patient.triage_result.priority);
  const [doctorId, setDoctorId] = useState('Dr. A. Sharma (PHC In-Charge)');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentPriority = patient.current_priority || patient.triage_result.priority;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide or select a clinical reason for this priority override.');
      return;
    }
    if (selectedPriority === currentPriority) {
      alert('Selected priority is the same as current priority.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await overridePriority(patient.id, {
        doctor_id: doctorId,
        new_priority: selectedPriority,
        reason: reason.trim()
      });
      if (res.success) {
        onOverrideSuccess(res.patient);
        onClose();
      }
    } catch (err) {
      alert('Override failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay-swiss" onClick={onClose}>
      <div className="modal-card-swiss" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div className="section-label accent">CLINICAL OVERRIDE PROTOCOL</div>
            <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: '0.25rem' }}>
              Re-Prioritize Patient
            </h3>
          </div>
          <button onClick={onClose} className="btn-swiss btn-swiss-outline" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
            ESC ✕
          </button>
        </div>

        <div style={{ background: '#f4f4f0', padding: '1rem', border: '1px solid #e0e0db', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          <div>TOKEN: <strong>{patient.id}</strong> · {patient.patient_name}</div>
          <div style={{ marginTop: '0.25rem' }}>
            CURRENT TIER: <strong>{currentPriority}</strong> · SOURCE: {patient.triage_result.decision_source}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Priority Tier Strip */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label-editorial">SELECT TARGET PRIORITY TIER</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { id: 'EMERGENCY', label: '01 · EMERGENCY', color: '#ff3b00' },
                { id: 'SAME_DAY', label: '02 · SAME-DAY', color: '#d97706' },
                { id: 'ROUTINE', label: '03 · ROUTINE', color: '#15803d' }
              ].map(tier => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedPriority(tier.id)}
                  style={{
                    padding: '0.85rem 0.5rem',
                    border: '1px solid #000',
                    backgroundColor: selectedPriority === tier.id ? '#000' : '#fff',
                    color: selectedPriority === tier.id ? '#fff' : '#000',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clinician ID Input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label-editorial">ATTENDING CLINICIAN CREDENTIAL</label>
            <input
              type="text"
              className="form-input-editorial"
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              required
            />
          </div>

          {/* Quick Reasons Strip */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label-editorial">STANDARD CLINICAL RATIONALE</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '130px', overflowY: 'auto' }}>
              {QUICK_REASONS.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(r)}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    background: reason === r ? '#000' : '#f9f9f9',
                    color: reason === r ? '#fff' : '#222',
                    border: '1px solid #e0e0e0',
                    cursor: 'pointer'
                  }}
                >
                  [0{idx + 1}] {r}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Rationale Textarea */}
          <div style={{ marginBottom: '2rem' }}>
            <textarea
              className="form-input-editorial"
              rows={2}
              placeholder="Or enter custom clinical rationale for audit trail..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              style={{ fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn-swiss btn-swiss-outline" onClick={onClose}>
              CANCEL
            </button>
            <button type="submit" className="btn-swiss btn-swiss-accent" disabled={submitting}>
              {submitting ? 'RECORDING...' : 'COMMIT OVERRIDE →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
