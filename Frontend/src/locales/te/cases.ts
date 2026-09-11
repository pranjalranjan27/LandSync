import type { CasesTranslations } from '../types';

export const cases: CasesTranslations = {
  caseQueueTitle: 'భూసేకరణ కేసుల వరుసక్రమం',
  caseQueueSubtitle: 'అన్ని జిల్లాల్లో చట్టబద్ధమైన గడువులు, గెజిట్ ప్రచురణలు మరియు బహుళ శాఖల అనుమతులను పర్యవేక్షించండి.',
  filterByStage: 'దశల వారీగా ఫిల్టర్ చేయండి',
  filterByStatus: 'స్థితి వారీగా ఫిల్టర్ చేయండి',
  searchCasesPlaceholder: 'కేసు ఐడీ, ప్రాజెక్ట్ పేరు, గ్రామం లేదా అభ్యర్థన సంస్థ ద్వారా వెతకండి...',
  tableHeaders: {
    caseId: 'కేసు ఐడీ',
    projectName: 'ప్రాజెక్ట్ పేరు',
    requiringBody: 'అభ్యర్థన సంస్థ',
    district: 'జిల్లా / రాష్ట్రం',
    totalArea: 'మొత్తం వైశాల్యం (హెక్టార్లు)',
    stage: 'చట్టబద్ధమైన దశ',
    status: 'స్థితి',
    lastUpdated: 'చివరిగా నవీకరించబడింది',
    action: 'చర్య'
  },
  stages: {
    preliminary: 'ప్రాథమిక ప్రతిపాదన',
    section11: 'సెక్షన్ 11 ప్రాథమిక నోటిఫికేషన్',
    sia: 'సామాజిక ప్రభావ అంచనా (SIA)',
    section19: 'సెక్షన్ 19 ప్రకటన',
    award: 'అవార్డు విచారణ మరియు నిర్ణయం',
    possession: 'స్వాధీనం మరియు అప్పగింత'
  },
  statuses: {
    draft: 'చిత్తుప్రతి',
    underReview: 'సమీక్షలో ఉంది',
    inProgress: 'పురోగతిలో ఉంది',
    approved: 'ఆమోదించబడింది',
    rejected: 'తిరస్కరించబడింది',
    completed: 'పూర్తయింది'
  },
  detailTabs: {
    overview: 'కేసు సారాంశం',
    timeline: 'చట్టబద్ధమైన కాలక్రమం',
    surveys: 'కాడాస్ట్రల్ సర్వేలు',
    compensation: 'పరిహారం & అవార్డు',
    objections: 'ప్రజా అభ్యంతరాలు (సెక్షన్ 15)',
    documents: 'గెజిట్ & పత్రాలు'
  }
};
