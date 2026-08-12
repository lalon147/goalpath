import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import { acknowledgeRecoveryCode } from '../../redux/slices/authSlice';
import { GP } from '../../theme/GP';

/**
 * Shown once, immediately after signup, and gated behind an explicit
 * confirmation.
 *
 * The account has no email attached, so this code is the only way back in if
 * the password is forgotten. The server keeps a hash of it and nothing else —
 * it genuinely cannot be re-sent, which is why leaving is a deliberate act
 * rather than a back gesture.
 */
export default function RecoveryCodeScreen() {
  const dispatch = useDispatch();
  const { recoveryCode, user } = useSelector((s) => s.auth);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(recoveryCode);
    setCopied(true);
  };

  const share = () => {
    Share.share({
      message: `LOCKED IN recovery code for @${user?.username}: ${recoveryCode}`,
    }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.hudLabel}>◆ LOCKED IN · SAVE THIS</Text>
          <Text style={styles.title}>Your recovery code</Text>
          <Text style={styles.subtitle}>
            You signed up with no email, so this code is the only way to get back
            in if you forget your password.
          </Text>
        </View>

        <View style={styles.codeBox}>
          <Text style={styles.code}>{recoveryCode}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={copy}>
            <Text style={styles.actionText}>{copied ? '✓ COPIED' : '◉ COPY'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={share}>
            <Text style={styles.actionText}>◉ SHARE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.warnBox}>
          <Text style={styles.warnTitle}>◉ THIS IS SHOWN ONLY ONCE</Text>
          <Text style={styles.warnBody}>
            We store a scrambled copy we cannot read, so we can never show it to
            you again or send it to you. Without it, a forgotten password means
            the account and everything in it is gone for good.
          </Text>
        </View>

        <TouchableOpacity style={styles.checkRow} onPress={() => setConfirmed(!confirmed)}>
          <View style={[styles.checkbox, confirmed && styles.checkboxOn]}>
            {confirmed && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>
            I have saved my recovery code somewhere safe
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueBtn, !confirmed && styles.continueDisabled]}
          onPress={() => dispatch(acknowledgeRecoveryCode())}
          disabled={!confirmed}
        >
          <Text style={[styles.continueText, !confirmed && { color: GP.inkMute }]}>
            ◉ CONTINUE
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GP.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  header: { marginBottom: 28 },
  hudLabel: { fontFamily: GP.mono, fontSize: 9, letterSpacing: 2, color: GP.amber, marginBottom: 8 },
  title: { fontFamily: GP.sans, fontSize: 28, fontWeight: '700', color: GP.ink, marginBottom: 8 },
  subtitle: { fontFamily: GP.sans, fontSize: 14, color: GP.inkDim, lineHeight: 21 },
  codeBox: {
    backgroundColor: GP.bg2,
    borderWidth: 1,
    borderColor: GP.amber,
    borderRadius: 4,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  code: {
    fontFamily: GP.mono,
    fontSize: 20,
    letterSpacing: 2,
    color: GP.amber,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: GP.line,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { fontFamily: GP.mono, fontSize: 10, letterSpacing: 1.5, color: GP.ink },
  warnBox: {
    backgroundColor: 'rgba(255,62,165,0.08)',
    borderWidth: 1,
    borderColor: GP.magenta,
    borderRadius: 4,
    padding: 14,
    marginBottom: 24,
  },
  warnTitle: { fontFamily: GP.mono, fontSize: 9, letterSpacing: 1.5, color: GP.magenta, marginBottom: 8 },
  warnBody: { fontFamily: GP.sans, fontSize: 13, color: GP.inkDim, lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingRight: 12 },
  checkbox: {
    width: 22, height: 22, borderWidth: 1, borderColor: GP.line, borderRadius: 3,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  checkboxOn: { borderColor: GP.cyan, backgroundColor: 'rgba(77,227,255,0.15)' },
  checkMark: { color: GP.cyan, fontSize: 13 },
  checkLabel: { flex: 1, fontFamily: GP.sans, fontSize: 13, color: GP.ink, lineHeight: 19 },
  continueBtn: {
    height: 50,
    backgroundColor: 'rgba(77,227,255,0.12)',
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueDisabled: { backgroundColor: 'transparent', borderColor: GP.line },
  continueText: { fontFamily: GP.mono, fontSize: 11, letterSpacing: 2, color: GP.cyan },
});
