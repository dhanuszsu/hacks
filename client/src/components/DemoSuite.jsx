import React, { useState, useEffect } from 'react';
import { fetchDemoScenarios, runDemoScenario, resetQueue } from '../utils/api';

export default function DemoSuite({ onNavigateToDoctor }) {
  const [scenarios, setScenarios] = useState([]);
  const [results, setResults] = useState({});
  const [runningId, setRunningId] = useState(null);
  const [runningAll, setRunningAll] = useState(false);

  useEffect(() => {
    fetchDemoScenarios().then(res => {
      if (res.success) setScenarios(res.scenarios);
    }).catch(console.error);
  }, []);

  const handleRunScenario = async (id) => {
    setRunningId(id);
    try {
      const res = await runDemoScenario(id);
      if (res.success) {
        setResults(prev => ({
          ...prev,
          [id]: res
        }));
      }
    } catch (err) {
      alert(`Scenario execution failed: ${err.message}`);
    } finally {
      setRunningId(null);
    }
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    for (const sc of scenarios) {
      try {
        const res = await runDemoScenario(sc.id);
        if (res.success) {
          setResults(prev => ({
            ...prev,
            [sc.id]: res
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    setRunningAll(false);
  };

  const handleResetQueue = async () => {
    if (confirm('Reset queue to initial seed state?')) {
      await resetQueue();
      setResults({});
      alert('Queue reset successfully.');
    }
  };

  return (
    <div>
      {/* Editorial Lead Section */}
      <div className="editorial-hero-grid">
        <div>
          <div className="section-label" style={{ marginBottom: '0.5rem' }}>
            03 / BENCHMARK MATRIX
          </div>
          <h2 className="display-hero">8 Scripted Scenarios</h2>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="mono-meta" style={{ marginBottom: '0.75rem' }}>
            ADVERSARIAL & SAFETY COMPLIANCE EVALUATION
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              className="btn-swiss btn-swiss-accent"
              onClick={handleRunAll}
              disabled={runningAll || scenarios.length === 0}
            >
              {runningAll ? 'EXECUTING ALL 08...' : 'RUN ALL 08 SCENARIOS →'}
            </button>
            <button className="btn-swiss btn-swiss-outline" onClick={handleResetQueue}>
              RESET QUEUE ↺
            </button>
          </div>
        </div>
      </div>

      <hr className="editorial-rule-strong" />

      {/* Numbered Scenario Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {scenarios.map(sc => {
          const runRes = results[sc.id];
          const isRunning = runningId === sc.id || runningAll;
          const isAdversarial = sc.number === 8;
          const isEdgeCase = sc.number === 7;

          return (
            <div
              key={sc.id}
              className="editorial-panel"
              style={{
                borderLeftWidth: '6px',
                borderLeftColor: sc.expected_priority === 'EMERGENCY' ? '#ff3b00' : sc.expected_priority === 'SAME_DAY' ? '#d97706' : '#15803d',
                background: isAdversarial ? '#fefefe' : '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
                <div style={{ flex: '1', minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span className="mono-meta" style={{ fontWeight: '800', background: '#0a0a0a', color: '#fff', padding: '0.15rem 0.5rem' }}>
                      SCENARIO 0{sc.number}
                    </span>

                    <span className={`status-indicator-swiss status-${sc.expected_priority.toLowerCase().replace('_', '')}`} style={{ fontSize: '0.75rem' }}>
                      [EXPECTED: {sc.expected_priority}]
                    </span>

                    {isAdversarial && (
                      <span className="mono-meta" style={{ color: '#ff3b00', fontWeight: '800' }}>
                        [ADVERSARIAL ATTACK TEST]
                      </span>
                    )}

                    {isEdgeCase && (
                      <span className="mono-meta" style={{ color: '#d97706', fontWeight: '800' }}>
                        [UNCERTAINTY RAIL TEST]
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', color: 'var(--text-main)' }}>
                    {sc.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.25rem' }}>
                    {sc.description}
                  </p>

                  <div className="manifest-box-swiss" style={{ padding: '0.85rem 1.25rem', marginTop: '0.85rem' }}>
                    <div className="mono-meta" style={{ color: '#0a0a0a', fontWeight: '700', fontSize: '0.75rem' }}>
                      INPUT PAYLOAD TRANSCRIPT:
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                      "{sc.intake.chief_complaint}"
                    </div>
                  </div>
                </div>

                {/* Execution Button */}
                <div>
                  <button
                    className="btn-swiss"
                    onClick={() => handleRunScenario(sc.id)}
                    disabled={isRunning}
                  >
                    {isRunning ? 'RUNNING...' : 'EXECUTE →'}
                  </button>
                </div>
              </div>

              {/* Live Execution Output Block */}
              {runRes && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #0a0a0a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#ff3b00' }}></span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '0.85rem' }}>
                        EXECUTED LIVE · RESULT = {runRes.actual.priority}
                      </span>
                    </div>

                    <div className="mono-meta">
                      SOURCE: <strong>{runRes.actual.source}</strong>
                    </div>
                  </div>

                  <div className="manifest-box-swiss" style={{ background: '#fff' }}>
                    <div className="manifest-line">
                      <div className="manifest-label">RATIONALE</div>
                      <div className="manifest-val">{runRes.actual.rationale}</div>
                    </div>
                    <div className="manifest-line">
                      <div className="manifest-label">STATUS</div>
                      <div className="manifest-val">
                        Token <strong>{runRes.patient?.id}</strong> written to live clinical registry queue.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <button className="btn-swiss btn-swiss-large" onClick={onNavigateToDoctor}>
          <span>VIEW CLINICAL REGISTRY QUEUE</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
