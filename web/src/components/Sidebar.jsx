import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { GP } from '../theme/GP';

const NAV = [
  { to: '/dashboard', label: 'HOME',  icon: '◉' },
  { to: '/goals',     label: 'PATH',  icon: '◈' },
  { to: '/habits',    label: 'LOG',   icon: '◆' },
  { to: '/analytics', label: 'COACH', icon: '◇' },
  { to: '/profile',   label: 'YOU',   icon: '○' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/signin');
  };

  return (
    <nav style={{
      width: 64,
      minHeight: '100vh',
      background: GP.bg2,
      borderRight: `1px solid ${GP.line}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 16,
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 100,
      gap: 0,
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: GP.mono,
        fontSize: 9,
        letterSpacing: 2,
        color: GP.cyan,
        marginBottom: 24,
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        textTransform: 'uppercase',
      }}>
        GOALPATH
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', alignItems: 'center' }}>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 0',
              width: '100%',
              textDecoration: 'none',
              color: isActive ? GP.cyan : GP.inkMute,
              borderRight: isActive ? `2px solid ${GP.cyan}` : '2px solid transparent',
              transition: 'color 0.15s',
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  fontFamily: GP.mono,
                  fontSize: 14,
                  color: isActive ? GP.cyan : GP.inkMute,
                }}>{icon}</span>
                <span style={{
                  fontFamily: GP.mono,
                  fontSize: 7,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: isActive ? GP.cyan : GP.inkMute,
                }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* User initials + logout */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: `1px solid ${GP.lineStrong}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: GP.mono, fontSize: 10, color: GP.inkDim,
        }}>
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: GP.mono, fontSize: 9, color: GP.inkMute,
            letterSpacing: 1, padding: 4,
          }}
        >
          ◂
        </button>
      </div>
    </nav>
  );
}

// Mobile bottom nav
export function BottomNav() {
  const NAV_MOBILE = [
    { to: '/dashboard', label: 'HOME' },
    { to: '/goals',     label: 'PATH' },
    { to: '/habits',    label: 'LOG'  },
    { to: '/analytics', label: 'COACH'},
    { to: '/profile',   label: 'YOU'  },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 56,
      background: GP.bg,
      borderTop: `1px solid ${GP.line}`,
      display: 'flex',
      zIndex: 100,
    }}>
      {NAV_MOBILE.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 4, textDecoration: 'none',
            color: isActive ? GP.cyan : GP.inkMute,
          })}
        >
          {({ isActive }) => (
            <>
              <div style={{
                width: 14, height: 14,
                border: `1px solid ${isActive ? GP.cyan : GP.line}`,
                borderRadius: 2,
                background: isActive ? 'rgba(77,227,255,0.1)' : 'transparent',
              }} />
              <span style={{
                fontFamily: GP.mono, fontSize: 7, letterSpacing: 1,
                textTransform: 'uppercase',
                color: isActive ? GP.cyan : GP.inkMute,
              }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
