import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI } from '../../services/api';
import { GP } from '../../theme/GP';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setError('');
    if (!email.trim()) return setFieldError('Required');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setFieldError('Invalid email');
    setFieldError('');

    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      if (err.code === 'ECONNABORTED') setError('Server is waking up — please try again in a moment');
      else if (!err.response) setError('Cannot reach the server — check your connection');
      else setError(err.response?.data?.error?.message || 'Could not send reset link');
    } finally {
      setLoading(false);
    }
  };

  // The reset link opens the web app rather than deep-linking back into the
  // phone: one reset page to maintain, and no custom URL scheme to register.
  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.hudLabel}>◆ GOALPATH · RECOVERY</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.body}>
            If {email.trim().toLowerCase()} is registered, a reset link is on its way.
            It expires in one hour. Opening it will take you to the GoalPath website.
          </Text>
          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.link}>◂ BACK TO SIGN IN</Text>
          </TouchableOpacity>
        </View>
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
            <Text style={styles.hudLabel}>◆ GOALPATH · RECOVERY</Text>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>We'll send a link to your email.</Text>
          </View>

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>◉ {error}</Text>
            </View>
          )}

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>◆ EMAIL</Text>
            <View style={[styles.inputBox, !!fieldError && styles.inputError]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={GP.inkMute}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {!!fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, loading && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={loading}
          >
            <Text style={styles.sendBtnText}>{loading ? 'SENDING…' : '◉ SEND RESET LINK'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.link}>◂ BACK TO SIGN IN</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GP.bg },
  centered: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 20 },
  backText: { fontFamily: GP.mono, fontSize: 9, letterSpacing: 1.5, color: GP.inkMute },
  header: { marginBottom: 28 },
  hudLabel: { fontFamily: GP.mono, fontSize: 9, letterSpacing: 2, color: GP.cyan, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontFamily: GP.sans, fontSize: 28, fontWeight: '700', color: GP.ink, marginBottom: 4 },
  subtitle: { fontFamily: GP.sans, fontSize: 14, color: GP.inkDim },
  body: { fontFamily: GP.sans, fontSize: 14, color: GP.inkDim, lineHeight: 22, marginTop: 8 },
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
  input: { flex: 1, fontSize: 15, color: GP.ink, fontFamily: GP.sans },
  fieldError: { fontFamily: GP.mono, fontSize: 9, color: GP.magenta, marginTop: 4, letterSpacing: 0.5 },
  sendBtn: {
    height: 50,
    backgroundColor: 'rgba(77,227,255,0.12)',
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  sendBtnText: { fontFamily: GP.mono, fontSize: 11, letterSpacing: 2, color: GP.cyan },
  linkRow: { alignItems: 'center', marginTop: 24 },
  link: { fontFamily: GP.mono, fontSize: 10, color: GP.cyan, letterSpacing: 1 },
});
