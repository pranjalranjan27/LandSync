import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import type { User, Role } from '../../types/user';
import { roleConfigs, mockUsers } from '../../mock-data/users';

export interface LoginCredentials {
  identifier: string; // email address
  password: string;
  rememberMe?: boolean;
}

export interface RegisterDetails {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  department?: string;
  role: Role;
  district?: string;
  state?: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

const PROFILE_STORAGE_PREFIX = 'landsync_profile_';
const SESSION_KEY = 'landsync_session_user';
const SESSION_ROLE_KEY = 'landsync_role';

/**
 * Retrieve current user from session storage
 */
export function getSessionUser(): User | null {
  try {
    const rawUser = sessionStorage.getItem(SESSION_KEY);
    if (rawUser) {
      const parsed = JSON.parse(rawUser) as User;
      if (parsed && parsed.id && parsed.role) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read user session from storage', err);
  }
  return null;
}

/**
 * Retrieve saved profile metadata for a given Firebase UID and optional email
 */
export function getStoredUserProfile(uid: string, email?: string): Partial<User> | null {
  try {
    const raw = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.role) return parsed;
    }
    if (email) {
      const emailRaw = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}email_${email.toLowerCase().trim()}`);
      if (emailRaw) {
        const parsed = JSON.parse(emailRaw);
        if (parsed && parsed.role) return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read user profile for UID/email:', uid, email, e);
  }
  return null;
}

/**
 * Store profile metadata for a given Firebase UID and email
 */
export function saveStoredUserProfile(uid: string, profile: Partial<User>): void {
  try {
    const existing = getStoredUserProfile(uid, profile.email) || {};
    const merged = { ...existing, ...profile };
    localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${uid}`, JSON.stringify(merged));
    if (merged.email) {
      localStorage.setItem(`${PROFILE_STORAGE_PREFIX}email_${merged.email.toLowerCase().trim()}`, JSON.stringify(merged));
    }
  } catch (e) {
    console.warn('Failed to save user profile for UID:', uid, e);
  }
}

/**
 * Construct application User model from Firebase User and stored profile.
 * Root cause fix: Previously, buildUserFromFirebase defaulted any missing role to 'COLLECTOR'.
 * When Firebase's asynchronous onAuthStateChanged listener triggered after some time (token refresh,
 * tab focus, or mount), it blindly resolved the user as COLLECTOR and overwritten the session.
 * Here we extract cloud metadata from photoURL, check email caches, match mockUsers, and preserve active session.
 */
export function buildUserFromFirebase(fbUser: FirebaseUser, currentSession?: User | null): User {
  // 1. Extract cloud metadata embedded in Firebase photoURL if available
  let cloudMeta: Partial<User> = {};
  if (fbUser.photoURL) {
    try {
      if (fbUser.photoURL.startsWith('landsync://meta?data=')) {
        const rawData = decodeURIComponent(fbUser.photoURL.replace('landsync://meta?data=', ''));
        cloudMeta = JSON.parse(rawData);
      } else if (fbUser.photoURL.startsWith('{')) {
        cloudMeta = JSON.parse(fbUser.photoURL);
      }
    } catch (err) {
      console.warn('Failed to parse cloud user metadata from photoURL', err);
    }
  }

  // 2. Lookup stored profile from localStorage (by UID or Email)
  const stored = getStoredUserProfile(fbUser.uid, fbUser.email || undefined) || {};

  // 3. Match against mock/seed users if email matches
  const mockMatch = mockUsers.find(
    (u) => (u.email || '').toLowerCase() === (fbUser.email || '').toLowerCase()
  );

  // 4. Infer role from email address naming conventions
  let inferredRole: Role | undefined;
  const emailLower = (fbUser.email || '').toLowerCase();
  if (emailLower.includes('requiring_body') || emailLower.includes('requiringbody')) {
    inferredRole = 'REQUIRING_BODY';
  } else if (emailLower.includes('state_approver') || emailLower.includes('stateapprover')) {
    inferredRole = 'STATE_APPROVER';
  } else if (emailLower.includes('sia_expert') || emailLower.includes('siaexpert')) {
    inferredRole = 'SIA_EXPERT';
  } else if (emailLower.includes('rr_admin') || emailLower.includes('rradmin')) {
    inferredRole = 'RR_ADMIN';
  } else if (emailLower.includes('patwari') || emailLower.includes('lekhpal') || emailLower.includes('field_officer')) {
    inferredRole = 'PATWARI_LEKHPAL';
  } else if (emailLower.includes('tehsildar')) {
    inferredRole = 'TEHSILDAR';
  } else if (emailLower.includes('policy_viewer') || emailLower.includes('policyviewer')) {
    inferredRole = 'POLICY_VIEWER';
  } else if (emailLower.includes('collector') || emailLower.includes('dm')) {
    inferredRole = 'COLLECTOR';
  }

  // Determine statutory role with priority to explicit configurations
  const role: Role = (
    cloudMeta.role ||
    stored.role ||
    mockMatch?.role ||
    inferredRole ||
    (currentSession && currentSession.role !== 'COLLECTOR' ? currentSession.role : undefined) ||
    'COLLECTOR'
  ) as Role;

  const roleMeta = roleConfigs[role];

  const user: User = {
    id: fbUser.uid,
    name: fbUser.displayName || stored.name || mockMatch?.name || fbUser.email?.split('@')[0] || 'Authorized Official',
    email: fbUser.email || stored.email || mockMatch?.email || '',
    role,
    designation: cloudMeta.designation || stored.designation || mockMatch?.designation || roleMeta?.displayName || 'Government Official',
    department: cloudMeta.department || stored.department || mockMatch?.department || 'Department of Revenue & Land Acquisition',
    district: cloudMeta.district || stored.district || mockMatch?.district || 'Gautam Buddha Nagar',
    district_id: cloudMeta.district_id || stored.district_id || mockMatch?.district_id || 'gautam_buddha_nagar',
    state: cloudMeta.state || stored.state || mockMatch?.state || 'Uttar Pradesh',
    phone: stored.phone || fbUser.phoneNumber || mockMatch?.phone || undefined,
    avatarUrl: fbUser.photoURL && !fbUser.photoURL.startsWith('landsync://') ? fbUser.photoURL : undefined,
    isOfficial: true,
    jurisdiction_level: stored.jurisdiction_level || mockMatch?.jurisdiction_level || (role === 'PATWARI_LEKHPAL' ? 'village' : role === 'TEHSILDAR' ? 'tehsil' : undefined),
    jurisdiction_value: stored.jurisdiction_value || mockMatch?.jurisdiction_value || (role === 'PATWARI_LEKHPAL' ? 'Chhapraula,Bisrakh Jalalpur' : role === 'TEHSILDAR' ? 'Dadri' : undefined)
  };

  // Persist resolved profile so subsequent onAuthStateChanged calls never lose the role
  saveStoredUserProfile(fbUser.uid, user);

  return user;
}

