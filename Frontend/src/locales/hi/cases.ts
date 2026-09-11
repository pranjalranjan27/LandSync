import type { CasesTranslations } from '../types';

export const cases: CasesTranslations = {
  caseQueueTitle: 'भूमि अधिग्रहण मामला कतार',
  caseQueueSubtitle: 'सभी जिलों में वैधानिक समय-सीमा, राजपत्र प्रकाशन और बहु-विभागीय स्वीकृतियों की निगरानी करें।',
  filterByStage: 'चरण अनुसार फ़िल्टर करें',
  filterByStatus: 'स्थिति अनुसार फ़िल्टर करें',
  searchCasesPlaceholder: 'केस आईडी, परियोजना शीर्षक, ग्राम या अध्येता निकाय द्वारा खोजें...',
  tableHeaders: {
    caseId: 'केस आईडी',
    projectName: 'परियोजना का नाम',
    requiringBody: 'अध्येता एजेंसी',
    district: 'जिला / राज्य',
    totalArea: 'कुल क्षेत्रफल (हे.)',
    stage: 'वैधानिक चरण',
    status: 'स्थिति',
    lastUpdated: 'अंतिम अद्यतन',
    action: 'कार्रवाई'
  },
  stages: {
    preliminary: 'प्रारंभिक प्रस्ताव',
    section11: 'धारा 11 प्रारंभिक अधिसूचना',
    sia: 'सामाजिक प्रभाव मूल्यांकन (एसआईए)',
    section19: 'धारा 19 घोषणा',
    award: 'अधिनिर्णय जांच एवं निर्धारण',
    possession: 'कब्जा एवं सुपुर्दगी'
  },
  statuses: {
    draft: 'प्रारूप',
    underReview: 'समीक्षाधीन',
    inProgress: 'प्रगति पर',
    approved: 'स्वीकृत',
    rejected: 'अस्वीकृत',
    completed: 'पूर्ण'
  },
  detailTabs: {
    overview: 'केस सारांश',
    timeline: 'वैधानिक समयरेखा',
    surveys: 'कैडस्ट्रल सर्वेक्षण',
    compensation: 'मुआवजा एवं अधिनिर्णय',
    objections: 'सार्वजनिक आपत्तियां (धारा 15)',
    documents: 'राजपत्र एवं दस्तावेज'
  }
};
