import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHabitStats } from '../../redux/slices/analyticsSlice';
import { deleteHabit } from '../../redux/slices/habitsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow, GPCol } from '../../components/gp/primitives';

export default function HabitDetailScreen({ route, navigation }) {
  const { habitId } = route.params;
  const dispatch = useDispatch();
  const { habitStats: stats } = useSelector((s) => s.analytics);
  const habit = useSelector((s) => s.habits.list.find((h) => h._id === habitId));

  useEffect(() => {
    dispatch(fetchHabitStats({ id: habitId }));
  }, [habitId]);

  const handleDelete = () => {
    Alert.alert('Delete Habit', 'All logs will also be deleted. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await dispatch(deleteHabit(habitId));
          navigation.goBack();
        },
      },
    ]);
  };

  if (!habit) return null;

  return (
    <SafeAreaView style={styles.container}>
      <GPRow style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Mono size={9} style={{ color: GP.cyan, letterSpacing: 1 }}>◂ BACK</Mono>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('CreateHabit', { habit })}>
          <Mono size={9} style={{ color: GP.cyan, letterSpacing: 1 }}>EDIT ▸</Mono>
        </TouchableOpacity>
      </GPRow>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Mono size={8} accent style={{ marginBottom: 4 }}>◆ HABIT DETAIL</Mono>
        <Sans size={22} weight="700" style={{ marginBottom: 4 }}>{habit.title}</Sans>
        <GPRow gap={12} style={{ marginBottom: 12 }}>
          <Mono size={8} dim>{(habit.frequency || '').toUpperCase()}</Mono>
          <Mono size={8} dim>STATUS: {(habit.status || '').toUpperCase()}</Mono>
        </GPRow>
        {habit.description ? (
          <Sans size={13} style={{ color: GP.inkDim, lineHeight: 20, marginBottom: 16 }}>
            {habit.description}
          </Sans>
        ) : null}

        <GPBox style={styles.card}>
          <Mono size={8} accent style={{ marginBottom: 12 }}>◆ STREAKS</Mono>
          <GPRow style={{ justifyContent: 'space-around' }}>
            <GPCol style={{ alignItems: 'center' }}>
              <Sans size={28} weight="700" color={GP.cyan}>{habit.currentStreak || 0}</Sans>
              <Mono size={7} dim style={{ marginTop: 2 }}>CURRENT</Mono>
            </GPCol>
            <View style={styles.divider} />
            <GPCol style={{ alignItems: 'center' }}>
              <Sans size={28} weight="700" color={GP.lime}>{habit.longestStreak || 0}</Sans>
              <Mono size={7} dim style={{ marginTop: 2 }}>LONGEST</Mono>
            </GPCol>
            <View style={styles.divider} />
            <GPCol style={{ alignItems: 'center' }}>
              <Sans size={28} weight="700" color={GP.amber}>{habit.totalCompletions || 0}</Sans>
              <Mono size={7} dim style={{ marginTop: 2 }}>TOTAL</Mono>
            </GPCol>
          </GPRow>
        </GPBox>

        {stats && (
          <GPBox style={styles.card}>
            <Mono size={8} accent style={{ marginBottom: 12 }}>◆ LAST 30 DAYS</Mono>
            <GPRow style={{ justifyContent: 'space-around', marginBottom: 16 }}>
              <GPCol style={{ alignItems: 'center' }}>
                <Sans size={24} weight="700" color={GP.cyan}>
                  {Math.round((stats.completionRate || 0) * 100)}%
                </Sans>
                <Mono size={7} dim style={{ marginTop: 2 }}>COMPLETION</Mono>
              </GPCol>
              <View style={styles.divider} />
              <GPCol style={{ alignItems: 'center' }}>
                <Sans size={24} weight="700" color={GP.amber}>{stats.averageDuration || 0}</Sans>
                <Mono size={7} dim style={{ marginTop: 2 }}>AVG MINS</Mono>
              </GPCol>
            </GPRow>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round((stats.completionRate || 0) * 100)}%` }]} />
            </View>
            <GPRow style={{ justifyContent: 'space-around', marginTop: 14 }}>
              <GPCol style={{ alignItems: 'center' }}>
                <Mono size={9} style={{ color: GP.lime }}>
                  {stats.frequencyBreakdown?.completed || 0} DONE
                </Mono>
              </GPCol>
              <GPCol style={{ alignItems: 'center' }}>
                <Mono size={9} style={{ color: GP.amber }}>
                  {stats.frequencyBreakdown?.skipped || 0} SKIP
                </Mono>
              </GPCol>
              <GPCol style={{ alignItems: 'center' }}>
                <Mono size={9} style={{ color: GP.magenta }}>
                  {stats.frequencyBreakdown?.failed || 0} FAIL
                </Mono>
              </GPCol>
            </GPRow>
          </GPBox>
        )}

        {habit.reminders?.length > 0 && (
          <GPBox style={styles.card}>
            <Mono size={8} accent style={{ marginBottom: 10 }}>◆ REMINDERS</Mono>
            {habit.reminders.map((r, i) => (
              <GPRow key={i} style={styles.reminderRow} gap={8}>
                <Mono size={9} style={{ color: GP.cyan }}>◉</Mono>
                <Sans size={13} style={{ color: GP.inkDim }}>
                  {r.time} — {r.message || 'Reminder'}
                </Sans>
              </GPRow>
            ))}
          </GPBox>
        )}

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Mono size={10} style={{ color: GP.magenta, letterSpacing: 2 }}>◉ DELETE HABIT</Mono>
        </TouchableOpacity>
      </ScrollView>
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
  },
  scroll: { paddingHorizontal: 14, paddingBottom: 40 },
  card: {
    backgroundColor: GP.bg2,
    padding: 14,
    marginBottom: 10,
  },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: GP.line,
  },
  progressTrack: {
    height: 2,
    backgroundColor: GP.line,
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GP.cyan,
    borderRadius: 1,
  },
  reminderRow: {
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: GP.line,
  },
  deleteBtn: {
    marginTop: 16,
    height: 48,
    borderWidth: 1,
    borderColor: GP.magenta,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,62,165,0.08)',
  },
});
