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
import { roleConfigs } from '../../mock-data/users';

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
 * Retrieve saved profile metadata for a given Firebase UID
 */
export function getStoredUserProfile(uid: string): Partial<User> | null {
  try {
    const raw = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${uid}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to read user profile for UID:', uid, e);
  }
  return null;
}

/**
 * Store profile metadata for a given Firebase UID
 */
export function saveStoredUserProfile(uid: string, profile: Partial<User>): void {
  try {
    const existing = getStoredUserProfile(uid) || {};
    const merged = { ...existing, ...profile };
    localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${uid}`, JSON.stringify(merged));
  } catch (e) {
    console.warn('Failed to save user profile for UID:', uid, e);
  }
}

/**
 * Construct application User model from Firebase User and stored profile
 */
export function buildUserFromFirebase(fbUser: FirebaseUser): User {
  const stored = getStoredUserProfile(fbUser.uid) || {};
  const role: Role = (stored.role as Role) || 'COLLECTOR';
  const roleMeta = roleConfigs[role];

  const user: User = {
    id: fbUser.uid,
    name: fbUser.displayName || stored.name || fbUser.email?.split('@')[0] || 'Authorized Official',
    email: fbUser.email || stored.email || '',
    role,
    designation: stored.designation || roleMeta?.displayName || 'Government Official',
    department: stored.department || 'Department of Revenue & Land Acquisition',
    district: stored.district || 'Gautam Buddha Nagar',
    district_id: stored.district_id || 'gautam_buddha_nagar',
    state: stored.state || 'Uttar Pradesh',
    phone: stored.phone || fbUser.phoneNumber || undefined,
    avatarUrl: fbUser.photoURL || undefined,
    isOfficial: role !== 'CITIZEN'
  };

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
    const appUser = buildUserFromFirebase(fbUser);

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

    // Update Firebase display name
    await updateProfile(fbUser, {
      displayName: details.fullName.trim()
    });

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
      isOfficial: details.role !== 'CITIZEN'
    };

    saveStoredUserProfile(fbUser.uid, profileData);

    const appUser = buildUserFromFirebase(fbUser);

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
