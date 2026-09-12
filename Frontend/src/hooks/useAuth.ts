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
import { roleConfigs } from '../mock-data/users';

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
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(() => getSessionUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const appUser = buildUserFromFirebase(fbUser);
        setSessionUser(appUser);
        setUser(appUser);
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
    if (typeof roleOrUser === 'string') {
      const roleUpper = roleOrUser.toUpperCase() as Role;
      const currentUser = user || getSessionUser();
      if (currentUser) {
        const updated: User = {
          ...currentUser,
          role: roleUpper,
          designation: roleConfigs[roleUpper]?.displayName || roleUpper
        };
        setSessionUser(updated);
        setUser(updated);
      }
    } else {
      setSessionUser(roleOrUser);
      setUser(roleOrUser);
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
        saveStoredUserProfile(auth.currentUser.uid, { role: roleUpper, designation: updated.designation });
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
