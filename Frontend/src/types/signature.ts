/**
 * Tamper-Evident Digital Signature Types
 * Aligned with Section 3 Information Technology Act, 2000 and FastAPI backend schemas
 */

export type SignatureActionType = 'notification_published' | 'award_declared' | 'rejected';

export interface SignatureResponse {
  id: string;
  case_id: number | string;
  document_id?: number | string | null;
  signer_user_id: number | string;
  signer_name?: string | null;
  signer_role: string;
  signer_jurisdiction: string;
  action_type: SignatureActionType | string;
  payload_hash: string;
  signed_at: string;
}

export interface SignatureRequest {
  document_id?: number | string | null;
  action_type: SignatureActionType;
}
