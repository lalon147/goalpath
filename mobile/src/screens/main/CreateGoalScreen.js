import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { createGoal, updateGoal } from '../../redux/slices/goalsSlice';
import { createHabit } from '../../redux/slices/habitsSlice';
import { milestonesAPI } from '../../services/api';
import {
  inferGoalFields,
  suggestTitles,
  suggestMilestones,
  suggestHabits,
  fetchAIIdeas,
} from '../../services/suggestions';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow } from '../../components/gp/primitives';
import { TitleSuggest, SuggestionPanel } from '../../components/gp/Suggest';

const CATEGORIES = ['learning', 'health', 'career', 'personal', 'financial'];
const PRIORITIES = ['low', 'medium', 'high'];
const TYPES = ['short-term', 'long-term'];
const COLOR_OPTS = ['#4de3ff', '#c8ff3e', '#ff3ea5', '#ffb547', '#a78bfa', '#34d399'];
const EMOJIS = ['🎯', '💪', '📚', '🏃', '💰', '🧘', '🎸', '✈️', '🌱', '⭐'];

const PRIORITY_COLORS = { high: GP.magenta, medium: GP.amber, low: GP.lime };
const CATEGORY_COLORS = {
  learning: GP.cyan, health: GP.lime, career: GP.amber,
  personal: GP.magenta, financial: GP.lime,
};

