import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../../store/slices/authSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPInput, GPButton } from '../../components/primitives';
import Layout from '../../components/Layout';

const BIO_LIMIT = 500;

const deviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export default function EditProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    timezone: user?.timezone || 'UTC',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const detected = deviceTimezone();

  const validate = () => {
    const e = {};
    // Mirrors updateProfileSchema on the backend, so a bad value is caught
    // before a round trip rather than coming back as a 400.
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    else if (form.firstName.trim().length > 50) e.firstName = 'Keep it under 50 characters';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    else if (form.lastName.trim().length > 50) e.lastName = 'Keep it under 50 characters';
    if (form.bio.length > BIO_LIMIT) e.bio = `Bio is ${form.bio.length}/${BIO_LIMIT} characters`;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await dispatch(updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        bio: form.bio,
        timezone: form.timezone,
      })).unwrap();
      navigate('/profile');
    } catch (err) {
      setSubmitError(typeof err === 'string' ? err : 'Could not save your profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="gp-page-sm">
        <div style={{ marginBottom: 24 }}>
          <Mono size={10} accent style={{ display: 'block', marginBottom: 6, letterSpacing: 2 }}>
            ◆ PATH / PROFILE / EDIT
          </Mono>
          <Sans size={22} weight={700}>Edit Profile</Sans>
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
            label="First name"
            value={form.firstName}
            onChange={set('firstName')}
            placeholder="First name"
            error={errors.firstName}
          />
          <GPInput
            label="Last name"
            value={form.lastName}
            onChange={set('lastName')}
            placeholder="Last name"
            error={errors.lastName}
          />

          <div style={{ marginBottom: 18 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6,
            }}>
              <Mono size={11} dim style={{ letterSpacing: 1.5 }}>◆ BIO</Mono>
              <Mono size={11} style={{ color: form.bio.length > BIO_LIMIT ? GP.magenta : GP.inkMute }}>
                {form.bio.length}/{BIO_LIMIT}
              </Mono>
            </div>
            <textarea
              value={form.bio}
              onChange={(e) => set('bio')(e.target.value)}
              placeholder="A line about what you're working towards"
              rows={4}
              style={{
                width: '100%',
                background: GP.bg2,
                border: `1px solid ${errors.bio ? GP.magenta : GP.line}`,
                borderRadius: 4,
                color: GP.ink,
                fontFamily: GP.sans,
                fontSize: 14,
                padding: '10px 12px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { if (!errors.bio) e.target.style.borderColor = GP.cyan; }}
              onBlur={(e) => { e.target.style.borderColor = errors.bio ? GP.magenta : GP.line; }}
            />
            {errors.bio && (
              <div style={{ fontFamily: GP.mono, fontSize: 11, color: GP.magenta, marginTop: 4 }}>
                {errors.bio}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 18 }}>
            <Mono size={11} dim style={{ display: 'block', marginBottom: 6, letterSpacing: 1.5 }}>◆ TIMEZONE</Mono>
            <div style={{
              border: `1px solid ${GP.line}`,
              borderRadius: 4,
              background: GP.bg2,
              padding: '12px 14px',
            }}>
              <Sans size={14}>{form.timezone}</Sans>
              <Mono size={10} dim style={{ display: 'block', marginTop: 4 }}>
                USED TO SCHEDULE YOUR DAILY REMINDER
              </Mono>
              {form.timezone !== detected && (
                <button
                  type="button"
                  onClick={() => set('timezone')(detected)}
                  style={{
                    marginTop: 10,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: GP.mono,
                    fontSize: 11,
                    letterSpacing: 1,
                    color: GP.cyan,
                  }}
                >
                  ◉ USE BROWSER TIMEZONE ({detected})
                </button>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Mono size={11} dim style={{ display: 'block', marginBottom: 6, letterSpacing: 1.5 }}>◆ USERNAME</Mono>
            <div style={{
              border: `1px solid ${GP.line}`,
              borderRadius: 4,
              background: GP.bg2,
              padding: '12px 14px',
            }}>
              <Sans size={14} color={GP.inkMute}>@{user?.username || '—'}</Sans>
              <Mono size={10} dim style={{ display: 'block', marginTop: 4 }}>
                THIS IS HOW FRIENDS FIND YOU · CANNOT BE CHANGED YET
              </Mono>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <GPButton loading={saving}>{saving ? 'SAVING' : '◉ SAVE CHANGES'}</GPButton>
            <GPButton type="button" variant="ghost" onClick={() => navigate('/profile')}>CANCEL</GPButton>
          </div>
        </form>
      </div>
    </Layout>
  );
}
