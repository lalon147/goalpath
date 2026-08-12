import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { authAPI } from '../../services/api';
import { GP } from '../../theme/GP';

/**
 * Password recovery for accounts with no email.
 *
 * Resetting spends the old recovery code and issues a new one, so the success
 * state has to show that new code with the same care as signup does — the user
 * is otherwise left holding a code that no longer works.
 */
export default function ForgotPasswordScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = 'Username is required';
    if (!recoveryCode.trim()) e.recoveryCode = 'Recovery code is required';
    if (!newPassword) e.newPassword = 'Required';
    else if (newPassword.length < 8) e.newPassword = 'Min 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword))
      e.newPassword = 'Needs uppercase, lowercase & number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setBanner('');
    if (!validate()) return;
    setBusy(true);
    try {
      const { data } = await authAPI.recover({
        username: username.trim().toLowerCase(),
        recoveryCode: recoveryCode.trim(),
        newPassword,
      });
      setNewCode(data.data.recoveryCode);
    } catch (err) {
      setBanner(err.response?.data?.error?.message || 'Could not reset your password');
    } finally {
      setBusy(false);
    }
  };

  if (newCode) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.hudLabel}>◆ LOCKED IN · DONE</Text>
            <Text style={styles.title}>Password reset</Text>
            <Text style={styles.subtitle}>
              Your old recovery code has been used up. Here is the new one —
              save it now, it will not be shown again.
            </Text>
          </View>

          <View style={styles.codeBox}>
            <Text style={styles.code}>{newCode}</Text>
          </View>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={async () => { await Clipboard.setStringAsync(newCode); setCopied(true); }}
          >
            <Text style={styles.secondaryText}>{copied ? '✓ COPIED' : '◉ COPY CODE'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.submitText}>◉ SIGN IN</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>◂ BACK</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.hudLabel}>◆ LOCKED IN · RECOVER</Text>
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.subtitle}>
              Enter the recovery code you saved when you signed up.
            </Text>
          </View>

          {!!banner && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>◉ {banner}</Text>
            </View>
          )}

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>◆ USERNAME</Text>
            <View style={[styles.inputBox, errors.username && styles.inputError]}>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(v) => setUsername(v.replace(/\s/g, '').toLowerCase())}
                placeholder="yourname"
                placeholderTextColor={GP.inkMute}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.username ? <Text style={styles.fieldError}>{errors.username}</Text> : null}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>◆ RECOVERY CODE</Text>
            <View style={[styles.inputBox, errors.recoveryCode && styles.inputError]}>
              <TextInput
                style={[styles.input, { fontFamily: GP.mono, letterSpacing: 1 }]}
                value={recoveryCode}
                onChangeText={setRecoveryCode}
                placeholder="LI-XXXX-XXXX-XXXX"
                placeholderTextColor={GP.inkMute}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
            {errors.recoveryCode ? <Text style={styles.fieldError}>{errors.recoveryCode}</Text> : null}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>◆ NEW PASSWORD</Text>
            <View style={[styles.inputBox, errors.newPassword && styles.inputError]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min. 8 chars"
                placeholderTextColor={GP.inkMute}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingLeft: 8 }}>
                <Text style={{ fontFamily: GP.mono, fontSize: 10, color: GP.inkMute }}>
                  {showPass ? 'HIDE' : 'SHOW'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.newPassword ? <Text style={styles.fieldError}>{errors.newPassword}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, busy && { opacity: 0.6 }]}
            onPress={submit}
            disabled={busy}
          >
            <Text style={styles.submitText}>{busy ? 'RESETTING…' : '◉ RESET PASSWORD'}</Text>
          </TouchableOpacity>

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              Lost your recovery code too? There is no other way in — accounts
              have no email attached, so nothing can be sent to you. You would
              need to start a new account.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GP.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 20 },
  backText: { fontFamily: GP.mono, fontSize: 9, letterSpacing: 1.5, color: GP.inkMute },
  header: { marginBottom: 28 },
  hudLabel: { fontFamily: GP.mono, fontSize: 9, letterSpacing: 2, color: GP.cyan, marginBottom: 8 },
  title: { fontFamily: GP.sans, fontSize: 28, fontWeight: '700', color: GP.ink, marginBottom: 6 },
  subtitle: { fontFamily: GP.sans, fontSize: 14, color: GP.inkDim, lineHeight: 21 },
  errorBanner: {
    backgroundColor: 'rgba(255,62,165,0.12)',
    borderWidth: 1, borderColor: GP.magenta, borderRadius: 4,
    padding: 12, marginBottom: 20,
  },
  errorText: { fontFamily: GP.mono, fontSize: 10, color: GP.magenta, letterSpacing: 1 },
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { fontFamily: GP.mono, fontSize: 8, letterSpacing: 1.5, color: GP.inkMute, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', height: 48,
    backgroundColor: GP.bg2, borderWidth: 1, borderColor: GP.line,
    borderRadius: 4, paddingHorizontal: 12,
  },
  inputError: { borderColor: GP.magenta },
  input: { flex: 1, fontSize: 15, color: GP.ink, fontFamily: GP.sans },
  fieldError: { fontFamily: GP.mono, fontSize: 9, color: GP.magenta, marginTop: 4 },
  codeBox: {
    backgroundColor: GP.bg2, borderWidth: 1, borderColor: GP.amber, borderRadius: 4,
    paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center', marginBottom: 12,
  },
  code: { fontFamily: GP.mono, fontSize: 20, letterSpacing: 2, color: GP.amber, textAlign: 'center' },
  secondaryBtn: {
    height: 44, borderWidth: 1, borderColor: GP.line, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  secondaryText: { fontFamily: GP.mono, fontSize: 10, letterSpacing: 1.5, color: GP.ink },
  submitBtn: {
    height: 50, backgroundColor: 'rgba(77,227,255,0.12)',
    borderWidth: 1, borderColor: GP.cyan, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  submitText: { fontFamily: GP.mono, fontSize: 11, letterSpacing: 2, color: GP.cyan },
  noteBox: {
    backgroundColor: GP.bg2, borderWidth: 1, borderColor: GP.line,
    borderRadius: 4, padding: 14, marginTop: 24,
  },
  noteText: { fontFamily: GP.sans, fontSize: 12, color: GP.inkDim, lineHeight: 19 },
});
