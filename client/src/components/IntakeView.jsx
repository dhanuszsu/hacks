import React, { useState } from 'react';
import { createSpeechRecognizer, isSpeechRecognitionSupported, speakText } from '../utils/speech';
import { startIntake, submitIntake } from '../utils/api';

export default function IntakeView({ language, onNavigateToDoctor }) {
  const [step, setStep] = useState(1); // 1: Complaint, 2: Duration, 3: Follow-ups, 4: Vitals, 5: Confirm, 6: Result
  const [isListening, setIsListening] = useState(false);
  const [recognizer, setRecognizer] = useState(null);

  // Form State
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('female');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [duration, setDuration] = useState('today');
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [vitals, setVitals] = useState({ spo2: 98, systolic_bp: 120, diastolic_bp: 80, temp_c: 37.0 });
  const [submitting, setSubmitting] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

  const isTamil = language === 'ta-IN';
  const isHindi = language === 'hi-IN';

  // Duration Options
  const durationOptions = [
    {
      id: 'today',
      code: '01',
      en: 'Today (< 24 hrs)',
      hi: 'आज ही शुरू हुआ (< 24 घंटे)',
      ta: 'இன்றே தொடங்கியது (< 24 மணி நேரம்)',
      meta: 'ACUTE / IMMEDIATE ONSET'
    },
    {
      id: 'few_days',
      code: '02',
      en: 'Few Days (2–6 days)',
      hi: 'कुछ दिनों से (2-6 दिन)',
      ta: 'சில நாட்களாக (2–6 நாட்கள்)',
      meta: 'SUBACUTE COURSE'
    },
    {
      id: 'weeks_plus',
      code: '03',
      en: 'Weeks or more (≥ 7 days)',
      hi: 'हफ्तों या महीनों से (≥ 7 दिन)',
      ta: 'வாரங்கள் அல்லது அதற்கு மேல் (≥ 7 நாட்கள்)',
      meta: 'PERSISTENT / CHRONIC'
    }
  ];

  // Voice handler
  const toggleListening = (targetField = 'complaint') => {
    if (isListening) {
      if (recognizer) recognizer.stop();
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert(isTamil
        ? 'இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. தயவுசெய்து தட்டச்சு செய்யவும்.'
        : isHindi
          ? 'इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। कृपया लिखकर बताएं।'
          : 'Web Speech API is not supported in this browser. Please type your symptoms.'
      );
      return;
    }

    const rec = createSpeechRecognizer({
      lang: language,
      onResult: (res) => {
        if (targetField === 'complaint') {
          setChiefComplaint(prev => (res.finalText ? `${prev} ${res.finalText}`.trim() : prev || res.interimText));
        }
      },
      onError: () => setIsListening(false),
      onEnd: () => setIsListening(false)
    });

    if (rec) {
      setRecognizer(rec);
      rec.start();
      setIsListening(true);
    }
  };

  const handleProceedToDuration = async () => {
    if (!chiefComplaint.trim()) {
      alert(isTamil
        ? 'தயவுசெய்து முக்கிய அறிகுறியை உள்ளிடவும்'
        : isHindi
          ? 'कृपया मुख्य तकलीफ बताएं'
          : 'Please provide the chief complaint'
      );
      return;
    }

    try {
      const res = await startIntake({
        chief_complaint: chiefComplaint,
        age,
        gender,
        language
      });
      if (res.success && res.adaptive_questions) {
        setAdaptiveQuestions(res.adaptive_questions);
      }
      setStep(2);
    } catch (err) {
      console.error(err);
      setStep(2);
    }
  };

  const handleProceedToConfirm = () => {
    setStep(5);
    const readbackText = isTamil
      ? `நோயாளி பெயர்: ${patientName || 'நோயாளி'}. முக்கிய அறிகுறி: ${chiefComplaint}. உடனடி முன்னுரிமை சரிபார்ப்பிற்கு சமர்ப்பிக்க தயாராக உள்ளது.`
      : isHindi
        ? `मरीज का नाम: ${patientName || 'मरीज'}। मुख्य तकलीफ: ${chiefComplaint}। क्या आप यह जानकारी जमा करना चाहते हैं?`
        : `Patient name: ${patientName || 'Patient'}. Chief complaint: ${chiefComplaint}. Ready to submit for triage prioritization.`;
    speakText(readbackText, language);
  };

  const handleSubmitTriage = async () => {
    setSubmitting(true);
    try {
      const mappedFlags = { ...answers };
      if (answers.pain_characteristics === 'severe_radiating') {
        mappedFlags.chest_pain = true;
        mappedFlags.chest_pain_radiating = true;
      }
      if (answers.breathing === 'cannot_speak') {
        mappedFlags.severe_breathlessness = true;
        mappedFlags.cannot_speak_sentences = true;
      }
      if (answers.consciousness_dizziness === 'fainted_passed_out') {
        mappedFlags.fainting = true;
        mappedFlags.loss_of_consciousness = true;
      }
      if (answers.consciousness_dizziness === 'one_sided_weakness') {
        mappedFlags.facial_droop = true;
        mappedFlags.one_sided_weakness = true;
      }
      if (answers.bleeding_discharge === 'blood_vomit_stool') {
        mappedFlags.blood_in_vomit = true;
        mappedFlags.blood_in_stool = true;
      }
      if (answers.pregnancy_check === 'pregnant_severe_pain') {
        mappedFlags.is_pregnant = true;
        mappedFlags.pregnancy_bleeding = true;
      }
      if (answers.child_activity === 'seizures_fits') {
        mappedFlags.child_seizure = true;
        mappedFlags.child_not_feeding = true;
      }

      const payload = {
        patient_name: patientName || 'Walk-in Patient',
        age: age ? Number(age) : null,
        gender,
        language,
        chief_complaint: chiefComplaint,
        duration,
        red_flag_answers: mappedFlags,
        vitals
      };

      const res = await submitIntake(payload);
      if (res.success && res.patient) {
        setTriageResult(res.patient);
        setStep(6);
      }
    } catch (err) {
      alert('Triage submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setChiefComplaint('');
    setPatientName('');
    setAge('');
    setAnswers({});
    setTriageResult(null);
  };

  return (
    <div>
      {/* Editorial Lead Section */}
      <div className="editorial-hero-grid">
        <div>
          <div className="section-label" style={{ marginBottom: '0.5rem' }}>
            01 / INTAKE PROTOCOL
          </div>
          <h2 className="display-hero">
            {step === 1 && (isTamil ? 'அறிகுறிகள் பதிவு' : isHindi ? 'लक्षण पंजीकरण' : 'Symptom Ingestion')}
            {step === 2 && (isTamil ? 'கால அளவு' : isHindi ? 'समय अवधि' : 'Onset Duration')}
            {step === 3 && (isTamil ? 'மருத்துவ பரிசோதனை' : isHindi ? 'लक्षण जांच' : 'Clinical Questions')}
            {step === 4 && (isTamil ? 'உடல் நிலை அளவீடு' : isHindi ? 'वाइटल साइन्स' : 'Vital Parameters')}
            {step === 5 && (isTamil ? 'சரிபார்த்தல்' : isHindi ? 'समीक्षा' : 'Verification')}
            {step === 6 && (isTamil ? 'ட்ரையஜ் முடிவு' : isHindi ? 'ट्राइएज परिणाम' : 'Triage Verdict')}
          </h2>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="mono-meta" style={{ marginBottom: '0.25rem' }}>
            PHASE: 0{step} / 05
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            {step < 6 && (
              <button onClick={handleReset} className="btn-swiss btn-swiss-outline" style={{ padding: '0.45rem 0.95rem', fontSize: '0.75rem' }}>
                RESET ↺
              </button>
            )}
          </div>
        </div>
      </div>

      <hr className="editorial-rule-strong" />

      {/* STEP 1: CHIEF COMPLAINT & DEMOGRAPHICS */}
      {step === 1 && (
        <div className="editorial-panel">
          <div className="editorial-panel-header">
            <div>
              <div className="section-label">PATIENT CREDENTIALS</div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                {isTamil ? 'நோயாளியின் விவரங்கள் & அறிகுறிகள்' : isHindi ? 'रोगी विवरण एवं मुख्य लक्षण' : 'Demographics & Primary Complaint'}
              </h3>
            </div>
            <div className="mono-meta">LANG: {language}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
            <div>
              <label className="form-label-editorial">
                {isTamil ? 'நோயாளி பெயர் (Patient Name)' : isHindi ? 'रोगी का नाम (Patient Name)' : '01. Patient Name'}
              </label>
              <input
                type="text"
                className="form-input-editorial"
                placeholder={isTamil ? 'எ.கா. செந்தில் குமார்' : isHindi ? 'उदा. राम कुमार' : 'e.g. Ramesh Kumar'}
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label-editorial">
                {isTamil ? 'வயது (Age in Years)' : isHindi ? 'उम्र (Age in Years)' : '02. Age (Years)'}
              </label>
              <input
                type="number"
                className="form-input-editorial"
                placeholder="45"
                value={age}
                onChange={e => setAge(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label-editorial">
                {isTamil ? 'பாலினம் (Gender)' : isHindi ? 'लिंग (Gender)' : '03. Gender'}
              </label>
              <select
                className="form-input-editorial"
                value={gender}
                onChange={e => setGender(e.target.value)}
              >
                <option value="female">{isTamil ? 'பெண் (Female)' : isHindi ? 'महिला (Female)' : 'Female'}</option>
                <option value="male">{isTamil ? 'ஆண் (Male)' : isHindi ? 'पुरुष (Male)' : 'Male'}</option>
                <option value="other">{isTamil ? 'மற்றவை (Other)' : isHindi ? 'अन्य (Other)' : 'Other'}</option>
              </select>
            </div>
          </div>

          {/* Minimalist Brutalist Voice Input Box */}
          <div className={`voice-hero-frame ${isListening ? 'active' : ''}`}>
            <div className="section-label" style={{ marginBottom: '1rem' }}>
              PRIMARY VOICE INTERFACE · REGIONAL ASR
            </div>
            
            <button
              onClick={() => toggleListening('complaint')}
              className={`voice-record-monolith ${isListening ? 'listening' : ''}`}
              title="Toggle microphone"
              aria-label="Voice input toggle"
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.85rem' }}>
                {isListening ? 'STOP ■' : 'MIC ●'}
              </span>
            </button>

            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: '700', textTransform: 'uppercase' }}>
                {isListening
                  ? (isTamil ? 'கேட்கிறோம்... தமிழில் பேசவும்' : isHindi ? 'सुन रहे हैं... बोलिए' : 'Listening... Speak clearly')
                  : (isTamil ? 'குரலில் பேச பொத்தானை அழுத்தவும்' : isHindi ? 'बोलने के लिए बटन दबाएं' : 'Tap to Activate Regional Voice')}
              </div>
              <div className="mono-meta" style={{ marginTop: '0.25rem' }}>
                {isTamil ? 'தமிழ் பேச்சு உள்ளீடு ஆதரிக்கப்படுகிறது [ta-IN]' : isHindi ? 'हिंदी आवाज इनपुट सक्रिय है [hi-IN]' : 'Regional speech recognition ready [en-IN]'}
              </div>
            </div>
          </div>

          {/* Chief Complaint Text Area */}
          <div style={{ marginTop: '2rem' }}>
            <label className="form-label-editorial">
              {isTamil ? '04. முக்கிய அறிகுறி (Chief Complaint Text / Transcript)' : isHindi ? '04. मुख्य लक्षण (Chief Complaint Text)' : '04. Chief Complaint Transcript'}
            </label>
            <textarea
              className="form-input-editorial"
              rows={3}
              placeholder={isTamil ? 'எ.கா. கடுமையான நெஞ்சு வலி, மூச்சு திணறல், இடது கையில் வலி...' : isHindi ? 'उदा. छाती में तेज दर्द और सांस फूलना...' : 'e.g. Severe chest heaviness radiating to left arm and shortness of breath...'}
              value={chiefComplaint}
              onChange={e => setChiefComplaint(e.target.value)}
              style={{ fontSize: '1.2rem', lineHeight: '1.6' }}
            />
          </div>

          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-swiss btn-swiss-large"
              onClick={handleProceedToDuration}
              disabled={!chiefComplaint.trim()}
            >
              <span>{isTamil ? 'கால அளவு தேர்ந்தெடுக்கவும்' : isHindi ? 'समय अवधि चुनें' : 'Continue to Duration'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DURATION SELECTION (EDITORIAL STRIPS) */}
      {step === 2 && (
        <div className="editorial-panel">
          <div className="editorial-panel-header">
            <div>
              <div className="section-label">TEMPORAL ACUITY</div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                {isTamil ? 'இந்த அறிகுறி எவ்வளவு காலமாக உள்ளது?' : isHindi ? 'यह लक्षण कितने समय से बना हुआ है?' : 'Select Symptom Onset Duration'}
              </h3>
            </div>
            <div className="mono-meta">02 / 05</div>
          </div>

          <div className="editorial-option-row">
            {durationOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setDuration(opt.id)}
                className={`editorial-option-item ${duration === opt.id ? 'selected' : ''}`}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="mono-meta" style={{ color: duration === opt.id ? '#ff3b00' : '#666' }}>{opt.code}</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: '700', fontFamily: 'var(--font-display)' }}>{opt.en}</span>
                  </div>
                  <div className="option-subtext" style={{ fontSize: '0.95rem', color: '#666', marginTop: '0.25rem' }}>
                    {isTamil ? opt.ta : opt.hi}
                  </div>
                </div>

                <div className="mono-meta" style={{ color: duration === opt.id ? '#ff3b00' : '#999', fontSize: '0.75rem' }}>
                  [{opt.meta}]
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-swiss btn-swiss-outline" onClick={() => setStep(1)}>
              ← BACK
            </button>
            <button className="btn-swiss btn-swiss-large" onClick={() => setStep(3)}>
              <span>{isTamil ? 'அடுத்தது: கேள்விகள்' : isHindi ? 'लक्षण विवरण' : 'Proceed to Questions'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ADAPTIVE TARGETED FOLLOW-UP QUESTIONS */}
      {step === 3 && (
        <div className="editorial-panel">
          <div className="editorial-panel-header">
            <div>
              <div className="section-label">TARGETED CLINICAL INQUIRY</div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                {isTamil ? 'பாதுகாப்பு மதிப்பீட்டிற்கு தகுந்த விடையைத் தேர்ந்தெடுக்கவும்' : isHindi ? 'लक्षणों की विस्तृत सुरक्षा जांच' : 'Clinical Safety Question Bank'}
              </h3>
            </div>
            <div className="mono-meta">03 / 05</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {adaptiveQuestions.map((q, idx) => (
              <div key={q.id} style={{ border: '1px solid var(--border-hairline)', padding: '1.5rem', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div className="section-label">QUESTION 0{idx + 1} · {q.category}</div>
                </div>

                <h4 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  {isTamil ? (q.question_ta || q.question_en) : isHindi ? q.question_hi : q.question_en}
                </h4>
                <p className="mono-meta" style={{ marginBottom: '1.25rem' }}>
                  {isTamil ? q.question_en : isHindi ? q.question_en : (q.question_ta || q.question_hi)}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
                  {q.options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                      style={{
                        padding: '1rem',
                        border: '1px solid',
                        borderColor: answers[q.id] === opt.id ? '#0a0a0a' : '#e5e5e5',
                        backgroundColor: answers[q.id] === opt.id ? '#0a0a0a' : '#fff',
                        color: answers[q.id] === opt.id ? '#fff' : '#0a0a0a',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit'
                      }}
                    >
                      <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{opt.label_en}</div>
                      <div style={{ fontSize: '0.85rem', color: answers[q.id] === opt.id ? '#a3a3a3' : '#666', marginTop: '0.2rem' }}>
                        {isTamil ? (opt.label_ta || opt.label_hi) : opt.label_hi}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-swiss btn-swiss-outline" onClick={() => setStep(2)}>
              ← BACK
            </button>
            <button className="btn-swiss btn-swiss-large" onClick={() => setStep(4)}>
              <span>{isTamil ? 'அடுத்தது: அளவீடுகள்' : isHindi ? 'वाइटल्स (वैकल्पिक)' : 'Proceed to Vitals'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: OPTIONAL VITALS ENTRY (BRUTALIST NUMERIC STEPPERS) */}
      {step === 4 && (
        <div className="editorial-panel">
          <div className="editorial-panel-header">
            <div>
              <div className="section-label">PHYSIOLOGICAL PARAMETERS</div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                {isTamil ? 'உடல் நிலை அளவீடுகள் (விருப்பத்திற்குரியது)' : isHindi ? 'रोगी के वाइटल साइन्स दर्ज करें' : 'Record Patient Vitals (Optional)'}
              </h3>
            </div>
            <div className="mono-meta">04 / 05</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {/* SpO2 */}
            <div style={{ border: '1px solid var(--border-strong)', padding: '1.75rem', textAlign: 'center', background: '#fff' }}>
              <div className="section-label" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>SPO₂ SATURATION</div>
              <div style={{ fontSize: '3rem', fontFamily: 'var(--font-mono)', fontWeight: '800', color: vitals.spo2 < 90 ? '#ff3b00' : '#0a0a0a', margin: '0.5rem 0' }}>
                {vitals.spo2}%
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button
                  className="btn-swiss btn-swiss-outline"
                  style={{ width: '48px', height: '48px', fontSize: '1.2rem', padding: 0 }}
                  onClick={() => setVitals(v => ({ ...v, spo2: Math.max(70, v.spo2 - 1) }))}
                >
                  -
                </button>
                <button
                  className="btn-swiss btn-swiss-outline"
                  style={{ width: '48px', height: '48px', fontSize: '1.2rem', padding: 0 }}
                  onClick={() => setVitals(v => ({ ...v, spo2: Math.min(100, v.spo2 + 1) }))}
                >
                  +
                </button>
              </div>
              {vitals.spo2 < 90 && (
                <div className="mono-meta" style={{ color: '#ff3b00', fontWeight: '700', marginTop: '0.75rem' }}>
                  CRITICAL HYPOXIA (&lt; 90%)
                </div>
              )}
            </div>

            {/* Systolic BP */}
            <div style={{ border: '1px solid var(--border-strong)', padding: '1.75rem', textAlign: 'center', background: '#fff' }}>
              <div className="section-label" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>SYSTOLIC BP</div>
              <div style={{ fontSize: '3rem', fontFamily: 'var(--font-mono)', fontWeight: '800', color: (vitals.systolic_bp < 90 || vitals.systolic_bp > 180) ? '#ff3b00' : '#0a0a0a', margin: '0.5rem 0' }}>
                {vitals.systolic_bp} <span style={{ fontSize: '1rem' }}>mmHg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button
                  className="btn-swiss btn-swiss-outline"
                  style={{ width: '48px', height: '48px', fontSize: '1.2rem', padding: 0 }}
                  onClick={() => setVitals(v => ({ ...v, systolic_bp: Math.max(60, v.systolic_bp - 5) }))}
                >
                  -5
                </button>
                <button
                  className="btn-swiss btn-swiss-outline"
                  style={{ width: '48px', height: '48px', fontSize: '1.2rem', padding: 0 }}
                  onClick={() => setVitals(v => ({ ...v, systolic_bp: Math.min(220, v.systolic_bp + 5) }))}
                >
                  +5
                </button>
              </div>
            </div>

            {/* Temperature */}
            <div style={{ border: '1px solid var(--border-strong)', padding: '1.75rem', textAlign: 'center', background: '#fff' }}>
              <div className="section-label" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>TEMPERATURE</div>
              <div style={{ fontSize: '3rem', fontFamily: 'var(--font-mono)', fontWeight: '800', color: vitals.temp_c > 40 ? '#ff3b00' : '#0a0a0a', margin: '0.5rem 0' }}>
                {vitals.temp_c.toFixed(1)}°C
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button
                  className="btn-swiss btn-swiss-outline"
                  style={{ width: '48px', height: '48px', fontSize: '1.2rem', padding: 0 }}
                  onClick={() => setVitals(v => ({ ...v, temp_c: Math.max(35.0, Number((v.temp_c - 0.2).toFixed(1))) }))}
                >
                  -0.2
                </button>
                <button
                  className="btn-swiss btn-swiss-outline"
                  style={{ width: '48px', height: '48px', fontSize: '1.2rem', padding: 0 }}
                  onClick={() => setVitals(v => ({ ...v, temp_c: Math.min(42.0, Number((v.temp_c + 0.2).toFixed(1))) }))}
                >
                  +0.2
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-swiss btn-swiss-outline" onClick={() => setStep(3)}>
              ← BACK
            </button>
            <button className="btn-swiss btn-swiss-large" onClick={handleProceedToConfirm}>
              <span>{isTamil ? 'அடுத்தது: சரிபார்த்தல்' : isHindi ? 'समीक्षा एवं पुष्टि' : 'Proceed to Verification'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & TTS CONFIRMATION */}
      {step === 5 && (
        <div className="editorial-panel">
          <div className="editorial-panel-header">
            <div>
              <div className="section-label">SPECIMEN REVIEW & AUDIO AUDIT</div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                {isTamil ? 'பதிவு செய்யப்பட்ட விவரங்களைச் சரிபார்க்கவும்' : isHindi ? 'दर्ज जानकारी की समीक्षा करें' : 'Verify Ingested Clinical Payload'}
              </h3>
            </div>
            <div className="mono-meta">05 / 05</div>
          </div>

          {/* Clinical Manifest Card */}
          <div className="manifest-box-swiss">
            <div className="manifest-line">
              <div className="manifest-label">01. PATIENT</div>
              <div className="manifest-val">{patientName || 'Walk-in'} · Age {age || 'N/A'} · {gender}</div>
            </div>
            <div className="manifest-line">
              <div className="manifest-label">02. COMPLAINT</div>
              <div className="manifest-val">{chiefComplaint}</div>
            </div>
            <div className="manifest-line">
              <div className="manifest-label">03. DURATION</div>
              <div className="manifest-val">{duration}</div>
            </div>
            <div className="manifest-line">
              <div className="manifest-label">04. VITALS</div>
              <div className="manifest-val">SpO₂ {vitals.spo2}% · BP {vitals.systolic_bp}/{vitals.diastolic_bp} mmHg · Temp {vitals.temp_c}°C</div>
            </div>
            <div className="manifest-line">
              <div className="manifest-label">05. AUDIO AUDIT</div>
              <div className="manifest-val" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  className="btn-swiss btn-swiss-outline"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={() => {
                    const readback = isTamil
                      ? `நோயாளி ${patientName || ''}, முக்கிய அறிகுறி ${chiefComplaint}, கால அளவு ${duration}`
                      : isHindi
                        ? `मरीज ${patientName || ''}, मुख्य शिकायत ${chiefComplaint}, अवधि ${duration}`
                        : `Patient ${patientName || ''}, chief complaint ${chiefComplaint}, duration ${duration}`;
                    speakText(readback, language);
                  }}
                >
                  SPEECH SYNTHESIS READBACK [PLAY] 🔊
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-swiss btn-swiss-outline" onClick={() => setStep(4)}>
              ← EDIT DETAILS
            </button>
            <button
              className="btn-swiss btn-swiss-large btn-swiss-accent"
              onClick={handleSubmitTriage}
              disabled={submitting}
            >
              {submitting ? 'EXECUTING SAFETY RULES & AI...' : 'COMMIT TO TRIAGE QUEUE →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: RESULT SCREEN (MONOLITHIC VERDICT) */}
      {step === 6 && triageResult && (
        <div className="editorial-panel" style={{ borderTop: `6px solid ${
          triageResult.triage_result.priority === 'EMERGENCY' ? 'var(--accent-vermilion)' :
          triageResult.triage_result.priority === 'SAME_DAY' ? 'var(--accent-amber)' : 'var(--accent-emerald)'
        }` }}>
          <div className="editorial-panel-header">
            <div>
              <div className="section-label accent">TRIAGE VERDICT GENERATED</div>
              <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                {triageResult.triage_result.priority === 'EMERGENCY' && '● PRIORITY 01: EMERGENCY'}
                {triageResult.triage_result.priority === 'SAME_DAY' && '○ PRIORITY 02: SAME-DAY CONSULTATION'}
                {triageResult.triage_result.priority === 'ROUTINE' && '— PRIORITY 03: ROUTINE OPD'}
              </h3>
            </div>
            <div className="mono-meta">TOKEN: <strong>{triageResult.id}</strong></div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="mono-meta" style={{ color: '#0a0a0a', fontWeight: '700', marginBottom: '0.35rem' }}>
              DECISION PROTOCOL SOURCE:
            </div>
            <div style={{ fontSize: '1rem', color: '#333' }}>
              {triageResult.triage_result.decision_source === 'RULE_LAYER' ? (
                <span style={{ color: '#ff3b00', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  [DETERMINISTIC RED-FLAG RULE LAYER · 100% CODE · LLM BYPASSED]
                </span>
              ) : (
                <span style={{ color: '#0a0a0a', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  [CONSTRAINED LLM CLASSIFIER · SAFETY GUARDRAILS VALIDATED]
                </span>
              )}
            </div>
          </div>

          {/* 5-Line Structured Summary */}
          <div className="manifest-box-swiss">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '0.08em' }}>
              5-LINE STRUCTURED CLINICAL SUMMARY (DOCTOR LEDGER)
            </div>
            {triageResult.structured_summary?.display_lines.map((l, idx) => (
              <div key={idx} className="manifest-line">
                <div className="manifest-label">{l.label}</div>
                <div className="manifest-val">{l.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-swiss btn-swiss-large" onClick={onNavigateToDoctor}>
              <span>VIEW IN DOCTOR QUEUE</span>
              <span>→</span>
            </button>
            <button className="btn-swiss btn-swiss-outline" onClick={handleReset}>
              NEW INTAKE ↺
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
