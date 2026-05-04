import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { createHabit, updateHabit } from '../../redux/slices/habitsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow } from '../../components/gp/primitives';

const FREQUENCIES = ['daily', 'weekly', 'monthly'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CreateHabitScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const existing = route.params?.habit;
  const goals = useSelector((s) => s.goals.list);

  const [form, setForm] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    goalId: existing?.goalId || '',
    frequency: existing?.frequency || 'daily',
    daysOfWeek: existing?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    reminderTime: existing?.reminders?.[0]?.time || '',
    reminderMessage: existing?.reminders?.[0]?.message || '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [timeFocused, setTimeFocused] = useState(false);
  const [msgFocused, setMsgFocused] = useState(false);

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const toggleDay = (day) => {
    const days = form.daysOfWeek.includes(day)
      ? form.daysOfWeek.filter((d) => d !== day)
      : [...form.daysOfWeek, day].sort();
    set('daysOfWeek')(days);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.frequency === 'weekly' && form.daysOfWeek.length === 0)
      e.days = 'Select at least one day';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        frequency: form.frequency,
        daysOfWeek: form.daysOfWeek,
        ...(form.goalId && { goalId: form.goalId }),
        ...(form.reminderTime && {
          reminders: [{ time: form.reminderTime, message: form.reminderMessage, enabled: true }],
        }),
      };
      if (existing) {
        await dispatch(updateHabit({ id: existing._id, ...payload })).unwrap();
      } else {
        await dispatch(createHabit(payload)).unwrap();
      }
      navigation.goBack();
    } catch (err) {
      setSubmitError(typeof err === 'string' ? err : 'Failed to save habit');
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
        <Mono size={10} accent>{existing ? '◆ EDIT HABIT' : '◆ NEW HABIT'}</Mono>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Mono size={9} style={{ color: GP.cyan, letterSpacing: 1, opacity: loading ? 0.5 : 1 }}>
            {loading ? 'SAVING…' : 'SAVE ◉'}
          </Mono>
        </TouchableOpacity>
      </GPRow>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Mono size={8} dim style={styles.label}>◆ TITLE *</Mono>
          <View style={[styles.inputBox, titleFocused && styles.inputFocused, errors.title && styles.inputError]}>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={set('title')}
              placeholder="e.g. Study Spanish 30min"
              placeholderTextColor={GP.inkMute}
              autoCapitalize="sentences"
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
            />
          </View>
          {errors.title ? <Mono size={8} style={styles.fieldError}>{errors.title}</Mono> : null}

          <Mono size={8} dim style={styles.label}>◆ DESCRIPTION</Mono>
          <View style={[styles.inputBox, styles.textareaBox, descFocused && styles.inputFocused]}>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.description}
              onChangeText={set('description')}
              placeholder="What does this habit involve?"
              placeholderTextColor={GP.inkMute}
              autoCapitalize="sentences"
              multiline
              numberOfLines={2}
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
            />
          </View>

          <Mono size={8} dim style={styles.label}>◆ FREQUENCY *</Mono>
          <GPRow style={styles.optRow}>
            {FREQUENCIES.map((f) => {
              const active = form.frequency === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.optBtn, active && styles.optActive]}
                  onPress={() => set('frequency')(f)}
                >
                  <Mono size={8} style={{ color: active ? GP.bg : GP.inkDim, textTransform: 'uppercase' }}>{f}</Mono>
                </TouchableOpacity>
              );
            })}
          </GPRow>

          {form.frequency === 'weekly' && (
            <>
              <Mono size={8} dim style={styles.label}>◆ DAYS OF WEEK</Mono>
              <GPRow style={styles.daysRow} gap={6}>
                {DAYS.map((day, i) => {
                  const active = form.daysOfWeek.includes(i);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayBtn, active && styles.dayActive]}
                      onPress={() => toggleDay(i)}
                    >
                      <Mono size={7} style={{ color: active ? GP.bg : GP.inkDim }}>{day.toUpperCase()}</Mono>
                    </TouchableOpacity>
                  );
                })}
              </GPRow>
              {errors.days ? <Mono size={8} style={styles.fieldError}>{errors.days}</Mono> : null}
            </>
          )}

          {goals.length > 0 && (
            <>
              <Mono size={8} dim style={styles.label}>◆ LINK TO GOAL (OPTIONAL)</Mono>
              <GPRow style={[styles.optRow, { flexWrap: 'wrap' }]}>
                <TouchableOpacity
                  style={[styles.optBtn, !form.goalId && styles.optActive]}
                  onPress={() => set('goalId')('')}
                >
                  <Mono size={8} style={{ color: !form.goalId ? GP.bg : GP.inkDim }}>NONE</Mono>
                </TouchableOpacity>
                {goals.slice(0, 4).map((g) => {
                  const active = form.goalId === g._id;
                  return (
                    <TouchableOpacity
                      key={g._id}
                      style={[styles.optBtn, active && styles.optActive]}
                      onPress={() => set('goalId')(g._id)}
                    >
                      <Mono size={8} style={{ color: active ? GP.bg : GP.inkDim }} numberOfLines={1}>
                        {g.title}
                      </Mono>
                    </TouchableOpacity>
                  );
                })}
              </GPRow>
            </>
          )}

          <Mono size={8} dim style={styles.label}>◆ REMINDER TIME (HH:MM)</Mono>
          <View style={[styles.inputBox, timeFocused && styles.inputFocused]}>
            <TextInput
              style={styles.input}
              value={form.reminderTime}
              onChangeText={set('reminderTime')}
              placeholder="e.g. 19:00"
              placeholderTextColor={GP.inkMute}
              keyboardType="numeric"
              onFocus={() => setTimeFocused(true)}
              onBlur={() => setTimeFocused(false)}
            />
          </View>

          <Mono size={8} dim style={styles.label}>◆ REMINDER MESSAGE</Mono>
          <View style={[styles.inputBox, msgFocused && styles.inputFocused]}>
            <TextInput
              style={styles.input}
              value={form.reminderMessage}
              onChangeText={set('reminderMessage')}
              placeholder="e.g. Time to study!"
              placeholderTextColor={GP.inkMute}
              autoCapitalize="sentences"
              onFocus={() => setMsgFocused(true)}
              onBlur={() => setMsgFocused(false)}
            />
          </View>

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
              {loading ? 'SAVING…' : existing ? '◉ SAVE CHANGES' : '◉ CREATE HABIT'}
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
  inputBox: {
    height: 48,
    backgroundColor: GP.bg2,
    borderWidth: 1,
    borderColor: GP.line,
    borderRadius: 3,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  textareaBox: { height: 72, paddingVertical: 10, justifyContent: 'flex-start' },
  inputFocused: { borderColor: GP.cyan },
  inputError: { borderColor: GP.magenta },
  input: {
    fontSize: 14,
    color: GP.ink,
    fontFamily: GP.sans,
  },
  textarea: { textAlignVertical: 'top' },
  fieldError: { color: GP.magenta, marginTop: 4, letterSpacing: 0.5 },
  optRow: { gap: 8, marginBottom: 14 },
  optBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: GP.line,
  },
  optActive: { backgroundColor: GP.cyan, borderColor: GP.cyan },
  daysRow: { marginBottom: 14, flexWrap: 'wrap' },
  dayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GP.line,
    backgroundColor: GP.bg2,
  },
  dayActive: { backgroundColor: GP.cyan, borderColor: GP.cyan },
  saveBtn: {
    height: 50,
    backgroundColor: 'rgba(77,227,255,0.12)',
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});
