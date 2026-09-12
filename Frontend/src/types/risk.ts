/**
 * Statutory Risk Analysis Types
 * Aligned with FastAPI backend schema (app/schemas/risk.py)
 */

export interface RiskComponentBreakdown {
  affected_families_score: number;
  dispute_score: number;
  cost_density_score: number;
  location_sensitivity_score: number;
  affected_families_count: number;
  dispute_count: number;
  prohibited_count: number;
  total_area_sqm: number;
  land_value_estimate: number;
  project_budget: number;
  location_sensitivity: string;
}

export interface RiskAssessmentResponse {
  case_id: number;
  risk_score: number;
  risk_band: 'low' | 'medium' | 'high';
  components: RiskComponentBreakdown;
  computed_at: string;
}
