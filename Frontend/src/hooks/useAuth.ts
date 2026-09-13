import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { User, Role } from '../types/user';
import {
  buildUserFromFirebase,
  logoutUser,
  saveStoredUserProfile,
  getStoredUserProfile
} from '../features/auth/authApi';
import { roleConfigs, mockUsers } from '../mock-data/users';

const SESSION_KEY = 'landsync_session_user';
const SESSION_ROLE_KEY = 'landsync_role';

/**
 * Retrieve the current authenticated user from session storage.
 * Returns null if no active session exists.
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
 * Save user to session storage and broadcast update
 */
export function setSessionUser(user: User | null): void {
  try {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      sessionStorage.setItem(SESSION_ROLE_KEY, user.role);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_ROLE_KEY);
    }
    window.dispatchEvent(new CustomEvent('landsync_session_change', { detail: user }));
  } catch (err) {
    console.warn('Failed to write user session to storage', err);
  }
}

export interface UseAuthReturn {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (roleOrUser: Role | User) => void;
  logout: () => Promise<void>;
  setRole: (role: Role) => void;
}

/**
 * useAuth hook: connects with Firebase Auth state and syncs reactively.
 * Root cause fix: onAuthStateChanged triggers asynchronously after some time (token refresh,
 * network reconnect, tab focus). Previously it blindly passed fbUser to buildUserFromFirebase
 * without preserving existing session or caching landsync_token, causing role downgrades to COLLECTOR.
 * Now it preserves active sessions, caches Firebase ID tokens for backend requests, and keeps roles intact.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(() => getSessionUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          sessionStorage.setItem('landsync_token', idToken);
        } catch (e) {
          console.warn('Could not refresh Firebase ID token', e);
        }

        const currentSession = getSessionUser();
        const appUser = buildUserFromFirebase(fbUser, currentSession);
        setSessionUser(appUser);
        setUser(appUser);
        saveStoredUserProfile(fbUser.uid, appUser);
      } else {
        // If Firebase is logged out, clear session unless manual session exists
        const sessionUser = getSessionUser();
        if (!sessionUser) {
          setSessionUser(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    // Listen to local session changes
    const handleSessionChange = (e: Event) => {
      const customEvent = e as CustomEvent<User | null>;
      setUser(customEvent.detail !== undefined ? customEvent.detail : getSessionUser());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY || e.key === SESSION_ROLE_KEY) {
        setUser(getSessionUser());
      }
    };

    window.addEventListener('landsync_session_change', handleSessionChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('landsync_session_change', handleSessionChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const login = useCallback((roleOrUser: Role | User) => {
    let updated: User;
    if (typeof roleOrUser === 'string') {
      const roleUpper = roleOrUser.toUpperCase() as Role;
      const currentUser = user || getSessionUser() || mockUsers.find(u => u.role === roleUpper);
      if (currentUser) {
        updated = {
          ...currentUser,
          role: roleUpper,
          designation: roleConfigs[roleUpper]?.displayName || roleUpper
        };
      } else {
        const meta = roleConfigs[roleUpper];
        updated = {
          id: auth.currentUser?.uid || `user-${Date.now()}`,
          name: auth.currentUser?.displayName || 'Authorized Official',
          email: auth.currentUser?.email || `${roleUpper.toLowerCase()}@landsync.gov.in`,
          role: roleUpper,
          designation: meta?.displayName || roleUpper,
          department: 'Department of Revenue & Land Acquisition',
          district: 'Gautam Buddha Nagar',
          state: 'Uttar Pradesh',
          isOfficial: true
        };
      }
    } else {
      updated = roleOrUser;
    }
    setSessionUser(updated);
    setUser(updated);
    if (auth.currentUser) {
      saveStoredUserProfile(auth.currentUser.uid, updated);
    }
  }, [user]);

  const setRole = useCallback((newRole: Role) => {
    const roleUpper = newRole.toUpperCase() as Role;
    const currentUser = user || getSessionUser();
    if (currentUser) {
      const updated: User = {
        ...currentUser,
        role: roleUpper,
        designation: roleConfigs[roleUpper]?.displayName || roleUpper
      };
      if (auth.currentUser) {
        saveStoredUserProfile(auth.currentUser.uid, updated);
      }
      setSessionUser(updated);
      setUser(updated);
    }
  }, [user]);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  return {
    user,
    role: user ? user.role : null,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setRole
  };
}
