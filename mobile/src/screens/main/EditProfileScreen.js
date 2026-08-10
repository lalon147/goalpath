import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../redux/slices/authSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow } from '../../components/gp/primitives';

const BIO_LIMIT = 500;

const deviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export default function EditProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    timezone: user?.timezone || 'UTC',
  });
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
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
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
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
      navigation.goBack();
    } catch (err) {
      setSubmitError(typeof err === 'string' ? err : 'Could not save your profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GPRow style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Mono size={9} style={{ color: GP.inkDim, letterSpacing: 1 }}>CANCEL</Mono>
        </TouchableOpacity>
        <Mono size={10} accent>◆ EDIT PROFILE</Mono>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Mono size={9} style={{ color: GP.cyan, letterSpacing: 1, opacity: saving ? 0.5 : 1 }}>
            {saving ? 'SAVING…' : 'SAVE ◉'}
          </Mono>
        </TouchableOpacity>
      </GPRow>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Mono size={8} dim style={styles.label}>◆ FIRST NAME *</Mono>
          <View style={[styles.inputBox, focused === 'firstName' && styles.inputFocused, errors.firstName && styles.inputError]}>
            <TextInput
              style={styles.input}
              value={form.firstName}
              onChangeText={set('firstName')}
              placeholder="First name"
              placeholderTextColor={GP.inkMute}
              autoCapitalize="words"
              onFocus={() => setFocused('firstName')}
              onBlur={() => setFocused(null)}
            />
          </View>
          {errors.firstName ? <Mono size={8} style={styles.fieldError}>{errors.firstName}</Mono> : null}

          <Mono size={8} dim style={styles.label}>◆ LAST NAME *</Mono>
          <View style={[styles.inputBox, focused === 'lastName' && styles.inputFocused, errors.lastName && styles.inputError]}>
            <TextInput
              style={styles.input}
              value={form.lastName}
              onChangeText={set('lastName')}
              placeholder="Last name"
              placeholderTextColor={GP.inkMute}
              autoCapitalize="words"
              onFocus={() => setFocused('lastName')}
              onBlur={() => setFocused(null)}
            />
          </View>
          {errors.lastName ? <Mono size={8} style={styles.fieldError}>{errors.lastName}</Mono> : null}

          <GPRow style={{ justifyContent: 'space-between', marginTop: 14, marginBottom: 6 }}>
            <Mono size={8} dim>◆ BIO</Mono>
            <Mono size={8} style={{ color: form.bio.length > BIO_LIMIT ? GP.magenta : GP.inkMute }}>
              {form.bio.length}/{BIO_LIMIT}
            </Mono>
          </GPRow>
          <View style={[styles.inputBox, styles.textareaBox, focused === 'bio' && styles.inputFocused, errors.bio && styles.inputError]}>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.bio}
              onChangeText={set('bio')}
              placeholder="A line about what you're working towards"
              placeholderTextColor={GP.inkMute}
              autoCapitalize="sentences"
              multiline
              onFocus={() => setFocused('bio')}
              onBlur={() => setFocused(null)}
            />
          </View>
          {errors.bio ? <Mono size={8} style={styles.fieldError}>{errors.bio}</Mono> : null}

          <Mono size={8} dim style={styles.label}>◆ TIMEZONE</Mono>
          <GPBox style={styles.tzBox}>
            <Sans size={14}>{form.timezone}</Sans>
            <Mono size={8} dim style={{ marginTop: 4 }}>USED TO SCHEDULE YOUR DAILY REMINDER</Mono>
            {form.timezone !== detected && (
              <TouchableOpacity onPress={() => set('timezone')(detected)} style={{ marginTop: 10 }}>
                <Mono size={9} accent>◉ USE DEVICE TIMEZONE ({detected})</Mono>
              </TouchableOpacity>
            )}
          </GPBox>

          <Mono size={8} dim style={styles.label}>◆ EMAIL</Mono>
          <GPBox style={styles.tzBox}>
            <Sans size={14} style={{ color: GP.inkMute }}>{user?.email}</Sans>
            <Mono size={8} dim style={{ marginTop: 4 }}>EMAIL CANNOT BE CHANGED YET</Mono>
          </GPBox>

          {submitError ? (
            <Mono size={9} style={{ color: GP.magenta, textAlign: 'center', marginTop: 16 }}>
              {submitError}
            </Mono>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Mono size={11} style={{ color: GP.cyan, letterSpacing: 2 }}>
              {saving ? 'SAVING…' : '◉ SAVE CHANGES'}
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
  textareaBox: { height: 96, paddingVertical: 10, justifyContent: 'flex-start' },
  inputFocused: { borderColor: GP.cyan },
  inputError: { borderColor: GP.magenta },
  input: { fontSize: 14, color: GP.ink, fontFamily: GP.sans },
  textarea: { textAlignVertical: 'top', flex: 1 },
  fieldError: { color: GP.magenta, marginTop: 4, letterSpacing: 0.5 },
  tzBox: { backgroundColor: GP.bg2, padding: 14 },
  saveBtn: {
    height: 50,
    backgroundColor: 'rgba(77,227,255,0.12)',
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
});
