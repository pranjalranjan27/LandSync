import type { ProposalsTranslations } from '../types';

export const proposals: ProposalsTranslations = {
  createProposalTitle: 'नया भूमि अधिग्रहण प्रस्ताव प्रस्तुत करें',
  createProposalSubtitle: 'RFCTLARR अधिनियम 2013 के दिशा-निर्देशों के अनुरूप औपचारिक अधियाचन पूर्ण करें।',
  steps: {
    projectDetails: '1. परियोजना विवरण',
    landSchedule: '2. भूमि अनुसूची',
    affectedFamilies: '3. प्रभावित परिवार एवं एसआईए',
    documents: '4. वैधानिक दस्तावेज',
    review: '5. समीक्षा एवं प्रस्तुतीकरण'
  },
  projectDetails: {
    projectName: 'बुनियादी ढांचा परियोजना शीर्षक',
    projectNamePlaceholder: 'उदा. राष्ट्रीय राजमार्ग-58 बाईपास 4-लेन विस्तार गलियारा',
    projectCategory: 'लोक प्रयोजन की श्रेणी',
    department: 'नोडल विभाग / मंत्रालय',
    district: 'लक्षित जिला एवं तहसील',
    estimatedBudget: 'अनुमानित मुआवजा परिव्यय (₹ करोड़)',
    purpose: 'विस्तृत औचित्य एवं लोक प्रयोजन'
  },
  landSchedule: {
    village: 'राजस्व ग्राम',
    surveyNumbers: 'कैडस्ट्रल सर्वे / खसरा संख्या',
    totalAreaHectares: 'कुल अधियाचित क्षेत्रफल (हेक्टेयर)',
    landClassification: 'भूमि वर्गीकरण (कृषि, बंजर, सिंचित, वाणिज्यिक)'
  },
  submitForReview: 'जिला कलेक्टर को प्रस्ताव प्रस्तुत करें',
  saveAsDraft: 'प्रगति को प्रारूप के रूप में सहेजें',
  proposalSuccessMessage: 'प्रस्ताव सफलतापूर्वक दर्ज किया गया। अधिग्रहण फ़ाइल ट्रैकिंग टोकन उत्पन्न।'
};
