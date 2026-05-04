import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { signup, clearError } from '../../redux/slices/authSlice';
import { GP } from '../../theme/GP';

function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, error }) {
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
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'none'}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingLeft: 8 }}>
            <Text style={{ fontFamily: GP.mono, fontSize: 10, color: GP.inkMute }}>
              {showPass ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function SignUpScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      e.password = 'Needs uppercase, lowercase & number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = () => {
    dispatch(clearError());
    if (!validate()) return;
    dispatch(signup({ ...form, email: form.email.trim().toLowerCase() }));
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
            <Text style={styles.subtitle}>Start your mission.</Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>◉ {error}</Text>
            </View>
          )}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="FIRST NAME" value={form.firstName} onChangeText={set('firstName')}
                placeholder="John" autoCapitalize="words" error={errors.firstName} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="LAST NAME" value={form.lastName} onChangeText={set('lastName')}
                placeholder="Doe" autoCapitalize="words" error={errors.lastName} />
            </View>
          </View>

          <Field label="EMAIL" value={form.email} onChangeText={set('email')}
            placeholder="you@example.com" keyboardType="email-address" error={errors.email} />

          <Field label="PASSWORD" value={form.password} onChangeText={set('password')}
            placeholder="Min. 8 chars" secureTextEntry error={errors.password} />

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
  title: { fontFamily: GP.sans, fontSize: 28, fontWeight: '700', color: GP.ink, marginBottom: 4 },
  subtitle: { fontFamily: GP.sans, fontSize: 14, color: GP.inkDim },
  errorBanner: {
    backgroundColor: 'rgba(255,62,165,0.12)',
    borderWidth: 1,
    borderColor: GP.magenta,
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  errorText: { fontFamily: GP.mono, fontSize: 10, color: GP.magenta, letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 12 },
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
  signUpBtn: {
    height: 50,
    backgroundColor: 'rgba(77,227,255,0.12)',
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signUpBtnText: { fontFamily: GP.mono, fontSize: 11, letterSpacing: 2, color: GP.cyan },
  linkRow: { alignItems: 'center', marginTop: 24 },
  linkText: { fontFamily: GP.sans, fontSize: 13, color: GP.inkMute },
  link: { fontFamily: GP.mono, fontSize: 10, color: GP.cyan, letterSpacing: 1 },
});
