import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createGoal } from '../../store/slices/goalsSlice';
import { createHabit } from '../../store/slices/habitsSlice';
import {
  inferGoalFields,
  suggestTitles,
  suggestMilestones,
  suggestHabits,
  fetchAIIdeas,
} from '../../services/suggestions';
import { TitleSuggest, SuggestionPanel } from '../../components/Suggest';
import { milestonesAPI } from '../../services/api';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPInput, GPButton } from '../../components/primitives';
import Layout from '../../components/Layout';

const EMOJIS = ['🎯', '💪', '📚', '💰', '🏃', '🧠', '❤️', '🌟', '🔥', '⚡', '🎵', '✈️'];
const CATEGORIES = ['learning', 'health', 'career', 'personal', 'financial'];
const PRIORITIES = ['high', 'medium', 'low'];
const TYPES = ['short-term', 'long-term'];

const CATEGORY_COLORS = {
  learning: '#8B5CF6', health: '#EF4444', career: '#3B82F6',
  personal: '#EC4899', financial: '#F59E0B',
};
const PRIORITY_COLORS = { high: GP.magenta, medium: GP.amber, low: GP.lime };

export default function CreateGoalPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.goals);

  const [form, setForm] = useState({
    title: '',
    description: '',
    emoji: '🎯',
    category: '',
    priority: 'medium',
    type: 'short-term',
    targetDate: '',
  });
  const [errors, setErrors] = useState({});
  const [milestones, setMilestones] = useState([{ title: '', description: '' }]);

  // Which fields the user has touched. The engine only auto-fills what they
  // haven't set themselves, so a guess never overwrites a deliberate choice.
  const [touched, setTouched] = useState({});
  const [moreState, setMoreState] = useState('idle');
  const [aiMilestones, setAiMilestones] = useState(null);
  const [pickedHabits, setPickedHabits] = useState([]);

  const set = (field) => (val) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setForm((f) => ({ ...f, [field]: val }));
  };

  // Typing the title is what drives every suggestion on this page.
  const setTitle = (val) => {
    setForm((f) => {
      const next = { ...f, title: val };
      const guess = inferGoalFields(val);
      if (guess) {
        if (!touched.category) next.category = guess.category;
        if (!touched.emoji) next.emoji = guess.emoji;
        if (!touched.type) next.type = guess.type;
      }
      return next;
    });
    setAiMilestones(null);
    setMoreState((s) => (s === 'unavailable' ? s : 'idle'));
  };

  const titleIdeas = suggestTitles(form.title, 'goal');
  const milestoneIdeas = aiMilestones || suggestMilestones(form.title);
  const habitIdeas = suggestHabits(form.title);

  // Milestones start with one blank row; adding a suggestion should fill that
  // row rather than leaving an empty one above it.
  const addMilestone_ = (m) => {
    setMilestones((ms) => {
      const next = ms.filter((x) => x.title.trim());
      if (next.some((x) => x.title === m.title)) return ms;
      return [...next, { title: m.title, description: m.description || '' }];
    });
  };

  const addAllMilestones = () => {
    setMilestones((ms) => {
      const kept = ms.filter((x) => x.title.trim());
      const have = new Set(kept.map((x) => x.title));
      return [
        ...kept,
        ...milestoneIdeas
          .filter((m) => !have.has(m.title))
          .map((m) => ({ title: m.title, description: m.description || '' })),
      ];
    });
  };

  const handleMoreIdeas = async () => {
    setMoreState('loading');
    const res = await fetchAIIdeas({
      kind: 'milestones',
      title: form.title,
      category: form.category,
      description: form.description,
    });
    if (res.ok) {
      setAiMilestones(res.items);
      setMoreState('idle');
    } else {
      setMoreState(res.reason);
    }
  };

  const toggleHabit = (h) => {
    setPickedHabits((hs) =>
      hs.some((x) => x.title === h.title)
        ? hs.filter((x) => x.title !== h.title)
        : [...hs, h]
    );
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.category) e.category = 'Select a category';
    if (!form.targetDate) e.targetDate = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const addMilestone = () => setMilestones((ms) => [...ms, { title: '', description: '' }]);
  const updateMilestone = (i, field, val) =>
    setMilestones((ms) => ms.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  const removeMilestone = (i) => setMilestones((ms) => ms.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await dispatch(createGoal({ ...form }));
    if (!result.error) {
      const goalId = result.payload._id;
      const validMilestones = milestones.filter((m) => m.title.trim());
      for (const m of validMilestones) {
        await milestonesAPI.create(goalId, { title: m.title, description: m.description });
      }
      // Supporting habits are opt-in extras — a failure here shouldn't lose the
      // goal the user just created, so each one is attempted independently.
      for (const h of pickedHabits) {
        await dispatch(createHabit({
          title: h.title,
          frequency: h.frequency,
          emoji: h.emoji,
          category: h.category,
          goalId,
        }));
      }
      navigate('/goals');
    }
  };

  return (
    <Layout>
      <div className="gp-page-sm">
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Mono size={10} accent style={{ display: 'block', marginBottom: 6, letterSpacing: 2 }}>◆ PATH / GOALS / NEW</Mono>
          <Sans size={22} weight={700}>Define Goal</Sans>
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

        <form onSubmit={handleSubmit}>
          {/* Emoji picker */}
          <div style={{ marginBottom: 16 }}>
            <Mono size={10} dim style={{ display: 'block', marginBottom: 8, letterSpacing: 1 }}>EMOJI</Mono>
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

          <GPInput label="Goal Title" value={form.title} onChange={setTitle}
            placeholder="e.g. Run a marathon" error={errors.title} />
          <TitleSuggest items={titleIdeas} onPick={setTitle} />
          <GPInput label="Description (optional)" value={form.description} onChange={set('description')}
            placeholder="What does success look like?" />

          {/* Category */}
          <div style={{ marginBottom: 16 }}>
            <Mono size={10} dim style={{ display: 'block', marginBottom: 8, letterSpacing: 1 }}>
              CATEGORY {errors.category && <span style={{ color: GP.magenta }}>— {errors.category}</span>}
            </Mono>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('category')(c)}
                  style={{
                    background: form.category === c ? `${CATEGORY_COLORS[c]}22` : 'transparent',
                    border: `1px solid ${form.category === c ? CATEGORY_COLORS[c] : GP.line}`,
                    borderRadius: 3,
                    padding: '4px 12px',
                    fontFamily: GP.mono,
                    fontSize: 11,
                    color: form.category === c ? CATEGORY_COLORS[c] : GP.inkMute,
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

          {/* Priority */}
          <div style={{ marginBottom: 16 }}>
            <Mono size={10} dim style={{ display: 'block', marginBottom: 8, letterSpacing: 1 }}>PRIORITY</Mono>
            <div style={{ display: 'flex', gap: 6 }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('priority')(p)}
                  style={{
                    background: form.priority === p ? `${PRIORITY_COLORS[p]}22` : 'transparent',
                    border: `1px solid ${form.priority === p ? PRIORITY_COLORS[p] : GP.line}`,
                    borderRadius: 3,
                    padding: '4px 12px',
                    fontFamily: GP.mono,
                    fontSize: 11,
                    color: form.priority === p ? PRIORITY_COLORS[p] : GP.inkMute,
                    letterSpacing: 1,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div style={{ marginBottom: 16 }}>
            <Mono size={10} dim style={{ display: 'block', marginBottom: 8, letterSpacing: 1 }}>TYPE</Mono>
            <div style={{ display: 'flex', gap: 6 }}>
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('type')(t)}
                  style={{
                    background: form.type === t ? 'rgba(77,227,255,0.15)' : 'transparent',
                    border: `1px solid ${form.type === t ? GP.cyan : GP.line}`,
                    borderRadius: 3,
                    padding: '4px 12px',
                    fontFamily: GP.mono,
                    fontSize: 11,
                    color: form.type === t ? GP.cyan : GP.inkMute,
                    letterSpacing: 1,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Target date */}
          <div style={{ marginBottom: 16 }}>
            <Mono size={10} dim style={{ display: 'block', marginBottom: 8, letterSpacing: 1 }}>
              TARGET DATE {errors.targetDate && <span style={{ color: GP.magenta }}>— {errors.targetDate}</span>}
            </Mono>
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => set('targetDate')(e.target.value)}
              style={{
                background: GP.bg2,
                border: `1px solid ${errors.targetDate ? GP.magenta : GP.line}`,
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

          {/* Suggested milestones — engine first, model on demand */}
          <SuggestionPanel
            label={aiMilestones ? 'SUGGESTED MILESTONES (AI)' : 'SUGGESTED MILESTONES'}
            items={milestoneIdeas}
            onAdd={addMilestone_}
            onAddAll={addAllMilestones}
            onMore={form.title.trim().length >= 3 ? handleMoreIdeas : undefined}
            moreState={moreState}
            renderMeta={(m) => m.description
              ? <Mono size={10} dim style={{ display: 'block', marginTop: 2 }}>{m.description}</Mono>
              : null}
          />

          {/* Suggested supporting habits — created alongside the goal */}
          {habitIdeas.length > 0 && (
            <div style={{
              border: `1px solid ${GP.line}`,
              borderRadius: 4,
              background: GP.bg2,
              padding: '12px 14px',
              marginBottom: 16,
            }}>
              <Mono size={10} accent style={{ display: 'block', letterSpacing: 1.5, marginBottom: 4 }}>
                ✦ SUPPORTING HABITS
              </Mono>
              <Mono size={10} dim style={{ display: 'block', marginBottom: 10 }}>
                CREATED AND LINKED TO THIS GOAL
              </Mono>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {habitIdeas.map((h) => {
                  const on = pickedHabits.some((x) => x.title === h.title);
                  return (
                    <button
                      key={h.title}
                      type="button"
                      onClick={() => toggleHabit(h)}
                      style={{
                        background: on ? 'rgba(77,227,255,0.15)' : 'transparent',
                        border: `1px solid ${on ? GP.cyan : GP.line}`,
                        borderRadius: 3,
                        padding: '5px 10px',
                        fontFamily: GP.sans,
                        fontSize: 12,
                        color: on ? GP.cyan : GP.inkDim,
                        cursor: 'pointer',
                      }}
                    >
                      {on ? '✓ ' : '+ '}{h.emoji} {h.title}
                      <span style={{ fontFamily: GP.mono, fontSize: 10, opacity: 0.7 }}> · {h.frequency}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Milestones */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Mono size={10} dim style={{ letterSpacing: 1 }}>MILESTONES</Mono>
              <button
                type="button"
                onClick={addMilestone}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: GP.mono, fontSize: 11, color: GP.cyan, letterSpacing: 1,
                }}
              >
                + ADD
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Mono size={11} style={{ color: GP.inkMute, paddingTop: 12, minWidth: 16 }}>
                    {i + 1}.
                  </Mono>
                  <div style={{ flex: 1 }}>
                    <input
                      value={m.title}
                      onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                      placeholder="Milestone title"
                      style={{
                        width: '100%',
                        background: GP.bg2,
                        border: `1px solid ${GP.line}`,
                        borderRadius: 4,
                        padding: '8px 12px',
                        fontFamily: GP.mono,
                        fontSize: 12,
                        color: GP.ink,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(i)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: GP.mono, fontSize: 12, color: GP.inkMute,
                        paddingTop: 8,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <GPButton onClick={handleSubmit} loading={loading} style={{ flex: 1 }}>
              {loading ? 'CREATING…' : '◉ CREATE GOAL'}
            </GPButton>
            <button
              type="button"
              onClick={() => navigate('/goals')}
              style={{
                background: 'none',
                border: `1px solid ${GP.line}`,
                borderRadius: 4,
                padding: '10px 20px',
                fontFamily: GP.mono,
                fontSize: 11,
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
