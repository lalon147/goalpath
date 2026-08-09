import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setFieldError('Required');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setFieldError('Invalid email');
    setFieldError('');

    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      if (err.code === 'ECONNABORTED') setError('Server is waking up — please try again in a moment');
      else if (!err.response) setError('Cannot reach the server — check your connection');
      else setError(err.response?.data?.error?.message || 'Could not send reset link');
    } finally {
      setLoading(false);
    }
  };

  // The confirmation is deliberately identical whether or not the address is
  // registered — saying "no such user" here would leak who has an account.
  if (sent) {
    return (
      <div style={shell}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <Mono size={11} accent style={{ letterSpacing: 3, display: 'block', marginBottom: 12 }}>
            ◆ GOALPATH · RECOVERY
          </Mono>
          <Sans size={24} weight={700} style={{ display: 'block', marginBottom: 12 }}>Check your email</Sans>
          <Sans size={14} style={{ color: GP.inkDim, display: 'block', marginBottom: 28, lineHeight: 1.6 }}>
            If <span style={{ color: GP.ink }}>{email.trim().toLowerCase()}</span> is registered,
            a reset link is on its way. It expires in one hour.
          </Sans>
          <Link to="/signin" style={{ fontFamily: GP.mono, fontSize: 12, color: GP.cyan, letterSpacing: 1, textDecoration: 'none' }}>
            ◂ BACK TO SIGN IN
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
          <Sans size={28} weight={700} style={{ display: 'block', marginBottom: 6 }}>Reset Password</Sans>
          <Sans size={14} style={{ color: GP.inkDim, display: 'block' }}>
            We'll send a link to your email.
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
          <GPInput label="Email" value={email} onChange={setEmail}
            type="email" placeholder="you@example.com" error={fieldError} />
          <GPButton onClick={handleSubmit} loading={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? 'SENDING…' : '◉ SEND RESET LINK'}
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