/**
 * Translate Firebase Auth error codes into friendly human-readable messages
 */
export function mapFirebaseError(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return 'Authentication failed. Please check your credentials and try again.';
  }

  const code = (err as { code?: string }).code || '';

  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email address. Please register first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a password with at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Access temporarily locked due to multiple failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network communication failed. Please check your internet connection and retry.';
    case 'auth/user-disabled':
      return 'This departmental account has been disabled. Please contact your administrator.';
    case 'auth/operation-not-allowed':
      return 'Email/Password authentication is currently not enabled in Firebase Console.';
    default:
      return (err as { message?: string }).message || 'An error occurred during authentication. Please try again.';
  }
}

/**
 * Authenticate existing user with Firebase Authentication
 */
export async function loginUser(credentials: LoginCredentials): Promise<LoginResult> {
  const email = credentials.identifier.trim();
  const password = credentials.password;

  if (!email || !password) {
    return {
      success: false,
      error: 'Please enter both email and password.'
    };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    // Cache Firebase Bearer token for statutory backend API calls
    try {
      const idToken = await fbUser.getIdToken();
      sessionStorage.setItem('landsync_token', idToken);
    } catch (e) {
      console.warn('Could not cache idToken during loginUser', e);
    }

    const appUser = buildUserFromFirebase(fbUser, getSessionUser());

    // Save active session
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(appUser));
    sessionStorage.setItem(SESSION_ROLE_KEY, appUser.role);
    saveStoredUserProfile(fbUser.uid, appUser);
    window.dispatchEvent(new CustomEvent('landsync_session_change', { detail: appUser }));

    return {
      success: true,
      user: appUser
    };
  } catch (err) {
    return {
      success: false,
      error: mapFirebaseError(err)
    };
  }
}

/**
 * Register new user with Firebase Authentication and attach custom role metadata
 */
export async function registerUser(details: RegisterDetails): Promise<LoginResult> {
  const email = details.email.trim();
  const password = details.password;

  if (!email || !password) {
    return {
      success: false,
      error: 'Please provide both email and password.'
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters long.'
    };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    const roleMeta = roleConfigs[details.role];
    const profileData: Partial<User> = {
      id: fbUser.uid,
      name: details.fullName.trim(),
      email,
      role: details.role,
      designation: roleMeta?.displayName || details.role,
      department: details.department?.trim() || 'Department of Revenue & Land Acquisition',
      district: details.district?.trim() || 'Gautam Buddha Nagar',
      district_id: (details.district?.trim() || 'Gautam Buddha Nagar').toLowerCase().replace(/\s+/g, '_'),
      state: details.state?.trim() || 'Uttar Pradesh',
      phone: details.phone?.trim(),
      isOfficial: true
    };

    // Store statutory role metadata in Firebase cloud photoURL so role persists across devices/browsers
    const metaPayload = JSON.stringify({
      role: details.role,
      designation: profileData.designation,
      department: profileData.department,
      district: profileData.district,
      district_id: profileData.district_id,
      state: profileData.state
    });

    try {
      await updateProfile(fbUser, {
        displayName: details.fullName.trim(),
        photoURL: `landsync://meta?data=${encodeURIComponent(metaPayload)}`
      });
    } catch (e) {
      console.warn('Failed to attach cloud role metadata to Firebase profile', e);
    }

    // Cache Firebase Bearer token for backend API calls
    try {
      const idToken = await fbUser.getIdToken();
      sessionStorage.setItem('landsync_token', idToken);
    } catch (e) {
      console.warn('Could not cache idToken during registerUser', e);
    }

    saveStoredUserProfile(fbUser.uid, profileData);

    const appUser = buildUserFromFirebase(fbUser, profileData as User);

    // Save active session
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(appUser));
    sessionStorage.setItem(SESSION_ROLE_KEY, appUser.role);
    window.dispatchEvent(new CustomEvent('landsync_session_change', { detail: appUser }));

    return {
      success: true,
      user: appUser
    };
  } catch (err) {
    return {
      success: false,
      error: mapFirebaseError(err)
    };
  }
}

/**
 * Send Password Reset email via Firebase Auth
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email.trim()) {
    return { success: false, error: 'Please enter your registered email address.' };
  }

  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: mapFirebaseError(err)
    };
  }
}

/**
 * Sign out from Firebase Auth and clear session state
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Firebase signOut error:', e);
  } finally {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_ROLE_KEY);
    sessionStorage.removeItem('landsync_token');
    window.dispatchEvent(new CustomEvent('landsync_session_change', { detail: null }));
  }
}
