/**
 * LIFELINE — DETERMINISTIC RED-FLAG RULE LAYER
 * 
 * "The rule layer decides who is an emergency and can never be overridden by the AI;
 *  the LLM only ever adjudicates between same-day and routine, and only after the rule layer has cleared the patient."
 * 
 * Rules are implemented as pure functions with NO LLM dependence and NO external API calls.
 * Multilingual Support: English, Hindi, and Tamil.
 */

// Helper to normalize and check string content for multilingual keywords
function normalizeText(text) {
  return (text || '').toLowerCase().trim();
}

function hasAnyToken(text, tokens) {
  const normalized = normalizeText(text);
  return tokens.some(token => {
    const t = token.toLowerCase();
    if (t.includes(' ') || t.length < 3) {
      return normalized.includes(t);
    }
    const regex = new RegExp(`\\b${t}\\b`, 'i');
    return regex.test(normalized) || normalized.includes(t);
  });
}

/**
 * Pure deterministic rule evaluation function
 * @param {Object} intake - Structured symptom & patient intake object
 * @returns {{ fired: boolean, rules: string[], rationale: string, matchedDetails: Array<{id: string, name: string, reason: string}> }}
 */
export function evaluateRedFlags(intake = {}) {
  const matchedRules = [];
  
  const chief = normalizeText(intake.chief_complaint);
  const freeText = normalizeText(intake.free_text || intake.notes || '');
  const combinedText = `${chief} ${freeText}`;
  const duration = normalizeText(intake.duration); // 'today', 'few_days', 'weeks_plus', or free text
  const age = Number(intake.age);
  const gender = normalizeText(intake.gender);
  const answers = intake.red_flag_answers || {};
  const vitals = intake.vitals || {};

  // Tokens for token-based fallback matching (English + Hindi + Tamil)
  const chestPainTokens = [
    'chest pain', 'chest tightness', 'heart pain', 'pressure in chest', 'chest heaviness',
    'सीने में दर्द', 'छाती में दर्द', 'दिल में दर्द', 'सीने में भारीपन', 'छाती दर्द',
    'நெஞ்சு வலி', 'மார்பு வலி', 'நெஞ்சு இறுக்கம்', 'இதய வலி', 'இடது கை வலி', 'நெஞ்சு பாரம்', 'மார்பில் வலி'
  ];
  const radiatingArmJawTokens = [
    'radiating', 'left arm', 'jaw', 'neck', 'shoulder', 'arm pain', 'jaw pain',
    'बाएं हाथ', 'बायाँ हाथ', 'जबड़ा', 'गर्दन', 'कंधा', 'हाथ में खिंचाव',
    'தாடை', 'இடது கை', 'கழுத்து', 'தோள்பட்டை', 'கை வலி', 'தாடை வலி', 'கைக்கு பரவும்'
  ];
  const severeBreathTokens = [
    'cannot speak', 'gasping', 'severe breathlessness', 'cant breathe', "can't breathe",
    'struggling to breathe', 'choking', 'suffocation',
    'सांस फूलना', 'साँस नहीं आ रही', 'दम घुटना', 'बोल नहीं पा रहे', 'साँस उखड़ना',
    'மூச்சு விட முடியவில்லை', 'பேச முடியவில்லை', 'மூச்சு திணறல்', 'கடுமையான மூச்சு திணறல்', 'மூச்சு அடைப்பு'
  ];
  const breathTokens = [
    'shortness of breath', 'breathless', 'breathing difficulty', 'dyspnea', 'breathlessness',
    'सांस लेने में दिक्कत', 'सांस', 'साँस',
    'மூச்சு', 'மூச்சு கஷ்டம்', 'இளைப்பு', 'மூச்சு வாங்குதல்'
  ];
  const consciousnessTokens = [
    'unconscious', 'fainted', 'fainting', 'passed out', 'blackout', 'confusion', 'unresponsive',
    'disoriented', 'loss of consciousness', 'syncope',
    'बेहोश', 'बेहोशी', 'मूर्छा', 'चक्कर खाकर गिरना', 'सुध-बुध खोना', 'अचेत',
    'மயக்கம்', 'சுயநினைவு இழப்பு', 'மயங்கி விழுதல்', 'மயக்க நிலை', 'அதிர்ச்சி', 'நினைவின்றி'
  ];
  const bleedingTokens = [
    'uncontrolled bleeding', 'profuse bleeding', 'blood in vomit', 'vomiting blood', 'blood in stool',
    'black stool', 'hematemesis', 'melena', 'coughing blood', 'hemoptysis',
    'खून बहना', 'उल्टी में खून', 'मल में खून', 'खांसी में खून', 'भारी रक्तस्राव', 'खून',
    'இரத்தப்போக்கு', 'இரத்தம் வாந்தி', 'மலத்தில் இரத்தம்', 'கடுமையான இரத்தப்போக்கு', 'இரத்தம்'
  ];
  const pregnancyTokens = [
    'pregnant', 'pregnancy', 'trimester', 'expecting', 'unborn baby', 'fetal',
    'गर्भवती', 'गर्भ', 'पेट में बच्चा',
    'கர்ப்பம்', 'கர்ப்பிணி', 'கரு', 'வயிற்றில் குழந்தை', 'கர்ப்ப காலம்'
  ];
  const strokeTokens = [
    'facial droop', 'face drooping', 'slurred speech', 'one-sided weakness', 'arm weakness',
    'paralysis', 'unable to speak', 'stroke', 'fast pattern',
    'मुंह टेढ़ा', 'आवाज लड़खड़ाना', 'एक तरफ कमजोरी', 'लकवा', 'फालिज',
    'முகக் கோணல்', 'ஒரு பக்க பலவீனம்', 'குளறிய பேச்சு', 'பக்கவாதம்', 'கை செயலிழப்பு'
  ];
  const childDangerTokens = [
    'not feeding', 'refusing to drink', 'cannot drink', 'lethargic', 'unusually sleepy',
    'seizure', 'convulsion', 'fits', 'twitching', 'fit',
    'दूध नहीं पी रहा', 'सुस्त', 'दौरा', 'झटका आना', 'कंपकंपी',
    'பால் குடிக்கவில்லை', 'மந்த நிலை', 'வலிப்பு', 'குழந்தை மயக்கம்', 'சாப்பிடவில்லை'
  ];
  const selfHarmTokens = [
    'suicide', 'suicidal', 'kill myself', 'end my life', 'self-harm', 'harm myself', 'poison', 'consumed poison',
    'आत्महत्या', 'खुदकुशी', 'जान देना', 'जहर खा लिया',
    'தற்கொலை', 'விஷம்', 'உயிர் விட', 'விஷம் குடித்து', 'சுய தீங்கு'
  ];

  // -------------------------------------------------------------
  // RULE 1: RF-CHEST-01
  // Chest pain AND (duration < 24h OR radiating to arm/jaw OR breathlessness)
  // -------------------------------------------------------------
  const hasChestPain = answers.chest_pain === true || hasAnyToken(combinedText, chestPainTokens);
  const hasRadiation = answers.chest_pain_radiating === true || hasAnyToken(combinedText, radiatingArmJawTokens);
  const hasShortnessOfBreath = answers.shortness_of_breath === true || hasAnyToken(combinedText, breathTokens);
  const isAcuteDuration = duration === 'today' || duration === '<24h' || duration.includes('hour') || duration.includes('today') || duration.includes('आज') || duration.includes('இன்று');

  if (hasChestPain && (isAcuteDuration || hasRadiation || hasShortnessOfBreath)) {
    matchedRules.push({
      id: 'RF-CHEST-01',
      name: 'Cardiac ACS Pattern',
      reason: 'Chest pain with cardiac red-flag features — possible ACS pattern'
    });
  }

  // -------------------------------------------------------------
  // RULE 2: RF-BREATH-01
  // Severe breathlessness / cannot speak full sentence
  // -------------------------------------------------------------
  const isSevereBreath = answers.severe_breathlessness === true ||
    answers.cannot_speak_sentences === true ||
    hasAnyToken(combinedText, severeBreathTokens);

  if (isSevereBreath) {
    matchedRules.push({
      id: 'RF-BREATH-01',
      name: 'Severe Respiratory Distress',
      reason: 'Severe respiratory distress reported'
    });
  }

  // -------------------------------------------------------------
  // RULE 3: RF-CONSC-01
  // Any reported loss of consciousness, fainting, or acute confusion
  // -------------------------------------------------------------
  const hasAlteredConsciousness = answers.loss_of_consciousness === true ||
    answers.fainting === true ||
    answers.confusion === true ||
    hasAnyToken(combinedText, consciousnessTokens);

  if (hasAlteredConsciousness) {
    matchedRules.push({
      id: 'RF-CONSC-01',
      name: 'Altered Consciousness',
      reason: 'Altered consciousness reported'
    });
  }

  // -------------------------------------------------------------
  // RULE 4: RF-BLEED-01
  // Uncontrolled bleeding OR blood in vomit/stool
  // -------------------------------------------------------------
  const hasSevereBleeding = answers.uncontrolled_bleeding === true ||
    answers.blood_in_vomit === true ||
    answers.blood_in_stool === true ||
    hasAnyToken(combinedText, bleedingTokens);

  if (hasSevereBleeding) {
    matchedRules.push({
      id: 'RF-BLEED-01',
      name: 'Hemorrhage / Internal Bleeding',
      reason: 'Uncontrolled or internal bleeding reported'
    });
  }

  // -------------------------------------------------------------
  // RULE 5: RF-PREG-01
  // Pregnant AND (bleeding OR severe abdominal pain OR reduced fetal movement)
  // -------------------------------------------------------------
  const isPregnant = answers.is_pregnant === true ||
    (gender === 'female' && answers.pregnant === true) ||
    hasAnyToken(combinedText, pregnancyTokens);

  const hasPregnancyDanger = answers.pregnancy_bleeding === true ||
    answers.severe_abdominal_pain === true ||
    answers.reduced_fetal_movement === true ||
    (isPregnant && (hasAnyToken(combinedText, ['bleeding', 'severe pain', 'cramp', 'दर्द', 'खून', 'வலி', 'இரத்தம்'])));

  if (isPregnant && hasPregnancyDanger) {
    matchedRules.push({
      id: 'RF-PREG-01',
      name: 'Obstetric Emergency',
      reason: 'Obstetric emergency pattern'
    });
  }

  // -------------------------------------------------------------
  // RULE 6: RF-STROKE-01
  // Sudden facial droop / one-sided weakness / slurred speech
  // -------------------------------------------------------------
  const hasStrokeSigns = answers.facial_droop === true ||
    answers.one_sided_weakness === true ||
    answers.slurred_speech === true ||
    hasAnyToken(combinedText, strokeTokens);

  if (hasStrokeSigns) {
    matchedRules.push({
      id: 'RF-STROKE-01',
      name: 'Possible Stroke (FAST Pattern)',
      reason: 'Possible stroke (FAST pattern)'
    });
  }

  // -------------------------------------------------------------
  // RULE 7: RF-CHILD-01
  // Child under 5 AND (not feeding/drinking OR lethargic OR seizure)
  // -------------------------------------------------------------
  const isPediatric = (age > 0 && age <= 5) || answers.is_child_under_5 === true || hasAnyToken(combinedText, ['baby', 'child', 'बच्चा', 'शिशु', 'குழந்தை', 'பிள்ளை']);
  const hasPediatricDanger = answers.child_not_feeding === true ||
    answers.child_lethargic === true ||
    answers.child_seizure === true ||
    answers.seizure === true ||
    hasAnyToken(combinedText, childDangerTokens);

  if (isPediatric && hasPediatricDanger) {
    matchedRules.push({
      id: 'RF-CHILD-01',
      name: 'Pediatric Danger Sign',
      reason: 'Pediatric danger sign present'
    });
  }

  // -------------------------------------------------------------
  // RULE 8: RF-VITALS-01
  // SpO2 < 90 OR BP systolic < 90 or > 180 OR temp > 40°C
  // -------------------------------------------------------------
  const spo2 = Number(vitals.spo2);
  const sysBP = Number(vitals.systolic_bp || vitals.systolic);
  const tempC = Number(vitals.temp_c || vitals.temperature);

  let vitalsFlagReason = '';
  if (spo2 > 0 && spo2 < 90) {
    vitalsFlagReason = `Critical hypoxia (SpO2 ${spo2}% < 90%)`;
  } else if (sysBP > 0 && (sysBP < 90 || sysBP > 180)) {
    vitalsFlagReason = `Critical blood pressure (Systolic ${sysBP} mmHg)`;
  } else if (tempC > 0 && (tempC > 40.0 || tempC > 104.0)) {
    vitalsFlagReason = `Critical hyperpyrexia (Temp ${tempC}°C)`;
  }

  if (vitalsFlagReason) {
    matchedRules.push({
      id: 'RF-VITALS-01',
      name: 'Critical Vital Sign Out of Range',
      reason: `Critical vital sign out of range: ${vitalsFlagReason}`
    });
  }

  // -------------------------------------------------------------
  // RULE 9: RF-SELFHARM-01
  // Any mention of self-harm or suicidal intent
  // -------------------------------------------------------------
  const hasSelfHarm = answers.self_harm === true || hasAnyToken(combinedText, selfHarmTokens);

  if (hasSelfHarm) {
    matchedRules.push({
      id: 'RF-SELFHARM-01',
      name: 'Immediate Safety / Psychiatric Escalation',
      reason: 'Immediate safety concern — escalate to available clinician regardless of physical symptoms'
    });
  }

  // Build combined rationale
  const fired = matchedRules.length > 0;
  const ruleIds = matchedRules.map(r => r.id);
  const rationale = fired
    ? matchedRules.map(r => r.reason).join('. ')
    : 'No critical red-flag rules matched. Patient cleared for non-emergency classification.';

  return {
    fired,
    rules: ruleIds,
    rationale,
    matchedDetails: matchedRules
  };
}
