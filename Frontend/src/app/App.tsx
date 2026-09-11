import { useRoutes, useLocation } from 'react-router-dom';
import type { Role } from '../types/user';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../shell/AppShell';
import { getAppRoutes } from './routes';
import { LanguageProvider } from '../locales';

function AppContent() {
  const { user, login } = useAuth();
  const location = useLocation();

  const handleLogin = (newRole: Role) => {
    login(newRole);
  };

  const routes = getAppRoutes(user, handleLogin);
  const routeElement = useRoutes(routes);

  // Standalone full-viewport views (Landing & Auth pages)
  const standalonePages = ['/', '/login', '/auth/otp', '/forgot-password', '/register'];
  if (standalonePages.includes(location.pathname)) {
    return <>{routeElement}</>;
  }

  return (
    <AppShell currentUser={user}>
      {routeElement}
    </AppShell>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
