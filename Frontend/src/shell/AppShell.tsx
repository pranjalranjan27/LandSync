import React, { useState } from 'react';
import type { User } from '../types/user';
import { SkipLink } from './SkipLink';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import './AppShell.css';

interface AppShellProps {
  currentUser: User;
  children: React.ReactNode;
}

export function AppShell({
  currentUser,
  children
}: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  return (
    <div className="app-shell-root">
      <SkipLink />

      {/* Mobile Drawer Backdrop */}
      {isMobileNavOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        currentRole={currentUser.role}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      <div className="app-shell-main-area">
        <TopBar
          currentUser={currentUser}
          onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        />

        <main id="main-content" className="app-shell-content">
          {children}
        </main>
      </div>
    </div>
  );
}
