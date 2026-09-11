import type { CasesTranslations } from '../types';

export const cases: CasesTranslations = {
  caseQueueTitle: 'जमीन संपादन प्रकरण रांग',
  caseQueueSubtitle: 'सर्व जिल्ह्यांमधील कायदेशीर कालमर्यादा, राजपत्र प्रकाशने आणि बहु-विभागीय मंजुऱ्यांचे निरीक्षण करा.',
  filterByStage: 'टप्प्यानुसार फिल्टर करा',
  filterByStatus: 'स्थितीनुसार फिल्टर करा',
  searchCasesPlaceholder: 'केस आयडी, प्रकल्प नाव, गाव किंवा मागणीदार संस्थेद्वारे शोधा...',
  tableHeaders: {
    caseId: 'केस आयडी',
    projectName: 'प्रकल्पाचे नाव',
    requiringBody: 'मागणीदार संस्था',
    district: 'जिल्हा / राज्य',
    totalArea: 'एकूण क्षेत्र (हेक्टर)',
    stage: 'कायदेशीर टप्पा',
    status: 'स्थिती',
    lastUpdated: 'शेवटचे अद्यतन',
    action: 'कृती'
  },
  stages: {
    preliminary: 'प्राथमिक प्रस्ताव',
    section11: 'कलम ११ प्राथमिक अधिसूचना',
    sia: 'सामाजिक प्रभाव मूल्यांकन (SIA)',
    section19: 'कलम १९ घोषणा',
    award: 'निवाडा चौकशी व निश्चिती',
    possession: 'कब्जा व हस्तांतरण'
  },
  statuses: {
    draft: 'मसुदा',
    underReview: 'पुनरावलोकनाधीन',
    inProgress: 'प्रगतीपथावर',
    approved: 'मंजूर',
    rejected: 'नाकारले',
    completed: 'पूर्ण'
  },
  detailTabs: {
    overview: 'प्रकरण सारांश',
    timeline: 'कायदेशीर कालमर्यादा',
    surveys: 'भूमापन सर्वेक्षण',
    compensation: 'भरपाई व निवाडा',
    objections: 'सार्वजनिक हरकती (कलम १५)',
    documents: 'राजपत्र आणि दस्तऐवज'
  }
};
