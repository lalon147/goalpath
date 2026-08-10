import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../../store/slices/authSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPButton } from '../../components/primitives';
import Layout from '../../components/Layout';

const pad = (n) => String(n).padStart(2, '0');

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        width: 46,
        height: 26,
        flexShrink: 0,
        borderRadius: 13,
        border: `1px solid ${checked ? GP.cyan : GP.line}`,
        background: checked ? 'rgba(77,227,255,0.2)' : 'transparent',
        cursor: 'pointer',
        padding: 0,
        position: 'relative',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: checked ? 23 : 3,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: checked ? GP.cyan : GP.inkMute,
        transition: 'left 0.15s',
      }} />
    </button>
  );
}

function SettingRow({ title, caption, checked, onChange }) {
  return (
    <div style={{
      border: `1px solid ${GP.line}`,
      borderRadius: 4,
      background: GP.bg2,
      padding: '14px 16px',
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      <div style={{ flex: 1 }}>
        <Sans size={14} weight={500}>{title}</Sans>
        <Mono size={10} dim style={{ display: 'block', marginTop: 4 }}>{caption}</Mono>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

export default function NotificationSettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const prefs = user?.preferences;

  const initial = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(prefs?.dailyReminderTime || '09:00');

  const [enabled, setEnabled] = useState(prefs?.notificationsEnabled !== false);
  const [emailEnabled, setEmailEnabled] = useState(prefs?.emailNotifications !== false);
  const [time, setTime] = useState(
    initial ? `${pad(Number(initial[1]))}:${pad(Number(initial[2]))}` : '09:00'
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);

  const handleSave = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setStatus('');
    setError(null);
    try {
      await dispatch(updateProfile({
        preferences: {
          notificationsEnabled: enabled,
          pushNotificationsEnabled: enabled,
          emailNotifications: emailEnabled,
          dailyReminderTime: time,
        },
      })).unwrap();
      setStatus(enabled ? `Reminder saved for ${time} daily.` : 'Reminders turned off.');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not save your settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="gp-page-sm">
        <div style={{ marginBottom: 24 }}>
          <Mono size={10} accent style={{ display: 'block', marginBottom: 6, letterSpacing: 2 }}>
            ◆ PATH / PROFILE / NOTIFICATIONS
          </Mono>
          <Sans size={22} weight={700}>Notifications</Sans>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,62,165,0.1)',
            border: `1px solid ${GP.magenta}`,
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 16,
          }}>
            <Mono size={11} style={{ color: GP.magenta }}>◉ {error}</Mono>
          </div>
        )}

        <form onSubmit={handleSave}>
          <SettingRow
            title="Daily reminder"
            caption="ONE NUDGE A DAY TO LOG YOUR HABITS"
            checked={enabled}
            onChange={setEnabled}
          />

          {enabled && (
            <div style={{
              border: `1px solid ${GP.line}`,
              borderRadius: 4,
              background: GP.bg2,
              padding: '14px 16px',
              marginBottom: 12,
            }}>
              <Mono size={10} dim style={{ display: 'block', letterSpacing: 1.5, marginBottom: 10 }}>
                REMIND ME AT
              </Mono>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                style={{
                  background: GP.bg,
                  border: `1px solid ${GP.line}`,
                  borderRadius: 4,
                  color: GP.ink,
                  fontFamily: GP.mono,
                  fontSize: 18,
                  letterSpacing: 2,
                  padding: '8px 12px',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
                onFocus={(e) => { e.target.style.borderColor = GP.cyan; }}
                onBlur={(e) => { e.target.style.borderColor = GP.line; }}
              />
            </div>
          )}

          <SettingRow
            title="Email notifications"
            caption="SAVED TO YOUR ACCOUNT · NO EMAILS ARE SENT YET"
            checked={emailEnabled}
            onChange={setEmailEnabled}
          />

          {/* The browser cannot arm the reminder the way the phone app can, so
              this says what actually happens rather than implying otherwise. */}
          <div style={{
            border: `1px solid ${GP.line}`,
            borderRadius: 4,
            background: GP.bg2,
            padding: '12px 14px',
            marginBottom: 24,
          }}>
            <Sans size={13} color={GP.inkDim}>
              These settings are stored on your account. The GoalPath mobile app delivers
              the daily reminder notification.
            </Sans>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <GPButton loading={saving}>{saving ? 'SAVING' : '◉ SAVE'}</GPButton>
            <GPButton type="button" variant="ghost" onClick={() => navigate('/profile')}>BACK</GPButton>
            {!!status && <Mono size={11} dim>{status}</Mono>}
          </div>
        </form>
      </div>
    </Layout>
  );
}
