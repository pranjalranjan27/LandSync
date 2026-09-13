import type {
  LandVerificationRecord,
  LandVerificationCreate
} from '../../types/verification';

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('landsync_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchVerificationForCase(caseId: number | string): Promise<LandVerificationRecord | null> {
  const cleanId = String(caseId).replace(/^[^\d]*/, '');
  if (!cleanId) return null;

  try {
    const res = await fetch(`/cases/${cleanId}/land-verification`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 404) {
      return null;
    }
  } catch (err) {
    console.warn('[LandVerificationApi] fetchVerificationForCase failed:', err);
  }
  return null;
}

export async function submitLandVerification(
  caseId: number | string,
  payload: LandVerificationCreate
): Promise<LandVerificationRecord> {
  const cleanId = String(caseId).replace(/^[^\d]*/, '');
  const res = await fetch(`/cases/${cleanId}/land-verification`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to submit Section 4 Land Verification');
  }

  return await res.json();
}

export async function certifyLandVerification(
  recordId: string,
  notes?: string
): Promise<LandVerificationRecord> {
  const res = await fetch(`/land-verification/${recordId}/certify`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: notes ? JSON.stringify({ notes }) : undefined
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to certify Land Verification');
  }

  return await res.json();
}

export async function returnLandVerification(
  recordId: string,
  notes: string
): Promise<LandVerificationRecord> {
  const res = await fetch(`/land-verification/${recordId}/return`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to return Land Verification for correction');
  }

  return await res.json();
}

export async function fetchTehsildarQueue(): Promise<LandVerificationRecord[]> {
  try {
    const res = await fetch('/land-verification/tehsildar-queue', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[LandVerificationApi] fetchTehsildarQueue failed:', err);
  }
  return [];
}
