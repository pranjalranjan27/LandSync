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
  await new Promise((res) => setTimeout(res, 100));
  const user = mockUsers.find((u) => u.role === role) || mockUsers[0];
  return user;
}

/**
 * Simulates POST /auth/login
 * Validates credentials and returns the authenticated user or error.
 */
export async function loginUser(credentials: LoginCredentials): Promise<LoginResult> {
  // Simulate network delay for loading state
  await new Promise((resolve) => setTimeout(resolve, 850));

  const id = credentials.identifier.trim().toLowerCase();
  const pwd = credentials.password;

  // Intentional failure test credentials
  if (
    pwd.toLowerCase() === 'wrong' ||
    pwd.toLowerCase() === 'invalid' ||
    id === 'wrong' ||
    id === 'invalid' ||
    id === 'fail'
  ) {
    return {
      success: false,
      error: 'Invalid username or password. Please check your credentials and try again.'
    };
  }

  // Check if identifier matches any mock user
  const foundUser = mockUsers.find(
    (u) =>
      u.email.toLowerCase() === id ||
      u.role.toLowerCase() === id ||
      u.id.toLowerCase() === id ||
      u.name.toLowerCase().includes(id)
  );

  if (foundUser) {
    return {
      success: true,
      user: foundUser
    };
  }

  // Accept typical government official credentials or demo formats
  if (
    id.includes('@') ||
    /^\d{10}$/.test(id) ||
    id.includes('collector') ||
    id.includes('admin') ||
    id === 'demo' ||
    id === 'official' ||
    id === 'nalams'
  ) {
    return {
      success: true,
      user: mockUsers[0] // District Collector by default
    };
  }

  // Default to invalid credentials for arbitrary unrecognizable input
  return {
    success: false,
    error: 'Invalid username or password. Please check your credentials and try again.'
  };
}
