import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { buildExport } from '../../services/exportData';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow, GPCol } from '../../components/gp/primitives';

function MenuItem({ label, hint, onPress, danger, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Sans size={14} style={{ color: danger ? GP.magenta : GP.ink }}>{label}</Sans>
      <Mono size={12} style={{ color: danger ? GP.magenta : GP.inkDim }}>{hint || '›'}</Mono>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { dashboard } = useSelector((s) => s.analytics);
  const [exporting, setExporting] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const payload = await buildExport(user);
      // No expo-file-system in this project, so the export rides out through the
      // system share sheet — the user picks Files, Mail, Notes, wherever.
      await Share.share({
        title: 'GoalPath data export',
        message: JSON.stringify(payload, null, 2),
      });
    } catch (err) {
      Alert.alert(
        'Export failed',
        'Could not gather your data. Check your connection and try again.'
      );
    } finally {
      setExporting(false);
    }
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Mono size={8} accent>◆ GOALPATH · YOU</Mono>
          <Sans size={20} weight="700" style={{ marginTop: 2 }}>Profile</Sans>
        </View>

        <GPBox style={styles.avatarSection}>
          <GPRow style={{ justifyContent: 'center', marginBottom: 12 }}>
            <View style={styles.avatar}>
              <Sans size={24} weight="700" color={GP.bg}>{initials}</Sans>
            </View>
          </GPRow>
          <Sans size={18} weight="700" style={{ textAlign: 'center', marginBottom: 2 }}>
            {/* Accounts created without any personal details have no name at
                all, so the username stands in as the identity. */}
            {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || `@${user?.username}`}
          </Sans>
          <Mono size={9} dim style={{ textAlign: 'center' }}>@{user?.username}</Mono>
        </GPBox>

        {dashboard?.summary && (
          <GPBox style={styles.statsCard}>
            <Mono size={8} accent style={{ marginBottom: 12 }}>◆ MISSION STATUS</Mono>
            <GPRow style={{ justifyContent: 'space-around' }}>
              <GPCol style={{ alignItems: 'center' }}>
                <Sans size={24} weight="700" color={GP.cyan}>
                  {dashboard.summary.activeGoals ?? 0}
                </Sans>
                <Mono size={7} dim style={{ marginTop: 2 }}>ACTIVE GOALS</Mono>
              </GPCol>
              <View style={styles.divider} />
              <GPCol style={{ alignItems: 'center' }}>
                <Sans size={24} weight="700" color={GP.lime}>
                  {dashboard.summary.activeHabits ?? 0}
                </Sans>
                <Mono size={7} dim style={{ marginTop: 2 }}>ACTIVE HABITS</Mono>
              </GPCol>
              <View style={styles.divider} />
              <GPCol style={{ alignItems: 'center' }}>
                <Sans size={24} weight="700" color={GP.amber}>
                  {dashboard.summary.completedMilestones ?? 0}
                </Sans>
                <Mono size={7} dim style={{ marginTop: 2 }}>MILESTONES</Mono>
              </GPCol>
            </GPRow>
          </GPBox>
        )}

        <GPBox style={styles.menuCard}>
          <Mono size={7} dim style={styles.menuSection}>SOCIAL</Mono>
          <MenuItem label="Friends" onPress={() => navigation.navigate('Friends')} />
        </GPBox>

        <GPBox style={styles.menuCard}>
          <Mono size={7} dim style={styles.menuSection}>SETTINGS</Mono>
          <MenuItem label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <MenuItem label="Notifications" onPress={() => navigation.navigate('NotificationSettings')} />
        </GPBox>

        <GPBox style={styles.menuCard}>
          <Mono size={7} dim style={styles.menuSection}>ACCOUNT</Mono>
          <MenuItem label="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
          <MenuItem
            label="Export My Data"
            hint={exporting ? '…' : '›'}
            onPress={handleExport}
            disabled={exporting}
          />
          <MenuItem label="Log Out" onPress={handleLogout} danger />
        </GPBox>

        <Mono size={8} dim style={styles.version}>GOALPATH v1.0.0</Mono>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GP.bg },
  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  scroll: { paddingHorizontal: 14, paddingBottom: 40 },
  avatarSection: {
    backgroundColor: GP.bg2,
    padding: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GP.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GP.lineStrong,
  },
  statsCard: {
    backgroundColor: GP.bg2,
    padding: 14,
    marginBottom: 10,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: GP.line,
  },
  menuCard: {
    backgroundColor: GP.bg2,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
  },
  menuSection: {
    letterSpacing: 1.5,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: GP.line,
    marginBottom: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: GP.line,
  },
  version: {
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 1.5,
  },
});
