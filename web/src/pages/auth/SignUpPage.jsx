import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signup, clearError } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';
import { GP } from '../../theme/GP';
import { GPInput, GPButton, Mono, Sans } from '../../components/primitives';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default function SignUpPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [check, setCheck] = useState({ state: 'idle', reason: null, suggestion: null });

  const set = (field) => (val) =>
    setForm((f) => ({ ...f, [field]: field === 'username' ? val.replace(/\s/g, '').toLowerCase() : val }));

  // Every keystroke would otherwise be a request. The timer is cleared on each
  // change so only the pause at the end of typing actually asks the server.
  const timer = useRef(null);
  const latest = useRef('');
  latest.current = form.username.trim().toLowerCase();

  useEffect(() => {
    clearTimeout(timer.current);
    const name = form.username.trim().toLowerCase();

    if (!name) { setCheck({ state: 'idle', reason: null, suggestion: null }); return; }
    if (!USERNAME_RE.test(name)) {
      setCheck({ state: 'invalid', reason: '3–20 characters: letters, numbers or underscore', suggestion: null });
      return;
    }

    setCheck({ state: 'checking', reason: null, suggestion: null });
    timer.current = setTimeout(async () => {
      try {
        const { data } = await authAPI.usernameAvailable(name);
        // A late answer about an older name must not overwrite the current one.
        if (latest.current !== name) return;
        setCheck({
          state: data.data.available ? 'free' : 'taken',
          reason: data.data.reason,
          suggestion: data.data.suggestion,
        });
      } catch {
        // An unreachable server is not a verdict on the name; signup itself
        // still rejects duplicates, so stay quiet rather than block the user.
        setCheck({ state: 'idle', reason: null, suggestion: null });
      }
    }, 400);

    return () => clearTimeout(timer.current);
  }, [form.username]);

  const validate = () => {
    const e = {};
    const name = form.username.trim().toLowerCase();
    if (!name) e.username = 'Required';
    else if (!USERNAME_RE.test(name)) e.username = '3–20 characters: letters, numbers or underscore';
    else if (check.state === 'taken') e.username = 'That username is taken';
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
    // No navigate() here: signing up sets a recovery code in the store and the
    // router shows that screen until it is acknowledged.
    await dispatch(signup({ username: form.username.trim().toLowerCase(), password: form.password }));
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
          <Mono size={11} accent style={{ letterSpacing: 3, display: 'block', marginBottom: 12 }}>
            ◆ GOALPATH · REGISTER
          </Mono>
          <Sans size={28} weight={700} style={{ display: 'block', marginBottom: 6 }}>Create Account</Sans>
          <Sans size={14} style={{ color: GP.inkDim, display: 'block' }}>
            Pick a username and a password. That is all — no email, no real name.
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
          <GPInput label="Username" value={form.username} onChange={set('username')}
            placeholder="yourname" error={errors.username} />

          <div style={{ marginTop: -12, marginBottom: 14, minHeight: 16 }}>
            {check.state === 'checking' && <Mono size={10} style={{ color: GP.inkMute }}>CHECKING…</Mono>}
            {check.state === 'free' && <Mono size={10} style={{ color: GP.cyan }}>✓ AVAILABLE</Mono>}
            {(check.state === 'taken' || check.state === 'invalid') && (
              <Mono size={10} style={{ color: GP.magenta }}>
                ✕ {check.reason}
              </Mono>
            )}
            {check.state === 'taken' && check.suggestion && (
              <button
                type="button"
                onClick={() => set('username')(check.suggestion)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, marginLeft: 10, fontFamily: GP.mono, fontSize: 10,
                  color: GP.cyan, letterSpacing: 1,
                }}
              >
                TRY @{check.suggestion} ▸
              </button>
            )}
          </div>

          <GPInput label="Password" value={form.password} onChange={set('password')}
            type="password" placeholder="Min. 8 characters" error={errors.password} />

          <div style={{
            background: GP.bg2, border: `1px solid ${GP.line}`, borderRadius: 4,
            padding: 14, marginBottom: 18,
          }}>
            <Sans size={12} style={{ color: GP.inkDim, lineHeight: 1.6 }}>
              Your username is how friends find you. After signing up you get a
              recovery code — it is the only way back in if you forget your
              password, so keep it somewhere safe.
            </Sans>
          </div>

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
            <Link to="/signin" style={{ fontFamily: GP.mono, fontSize: 12, color: GP.cyan, letterSpacing: 1, textDecoration: 'none' }}>
              SIGN IN ▸
            </Link>
          </Sans>
        </div>
      </div>
    </div>
  );
}
