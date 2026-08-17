/**
 * LIFELINE — ADAPTIVE QUESTION ENGINE (English, Hindi, Tamil)
 * 
 * Generates structured, clinically relevant follow-up questions tailored to the patient's
 * chief complaint, constrained strictly to safety-relevant categories and tap options.
 */

export const CLINICAL_QUESTION_BANK = {
  pain_characteristics: {
    id: 'pain_characteristics',
    category: 'pain',
    question_en: 'How severe is the pain and does it spread anywhere?',
    question_hi: 'दर्द कितना तेज है और क्या यह कहीं और फैल रहा है?',
    question_ta: 'வலி எவ்வளவு தீவிரமாக உள்ளது மற்றும் அது வேறு எங்காவது பரவுகிறதா?',
    icon: 'flame',
    options: [
      { id: 'mild_localized', label_en: 'Mild / Stayed in one place', label_hi: 'हल्का / एक ही जगह है', label_ta: 'லேசானது / ஒரே இடத்தில் உள்ளது' },
      { id: 'moderate', label_en: 'Moderate / Bearable', label_hi: 'मध्यम / बर्दाश्त करने योग्य', label_ta: 'மிதமானது / தாங்கக்கூடியது' },
      { id: 'severe_radiating', label_en: 'Severe / Spreading to arm, jaw or back', label_hi: 'बहुत तेज / हाथ, जबड़े या पीठ में खिंचाव', label_ta: 'மிகவும் கடுமையானது / கை, தாடை அல்லது முதுகுக்கு பரவுகிறது' },
      { id: 'no_pain', label_en: 'No significant pain', label_hi: 'खास दर्द नहीं है', label_ta: 'குறிப்பிடத்தக்க வலி இல்லை' }
    ]
  },
  breathing: {
    id: 'breathing',
    category: 'respiratory',
    question_en: 'Are you having any trouble breathing or speaking full sentences?',
    question_hi: 'क्या आपको सांस लेने में या पूरा वाक्य बोलने में दिक्कत हो रही है?',
    question_ta: 'உங்களுக்கு மூச்சு விடுவதில் அல்லது முழு வாக்கியம் பேசுவதில் சிரமம் உள்ளதா?',
    icon: 'wind',
    options: [
      { id: 'normal_breathing', label_en: 'Breathing normally', label_hi: 'सांस सामान्य है', label_ta: 'இயல்பான சுவாசம்' },
      { id: 'mild_cough_breath', label_en: 'Mild cough / stuffy nose only', label_hi: 'हल्की खांसी / बंद नाक', label_ta: 'லேசான இருமல் / மூக்கடைப்பு மட்டும்' },
      { id: 'moderate_shortness', label_en: 'Shortness of breath on walking', label_hi: 'चलने पर सांस फूलना', label_ta: 'நடக்கும்போது மூச்சு திணறல்' },
      { id: 'cannot_speak', label_en: 'Severe / Gasping / Cannot speak full sentence', label_hi: 'गंभीर / बात नहीं कर पा रहे', label_ta: 'கடுமையானது / பேச முடியவில்லை / மூச்சுத்திணறல்' }
    ]
  },
  consciousness_dizziness: {
    id: 'consciousness_dizziness',
    category: 'neurological',
    question_en: 'Have you had any fainting, dizziness, confusion, or weakness on one side?',
    question_hi: 'क्या आपको बेहोशी, चक्कर, भ्रम या शरीर के एक तरफ कमजोरी महसूस हुई?',
    question_ta: 'உங்களுக்கு மயக்கம், தலைசுற்றல், குழப்பம் அல்லது ஒரு பக்க பலவீனம் ஏற்பட்டதா?',
    icon: 'activity',
    options: [
      { id: 'alert_normal', label_en: 'Fully alert, no dizziness', label_hi: 'पूरी तरह सतर्क, कोई चक्कर नहीं', label_ta: 'முழு விழிப்புணர்வு, தலைசுற்றல் இல்லை' },
      { id: 'mild_dizzy_standing', label_en: 'Mild dizziness when standing up', label_hi: 'खड़े होने पर हल्का चक्कर', label_ta: 'எழுந்து நிற்கும்போது லேசான தலைசுற்றல்' },
      { id: 'fainted_passed_out', label_en: 'Fainted / Passed out / Blackout', label_hi: 'बेहोश हो गए / गिर पड़े', label_ta: 'மயங்கி விழுந்தார் / சுயநினைவு இழந்தார்' },
      { id: 'one_sided_weakness', label_en: 'Face droop / Arm weakness / Slurred speech', label_hi: 'मुंह टेढ़ा / हाथ में कमजोरी / आवाज लड़खड़ाहट', label_ta: 'முகக் கோணல் / கை பலவீனம் / குளறிய பேச்சு' }
    ]
  },
  bleeding_discharge: {
    id: 'bleeding_discharge',
    category: 'bleeding',
    question_en: 'Is there any uncontrolled bleeding, blood in vomit, or blood in stool?',
    question_hi: 'क्या कहीं से खून बह रहा है, या उल्टी या मल में खून आया है?',
    question_ta: 'கட்டுப்படுத்த முடியாத இரத்தப்போக்கு, வாந்தியில் அல்லது மலத்தில் இரத்தம் உள்ளதா?',
    icon: 'droplet',
    options: [
      { id: 'no_bleeding', label_en: 'No bleeding', label_hi: 'कोई खून नहीं', label_ta: 'இரத்தப்போக்கு இல்லை' },
      { id: 'minor_scratch', label_en: 'Minor cut / stopped bleeding', label_hi: 'मामूली खरोंच / खून रुक गया', label_ta: 'சிறிய வெட்டு / இரத்தம் நின்றுவிட்டது' },
      { id: 'blood_vomit_stool', label_en: 'Blood in vomit or dark/black stool', label_hi: 'उल्टी या मल में खून', label_ta: 'வாந்தியில் அல்லது மலத்தில் இரத்தம்' },
      { id: 'active_profuse', label_en: 'Heavy / continuous bleeding', label_hi: 'लगातार या भारी रक्तस्राव', label_ta: 'அதிகப்படியான / தொடர் இரத்தப்போக்கு' }
    ]
  },
  pregnancy_check: {
    id: 'pregnancy_check',
    category: 'obstetric',
    question_en: 'Are you pregnant, and do you have any severe belly pain or bleeding?',
    question_hi: 'क्या आप गर्भवती हैं, और क्या पेट में तेज दर्द या रक्तस्राव है?',
    question_ta: 'நீங்கள் கர்ப்பமாக உள்ளீர்களா? கடுமையான வயிற்று வலி அல்லது இரத்தப்போக்கு உள்ளதா?',
    icon: 'heart',
    options: [
      { id: 'not_pregnant', label_en: 'Not pregnant / Not applicable', label_hi: 'गर्भवती नहीं हैं', label_ta: 'கர்ப்பமாக இல்லை' },
      { id: 'pregnant_routine', label_en: 'Pregnant — routine check / mild symptoms', label_hi: 'गर्भवती हैं — सामान्य जांच / हल्का लक्षण', label_ta: 'கர்ப்பம் — வழக்கமான பரிசோதனை / லேசான அறிகுறிகள்' },
      { id: 'pregnant_severe_pain', label_en: 'Pregnant — severe abdominal pain or bleeding', label_hi: 'गर्भवती — पेट में तेज दर्द या रक्तस्राव', label_ta: 'கர்ப்பம் — கடுமையான வயிற்று வலி அல்லது இரத்தப்போக்கு' },
      { id: 'pregnant_reduced_movement', label_en: 'Pregnant — baby moving less than usual', label_hi: 'गर्भवती — बच्चे की हलचल कम', label_ta: 'கர்ப்பம் — குழந்தையின் அசைவு குறைவு' }
    ]
  },
  child_activity: {
    id: 'child_activity',
    category: 'pediatric',
    question_en: 'Is the child feeding/drinking normally and active, or lethargic/having fits?',
    question_hi: 'क्या बच्चा सामान्य रूप से खा-पी रहा है या बहुत सुस्त है/झटके आए हैं?',
    question_ta: 'குழந்தை சாதாரணமாக சாப்பிடுகிறதா? அல்லது மந்தமாக/வலிப்பு ஏற்பட்டுள்ளதா?',
    icon: 'smile',
    options: [
      { id: 'feeding_playful', label_en: 'Drinking milk/water, active & playful', label_hi: 'दूध/पानी पी रहा है, सक्रिय है', label_ta: 'பால்/தண்ணீர் குடிக்கிறது, சுறுசுறுப்பாக உள்ளது' },
      { id: 'eating_less_irritable', label_en: 'Eating slightly less, irritable', label_hi: 'कम खा रहा है, चिड़चिड़ा है', label_ta: 'குறைவாக சாப்பிடுகிறது, எரிச்சல் அடைகிறது' },
      { id: 'refusing_all_feeds', label_en: 'Refusing all food/drinks, unusually sleepy', label_hi: 'कुछ नहीं पी रहा, बहुत सुस्त/सोया हुआ', label_ta: 'உணவு மறுக்கிறது, அதிக தூக்கம் / மந்த நிலை' },
      { id: 'seizures_fits', label_en: 'Had fits, twitching or convulsions', label_hi: 'दौरे या झटके आए', label_ta: 'வலிப்பு அல்லது உடலசைவு நடுக்கம் ஏற்பட்டது' }
    ]
  }
};

