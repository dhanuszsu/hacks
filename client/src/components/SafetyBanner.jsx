import React from 'react';

export default function SafetyBanner() {
  return (
    <aside className="safety-rail-ticker" role="status" aria-label="Mandatory Safety Rail">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className="safety-dot"></span>
        <span>
          <strong>SAFETY PROTOCOL 01:</strong> AI ASSISTS PRIORITIZATION ONLY · STRICTLY NON-DIAGNOSTIC · CLINICAL OVERRIDE ACTIVE
        </span>
      </div>
      <div className="mono-meta" style={{ color: '#a3a3a3', fontSize: '0.7rem' }}>
        DETERMINISTIC RED-FLAG LAYER [ACTIVE]
      </div>
    </aside>
  );
}
