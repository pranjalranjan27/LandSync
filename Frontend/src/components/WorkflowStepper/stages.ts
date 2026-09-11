import type { CaseStage } from '../../types/case';

export interface WorkflowStageDefinition {
  stage: CaseStage;
  stepNumber: number;
  labelEn: string;
  labelHi: string;
  actCitation: string;
  description: string;
}

export const WORKFLOW_STAGES: WorkflowStageDefinition[] = [
  {
    stage: 'STAGE_1_PROPOSAL_PENDING',
    stepNumber: 1,
    labelEn: 'Proposal Submission',
    labelHi: 'प्रस्ताव प्रस्तुति',
    actCitation: 'Section 4',
    description: 'Requiring body submits Land Acquisition Form-1 with Khasra schedule and project justification.'
  },
  {
    stage: 'STAGE_2_COLLECTOR_SCRUTINY',
    stepNumber: 2,
    labelEn: 'Collector Scrutiny',
    labelHi: 'कलेक्टर संवीक्षा',
    actCitation: 'Section 4(2)',
    description: 'Revenue department verifies cadastral maps, Mauza survey records, and preliminary feasibility.'
  },
  {
    stage: 'STAGE_3_SIA_EVALUATION',
    stepNumber: 3,
    labelEn: 'Social Impact (SIA)',
    labelHi: 'सामाजिक प्रभाव आकलन',
    actCitation: 'Section 7-9',
    description: 'Independent expert committee evaluates displacement impact, public hearings, and mitigation.'
  },
  {
    stage: 'STAGE_4_SEC11_NOTIFICATION',
    stepNumber: 4,
    labelEn: 'Preliminary Notification',
    labelHi: 'प्रारंभिक अधिसूचना',
    actCitation: 'Section 11(1)',
    description: 'Statutory gazette notification published in official state gazette and two local newspapers.'
  },
  {
    stage: 'STAGE_5_OBJECTIONS_HEARING',
    stepNumber: 5,
    labelEn: 'Hearing Objections',
    labelHi: 'आपत्तियों की सुनवाई',
    actCitation: 'Section 15',
    description: '60-day statutory window for affected landowners to file objections before the Collector.'
  },
  {
    stage: 'STAGE_6_SEC19_DECLARATION',
    stepNumber: 6,
    labelEn: 'Final Declaration',
    labelHi: 'अंतिम घोषणा',
    actCitation: 'Section 19(1)',
    description: 'State government issues declaration of acquisition along with summary of R&R scheme.'
  },
  {
    stage: 'STAGE_7_RR_AWARD_DISBURSEMENT',
    stepNumber: 7,
    labelEn: 'Award & Solatium',
    labelHi: 'अधिनिर्णय एवं मुआवजा',
    actCitation: 'Section 23-31',
    description: 'Market value determined with 100% solatium and direct DBT bank disbursement.'
  },
  {
    stage: 'STAGE_8_POSSESSION_COMPLETED',
    stepNumber: 8,
    labelEn: 'Vesting & Possession',
    labelHi: 'कब्जा एवं हस्तांतरण',
    actCitation: 'Section 38',
    description: 'Land vests absolutely in the Government free from all encumbrances.'
  }
];
