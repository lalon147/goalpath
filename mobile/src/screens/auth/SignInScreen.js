import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { signin, clearError } from '../../redux/slices/authSlice';
import { GP } from '../../theme/GP';

export default function SignInScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = 'Username is required';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignIn = () => {
    dispatch(clearError());
    if (!validate()) return;
    dispatch(signin({ username: username.trim().toLowerCase(), password }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Text style={styles.hudLabel}>◆ LOCKED IN · AUTH</Text>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Resume your mission.</Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>◉ {error}</Text>
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
            <Text style={styles.fieldLabel}>◆ PASSWORD</Text>
            <View style={[styles.inputBox, errors.password && styles.inputError]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={GP.inkMute}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingLeft: 8 }}>
                <Text style={{ fontFamily: GP.mono, fontSize: 10, color: GP.inkMute }}>
                  {showPass ? 'HIDE' : 'SHOW'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.signInBtn, loading && { opacity: 0.6 }]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.signInBtnText}>{loading ? 'SIGNING IN…' : '◉ SIGN IN'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotRow} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.linkText}>
              New?{'  '}
              <Text style={styles.link}>CREATE ACCOUNT ▸</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GP.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  header: { marginBottom: 36 },
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
  fieldWrap: { marginBottom: 20 },
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
  input: {
    flex: 1,
    fontSize: 15,
    color: GP.ink,
    fontFamily: GP.sans,
  },
  fieldError: { fontFamily: GP.mono, fontSize: 9, color: GP.magenta, marginTop: 4, letterSpacing: 0.5 },
  signInBtn: {
    height: 50,
    backgroundColor: 'rgba(77,227,255,0.12)',
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signInBtnText: { fontFamily: GP.mono, fontSize: 11, letterSpacing: 2, color: GP.cyan },
  forgotRow: { alignItems: 'center', marginTop: 18 },
  forgotText: { fontFamily: GP.mono, fontSize: 9, letterSpacing: 1.5, color: GP.inkMute },
  linkRow: { alignItems: 'center', marginTop: 20 },
  linkText: { fontFamily: GP.sans, fontSize: 13, color: GP.inkMute },
  link: { fontFamily: GP.mono, fontSize: 10, color: GP.cyan, letterSpacing: 1 },
});
