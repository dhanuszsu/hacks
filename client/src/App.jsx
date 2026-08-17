import React, { useState, useEffect } from 'react';
import SafetyBanner from './components/SafetyBanner';
import Header from './components/Header';
import IntakeView from './components/IntakeView';
import DoctorDashboard from './components/DoctorDashboard';
import DemoSuite from './components/DemoSuite';
import AuditLogView from './components/AuditLogView';
import { fetchQueue } from './utils/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('intake');
  const [language, setLanguage] = useState('ta-IN'); // Default Tamil for regional PHC context
  const [emergencyCount, setEmergencyCount] = useState(0);

  // Check URL hash/path for deep linking e.g. #demo or /demo
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const pathname = window.location.pathname;

    if (hash === 'demo' || pathname.includes('/demo')) {
      setCurrentTab('demo');
    } else if (hash === 'doctor' || pathname.includes('/doctor')) {
      setCurrentTab('doctor');
    } else if (hash === 'audit' || pathname.includes('/audit')) {
      setCurrentTab('audit');
    }
  }, []);

  // Poll emergency count periodically for tab badge
  useEffect(() => {
    const updateEmergencyBadge = async () => {
      try {
        const data = await fetchQueue();
        if (data.success && data.counts) {
          setEmergencyCount(data.counts.emergency || 0);
        }
      } catch (err) {
        // silent fallback
      }
    };
    updateEmergencyBadge();
    const interval = setInterval(updateEmergencyBadge, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* 1. Mandatory Safety Banner on Every Screen */}
      <SafetyBanner />

      {/* 2. Top Header Navigation & Language Switcher */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        language={language}
        setLanguage={setLanguage}
        emergencyCount={emergencyCount}
      />

      {/* 3. Main Routed View Content */}
      <main className="main-content">
        {currentTab === 'intake' && (
          <IntakeView
            language={language}
            onNavigateToDoctor={() => setCurrentTab('doctor')}
          />
        )}

        {currentTab === 'doctor' && (
          <DoctorDashboard />
        )}

        {currentTab === 'demo' && (
          <DemoSuite
            onNavigateToDoctor={() => setCurrentTab('doctor')}
          />
        )}

        {currentTab === 'audit' && (
          <AuditLogView />
        )}
      </main>
    </div>
  );
}
