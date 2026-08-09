import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { GP } from '../../theme/GP';
import { GPInput, GPButton, Mono, Sans } from '../../components/primitives';

const shell = {
  minHeight: '100vh',
  background: GP.bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  backgroundImage:
    'radial-gradient(circle at 25% 25%, rgba(77,227,255,0.06), transparent 50%),' +
    'radial-gradient(circle at 75% 75%, rgba(255,62,165,0.05), transparent 50%)',
};

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    const e = {};
    if (!password) e.password = 'Required';
    else if (password.length < 8) e.password = 'Min 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      e.password = 'Needs uppercase, lowercase & number';
    if (confirm !== password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, newPassword: password });
      setDone(true);
      // The reset revokes every existing session, so signing in again is the
      // only way forward — send them there rather than to a dead dashboard.
      setTimeout(() => navigate('/signin'), 2500);
    } catch (err) {
      if (err.code === 'ECONNABORTED') setError('Server is waking up — please try again in a moment');
      else if (!err.response) setError('Cannot reach the server — check your connection');
      else setError(err.response?.data?.error?.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  // A link with no token at all is a dead end — say so instead of rendering a
  // form that is guaranteed to fail on submit.
  if (!token) {
    return (
      <div style={shell}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <Mono size={11} style={{ color: GP.magenta, letterSpacing: 3, display: 'block', marginBottom: 12 }}>
            ◉ INVALID LINK
          </Mono>
          <Sans size={22} weight={700} style={{ display: 'block', marginBottom: 12 }}>Reset link is incomplete</Sans>
          <Sans size={14} style={{ color: GP.inkDim, display: 'block', marginBottom: 28 }}>
            Request a fresh one and use the most recent email.
          </Sans>
          <Link to="/forgot-password" style={{ fontFamily: GP.mono, fontSize: 12, color: GP.cyan, letterSpacing: 1, textDecoration: 'none' }}>
            ◉ REQUEST NEW LINK
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={shell}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <Mono size={11} accent style={{ letterSpacing: 3, display: 'block', marginBottom: 12 }}>
            ◆ PASSWORD UPDATED
          </Mono>
          <Sans size={24} weight={700} style={{ display: 'block', marginBottom: 12 }}>You're all set</Sans>
          <Sans size={14} style={{ color: GP.inkDim, display: 'block', marginBottom: 28 }}>
            Signing you back in…
          </Sans>
          <Link to="/signin" style={{ fontFamily: GP.mono, fontSize: 12, color: GP.cyan, letterSpacing: 1, textDecoration: 'none' }}>
            ◉ SIGN IN NOW
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={shell}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <Mono size={11} accent style={{ letterSpacing: 3, display: 'block', marginBottom: 12 }}>
            ◆ GOALPATH · RECOVERY
          </Mono>
          <Sans size={28} weight={700} style={{ display: 'block', marginBottom: 6 }}>New Password</Sans>
          <Sans size={14} style={{ color: GP.inkDim, display: 'block' }}>
            This signs you out everywhere else.
          </Sans>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,62,165,0.1)',
            border: `1px solid ${GP.magenta}`,
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 20,
          }}>
            <Mono size={11} style={{ color: GP.magenta }}>◉ {error}</Mono>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <GPInput label="New Password" value={password} onChange={setPassword}
            type="password" placeholder="Min. 8 characters" error={errors.password} />
          <GPInput label="Confirm Password" value={confirm} onChange={setConfirm}
            type="password" placeholder="Repeat it" error={errors.confirm} />
          <GPButton onClick={handleSubmit} loading={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? 'UPDATING…' : '◉ SET NEW PASSWORD'}
          </GPButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link to="/signin" style={{ fontFamily: GP.mono, fontSize: 12, color: GP.cyan, letterSpacing: 1, textDecoration: 'none' }}>
            ◂ BACK TO SIGN IN
          </Link>
        </div>
      </div>
    </div>
  );
}
