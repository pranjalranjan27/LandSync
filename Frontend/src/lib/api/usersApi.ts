import type { User, Role } from '../../types/user';
import { mockUsers } from '../../mock-data/users';

export async function getCurrentUser(): Promise<User> {
  // Default to District Collector for official workflows
  return mockUsers[0];
}

export async function switchUserRole(role: Role): Promise<User> {
  const user = mockUsers.find((u) => u.role === role) || mockUsers[0];
  return user;
}
