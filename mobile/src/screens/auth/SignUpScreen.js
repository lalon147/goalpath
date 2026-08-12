import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { signup, clearError } from '../../redux/slices/authSlice';
import { authAPI } from '../../services/api';
import { GP } from '../../theme/GP';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function Field({ label, value, onChangeText, placeholder, secureTextEntry, error, hint, right, autoFocus }) {
  const [showPass, setShowPass] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>◆ {label}</Text>
      <View style={[styles.inputBox, error && styles.inputError]}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={GP.inkMute}
          secureTextEntry={secureTextEntry && !showPass}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
        />
        {right}
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingLeft: 8 }}>
            <Text style={{ fontFamily: GP.mono, fontSize: 10, color: GP.inkMute }}>
              {showPass ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export default function SignUpScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [check, setCheck] = useState({ state: 'idle', reason: null, suggestion: null });

  // Every keystroke would otherwise be a request. The timer is cleared on each
  // change so only the pause at the end of typing actually asks the server.
  const timer = useRef(null);
  // What the field holds right now, readable from inside an async callback
  // without making the effect depend on it.
  const latest = useRef('');
  latest.current = username.trim().toLowerCase();

  useEffect(() => {
    clearTimeout(timer.current);
    const name = username.trim().toLowerCase();

    if (!name) return setCheck({ state: 'idle', reason: null, suggestion: null });
    if (!USERNAME_RE.test(name)) {
      return setCheck({
        state: 'invalid',
        reason: '3–20 characters: letters, numbers or underscore',
        suggestion: null,
      });
    }

    setCheck({ state: 'checking', reason: null, suggestion: null });
    timer.current = setTimeout(async () => {
      try {
        const { data } = await authAPI.usernameAvailable(name);
        // The field may have moved on while this was in flight; a late answer
        // about an older name must not overwrite the current one.
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
  }, [username]);

  const validate = () => {
    const e = {};
    const name = username.trim().toLowerCase();
    if (!name) e.username = 'Required';
    else if (!USERNAME_RE.test(name)) e.username = '3–20 characters: letters, numbers or underscore';
    else if (check.state === 'taken') e.username = 'That username is taken';

    if (!password) e.password = 'Required';
    else if (password.length < 8) e.password = 'Min 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      e.password = 'Needs uppercase, lowercase & number';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = () => {
    dispatch(clearError());
    if (!validate()) return;
    dispatch(signup({ username: username.trim().toLowerCase(), password }));
  };

  const statusRight = () => {
    if (check.state === 'checking') return <ActivityIndicator size="small" color={GP.inkMute} />;
    if (check.state === 'free') return <Text style={styles.okMark}>✓</Text>;
    if (check.state === 'taken') return <Text style={styles.badMark}>✕</Text>;
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>◂ BACK</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.hudLabel}>◆ GOALPATH · REGISTER</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Pick a username and a password. That is all — no email, no real name.
            </Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>◉ {error}</Text>
            </View>
          )}

          <Field
            label="USERNAME"
            value={username}
            onChangeText={(v) => setUsername(v.replace(/\s/g, '').toLowerCase())}
            placeholder="yourname"
            error={errors.username}
            hint={check.state === 'free' ? 'Available' : check.reason}
            right={statusRight()}
            autoFocus
          />

          {check.state === 'taken' && check.suggestion && (
            <TouchableOpacity style={styles.suggestRow} onPress={() => setUsername(check.suggestion)}>
              <Text style={styles.suggestText}>
                TRY <Text style={styles.suggestName}>@{check.suggestion}</Text> ▸
              </Text>
            </TouchableOpacity>
          )}

          <Field
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 8 chars"
            secureTextEntry
            error={errors.password}
          />

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              Your username is how friends find you. After signing up you get a
              recovery code — it is the only way back in if you forget your
              password, so keep it somewhere safe.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.signUpBtn, loading && { opacity: 0.6 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.signUpBtnText}>{loading ? 'CREATING…' : '◉ CREATE ACCOUNT'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.linkText}>
              Already a member?{'  '}
              <Text style={styles.link}>SIGN IN ▸</Text>
            </Text>
          </TouchableOpacity>

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
  hudLabel: { fontFamily: GP.mono, fontSize: 9, letterSpacing: 2, color: GP.cyan, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontFamily: GP.sans, fontSize: 28, fontWeight: '700', color: GP.ink, marginBottom: 6 },
  subtitle: { fontFamily: GP.sans, fontSize: 14, color: GP.inkDim, lineHeight: 21 },
  errorBanner: {
    backgroundColor: 'rgba(255,62,165,0.12)',
    borderWidth: 1,
    borderColor: GP.magenta,
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  errorText: { fontFamily: GP.mono, fontSize: 10, color: GP.magenta, letterSpacing: 1 },
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { fontFamily: GP.mono, fontSize: 8, letterSpacing: 1.5, color: GP.inkMute, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: GP.bg2,
    borderWidth: 1,
    borderColor: GP.line,
    borderRadius: 4,
    paddingHorizontal: 12,
  },
  inputError: { borderColor: GP.magenta },
  input: { fontSize: 15, color: GP.ink, fontFamily: GP.sans },
  fieldError: { fontFamily: GP.mono, fontSize: 9, color: GP.magenta, marginTop: 4, letterSpacing: 0.5 },
  fieldHint: { fontFamily: GP.mono, fontSize: 9, color: GP.inkMute, marginTop: 4, letterSpacing: 0.5 },
  okMark: { fontFamily: GP.mono, fontSize: 13, color: GP.cyan },
  badMark: { fontFamily: GP.mono, fontSize: 13, color: GP.magenta },
  suggestRow: { marginTop: -8, marginBottom: 18 },
  suggestText: { fontFamily: GP.mono, fontSize: 10, color: GP.inkMute, letterSpacing: 1 },
  suggestName: { color: GP.cyan },
  noteBox: {
    backgroundColor: GP.bg2,
    borderWidth: 1,
    borderColor: GP.line,
    borderRadius: 4,
    padding: 14,
    marginBottom: 20,
  },
  noteText: { fontFamily: GP.sans, fontSize: 12, color: GP.inkDim, lineHeight: 19 },
  signUpBtn: {
    height: 50,
    backgroundColor: 'rgba(77,227,255,0.12)',
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  signUpBtnText: { fontFamily: GP.mono, fontSize: 11, letterSpacing: 2, color: GP.cyan },
  linkRow: { alignItems: 'center', marginTop: 24 },
  linkText: { fontFamily: GP.sans, fontSize: 13, color: GP.inkMute },
  link: { fontFamily: GP.mono, fontSize: 10, color: GP.cyan, letterSpacing: 1 },
});
