import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GP } from '../theme/GP';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, initializing } = useSelector((s) => s.auth);

  if (initializing) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: GP.bg,
      }}>
        <span style={{ fontFamily: GP.mono, fontSize: 11, color: GP.cyan, letterSpacing: 2 }}>
          ◉ INITIALIZING…
        </span>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/signin" replace />;
}
