import React, { useState, useEffect } from 'react';
import { fetchAuditLogs } from '../utils/api';

export default function AuditLogView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div>
      {/* Editorial Lead Section */}
      <div className="editorial-hero-grid">
        <div>
          <div className="section-label" style={{ marginBottom: '0.5rem' }}>
            04 / AUDIT LEDGER
          </div>
          <h2 className="display-hero">Safety Rail Log</h2>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="mono-meta" style={{ marginBottom: '0.75rem' }}>
            IMMUTABLE INFERENCE AUDIT TRAIL
          </div>
          <button className="btn-swiss btn-swiss-outline" onClick={loadLogs}>
            {loading ? 'SYNCING...' : 'REFRESH LEDGER ↺'}
          </button>
        </div>
      </div>

      <hr className="editorial-rule-strong" />

      {logs.length === 0 ? (
        <div className="editorial-panel" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="section-label" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>NO INFERENCES LOGGED</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Run test scenarios or patient intake to generate audited records</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {logs.slice().reverse().map((entry, idx) => {
            const isExpanded = expandedIndex === idx;
            const hasViolation = !!entry.safety_violation;

            return (
              <div
                key={entry.audit_id || idx}
                className="editorial-panel"
                style={{
                  borderLeftWidth: '5px',
                  borderLeftColor: hasViolation ? '#ff3b00' : '#0a0a0a'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div className="mono-meta" style={{ color: '#0a0a0a', fontWeight: '800' }}>
                      AUDIT-ID: {entry.audit_id}
                    </div>
                    <div className="mono-meta" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                      TIMESTAMP: {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="mono-meta" style={{ background: '#0a0a0a', color: '#fff', padding: '0.2rem 0.5rem', fontWeight: '700' }}>
                      VERDICT: {entry.decision?.priority || 'ESCALATED'}
                    </span>
                    <button
                      className="btn-swiss btn-swiss-outline"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    >
                      {isExpanded ? 'COLLAPSE ▲' : 'INSPECT PAYLOAD ▼'}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  <strong>RATIONALE:</strong> {entry.decision?.rationale}
                </div>

                {hasViolation && (
                  <div style={{ marginTop: '0.75rem', background: '#0a0a0a', color: '#ff3b00', padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: '700' }}>
                    ⚠️ SAFETY GUARDRAIL TRIGGERED: {entry.safety_violation}
                  </div>
                )}

                {isExpanded && (
                  <div style={{ marginTop: '1.25rem', background: '#0a0a0a', color: '#f8fafc', padding: '1.25rem', fontSize: '0.8rem', overflowX: 'auto', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ color: '#ff3b00', fontWeight: '700', marginBottom: '0.5rem' }}>
                      // UNTRUSTED INPUT PAYLOAD (ISOLATED IN DATA CONTAINER):
                    </div>
                    <pre>{JSON.stringify(entry.untrusted_input, null, 2)}</pre>

                    <div style={{ color: '#fff', fontWeight: '700', margin: '1rem 0 0.5rem 0' }}>
                      // RAW / SANITIZED MODEL DECISION:
                    </div>
                    <pre>{JSON.stringify(entry.parsed_output || entry.decision, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
