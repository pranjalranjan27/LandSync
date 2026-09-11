import type { Case } from '../../types/case';
import { mockCases } from '../../mock-data/cases';

export async function fetchAllCases(): Promise<Case[]> {
  await new Promise((res) => setTimeout(res, 80));
  return [...mockCases];
}

export async function fetchCaseById(id: string): Promise<Case | null> {
  await new Promise((res) => setTimeout(res, 50));
  const found = mockCases.find((c) => c.id === id || c.caseNumber.toLowerCase() === id.toLowerCase());
  return found || null;
}

export async function updateCaseStage(caseId: string, newStage: Case['stage'], newStageNumber: number): Promise<Case | null> {
  await new Promise((res) => setTimeout(res, 100));
  const target = mockCases.find((c) => c.id === caseId);
  if (target) {
    target.stage = newStage;
    target.stageNumber = newStageNumber;
    target.lastUpdated = new Date().toISOString().split('T')[0];
    return { ...target };
  }
  return null;
}

export { caseService } from '../../services/caseService';
