import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { downloadExport } from '../../services/exportData';
import { GP } from '../../theme/GP';
import { Mono, Sans, Chip } from '../../components/primitives';
import Layout from '../../components/Layout';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { dashboard } = useSelector((s) => s.analytics);

  const [confirmSignout, setConfirmSignout] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState(null);

  const handleSignout = () => {
    dispatch(logout());
    navigate('/signin');
  };

  const handleExport = async () => {
    setExporting(true);
    setExportNote(null);
    try {
      const counts = await downloadExport(user);
      setExportNote({
        ok: true,
        text: `Downloaded ${counts.goals} goal${counts.goals === 1 ? '' : 's'} and ${counts.habits} habit${counts.habits === 1 ? '' : 's'}.`,
      });
    } catch {
      setExportNote({ ok: false, text: 'Could not gather your data. Check your connection and try again.' });
    } finally {
      setExporting(false);
    }
  };

  const menuItems = [
    { icon: '◈', label: 'Friends', desc: 'Find people by username', onClick: () => navigate('/friends') },
    { icon: '◆', label: 'Edit Profile', desc: 'Name, bio, timezone', onClick: () => navigate('/profile/edit') },
    { icon: '◉', label: 'Notifications', desc: 'Reminders and alerts', onClick: () => navigate('/profile/notifications') },
    { icon: '◈', label: 'Change Password', desc: 'Update your sign-in password', onClick: () => navigate('/profile/password') },
    {
      icon: '▸',
      label: 'Data Export',
      desc: exporting ? 'Gathering your data…' : 'Download your goals and habits as JSON',
      onClick: handleExport,
      disabled: exporting,
    },
  ];

  const summary = dashboard?.summary;
  const initials = user
    ? (`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
       || user.username?.[0]?.toUpperCase() || '?')
    : '?';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <Layout>
      <div className="gp-page-sm">
        <div style={{ marginBottom: 24 }}>
          <Mono size={10} accent style={{ display: 'block', marginBottom: 6, letterSpacing: 2 }}>◆ PATH / PROFILE</Mono>
          <Sans size={22} weight={700}>Profile</Sans>
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
              {/* Accounts made without personal details have no name, so the
                  username stands in as the identity. */}
              {user ? ([user.firstName, user.lastName].filter(Boolean).join(' ') || `@${user.username}`) : '—'}
            </Sans>
            <Mono size={11} dim style={{ display: 'block', marginBottom: 6 }}>@{user?.username || '—'}</Mono>
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
                <Mono size={10} dim style={{ display: 'block', marginBottom: 4 }}>{s.l}</Mono>
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
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              disabled={item.disabled}
              style={{
                width: '100%',
                textAlign: 'left',
                font: 'inherit',
                padding: '14px 16px',
                border: 'none',
                borderBottom: i < menuItems.length - 1 ? `1px solid ${GP.line}` : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: item.disabled ? 'progress' : 'pointer',
                opacity: item.disabled ? 0.6 : 1,
                background: GP.bg2,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = 'rgba(77,227,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = GP.bg2; }}
            >
              <Mono size={12} style={{ color: GP.inkMute, minWidth: 16 }}>{item.icon}</Mono>
              <div style={{ flex: 1 }}>
                <Sans size={13} weight={500}>{item.label}</Sans>
                <Mono size={10} dim style={{ display: 'block', marginTop: 2 }}>{item.desc}</Mono>
              </div>
              <Mono size={10} dim>▸</Mono>
            </button>
          ))}
        </div>

        {exportNote && (
          <div style={{
            border: `1px solid ${exportNote.ok ? GP.lime : GP.magenta}`,
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 16,
            background: GP.bg2,
          }}>
            <Mono size={11} style={{ color: exportNote.ok ? GP.lime : GP.magenta }}>
              ◉ {exportNote.text}
            </Mono>
          </div>
        )}

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
              <Mono size={11} style={{ color: GP.magenta, flex: 1 }}>Confirm sign out?</Mono>
              <button
                onClick={handleSignout}
                style={{
                  background: 'rgba(255,62,165,0.1)',
                  border: `1px solid ${GP.magenta}`,
                  borderRadius: 3,
                  padding: '5px 14px',
                  fontFamily: GP.mono,
                  fontSize: 11,
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
                  fontSize: 11,
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

        <Mono size={10} dim style={{ display: 'block', textAlign: 'center' }}>
          LOCKED IN · BUILD 1.0 · {new Date().getFullYear()}
        </Mono>
      </div>
    </Layout>
  );
}
