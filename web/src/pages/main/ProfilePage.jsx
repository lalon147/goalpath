import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, Chip } from '../../components/primitives';
import Layout from '../../components/Layout';

const MENU_ITEMS = [
  { icon: '◆', label: 'Account Settings', desc: 'Email, password, preferences' },
  { icon: '◉', label: 'Notifications', desc: 'Reminders and alerts' },
  { icon: '▸', label: 'Data Export', desc: 'Download your progress data' },
  { icon: '◈', label: 'Privacy', desc: 'Control your data' },
];

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { dashboard } = useSelector((s) => s.analytics);

  const [confirmSignout, setConfirmSignout] = useState(false);

  const handleSignout = () => {
    dispatch(logout());
    navigate('/signin');
  };

  const summary = dashboard?.summary;
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '?'
    : '?';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <Layout>
      <div className="gp-page-sm">
        <div style={{ marginBottom: 24 }}>
          <Mono size={8} accent style={{ display: 'block', marginBottom: 6, letterSpacing: 2 }}>◆ PATH / PROFILE</Mono>
          <Sans size={20} weight={700}>Profile</Sans>
        </div>

        {/* Avatar card */}
        <div style={{
          border: `1px solid ${GP.line}`,
          borderRadius: 4,
          padding: '20px 20px',
          background: GP.bg2,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(77,227,255,0.12)',
            border: `2px solid ${GP.cyan}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Sans size={22} weight={700} color={GP.cyan}>{initials}</Sans>
          </div>
          <div>
            <Sans size={18} weight={700} style={{ display: 'block', marginBottom: 4 }}>
              {user ? `${user.firstName} ${user.lastName}` : '—'}
            </Sans>
            <Mono size={8} dim style={{ display: 'block', marginBottom: 6 }}>{user?.email || '—'}</Mono>
            <Chip color={GP.cyan}>MEMBER SINCE {memberSince.toUpperCase()}</Chip>
          </div>
        </div>

        {/* Stats row */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { l: 'GOALS', v: String(summary.activeGoals || 0), c: GP.cyan },
              { l: 'HABITS', v: String(summary.activeHabits || 0), c: GP.lime },
              { l: 'COMPLETED', v: String(summary.completedGoals || 0), c: GP.amber },
            ].map((s) => (
              <div key={s.l} style={{
                border: `1px solid ${GP.line}`,
                borderRadius: 4,
                padding: '10px 14px',
                background: GP.bg2,
                textAlign: 'center',
              }}>
                <Mono size={7} dim style={{ display: 'block', marginBottom: 4 }}>{s.l}</Mono>
                <Sans size={22} weight={700} color={s.c}>{s.v}</Sans>
              </div>
            ))}
          </div>
        )}

        {/* Menu items */}
        <div style={{
          border: `1px solid ${GP.line}`,
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {MENU_ITEMS.map((item, i) => (
            <div
              key={item.label}
              style={{
                padding: '14px 16px',
                borderBottom: i < MENU_ITEMS.length - 1 ? `1px solid ${GP.line}` : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                background: GP.bg2,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(77,227,255,0.04)'}
              onMouseLeave={(e) => e.currentTarget.style.background = GP.bg2}
            >
              <Mono size={12} style={{ color: GP.inkMute, minWidth: 16 }}>{item.icon}</Mono>
              <div style={{ flex: 1 }}>
                <Sans size={13} weight={500}>{item.label}</Sans>
                <Mono size={7} dim style={{ display: 'block', marginTop: 2 }}>{item.desc}</Mono>
              </div>
              <Mono size={10} dim>▸</Mono>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <div style={{
          border: `1px solid ${GP.line}`,
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 24,
          background: GP.bg2,
        }}>
          {confirmSignout ? (
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Mono size={9} style={{ color: GP.magenta, flex: 1 }}>Confirm sign out?</Mono>
              <button
                onClick={handleSignout}
                style={{
                  background: 'rgba(255,62,165,0.1)',
                  border: `1px solid ${GP.magenta}`,
                  borderRadius: 3,
                  padding: '5px 14px',
                  fontFamily: GP.mono,
                  fontSize: 8,
                  color: GP.magenta,
                  letterSpacing: 1,
                  cursor: 'pointer',
                }}
              >
                CONFIRM
              </button>
              <button
                onClick={() => setConfirmSignout(false)}
                style={{
                  background: 'none',
                  border: `1px solid ${GP.line}`,
                  borderRadius: 3,
                  padding: '5px 14px',
                  fontFamily: GP.mono,
                  fontSize: 8,
                  color: GP.inkMute,
                  letterSpacing: 1,
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmSignout(true)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <Mono size={12} style={{ color: GP.magenta, minWidth: 16 }}>◉</Mono>
              <Sans size={13} weight={500} color={GP.magenta}>Sign Out</Sans>
            </button>
          )}
        </div>

        <Mono size={7} dim style={{ display: 'block', textAlign: 'center' }}>
          GOALPATH · BUILD 1.0 · {new Date().getFullYear()}
        </Mono>
      </div>
    </Layout>
  );
}
