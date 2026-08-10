import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { changePassword, logout } from '../../redux/slices/authSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow } from '../../components/gp/primitives';

// Kept in step with passwordRules in backend/src/validators/authValidator.js.
const RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
];

function Rule({ label, met, dormant }) {
  return (
    <GPRow gap={8} style={{ marginTop: 6 }}>
      <Mono size={9} style={{ color: dormant ? GP.inkMute : met ? GP.lime : GP.magenta }}>
        {dormant ? '·' : met ? '✓' : '✗'}
      </Mono>
      <Mono size={9} style={{ color: dormant ? GP.inkMute : met ? GP.lime : GP.inkDim }}>
        {label}
      </Mono>
    </GPRow>
  );
}

export default function ChangePasswordScreen({ navigation }) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Enter your current password';
    if (!form.newPassword) e.newPassword = 'Enter a new password';
    else if (RULES.some((r) => !r.test(form.newPassword))) e.newPassword = 'Password does not meet the rules below';
    else if (form.newPassword === form.currentPassword) e.newPassword = 'New password must be different';
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await dispatch(changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })).unwrap();

      // Changing the password revokes every refresh token server-side, so this
      // session would silently die at the next token refresh. Ending it here
      // makes that visible instead of surprising.
      Alert.alert(
        'Password changed',
        'You have been signed out everywhere. Please sign in with your new password.',
        [{ text: 'OK', onPress: () => dispatch(logout()) }]
      );
    } catch (err) {
      setSubmitError(typeof err === 'string' ? err : 'Could not change password');
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, placeholder, extra = {}) => (
    <>
      <Mono size={8} dim style={styles.label}>◆ {label}</Mono>
      <View style={[styles.inputBox, focused === key && styles.inputFocused, errors[key] && styles.inputError]}>
        <TextInput
          style={styles.input}
          value={form[key]}
          onChangeText={set(key)}
          placeholder={placeholder}
          placeholderTextColor={GP.inkMute}
          secureTextEntry={!reveal}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(key)}
          onBlur={() => setFocused(null)}
          {...extra}
        />
      </View>
      {errors[key] ? <Mono size={8} style={styles.fieldError}>{errors[key]}</Mono> : null}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GPRow style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Mono size={9} style={{ color: GP.inkDim, letterSpacing: 1 }}>CANCEL</Mono>
        </TouchableOpacity>
        <Mono size={10} accent>◆ CHANGE PASSWORD</Mono>
        <View style={{ width: 44 }} />
      </GPRow>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {field('currentPassword', 'CURRENT PASSWORD', 'Your current password', { textContentType: 'password' })}
          {field('newPassword', 'NEW PASSWORD', 'Your new password', { textContentType: 'newPassword' })}
          {field('confirmPassword', 'CONFIRM NEW PASSWORD', 'Type it again', { textContentType: 'newPassword' })}

          <TouchableOpacity onPress={() => setReveal((r) => !r)} style={{ marginTop: 12 }}>
            <Mono size={9} accent>{reveal ? '◉ HIDE PASSWORDS' : '◉ SHOW PASSWORDS'}</Mono>
          </TouchableOpacity>

          <GPBox style={styles.rulesBox}>
            <Mono size={7} dim style={{ letterSpacing: 1.5 }}>NEW PASSWORD MUST HAVE</Mono>
            {RULES.map((r) => (
              <Rule
                key={r.label}
                label={r.label}
                met={r.test(form.newPassword)}
                dormant={!form.newPassword}
              />
            ))}
          </GPBox>

          <GPBox style={[styles.rulesBox, { borderColor: GP.amber }]}>
            <Sans size={13} style={{ color: GP.inkDim, lineHeight: 20 }}>
              Changing your password signs you out on every device, including this one.
            </Sans>
          </GPBox>

          {submitError ? (
            <Mono size={9} style={{ color: GP.magenta, textAlign: 'center', marginTop: 14 }}>
              {submitError}
            </Mono>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Mono size={11} style={{ color: GP.cyan, letterSpacing: 2 }}>
              {saving ? 'CHANGING…' : '◉ CHANGE PASSWORD'}
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
  inputFocused: { borderColor: GP.cyan },
  inputError: { borderColor: GP.magenta },
  input: { fontSize: 14, color: GP.ink, fontFamily: GP.sans },
  fieldError: { color: GP.magenta, marginTop: 4, letterSpacing: 0.5 },
  rulesBox: { backgroundColor: GP.bg2, padding: 14, marginTop: 16 },
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
