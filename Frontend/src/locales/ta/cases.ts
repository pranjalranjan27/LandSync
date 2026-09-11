import type { CasesTranslations } from '../types';

export const cases: CasesTranslations = {
  caseQueueTitle: 'நிலம் கையகப்படுத்தல் வழக்கு வரிசை',
  caseQueueSubtitle: 'அனைத்து மாவட்டங்களிலும் சட்டரீதியான காலக்கெடு, அரசிதழ் வெளியீடுகள் மற்றும் பல துறை அனுமதிகளைக் கண்காணிக்கவும்.',
  filterByStage: 'படிநிலை வாரியாக வடிகட்டு',
  filterByStatus: 'நிலை வாரியாக வடிகட்டு',
  searchCasesPlaceholder: 'வழக்கு எண், திட்டப் பெயர், கிராமம் அல்லது கோரும் அமைப்பு மூலம் தேடுக...',
  tableHeaders: {
    caseId: 'வழக்கு எண்',
    projectName: 'திட்டத்தின் பெயர்',
    requiringBody: 'கோரும் நிறுவனம்',
    district: 'மாவட்டம் / மாநிலம்',
    totalArea: 'மொத்த பரப்பளவு (ஹெக்)',
    stage: 'சட்டரீதியான படிநிலை',
    status: 'நிலை',
    lastUpdated: 'கடைசி புதுப்பிப்பு',
    action: 'நடவடிக்கை'
  },
  stages: {
    preliminary: 'தொடக்க முன்மொழிவு',
    section11: 'பிரிவு 11 பூர்வாங்க அறிவிப்பு',
    sia: 'சமூக தாக்க மதிப்பீடு (SIA)',
    section19: 'பிரிவு 19 பிரகடனம்',
    award: 'தீர்ப்பு விசாரணை மற்றும் நிர்ணயம்',
    possession: 'சுவாதீனம் மற்றும் ஒப்படைப்பு'
  },
  statuses: {
    draft: 'வரைவு',
    underReview: 'மறுஆய்வில் உள்ளது',
    inProgress: 'செயல்பாட்டில் உள்ளது',
    approved: 'ஒப்புதல் அளிக்கப்பட்டது',
    rejected: 'நிராகரிக்கப்பட்டது',
    completed: 'முடிவடைந்தது'
  },
  detailTabs: {
    overview: 'வழக்கு சுருக்கம்',
    timeline: 'சட்டரீதியான காலவரிசை',
    surveys: 'நில அளவை ஆய்வுகள்',
    compensation: 'இழப்பீடு & தீர்ப்பு',
    objections: 'பொது ஆட்சேபனைகள் (பிரிவு 15)',
    documents: 'அரசிதழ் & ஆவணங்கள்'
  }
};
