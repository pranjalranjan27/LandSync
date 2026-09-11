import type { ProposalsTranslations } from '../types';

export const proposals: ProposalsTranslations = {
  createProposalTitle: 'নতুন ভূমি অধিগ্রহণ প্রস্তাব জমা দিন',
  createProposalSubtitle: 'RFCTLARR আইন ২০১৩-এর নির্দেশিকা অনুসারে আনুষ্ঠানিক চাহিদা পূরণ করুন।',
  steps: {
    projectDetails: '১. প্রকল্পের বিবরণ',
    landSchedule: '২. জমির তফসিল',
    affectedFamilies: '৩. ক্ষতিগ্রস্ত পরিবার ও এসআইএ',
    documents: '৪. সংবিধিবদ্ধ নথিপত্র',
    review: '৫. পর্যালোচনা ও জমাদান'
  },
  projectDetails: {
    projectName: 'অবকাঠামো প্রকল্পের নাম',
    projectNamePlaceholder: 'যেমন: জাতীয় সড়ক-৫৮ বাইপাস ৪-লেন সম্প্রসারণ',
    projectCategory: 'জনস্বার্থের উদ্দেশ্য বিভাগ',
    department: 'নোডাল বিভাগ / মন্ত্রণালয়',
    district: 'উদ্দিষ্ট জেলা ও মহকুমা',
    estimatedBudget: 'আনুমানিক ক্ষতিপূরণ ব্যয় (₹ কোটি)',
    purpose: 'বিস্তারিত যৌক্তিকতা ও জনস্বার্থের উদ্দেশ্য'
  },
  landSchedule: {
    village: 'মৌজা / রাজস্ব গ্রাম',
    surveyNumbers: 'ক্যাডাস্ট্রাল সার্ভে / দাগ / খতিয়ান নম্বর',
    totalAreaHectares: 'মোট প্রস্তাবিত এলাকা (হেক্টর)',
    landClassification: 'জমির শ্রেণীবিভাগ (কৃষি, পতিত, সেচযুক্ত, বাণিজ্যিক)'
  },
  submitForReview: 'জেলা শাসকের কাছে প্রস্তাব পেশ করুন',
  saveAsDraft: 'খসড়া হিসেবে সংরক্ষণ করুন',
  proposalSuccessMessage: 'প্রস্তাব সফলভাবে নথিভুক্ত হয়েছে। ফাইল ট্র্যাকিং টোকেন তৈরি হয়েছে।'
};