/**
 * Returns 2-3 tailored adaptive questions based on initial chief complaint, age, and gender
 */
export function getAdaptiveQuestions(intake) {
  const text = ((intake.chief_complaint || '') + ' ' + (intake.notes || '')).toLowerCase();
  const age = Number(intake.age);
  const gender = (intake.gender || '').toLowerCase();
  const questions = [];

  // Child-specific question
  if (age > 0 && age <= 5) {
    questions.push(CLINICAL_QUESTION_BANK.child_activity);
  }

  // Female reproductive age question
  if (gender === 'female' && (isNaN(age) || (age >= 12 && age <= 55))) {
    if (text.includes('abdomen') || text.includes('belly') || text.includes('stomach') ||
        text.includes('pregnant') || text.includes('period') || text.includes('पेट') ||
        text.includes('गर्भ') || text.includes('दर्द') || text.includes('வயிறு') ||
        text.includes('கர்ப்ப') || text.includes('மாதவிடாய்')) {
      questions.push(CLINICAL_QUESTION_BANK.pregnancy_check);
    }
  }

  // Chest / Cardiovascular / Pain check
  if (text.includes('chest') || text.includes('heart') || text.includes('pain') ||
      text.includes('ache') || text.includes('छाती') || text.includes('सीना') ||
      text.includes('दर्द') || text.includes('सिर') || text.includes('पेट') ||
      text.includes('நெஞ்சு') || text.includes('மார்பு') || text.includes('வலி')) {
    questions.push(CLINICAL_QUESTION_BANK.pain_characteristics);
  }

  // Respiratory check
  if (text.includes('cough') || text.includes('breath') || text.includes('cold') ||
      text.includes('fever') || text.includes('खांसी') || text.includes('सांस') ||
      text.includes('बुखार') || text.includes('जुकाम') || text.includes('இருமல்') ||
      text.includes('மூச்சு') || text.includes('காய்ச்சல்') || text.includes('சளி')) {
    questions.push(CLINICAL_QUESTION_BANK.breathing);
  }

  // Neurological / Dizziness check
  if (text.includes('dizzy') || text.includes('headache') || text.includes('faint') ||
      text.includes('fall') || text.includes('weak') || text.includes('चक्कर') ||
      text.includes('बेहोश') || text.includes('कमजोरी') || text.includes('மயக்கம்') ||
      text.includes('தலைவலி') || text.includes('பலவீனம்')) {
    questions.push(CLINICAL_QUESTION_BANK.consciousness_dizziness);
  }

  // Bleeding check
  if (text.includes('blood') || text.includes('bleed') || text.includes('vomit') ||
      text.includes('stool') || text.includes('cut') || text.includes('wound') ||
      text.includes('खून') || text.includes('उल्टी') || text.includes('घाव') ||
      text.includes('இரத்தம்') || text.includes('வாந்தி') || text.includes('காயம்')) {
    questions.push(CLINICAL_QUESTION_BANK.bleeding_discharge);
  }

  // Default fallbacks if fewer than 2 questions selected
  const allDefaults = [
    CLINICAL_QUESTION_BANK.pain_characteristics,
    CLINICAL_QUESTION_BANK.breathing,
    CLINICAL_QUESTION_BANK.consciousness_dizziness
  ];

  for (const q of allDefaults) {
    if (questions.length >= 3) break;
    if (!questions.some(existing => existing.id === q.id)) {
      questions.push(q);
    }
  }

  return questions;
}
