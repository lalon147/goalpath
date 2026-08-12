import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { GP } from '../../theme/GP';
import { GPInput, GPButton, Mono, Sans } from '../../components/primitives';

/**
 * Password recovery for accounts with no email.
 *
 * Resetting spends the old recovery code and issues a new one, so the success
 * state shows that new code with the same care signup does — otherwise the user
 * walks away holding a code that no longer works.
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', recoveryCode: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = (field) => (val) =>
    setForm((f) => ({ ...f, [field]: field === 'username' ? val.replace(/\s/g, '').toLowerCase() : val }));

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Required';
    if (!form.recoveryCode.trim()) e.recoveryCode = 'Required';
    if (!form.newPassword) e.newPassword = 'Required';
    else if (form.newPassword.length < 8) e.newPassword = 'Min 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.newPassword))
      e.newPassword = 'Needs uppercase, lowercase & number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBanner('');
    if (!validate()) return;
    setBusy(true);
    try {
      const { data } = await authAPI.recover({
        username: form.username.trim().toLowerCase(),
        recoveryCode: form.recoveryCode.trim(),
        newPassword: form.newPassword,
      });
      setNewCode(data.data.recoveryCode);
    } catch (err) {
      setBanner(err.response?.data?.error?.message || 'Could not reset your password');
    } finally {
      setBusy(false);
    }
  };

  const shell = (children) => (
    <div style={{
      minHeight: '100vh', background: GP.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
    </div>
  );

  if (newCode) {
    return shell(
      <>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Mono size={11} style={{ color: GP.amber, letterSpacing: 3, display: 'block', marginBottom: 12 }}>
            ◆ LOCKED IN · DONE
          </Mono>
          <Sans size={26} weight={700} style={{ display: 'block', marginBottom: 8 }}>Password reset</Sans>
          <Sans size={14} style={{ color: GP.inkDim, display: 'block', lineHeight: 1.6 }}>
            Your old recovery code has been used up. Here is the new one — save
            it now, it will not be shown again.
          </Sans>
        </div>

        <div style={{
          background: GP.bg2, border: `1px solid ${GP.amber}`, borderRadius: 4,
          padding: '28px 16px', textAlign: 'center', marginBottom: 12,
        }}>
          <span style={{
            fontFamily: GP.mono, fontSize: 22, letterSpacing: 3,
            color: GP.amber, wordBreak: 'break-all',
          }}>
            {newCode}
          </span>
        </div>

        <button
          type="button"
          onClick={async () => {
            try { await navigator.clipboard.writeText(newCode); setCopied(true); } catch {}
          }}
          style={{
            width: '100%', height: 44, background: 'none', cursor: 'pointer',
            border: `1px solid ${GP.line}`, borderRadius: 4, color: GP.ink,
            fontFamily: GP.mono, fontSize: 11, letterSpacing: 1.5, marginBottom: 18,
          }}
        >
          {copied ? '✓ COPIED' : '◉ COPY CODE'}
        </button>

        <GPButton onClick={() => navigate('/signin')} style={{ width: '100%' }}>
          ◉ SIGN IN
        </GPButton>
      </>
    );
  }

  return shell(
    <>
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <Mono size={11} accent style={{ letterSpacing: 3, display: 'block', marginBottom: 12 }}>
          ◆ LOCKED IN · RECOVER
        </Mono>
        <Sans size={26} weight={700} style={{ display: 'block', marginBottom: 8 }}>Forgot password</Sans>
        <Sans size={14} style={{ color: GP.inkDim, display: 'block', lineHeight: 1.6 }}>
          Enter the recovery code you saved when you signed up.
        </Sans>
      </div>

      {!!banner && (
        <div style={{
          background: 'rgba(255,62,165,0.1)', border: `1px solid ${GP.magenta}`,
          borderRadius: 4, padding: '10px 14px', marginBottom: 20,
        }}>
          <Mono size={11} style={{ color: GP.magenta }}>◉ {banner}</Mono>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <GPInput label="Username" value={form.username} onChange={set('username')}
          placeholder="yourname" error={errors.username} />
        <GPInput label="Recovery Code" value={form.recoveryCode} onChange={set('recoveryCode')}
          placeholder="LI-XXXX-XXXX-XXXX" error={errors.recoveryCode} />
        <GPInput label="New Password" value={form.newPassword} onChange={set('newPassword')}
          type="password" placeholder="Min. 8 characters" error={errors.newPassword} />

        <GPButton onClick={handleSubmit} loading={busy} style={{ width: '100%', marginTop: 8 }}>
          {busy ? 'RESETTING…' : '◉ RESET PASSWORD'}
        </GPButton>
      </form>

      <div style={{
        background: GP.bg2, border: `1px solid ${GP.line}`,
        borderRadius: 4, padding: 14, marginTop: 22,
      }}>
        <Sans size={12} style={{ color: GP.inkDim, lineHeight: 1.6 }}>
          Lost your recovery code too? There is no other way in — accounts have
          no email attached, so nothing can be sent to you. You would need to
          start a new account.
        </Sans>
      </div>

      <div style={{ textAlign: 'center', marginTop: 22 }}>
        <Link to="/signin" style={{
          fontFamily: GP.mono, fontSize: 12, color: GP.cyan,
          letterSpacing: 1, textDecoration: 'none',
        }}>
          ◂ BACK TO SIGN IN
        </Link>
      </div>
    </>
  );
}
