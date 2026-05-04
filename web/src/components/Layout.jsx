import React from 'react';
import Sidebar, { BottomNav } from './Sidebar';
import { GP } from '../theme/GP';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: GP.bg }}>
      {/* Sidebar — desktop */}
      <div className="sidebar-desktop">
        <Sidebar />
      </div>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: 64,
        minHeight: '100vh',
        paddingBottom: 60, // room for mobile bottom nav
      }}
        className="main-content"
      >
        {children}
      </main>

      {/* Bottom nav — mobile */}
      <div className="bottom-nav-mobile">
        <BottomNav />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .main-content { margin-left: 0 !important; padding-bottom: 72px !important; }
          .bottom-nav-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .bottom-nav-mobile { display: none !important; }
        }
        .main-content { overflow-x: hidden; }
      `}</style>
    </div>
  );
}
