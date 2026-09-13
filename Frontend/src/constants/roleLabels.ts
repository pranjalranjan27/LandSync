/**
 * Single source of truth for all role display titles across LandSync.
 * Aligned with the statutory RFCTLARR Act 2013 and State Revenue Administration nomenclature.
 */

export const ROLE_DISPLAY_LABELS: Record<string, string> = {
  // Canonical backend snake_case keys
  requiring_body: 'Requiring Body / Project Proponent',
  district_collector: 'District Collector & DM',
  state_approver: 'State Revenue Department (Approver)',
  sia_expert: 'SIA Team Leader / Expert Group',
  rr_administrator: 'Administrator (R&R)',
  patwari_lekhpal: 'Patwari / Lekhpal (Village Revenue Officer)',
  tehsildar: 'Tehsildar (Quasi-Judicial Revenue Authority)',
  policy_viewer: 'Policy Viewer (National / Public Portal)',
  larr_authority: 'Presiding Officer (LARR Authority)',
  independent_sia_expert: 'Independent SIA Expert Group',
  rr_monitoring_committee: 'State R&R Monitoring Committee',

  // Frontend uppercase enum keys
  REQUIRING_BODY: 'Requiring Body / Project Proponent',
  COLLECTOR: 'District Collector & DM',
  DISTRICT_COLLECTOR: 'District Collector & DM',
  STATE_APPROVER: 'State Revenue Department (Approver)',
  SIA_EXPERT: 'SIA Team Leader / Expert Group',
  RR_ADMIN: 'Administrator (R&R)',
  RR_ADMINISTRATOR: 'Administrator (R&R)',
  PATWARI_LEKHPAL: 'Patwari / Lekhpal (Village Revenue Officer)',
  TEHSILDAR: 'Tehsildar (Quasi-Judicial Revenue Authority)',
  POLICY_VIEWER: 'Policy Viewer (National / Public Portal)',
  LARR_AUTHORITY: 'Presiding Officer (LARR Authority)',
  INDEPENDENT_SIA_EXPERT: 'Independent SIA Expert Group',
  RR_MONITORING_COMMITTEE: 'State R&R Monitoring Committee',

  // Backward compatibility alias for legacy field_officer
  field_officer: 'Patwari / Lekhpal (Village Revenue Officer)',
  FIELD_OFFICER: 'Patwari / Lekhpal (Village Revenue Officer)'
};

/**
 * Returns the human-readable statutory role display title.
 * Accepts any case format (uppercase, lowercase, snake_case).
 */
export function getRoleDisplayLabel(role?: string): string {
  if (!role) return 'Public User';
  return (
    ROLE_DISPLAY_LABELS[role] ||
    ROLE_DISPLAY_LABELS[role.toLowerCase()] ||
    ROLE_DISPLAY_LABELS[role.toUpperCase()] ||
    role
  );
}
