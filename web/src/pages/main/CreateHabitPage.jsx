import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createHabit } from '../../store/slices/habitsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPInput, GPButton } from '../../components/primitives';
import Layout from '../../components/Layout';

const EMOJIS = ['⚡', '💪', '📚', '🧘', '🏃', '💧', '🧠', '🎯', '🌅', '🔥', '✍️', '🎵'];
const FREQUENCIES = ['daily', 'weekly', 'monthly'];
const CATEGORIES = ['health', 'learning', 'mindfulness', 'productivity', 'fitness', 'social'];
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CreateHabitPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.habits);

  const [form, setForm] = useState({
    name: '',
    description: '',
    emoji: '⚡',
    frequency: 'daily',
    category: '',
    targetValue: 1,
    unit: '',
    reminderTime: '',
    daysOfWeek: [1, 2, 3, 4, 5],
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const toggleDay = (dayIdx) => {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(dayIdx)
        ? f.daysOfWeek.filter((d) => d !== dayIdx)
        : [...f.daysOfWeek, dayIdx].sort(),
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await dispatch(createHabit(form));
    if (!result.error) navigate('/habits');
  };

  return (
    <Layout>
      <div className="gp-page-sm">
        <div style={{ marginBottom: 24 }}>
          <Mono size={8} accent style={{ display: 'block', marginBottom: 6, letterSpacing: 2 }}>◆ PATH / HABITS / NEW</Mono>
          <Sans size={20} weight={700}>New Habit</Sans>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,62,165,0.1)',
            border: `1px solid ${GP.magenta}`,
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 16,
          }}>
            <Mono size={9} style={{ color: GP.magenta }}>◉ {error}</Mono>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Emoji */}
          <div style={{ marginBottom: 16 }}>
            <Mono size={7} dim style={{ display: 'block', marginBottom: 8, letterSpacing: 1 }}>EMOJI</Mono>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => set('emoji')(em)}
                  style={{
                    background: form.emoji === em ? 'rgba(77,227,255,0.15)' : 'transparent',
                    border: `1px solid ${form.emoji === em ? GP.cyan : GP.line}`,
                    borderRadius: 4,
                    padding: '6px 10px',
                    fontSize: 20,
                    cursor: 'pointer',
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <GPInput label="Habit Name" value={form.name} onChange={set('name')}
            placeholder="e.g. Morning run" error={errors.name} />
          <GPInput label="Description (optional)" value={form.description} onChange={set('description')}
            placeholder="Why this habit matters" />

          {/* Frequency */}
          <div style={{ marginBottom: 16 }}>
            <Mono size={7} dim style={{ display: 'block', marginBottom: 8, letterSpacing: 1 }}>FREQUENCY</Mono>
            <div style={{ display: 'flex', gap: 6 }}>
              {FREQUENCIES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => set('frequency')(f)}
                  style={{
                    background: form.frequency === f ? 'rgba(77,227,255,0.15)' : 'transparent',
                    border: `1px solid ${form.frequency === f ? GP.cyan : GP.line}`,
                    borderRadius: 3,
                    padding: '4px 14px',
                    fontFamily: GP.mono,
                    fontSize: 8,
                    color: form.frequency === f ? GP.cyan : GP.inkMute,
                    letterSpacing: 1,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Days of week (only for non-daily) */}
          {form.frequency === 'weekly' && (
            <div style={{ marginBottom: 16 }}>
              <Mono size={7} dim style={{ display: 'block', marginBottom: 8, letterSpacing: 1 }}>DAYS OF WEEK</Mono>
              <div style={{ display: 'flex', gap: 6 }}>
                {DAYS_OF_WEEK.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i)}
                    style={{
                      background: form.daysOfWeek.includes(i) ? 'rgba(77,227,255,0.15)' : 'transparent',
                      border: `1px solid ${form.daysOfWeek.includes(i) ? GP.cyan : GP.line}`,
                      borderRadius: 3,
                      padding: '5px 8px',
                      fontFamily: GP.mono,
                      fontSize: 7,
                      color: form.daysOfWeek.includes(i) ? GP.cyan : GP.inkMute,
                      letterSpacing: 1,
                      cursor: 'pointer',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          <div style={{ marginBottom: 16 }}>
            <Mono size={7} dim style={{ display: 'block', marginBottom: 8, letterSpacing: 1 }}>CATEGORY</Mono>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('category')(c)}
                  style={{
                    background: form.category === c ? 'rgba(77,227,255,0.15)' : 'transparent',
                    border: `1px solid ${form.category === c ? GP.cyan : GP.line}`,
                    borderRadius: 3,
                    padding: '4px 12px',
                    fontFamily: GP.mono,
                    fontSize: 8,
                    color: form.category === c ? GP.cyan : GP.inkMute,
                    letterSpacing: 1,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Target + unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 16 }}>
            <div>
              <Mono size={7} dim style={{ display: 'block', marginBottom: 8, letterSpacing: 1 }}>TARGET</Mono>
              <input
                type="number"
                min="1"
                value={form.targetValue}
                onChange={(e) => set('targetValue')(parseInt(e.target.value) || 1)}
                style={{
                  width: '100%',
                  background: GP.bg2,
                  border: `1px solid ${GP.line}`,
                  borderRadius: 4,
                  padding: '10px 14px',
                  fontFamily: GP.mono,
                  fontSize: 13,
                  color: GP.ink,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <GPInput label="Unit (optional)" value={form.unit} onChange={set('unit')}
              placeholder="e.g. km, minutes, pages" />
          </div>

          {/* Reminder */}
          <div style={{ marginBottom: 20 }}>
            <Mono size={7} dim style={{ display: 'block', marginBottom: 8, letterSpacing: 1 }}>REMINDER TIME (optional)</Mono>
            <input
              type="time"
              value={form.reminderTime}
              onChange={(e) => set('reminderTime')(e.target.value)}
              style={{
                background: GP.bg2,
                border: `1px solid ${GP.line}`,
                borderRadius: 4,
                padding: '10px 14px',
                fontFamily: GP.mono,
                fontSize: 12,
                color: GP.ink,
                outline: 'none',
                colorScheme: 'dark',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <GPButton onClick={handleSubmit} loading={loading} style={{ flex: 1 }}>
              {loading ? 'CREATING…' : '◉ CREATE HABIT'}
            </GPButton>
            <button
              type="button"
              onClick={() => navigate('/habits')}
              style={{
                background: 'none',
                border: `1px solid ${GP.line}`,
                borderRadius: 4,
                padding: '10px 20px',
                fontFamily: GP.mono,
                fontSize: 9,
                color: GP.inkMute,
                letterSpacing: 2,
                cursor: 'pointer',
              }}
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
