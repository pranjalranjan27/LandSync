import type { CasesTranslations } from '../types';

export const cases: CasesTranslations = {
  caseQueueTitle: 'ভূমি অধিগ্রহণ মামলার সারি',
  caseQueueSubtitle: 'সমস্ত জেলা জুড়ে সংবিধিবদ্ধ সময়সীমা, গেজেট প্রকাশনা এবং বহু-বিভাগীয় ছাড়পত্র নিরীক্ষণ করুন।',
  filterByStage: 'পর্যায় অনুযায়ী ফিল্টার',
  filterByStatus: 'অবস্থা অনুযায়ী ফিল্টার',
  searchCasesPlaceholder: 'কেস আইডি, প্রকল্পের নাম, গ্রাম বা প্রত্যাশী সংস্থা দিয়ে অনুসন্ধান করুন...',
  tableHeaders: {
    caseId: 'কেস আইডি',
    projectName: 'প্রকল্পের নাম',
    requiringBody: 'প্রত্যাশী সংস্থা',
    district: 'জেলা / রাজ্য',
    totalArea: 'মোট আয়তন (হেক্টর)',
    stage: 'সংবিধিবদ্ধ পর্যায়',
    status: 'অবস্থা',
    lastUpdated: 'সর্বশেষ আপডেট',
    action: 'পদক্ষেপ'
  },
  stages: {
    preliminary: 'প্রাথমিক প্রস্তাব',
    section11: 'ধারা ১১ প্রাথমিক বিজ্ঞপ্তি',
    sia: 'সামাজিক প্রভাব মূল্যায়ন (SIA)',
    section19: 'ধারা ১৯ ঘোষণা',
    award: 'রোয়াদাদ তদন্ত ও নির্ধারণ',
    possession: 'দখল ও হস্তান্তর'
  },
  statuses: {
    draft: 'খসড়া',
    underReview: 'পর্যালোচনাধীন',
    inProgress: 'চলমান',
    approved: 'অনুমোদিত',
    rejected: 'প্রত্যাখ্যাত',
    completed: 'সম্পূর্ণ'
  },
  detailTabs: {
    overview: 'মামলার সারসংক্ষেপ',
    timeline: 'সংবিধিবদ্ধ সময়রেখা',
    surveys: 'ক্যাডাস্ট্রাল সমীক্ষা',
    compensation: 'ক্ষতিপূরণ ও রোয়াদাদ',
    objections: 'জনসাধারণের আপত্তি (ধারা ১৫)',
    documents: 'গেজেট ও নথিপত্র'
  }
};