export default function CreateGoalScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const existing = route.params?.goal;

  const [form, setForm] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    category: existing?.category || 'personal',
    type: existing?.type || 'long-term',
    targetDate: existing?.targetDate ? existing.targetDate.split('T')[0] : '',
    priority: existing?.priority || 'medium',
    color: existing?.color || '#4de3ff',
    emoji: existing?.emoji || '🎯',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [dateFocused, setDateFocused] = useState(false);

  // Which fields the user has set themselves. The engine only fills what they
  // haven't touched, so a guess never overwrites a deliberate choice.
  const [touched, setTouched] = useState({});
  const [pickedMilestones, setPickedMilestones] = useState([]);
  const [pickedHabits, setPickedHabits] = useState([]);
  const [aiMilestones, setAiMilestones] = useState(null);
  const [moreState, setMoreState] = useState('idle');

  const set = (field) => (val) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setForm((f) => ({ ...f, [field]: val }));
  };

  // Typing the title is what drives every suggestion on this screen.
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

  const toggle = (list, setList, item) =>
    setList(
      list.some((x) => x.title === item.title)
        ? list.filter((x) => x.title !== item.title)
        : [...list, item]
    );

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

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.targetDate) e.targetDate = 'Target date is required';
    else if (new Date(form.targetDate) <= new Date()) e.targetDate = 'Target date must be in the future';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const payload = { ...form, targetDate: new Date(form.targetDate).toISOString() };
      if (existing) {
        await dispatch(updateGoal({ id: existing._id, ...payload })).unwrap();
      } else {
        const goal = await dispatch(createGoal(payload)).unwrap();
        for (const m of pickedMilestones) {
          await milestonesAPI.create(goal._id, { title: m.title, description: m.description || '' });
        }
        for (const h of pickedHabits) {
          await dispatch(createHabit({
            title: h.title,
            frequency: h.frequency,
            emoji: h.emoji,
            category: h.category,
            goalId: goal._id,
          }));
        }
      }
      navigation.goBack();
    } catch (err) {
      setSubmitError(typeof err === 'string' ? err : 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GPRow style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Mono size={9} style={{ color: GP.inkDim, letterSpacing: 1 }}>CANCEL</Mono>
        </TouchableOpacity>
        <Mono size={10} accent>{existing ? '◆ EDIT GOAL' : '◆ NEW GOAL'}</Mono>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Mono size={9} style={{ color: GP.cyan, letterSpacing: 1, opacity: loading ? 0.5 : 1 }}>
            {loading ? 'SAVING…' : 'SAVE ◉'}
          </Mono>
        </TouchableOpacity>
      </GPRow>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Mono size={8} dim style={styles.label}>CHOOSE EMOJI</Mono>
          <GPRow style={styles.emojiRow}>
            {EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, form.emoji === e && styles.emojiBtnActive]}
                onPress={() => set('emoji')(e)}
              >
                <Sans size={20}>{e}</Sans>
              </TouchableOpacity>
            ))}
          </GPRow>

          <Mono size={8} dim style={styles.label}>◆ TITLE *</Mono>
          <View style={[styles.inputBox, titleFocused && styles.inputFocused, errors.title && styles.inputError]}>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={setTitle}
              placeholder="e.g. Run a marathon"
              placeholderTextColor={GP.inkMute}
              autoCapitalize="sentences"
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
            />
          </View>
          {errors.title ? <Mono size={8} style={styles.fieldError}>{errors.title}</Mono> : null}
          <TitleSuggest items={titleIdeas} onPick={setTitle} />

          <Mono size={8} dim style={styles.label}>◆ DESCRIPTION</Mono>
          <View style={[styles.inputBox, styles.textareaBox, descFocused && styles.inputFocused]}>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.description}
              onChangeText={set('description')}
              placeholder="What do you want to achieve?"
              placeholderTextColor={GP.inkMute}
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
            />
          </View>

          <Mono size={8} dim style={styles.label}>◆ CATEGORY *</Mono>
          <GPRow style={styles.optRow}>
            {CATEGORIES.map((c) => {
              const active = form.category === c;
              const col = CATEGORY_COLORS[c] || GP.cyan;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.optBtn, active && { borderColor: col, backgroundColor: `${col}22` }]}
                  onPress={() => set('category')(c)}
                >
                  <Mono size={8} style={{ color: active ? col : GP.inkDim, textTransform: 'uppercase' }}>{c}</Mono>
                </TouchableOpacity>
              );
            })}
          </GPRow>

          <Mono size={8} dim style={styles.label}>◆ TYPE *</Mono>
          <GPRow style={styles.optRow}>
            {TYPES.map((t) => {
              const active = form.type === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.optBtn, active && styles.optActive]}
                  onPress={() => set('type')(t)}
                >
                  <Mono size={8} style={{ color: active ? GP.bg : GP.inkDim, textTransform: 'uppercase' }}>{t}</Mono>
                </TouchableOpacity>
              );
            })}
          </GPRow>

          <Mono size={8} dim style={styles.label}>◆ PRIORITY</Mono>
          <GPRow style={styles.optRow}>
            {PRIORITIES.map((p) => {
              const active = form.priority === p;
              const col = PRIORITY_COLORS[p] || GP.amber;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.optBtn, active && { borderColor: col, backgroundColor: `${col}22` }]}
                  onPress={() => set('priority')(p)}
                >
                  <Mono size={8} style={{ color: active ? col : GP.inkDim, textTransform: 'uppercase' }}>{p}</Mono>
                </TouchableOpacity>
              );
            })}
          </GPRow>

          <Mono size={8} dim style={styles.label}>◆ TARGET DATE * (YYYY-MM-DD)</Mono>
          <View style={[styles.inputBox, dateFocused && styles.inputFocused, errors.targetDate && styles.inputError]}>
            <TextInput
              style={styles.input}
              value={form.targetDate}
              onChangeText={set('targetDate')}
              placeholder="2026-12-31"
              placeholderTextColor={GP.inkMute}
              keyboardType="numeric"
              onFocus={() => setDateFocused(true)}
              onBlur={() => setDateFocused(false)}
            />
          </View>
          {errors.targetDate ? <Mono size={8} style={styles.fieldError}>{errors.targetDate}</Mono> : null}

          <Mono size={8} dim style={styles.label}>◆ COLOR</Mono>
          <GPRow style={styles.colorRow}>
            {COLOR_OPTS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, form.color === c && styles.colorSelected]}
                onPress={() => set('color')(c)}
              />
            ))}
          </GPRow>

          {/* Suggestions only apply to a new goal — editing one shouldn't
              silently create extra milestones and habits alongside the edit. */}
          {!existing && (
            <>
              <SuggestionPanel
                label={aiMilestones ? 'SUGGESTED MILESTONES (AI)' : 'SUGGESTED MILESTONES'}
                items={milestoneIdeas}
                addedTitles={pickedMilestones.map((m) => m.title)}
                onAdd={(m) => toggle(pickedMilestones, setPickedMilestones, m)}
                onAddAll={() => setPickedMilestones(milestoneIdeas)}
                onMore={form.title.trim().length >= 3 ? handleMoreIdeas : undefined}
                moreState={moreState}
              />

              <SuggestionPanel
                label="SUPPORTING HABITS"
                items={habitIdeas}
                addedTitles={pickedHabits.map((h) => h.title)}
                onAdd={(h) => toggle(pickedHabits, setPickedHabits, h)}
                onAddAll={() => setPickedHabits(habitIdeas)}
              />
            </>
          )}

          {submitError ? (
            <Mono size={9} style={{ color: GP.magenta, textAlign: 'center', marginBottom: 8 }}>
              {submitError}
            </Mono>
          ) : null}
          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Mono size={11} style={{ color: GP.cyan, letterSpacing: 2 }}>
              {loading ? 'SAVING…' : existing ? '◉ SAVE CHANGES' : '◉ CREATE GOAL'}
            </Mono>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GP.bg },
  topBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GP.line,
  },
  scroll: { padding: 14, paddingBottom: 40 },
  label: { marginBottom: 6, marginTop: 14 },
  emojiRow: { flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GP.line,
    backgroundColor: GP.bg2,
  },
  emojiBtnActive: {
    borderColor: GP.cyan,
    backgroundColor: 'rgba(77,227,255,0.12)',
  },
  inputBox: {
    height: 48,
    backgroundColor: GP.bg2,
    borderWidth: 1,
    borderColor: GP.line,
    borderRadius: 3,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  textareaBox: { height: 80, paddingVertical: 10, justifyContent: 'flex-start' },
  inputFocused: { borderColor: GP.cyan },
  inputError: { borderColor: GP.magenta },
  input: {
    fontSize: 14,
    color: GP.ink,
    fontFamily: GP.sans,
  },
  textarea: { textAlignVertical: 'top' },
  fieldError: { color: GP.magenta, marginTop: 4, letterSpacing: 0.5 },
  optRow: { flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  optBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: GP.line,
  },
  optActive: { backgroundColor: GP.cyan, borderColor: GP.cyan },
  colorRow: { gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderWidth: 2,
    borderColor: GP.ink,
  },
  saveBtn: {
    height: 50,
    backgroundColor: 'rgba(77,227,255,0.12)',
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});
