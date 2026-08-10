import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { changePassword, logout } from '../../store/slices/authSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPInput, GPButton } from '../../components/primitives';
import Layout from '../../components/Layout';

// Kept in step with passwordRules in backend/src/validators/authValidator.js.
const RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
];

export default function ChangePasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Enter your current password';
    if (!form.newPassword) e.newPassword = 'Enter a new password';
    else if (RULES.some((r) => !r.test(form.newPassword))) e.newPassword = 'Password does not meet the rules below';
    else if (form.newPassword === form.currentPassword) e.newPassword = 'New password must be different';
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await dispatch(changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })).unwrap();

      // Changing the password revokes every refresh token server-side, so this
      // session would silently die at the next token refresh. Ending it here
      // makes that visible instead of surprising.
      await dispatch(logout());
      navigate('/signin', {
        replace: true,
        state: { notice: 'Password changed. Please sign in again.' },
      });
    } catch (err) {
      setSubmitError(typeof err === 'string' ? err : 'Could not change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="gp-page-sm">
        <div style={{ marginBottom: 24 }}>
          <Mono size={10} accent style={{ display: 'block', marginBottom: 6, letterSpacing: 2 }}>
            ◆ PATH / PROFILE / SECURITY
          </Mono>
          <Sans size={22} weight={700}>Change Password</Sans>
        </div>

        {submitError && (
          <div style={{
            background: 'rgba(255,62,165,0.1)',
            border: `1px solid ${GP.magenta}`,
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 16,
          }}>
            <Mono size={11} style={{ color: GP.magenta }}>◉ {submitError}</Mono>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <GPInput
            label="Current password"
            type="password"
            value={form.currentPassword}
            onChange={set('currentPassword')}
            placeholder="Your current password"
            error={errors.currentPassword}
          />
          <GPInput
            label="New password"
            type="password"
            value={form.newPassword}
            onChange={set('newPassword')}
            placeholder="Your new password"
            error={errors.newPassword}
          />
          <GPInput
            label="Confirm new password"
            type="password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            placeholder="Type it again"
            error={errors.confirmPassword}
          />

          <div style={{
            border: `1px solid ${GP.line}`,
            borderRadius: 4,
            background: GP.bg2,
            padding: '12px 14px',
            marginBottom: 16,
          }}>
            <Mono size={10} dim style={{ display: 'block', letterSpacing: 1.5, marginBottom: 8 }}>
              NEW PASSWORD MUST HAVE
            </Mono>
            {RULES.map((r) => {
              const dormant = !form.newPassword;
              const met = r.test(form.newPassword);
              const color = dormant ? GP.inkMute : met ? GP.lime : GP.magenta;
              return (
                <div key={r.label} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 5 }}>
                  <Mono size={11} style={{ color }}>{dormant ? '·' : met ? '✓' : '✗'}</Mono>
                  <Mono size={11} style={{ color: dormant ? GP.inkMute : met ? GP.lime : GP.inkDim }}>
                    {r.label}
                  </Mono>
                </div>
              );
            })}
          </div>

          <div style={{
            border: `1px solid ${GP.amber}`,
            borderRadius: 4,
            background: GP.bg2,
            padding: '12px 14px',
            marginBottom: 24,
          }}>
            <Sans size={13} color={GP.inkDim}>
              Changing your password signs you out on every device, including this one.
            </Sans>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <GPButton loading={saving}>{saving ? 'CHANGING' : '◉ CHANGE PASSWORD'}</GPButton>
            <GPButton type="button" variant="ghost" onClick={() => navigate('/profile')}>CANCEL</GPButton>
          </div>
        </form>
      </div>
    </Layout>
  );
}
