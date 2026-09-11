import { useState, useEffect, useCallback } from 'react';
import type { User, Role } from '../types/user';
import { mockUsers, roleConfigs } from '../mock-data/users';

const SESSION_KEY = 'landsync_session_user';
const SESSION_ROLE_KEY = 'landsync_role';

/**
 * Retrieve the current authenticated user from session storage.
 * Falls back to default mock official (Collector).
 */
export function getSessionUser(): User {
  try {
    const rawRole = sessionStorage.getItem(SESSION_ROLE_KEY) || sessionStorage.getItem('role') || sessionStorage.getItem('user_role');
    const rawUser = sessionStorage.getItem(SESSION_KEY) || sessionStorage.getItem('currentUser') || sessionStorage.getItem('nalams_user');

    if (rawUser) {
      const parsed = JSON.parse(rawUser) as User;
      if (parsed && parsed.role) {
        return parsed;
      }
    }

    if (rawRole) {
      const normalized = rawRole.toUpperCase() as Role;
      const found = mockUsers.find((u) => u.role === normalized);
      if (found) return found;
    }
  } catch (err) {
    console.warn('Failed to read user session from storage', err);
  }

  // Default fallback user is District Collector
  return mockUsers[0];
}

/**
 * Save user to session storage and broadcast update
 */
export function setSessionUser(user: User): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    sessionStorage.setItem(SESSION_ROLE_KEY, user.role);
    window.dispatchEvent(new CustomEvent('landsync_session_change', { detail: user }));
  } catch (err) {
    console.warn('Failed to write user session to storage', err);
  }
}

export interface UseAuthReturn {
  user: User;
  role: Role;
  isAuthenticated: boolean;
  login: (roleOrUser: Role | User) => void;
  logout: () => void;
  setRole: (role: Role) => void;
}

/**
 * useAuth hook: reads the current user and role from session and syncs reactively.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User>(() => getSessionUser());

  useEffect(() => {
    const handleSessionChange = (e: Event) => {
      const customEvent = e as CustomEvent<User>;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      } else {
        setUser(getSessionUser());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY || e.key === SESSION_ROLE_KEY || e.key === 'role') {
        setUser(getSessionUser());
      }
    };

    window.addEventListener('landsync_session_change', handleSessionChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('landsync_session_change', handleSessionChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const login = useCallback((roleOrUser: Role | User) => {
    let targetUser: User;
    if (typeof roleOrUser === 'string') {
      const roleUpper = roleOrUser.toUpperCase() as Role;
      targetUser = mockUsers.find((u) => u.role === roleUpper) || mockUsers[0];
    } else {
      targetUser = roleOrUser;
    }
    setSessionUser(targetUser);
    setUser(targetUser);
  }, []);

  const setRole = useCallback((newRole: Role) => {
    const roleUpper = newRole.toUpperCase() as Role;
    const targetUser = mockUsers.find((u) => u.role === roleUpper) || {
      ...mockUsers[0],
      role: roleUpper,
      designation: roleConfigs[roleUpper]?.displayName || roleUpper
    };
    setSessionUser(targetUser);
    setUser(targetUser);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_ROLE_KEY);
    setUser(mockUsers[0]);
    window.dispatchEvent(new CustomEvent('landsync_session_change', { detail: mockUsers[0] }));
  }, []);

  return {
    user,
    role: user.role,
    isAuthenticated: !!user,
    login,
    logout,
    setRole
  };
}
