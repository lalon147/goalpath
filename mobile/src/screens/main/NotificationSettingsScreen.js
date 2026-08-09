import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../redux/slices/authSlice';
import {
  syncRemindersFromPreferences,
  cancelDailyReminder,
  getPermissionStatus,
} from '../../services/notifications';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow } from '../../components/gp/primitives';

const clamp = (n, min, max) => (n < min ? max : n > max ? min : n);
const pad = (n) => String(n).padStart(2, '0');

function Stepper({ label, value, onDown, onUp }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity onPress={onUp} style={styles.stepBtn}>
        <Mono size={12} accent>▲</Mono>
      </TouchableOpacity>
      <Sans size={32} weight="700" style={{ marginVertical: 4 }}>{pad(value)}</Sans>
      <TouchableOpacity onPress={onDown} style={styles.stepBtn}>
        <Mono size={12} accent>▼</Mono>
      </TouchableOpacity>
      <Mono size={7} dim style={{ marginTop: 4 }}>{label}</Mono>
    </View>
  );
}

export default function NotificationSettingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const prefs = user?.preferences;

  const initial = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(prefs?.dailyReminderTime || '09:00');
  const [enabled, setEnabled] = useState(prefs?.notificationsEnabled !== false);
  const [hour, setHour] = useState(initial ? Number(initial[1]) : 9);
  const [minute, setMinute] = useState(initial ? Number(initial[2]) : 0);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    getPermissionStatus().then((s) => setBlocked(s === 'denied'));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    const time = `${pad(hour)}:${pad(minute)}`;

    try {
      const result = await dispatch(updateProfile({
        preferences: {
          notificationsEnabled: enabled,
          pushNotificationsEnabled: enabled,
          dailyReminderTime: time,
        },
      }));

      if (result.error) {
        setStatus('Could not save — check your connection.');
        return;
      }

      if (!enabled) {
        await cancelDailyReminder();
        setStatus('Reminders turned off.');
        return;
      }

      // Saving the preference and arming the notification are separate things;
      // permission can still be refused after a successful save, and saying
      // "reminder set" then would be a lie.
      const armed = await syncRemindersFromPreferences({
        notificationsEnabled: true,
        pushNotificationsEnabled: true,
        dailyReminderTime: time,
      }, { prompt: true });

      if (armed) {
        setStatus(`Reminder set for ${time} daily.`);
        setBlocked(false);
      } else {
        setBlocked(true);
        setStatus('Saved, but notifications are blocked for GoalPath.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Mono size={9} dim>◂ BACK</Mono>
        </TouchableOpacity>

        <View style={styles.header}>
          <Mono size={8} accent>◆ GOALPATH · SETTINGS</Mono>
          <Sans size={20} weight="700" style={{ marginTop: 2 }}>Notifications</Sans>
        </View>

        <GPBox style={styles.card}>
          <GPRow style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Sans size={14}>Daily reminder</Sans>
              <Mono size={8} dim style={{ marginTop: 4 }}>
                ONE NUDGE A DAY TO LOG YOUR HABITS
              </Mono>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: GP.line, true: 'rgba(77,227,255,0.4)' }}
              thumbColor={enabled ? GP.cyan : GP.inkMute}
            />
          </GPRow>
        </GPBox>

        {enabled && (
          <GPBox style={styles.card}>
            <Mono size={7} dim style={{ marginBottom: 14 }}>REMIND ME AT</Mono>
            <GPRow style={{ justifyContent: 'center', alignItems: 'center', gap: 18 }}>
              <Stepper
                label="HOUR"
                value={hour}
                onUp={() => setHour((h) => clamp(h + 1, 0, 23))}
                onDown={() => setHour((h) => clamp(h - 1, 0, 23))}
              />
              <Sans size={32} weight="700" style={{ color: GP.inkMute }}>:</Sans>
              <Stepper
                label="MINUTE"
                value={minute}
                onUp={() => setMinute((m) => clamp(m + 15, 0, 45))}
                onDown={() => setMinute((m) => clamp(m - 15, 0, 45))}
              />
            </GPRow>
          </GPBox>
        )}

        {blocked && (
          <GPBox style={[styles.card, { borderColor: GP.amber }]}>
            <Mono size={9} style={{ color: GP.amber, letterSpacing: 1 }}>◉ NOTIFICATIONS BLOCKED</Mono>
            <Sans size={13} style={{ color: GP.inkDim, marginTop: 8, lineHeight: 20 }}>
              GoalPath cannot show reminders until you allow notifications in your
              device settings.
            </Sans>
            <TouchableOpacity onPress={() => Linking.openSettings()} style={{ marginTop: 12 }}>
              <Mono size={10} accent>◉ OPEN SETTINGS</Mono>
            </TouchableOpacity>
          </GPBox>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Mono size={11} accent style={{ letterSpacing: 2 }}>
            {saving ? 'SAVING…' : '◉ SAVE'}
          </Mono>
        </TouchableOpacity>

        {!!status && (
          <Mono size={9} dim style={{ textAlign: 'center', marginTop: 14, letterSpacing: 1 }}>
            {status}
          </Mono>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GP.bg },
  scroll: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 40 },
  header: { paddingBottom: 12 },
  card: { backgroundColor: GP.bg2, padding: 16, marginBottom: 10 },
  stepBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  saveBtn: {
    height: 50,
    backgroundColor: 'rgba(77,227,255,0.12)',
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});
