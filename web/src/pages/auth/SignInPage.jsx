import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signin, clearError } from '../../store/slices/authSlice';
import { GP } from '../../theme/GP';
import { GPInput, GPButton, Mono, Sans } from '../../components/primitives';

export default function SignInPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (!validate()) return;
    const result = await dispatch(signin({ email: email.trim().toLowerCase(), password }));
    if (!result.error) navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: GP.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundImage:
        'radial-gradient(circle at 25% 25%, rgba(77,227,255,0.06), transparent 50%),' +
        'radial-gradient(circle at 75% 75%, rgba(255,62,165,0.05), transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <Mono size={9} accent style={{ letterSpacing: 3, display: 'block', marginBottom: 12 }}>
            ◆ GOALPATH · AUTH
          </Mono>
          <Sans size={28} weight={700} style={{ display: 'block', marginBottom: 6 }}>Sign In</Sans>
          <Sans size={14} style={{ color: GP.inkDim, display: 'block' }}>Resume your mission.</Sans>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,62,165,0.1)',
            border: `1px solid ${GP.magenta}`,
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 20,
          }}>
            <Mono size={9} style={{ color: GP.magenta }}>◉ {error}</Mono>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <GPInput label="Email" value={email} onChange={setEmail}
            type="email" placeholder="you@example.com" error={errors.email} />
          <GPInput label="Password" value={password} onChange={setPassword}
            type="password" placeholder="Your password" error={errors.password} />

          <GPButton
            onClick={handleSubmit}
            loading={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? '◉ SIGNING IN…' : '◉ SIGN IN'}
          </GPButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Sans size={13} style={{ color: GP.inkMute }}>
            New?{'  '}
            <Link to="/signup" style={{ fontFamily: GP.mono, fontSize: 10, color: GP.cyan, letterSpacing: 1, textDecoration: 'none' }}>
              CREATE ACCOUNT ▸
            </Link>
          </Sans>
        </div>
      </div>
    </div>
  );
}
