import React from 'react';

export default function Header({ currentTab, setCurrentTab, language, setLanguage, emergencyCount = 0 }) {
  return (
    <header className="editorial-header">
      <div className="editorial-header-inner">
        {/* Monolithic Brand Identification */}
        <div className="brand-monolith">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#0a0a0a' }}></span>
            <h1 className="brand-monolith-title">LifeLine</h1>
            <span className="mono-meta" style={{ color: '#ff3b00', fontWeight: '700' }}>[V2.4]</span>
          </div>
          <span className="brand-monolith-sub">
            RURAL PHC TRIAGE SYSTEM · DETERMINISTIC SAFETY RAIL ENGINE
          </span>
        </div>

        {/* Action Controls & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Language Switcher Mono */}
          <div className="lang-switcher-mono" role="group" aria-label="Language selection">
            <button
              className={`lang-btn-mono ${language === 'ta-IN' ? 'active' : ''}`}
              onClick={() => setLanguage('ta-IN')}
            >
              TA · தமிழ்
            </button>
            <button
              className={`lang-btn-mono ${language === 'hi-IN' ? 'active' : ''}`}
              onClick={() => setLanguage('hi-IN')}
            >
              HI · हिंदी
            </button>
            <button
              className={`lang-btn-mono ${language === 'en-IN' ? 'active' : ''}`}
              onClick={() => setLanguage('en-IN')}
            >
              EN · ENGLISH
            </button>
          </div>

          {/* Editorial Navigation Strip */}
          <nav className="nav-editorial-strip" aria-label="Primary navigation">
            <button
              className={`nav-editorial-btn ${currentTab === 'intake' ? 'active' : ''}`}
              onClick={() => setCurrentTab('intake')}
            >
              <span className="tab-num">01</span>
              <span>Intake</span>
            </button>

            <button
              className={`nav-editorial-btn ${currentTab === 'doctor' ? 'active' : ''}`}
              onClick={() => setCurrentTab('doctor')}
            >
              <span className="tab-num">02</span>
              <span>Queue</span>
              {emergencyCount > 0 && (
                <span className="nav-emergency-counter">{emergencyCount}</span>
              )}
            </button>

            <button
              className={`nav-editorial-btn ${currentTab === 'demo' ? 'active' : ''}`}
              onClick={() => setCurrentTab('demo')}
            >
              <span className="tab-num">03</span>
              <span>Demo [08]</span>
            </button>

            <button
              className={`nav-editorial-btn ${currentTab === 'audit' ? 'active' : ''}`}
              onClick={() => setCurrentTab('audit')}
            >
              <span className="tab-num">04</span>
              <span>Audit</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
