import type { TranslationSchema } from '../types';
import { common } from './common';
import { auth } from './auth';
import { landing } from './landing';
import { dashboard } from './dashboard';
import { cases } from './cases';
import { proposals } from './proposals';
import { objections } from './objections';
import { analytics } from './analytics';

export const en: TranslationSchema = {
  common,
  auth,
  landing,
  dashboard,
  cases,
  proposals,
  objections,
  analytics
};
