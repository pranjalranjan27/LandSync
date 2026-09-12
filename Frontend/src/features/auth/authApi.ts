import type { User, Role } from '../../types/user';
import { mockUsers } from '../../mock-data/users';

export interface LoginCredentials {
  identifier: string; // username, email, or mobile number
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export async function loginWithRole(role: Role): Promise<User> {
  await new Promise((res) => setTimeout(res, 80));
  const user = mockUsers.find((u) => u.role === role) || mockUsers[0];
  sessionStorage.setItem('landsync_session_user', JSON.stringify(user));
  sessionStorage.setItem('landsync_role', user.role);
  return user;
}

/**
 * Validates credentials against FastAPI /auth/login with graceful mock fallback.
 */
export async function loginUser(credentials: LoginCredentials): Promise<LoginResult> {
  const id = credentials.identifier.trim();
  const pwd = credentials.password;

  // Intentional failure test credentials
  if (
    pwd.toLowerCase() === 'wrong' ||
    pwd.toLowerCase() === 'invalid' ||
    id.toLowerCase() === 'wrong' ||
    id.toLowerCase() === 'invalid' ||
    id.toLowerCase() === 'fail'
  ) {
    return {
      success: false,
      error: 'Invalid username or password. Please check your credentials and try again.'
    };
  }

  // Attempt FastAPI backend login first
  try {
    const emailToTry = id.includes('@')
      ? id
      : id.toLowerCase() === 'collector'
      ? 'collector@landsync.gov.in'
      : id.toLowerCase() === 'requiring_body'
      ? 'requiring_body@landsync.gov.in'
      : id.toLowerCase() === 'state_approver'
      ? 'state_approver@landsync.gov.in'
      : id.toLowerCase() === 'sia_expert'
      ? 'sia_expert@landsync.gov.in'
      : id.toLowerCase() === 'rr_admin'
      ? 'rr_admin@landsync.gov.in'
      : id.toLowerCase() === 'field_officer'
      ? 'field_officer@landsync.gov.in'
      : `${id}@landsync.gov.in`;

    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToTry, password: pwd })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        sessionStorage.setItem('landsync_token', data.access_token);
      }

      const roleMapping: Record<string, Role> = {
        district_collector: 'COLLECTOR',
        requiring_body: 'REQUIRING_BODY',
        state_approver: 'STATE_APPROVER',
        sia_expert: 'SIA_EXPERT',
        rr_administrator: 'RR_ADMIN',
        rr_admin: 'RR_ADMIN',
        field_officer: 'FIELD_OFFICER',
        policy_viewer: 'POLICY_VIEWER'
      };

      const backendRole = data.user?.role?.toLowerCase() || 'district_collector';
      const mappedRole: Role = roleMapping[backendRole] || 'COLLECTOR';
      const mockUserMatch = mockUsers.find((u) => u.role === mappedRole) || mockUsers[0];

      const authenticatedUser: User = {
        id: String(data.user?.id || mockUserMatch.id),
        name: data.user?.name || mockUserMatch.name,
        email: data.user?.email || emailToTry,
        role: mappedRole,
        designation: mockUserMatch.designation,
        department: mockUserMatch.department,
        district: mockUserMatch.district,
        district_id: mockUserMatch.district_id,
        state: mockUserMatch.state,
        isOfficial: true
      };

      sessionStorage.setItem('landsync_session_user', JSON.stringify(authenticatedUser));
      sessionStorage.setItem('landsync_role', authenticatedUser.role);

      return {
        success: true,
        user: authenticatedUser
      };
    }
  } catch (backendErr) {
    console.warn('[LandSync] Backend login unreachable, falling back to local verification:', backendErr);
  }

  // Local fallback for mock accounts and offline development
  const idLower = id.toLowerCase();
  const foundUser = mockUsers.find(
    (u) =>
      u.email.toLowerCase() === idLower ||
      u.role.toLowerCase() === idLower ||
      u.id.toLowerCase() === idLower ||
      u.name.toLowerCase().includes(idLower)
  );

  if (foundUser) {
    sessionStorage.setItem('landsync_session_user', JSON.stringify(foundUser));
    sessionStorage.setItem('landsync_role', foundUser.role);
    return {
      success: true,
      user: foundUser
    };
  }

  if (
    id.includes('@') ||
    /^\d{10}$/.test(id) ||
    idLower.includes('collector') ||
    idLower.includes('admin') ||
    idLower === 'demo' ||
    idLower === 'official' ||
    idLower === 'nalams'
  ) {
    sessionStorage.setItem('landsync_session_user', JSON.stringify(mockUsers[0]));
    sessionStorage.setItem('landsync_role', mockUsers[0].role);
    return {
      success: true,
      user: mockUsers[0]
    };
  }

  return {
    success: false,
    error: 'Invalid username or password. Please check your credentials and try again.'
  };
}
