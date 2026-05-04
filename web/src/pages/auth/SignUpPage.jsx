import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signup, clearError } from '../../store/slices/authSlice';
import { GP } from '../../theme/GP';
import { GPInput, GPButton, Mono, Sans } from '../../components/primitives';

export default function SignUpPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      e.password = 'Needs uppercase, lowercase & number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (!validate()) return;
    const result = await dispatch(signup({ ...form, email: form.email.trim().toLowerCase() }));
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
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <Mono size={9} accent style={{ letterSpacing: 3, display: 'block', marginBottom: 12 }}>
            ◆ GOALPATH · REGISTER
          </Mono>
          <Sans size={28} weight={700} style={{ display: 'block', marginBottom: 6 }}>Create Account</Sans>
          <Sans size={14} style={{ color: GP.inkDim, display: 'block' }}>Start your mission.</Sans>
        </div>

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

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <GPInput label="First Name" value={form.firstName} onChange={set('firstName')}
                placeholder="John" error={errors.firstName} />
            </div>
            <div style={{ flex: 1 }}>
              <GPInput label="Last Name" value={form.lastName} onChange={set('lastName')}
                placeholder="Doe" error={errors.lastName} />
            </div>
          </div>
          <GPInput label="Email" value={form.email} onChange={set('email')}
            type="email" placeholder="you@example.com" error={errors.email} />
          <GPInput label="Password" value={form.password} onChange={set('password')}
            type="password" placeholder="Min. 8 characters" error={errors.password} />

          <GPButton
            onClick={handleSubmit}
            loading={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? 'CREATING…' : '◉ CREATE ACCOUNT'}
          </GPButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Sans size={13} style={{ color: GP.inkMute }}>
            Already a member?{'  '}
            <Link to="/signin" style={{ fontFamily: GP.mono, fontSize: 10, color: GP.cyan, letterSpacing: 1, textDecoration: 'none' }}>
              SIGN IN ▸
            </Link>
          </Sans>
        </div>
      </div>
    </div>
  );
}
