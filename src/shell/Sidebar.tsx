import React from 'react';
import type { Role } from '../types/user';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  BarChart2,
  Bell,
  Files,
  UserCircle,
  X
} from 'lucide-react';
import { IndianFlagIcon } from '../features/auth/IndianFlagIcon';
import './Sidebar.css';

interface SidebarProps {
  currentRole: Role;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className={`app-sidebar-nav ${isOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand-header-wrap">
        <NavLink to="/dashboard" className="sidebar-brand-header" onClick={handleNavClick}>
          <img
            src="/assets/Ashoka emblem.png"
            alt="State Emblem of India"
            className="sidebar-emblem-img"
          />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">LandSync</span>
            <span className="sidebar-brand-subtitle">
              National Land Acquisition &amp;<br />
              Management System
            </span>
          </div>
        </NavLink>

        {onClose && (
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-menu">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/cases"
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <FolderKanban size={18} />
          <span>District Cases</span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          <BarChart2 size={18} />
          <span>Reports</span>
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
          onClick={(e) => {
            if (window.location.pathname === '/notifications') e.preventDefault();
            handleNavClick();
          }}
        >
          <Bell size={18} />
          <span>Notifications</span>
          <span className="sidebar-badge-pill">3</span>
        </NavLink>

        <NavLink
          to="/documents"
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
          onClick={(e) => {
            if (window.location.pathname === '/documents') e.preventDefault();
            handleNavClick();
          }}
        >
          <Files size={18} />
          <span>Documents</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
          onClick={(e) => {
            if (window.location.pathname === '/profile') e.preventDefault();
            handleNavClick();
          }}
        >
          <UserCircle size={18} />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Footer Tagline */}
      <div className="sidebar-footer">
        <IndianFlagIcon width={24} height={16} />
        <div className="sidebar-footer-text">
          <span>Digital India.</span>
          <span>Transparent India.</span>
          <span>Developed India.</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
