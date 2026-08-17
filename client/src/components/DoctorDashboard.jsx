import React, { useState, useEffect } from 'react';
import { fetchQueue } from '../utils/api';
import OverrideModal from './OverrideModal';

export default function DoctorDashboard() {
  const [queueData, setQueueData] = useState({ queue: [], counts: { emergency: 0, same_day: 0, routine: 0 }, total: 0 });
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [overridePatient, setOverridePatient] = useState(null);
  const [lastSync, setLastSync] = useState(new Date());

  const loadQueue = async () => {
    try {
      const data = await fetchQueue();
      if (data.success) {
        setQueueData(data);
        setLastSync(new Date());
      }
    } catch (err) {
      console.warn('Queue poll error:', err.message);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const filteredQueue = queueData.queue.filter(p => {
    const priority = p.current_priority || p.triage_result?.priority;
    const matchesFilter = filterPriority === 'ALL' || priority === filterPriority;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      p.patient_name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.intake?.chief_complaint || '').toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      {/* Editorial Lead Section */}
      <div className="editorial-hero-grid">
        <div>
          <div className="section-label" style={{ marginBottom: '0.5rem' }}>
            02 / CLINICAL REGISTRY
          </div>
          <h2 className="display-hero">Active Triage Queue</h2>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="mono-meta" style={{ marginBottom: '0.25rem' }}>
            SYNC INTERVAL: 3.0s · REAL-TIME
          </div>
          <div className="mono-meta" style={{ color: '#0a0a0a', fontWeight: '700' }}>
            LAST INGESTION: {lastSync.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <hr className="editorial-rule-strong" />

      {/* Monolithic Metric Counters Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0', border: '1px solid var(--border-strong)', marginBottom: '2.5rem' }}>
        <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border-strong)', background: '#fff' }}>
          <div className="section-label accent">01 · EMERGENCY</div>
          <div style={{ fontSize: '2.75rem', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#ff3b00', marginTop: '0.25rem' }}>
            {queueData.counts.emergency < 10 ? `0${queueData.counts.emergency}` : queueData.counts.emergency}
          </div>
          <div className="mono-meta" style={{ fontSize: '0.7rem' }}>IMMEDIATE PROTOCOL</div>
        </div>

        <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border-strong)', background: '#fff' }}>
          <div className="section-label">02 · SAME-DAY</div>
          <div style={{ fontSize: '2.75rem', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#0a0a0a', marginTop: '0.25rem' }}>
            {queueData.counts.same_day < 10 ? `0${queueData.counts.same_day}` : queueData.counts.same_day}
          </div>
          <div className="mono-meta" style={{ fontSize: '0.7rem' }}>CURRENT SHIFT CONSULT</div>
        </div>

        <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border-strong)', background: '#fff' }}>
          <div className="section-label">03 · ROUTINE OPD</div>
          <div style={{ fontSize: '2.75rem', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#666', marginTop: '0.25rem' }}>
            {queueData.counts.routine < 10 ? `0${queueData.counts.routine}` : queueData.counts.routine}
          </div>
          <div className="mono-meta" style={{ fontSize: '0.7rem' }}>STANDARD OUTPATIENT</div>
        </div>

        <div style={{ padding: '1.5rem', background: '#fff' }}>
          <div className="section-label">TOTAL QUEUE</div>
          <div style={{ fontSize: '2.75rem', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#0a0a0a', marginTop: '0.25rem' }}>
            {queueData.total < 10 ? `0${queueData.total}` : queueData.total}
          </div>
          <div className="mono-meta" style={{ fontSize: '0.7rem' }}>PATIENTS IN REGISTRY</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Priority Filter Strips */}
        <div className="nav-editorial-strip">
          {['ALL', 'EMERGENCY', 'SAME_DAY', 'ROUTINE'].map((tier, idx) => (
            <button
              key={tier}
              className={`nav-editorial-btn ${filterPriority === tier ? 'active' : ''}`}
              onClick={() => setFilterPriority(tier)}
              style={{ fontSize: '0.75rem' }}
            >
              <span className="tab-num">0{idx}</span>
              <span>{tier === 'ALL' ? 'ALL CASES' : tier.replace('_', '-')}</span>
            </button>
          ))}
        </div>

        {/* Underline Search Input */}
        <div style={{ minWidth: '280px', flex: '1', maxWidth: '400px' }}>
          <label className="form-label-editorial">REGISTRY SEARCH</label>
          <input
            type="text"
            className="form-input-editorial"
            placeholder="Search patient, token or symptom..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ fontSize: '0.95rem' }}
          />
        </div>
      </div>

      {/* Strict Swiss Editorial Table */}
      <div className="editorial-panel" style={{ padding: '0' }}>
        <table className="editorial-table">
          <thead>
            <tr>
              <th style={{ width: '160px' }}>PRIORITY TIER</th>
              <th style={{ width: '110px' }}>TOKEN ID</th>
              <th style={{ width: '220px' }}>PATIENT / DEMO</th>
              <th>PRIMARY COMPLAINT TRANSCRIPT</th>
              <th style={{ width: '100px' }}>TIME</th>
              <th style={{ width: '190px', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredQueue.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                  <div className="section-label" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>NULL RESULT</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>No patients found in this registry filter</div>
                </td>
              </tr>
            ) : (
              filteredQueue.map(patient => {
                const priority = patient.current_priority || patient.triage_result?.priority;
                const isExpanded = expandedId === patient.id;
                const hasOverrides = patient.overrides && patient.overrides.length > 0;
                const arrivalTime = new Date(patient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <React.Fragment key={patient.id}>
                    <tr>
                      <td>
                        <span className={`status-indicator-swiss status-${priority.toLowerCase().replace('_', '')}`}>
                          {priority === 'EMERGENCY' && '● EMERGENCY'}
                          {priority === 'SAME_DAY' && '○ SAME-DAY'}
                          {priority === 'ROUTINE' && '— ROUTINE'}
                        </span>
                      </td>

                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.85rem' }}>
                        {patient.id}
                      </td>

                      <td>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{patient.patient_name}</div>
                        <div className="mono-meta" style={{ fontSize: '0.75rem' }}>
                          Age {patient.age || 'N/A'} · {patient.gender}
                        </div>
                      </td>

                      <td style={{ color: '#262626' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{patient.intake?.chief_complaint || 'No complaint recorded'}</span>
                          {hasOverrides && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', background: '#0a0a0a', color: '#fff', padding: '0.1rem 0.35rem', textTransform: 'uppercase' }}>
                              OVERRIDDEN
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="mono-meta" style={{ fontSize: '0.8rem' }}>
                        {arrivalTime}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            className="btn-swiss btn-swiss-outline"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => setOverridePatient(patient)}
                          >
                            OVERRIDE
                          </button>
                          <button
                            className="btn-swiss"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => handleToggleExpand(patient.id)}
                          >
                            {isExpanded ? 'CLOSE ▲' : 'EXPAND ▼'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable 5-Line Clinical Summary Manifest */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="6" style={{ background: '#f8f8f6', padding: '1.75rem' }}>
                          <div className="manifest-box-swiss" style={{ background: '#fff', margin: '0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #000', paddingBottom: '0.5rem' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '0.08em' }}>
                                5-LINE STRUCTURED CLINICAL MANIFEST · DOCTOR INSPECTION
                              </span>
                              <span className="mono-meta" style={{ fontSize: '0.75rem' }}>
                                SOURCE: <strong>{patient.triage_result.decision_source}</strong>
                              </span>
                            </div>

                            {patient.structured_summary?.display_lines.map((line, lIdx) => (
                              <div key={lIdx} className="manifest-line">
                                <div className="manifest-label">{line.label}</div>
                                <div className="manifest-val">{line.value}</div>
                              </div>
                            ))}

                            {/* Override Trail if present */}
                            {hasOverrides && (
                              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #d0d0cc' }}>
                                <div className="section-label" style={{ marginBottom: '0.5rem' }}>
                                  CLINICAL OVERRIDE AUDIT LOG ({patient.overrides.length} MODIFICATIONS)
                                </div>
                                {patient.overrides.map((ovr, oIdx) => (
                                  <div key={oIdx} className="mono-meta" style={{ fontSize: '0.75rem', padding: '0.2rem 0', color: '#171717' }}>
                                    • {new Date(ovr.timestamp).toLocaleTimeString()}: Changed <em>{ovr.previous_priority}</em> → <strong>{ovr.new_priority}</strong> by <u>{ovr.doctor_id}</u>. Reason: "{ovr.reason}"
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Override Modal */}
      {overridePatient && (
        <OverrideModal
          patient={overridePatient}
          onClose={() => setOverridePatient(null)}
          onOverrideSuccess={(updated) => {
            setQueueData(prev => ({
              ...prev,
              queue: prev.queue.map(p => (p.id === updated.id ? updated : p))
            }));
            loadQueue();
          }}
        />
      )}
    </div>
  );
}
