import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { habitsAPI } from '../../services/api';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow } from '../../components/gp/primitives';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_MS = 86400000;

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const prettyRange = (startStr, endStr) => {
  const opts = { month: 'short', day: 'numeric' };
  const s = new Date(`${startStr}T00:00:00`);
  const e = new Date(`${endStr}T00:00:00`);
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`;
};

/**
 * One cell in the week grid.
 *
 * A day the habit is not due is drawn as a gap rather than a miss, so a
 * three-days-a-week habit does not look like it is being failed four times.
 */
function Cell({ cell, onPress, busy }) {
  if (!cell.due) {
    return <View style={[styles.cell, styles.cellOff]}><Mono size={8} dim>·</Mono></View>;
  }

  const done = cell.status === 'completed';
  const skipped = cell.status === 'skipped';
  const failed = cell.status === 'failed';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={cell.isFuture || busy}
      style={[
        styles.cell,
        cell.isFuture && styles.cellFuture,
        done && styles.cellDone,
        skipped && styles.cellSkipped,
        failed && styles.cellFailed,
      ]}
    >
      <Mono
        size={11}
        style={{
          color: done ? GP.lime : skipped ? GP.amber : failed ? GP.magenta : GP.inkMute,
        }}
      >
        {busy ? '·' : done ? '✓' : skipped ? '–' : failed ? '✕' : '○'}
      </Mono>
    </TouchableOpacity>
  );
}

export default function WeekLogScreen({ navigation }) {
  const [week, setWeek] = useState(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyCell, setBusyCell] = useState(null);
  const [error, setError] = useState('');

  const startFor = (weeksBack) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - weeksBack * 7);
    return ymd(d);
  };

  const load = useCallback(async (weeksBack) => {
    setError('');
    try {
      const { data } = await habitsAPI.week(startFor(weeksBack));
      setWeek(data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not load this week');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reloads whenever the tab regains focus, so a habit logged from its detail
  // screen is not stale here.
  useFocusEffect(
    useCallback(() => { load(offset); }, [load, offset])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(offset);
    setRefreshing(false);
  };

  // Cycles empty → done → skipped → empty. One tap logs the common case; the
  // rest are reachable without a menu getting in the way.
  const nextStatus = (current) => {
    if (!current) return 'completed';
    if (current === 'completed') return 'skipped';
    return null;
  };

  const toggle = async (habit, cell) => {
    const key = `${habit.habitId}|${cell.date}`;
    setBusyCell(key);
    setError('');
    try {
      await habitsAPI.setDay(habit.habitId, {
        date: cell.date,
        status: nextStatus(cell.status),
      });
      await load(offset);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save that');
    } finally {
      setBusyCell(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={GP.cyan} />
      </SafeAreaView>
    );
  }

  const summary = week?.summary;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GP.cyan} />}
      >

        <GPRow style={[styles.header, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
          <View>
            <Mono size={8} accent>◆ LOCKED IN · LOG</Mono>
            <Sans size={20} weight="700" style={{ marginTop: 2 }}>This week</Sans>
          </View>
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => navigation.navigate('HabitsList')}
          >
            <Mono size={9} accent style={{ letterSpacing: 1 }}>HABITS ▸</Mono>
          </TouchableOpacity>
        </GPRow>

        <GPRow style={styles.weekNav}>
          <TouchableOpacity onPress={() => setOffset((o) => o + 1)} style={styles.navBtn}>
            <Mono size={10} dim>◂ PREV</Mono>
          </TouchableOpacity>
          <Mono size={9} accent style={{ flex: 1, textAlign: 'center' }}>
            {week ? prettyRange(week.weekStart, week.weekEnd) : ''}
          </Mono>
          <TouchableOpacity
            onPress={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            style={[styles.navBtn, offset === 0 && { opacity: 0.3 }]}
          >
            <Mono size={10} dim>NEXT ▸</Mono>
          </TouchableOpacity>
        </GPRow>

        {!!error && (
          <GPBox style={[styles.card, { borderColor: GP.magenta }]}>
            <Mono size={9} style={{ color: GP.magenta }}>◉ {error}</Mono>
          </GPBox>
        )}

        {summary && (
          <GPBox style={styles.summaryCard}>
            <GPRow style={{ justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Sans size={24} weight="700" color={GP.cyan}>{summary.percentage}%</Sans>
                <Mono size={7} dim style={{ marginTop: 2 }}>CONSISTENCY</Mono>
              </View>
              <View style={styles.divider} />
              <View style={{ alignItems: 'center' }}>
                <Sans size={24} weight="700" color={GP.lime}>
                  {summary.totalDone}/{summary.totalDue}
                </Sans>
                <Mono size={7} dim style={{ marginTop: 2 }}>CHECK-INS</Mono>
              </View>
              <View style={styles.divider} />
              <View style={{ alignItems: 'center' }}>
                <Sans size={24} weight="700" color={GP.amber}>{summary.perfectDays}</Sans>
                <Mono size={7} dim style={{ marginTop: 2 }}>PERFECT DAYS</Mono>
              </View>
            </GPRow>
            <Mono size={7} dim style={{ marginTop: 12, lineHeight: 12 }}>
              MEASURED AGAINST DAYS ALREADY REACHED — NOT THE WHOLE WEEK
            </Mono>
          </GPBox>
        )}

        {week?.habits?.length === 0 && (
          <GPBox style={styles.card}>
            <Mono size={9} dim style={{ lineHeight: 15 }}>
              NO ACTIVE HABITS · CREATE ONE TO START LOGGING
            </Mono>
            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => navigation.navigate('CreateHabit')}
            >
              <Mono size={10} accent>+ NEW HABIT</Mono>
            </TouchableOpacity>
          </GPBox>
        )}

        {week?.habits?.length > 0 && (
          <>
            <GPRow style={styles.dayHeader}>
              <View style={{ flex: 1 }} />
              {week.days.map((d, i) => (
                <View key={d.date} style={styles.dayLabel}>
                  <Mono size={8} style={{ color: d.isToday ? GP.cyan : GP.inkMute }}>
                    {DAY_LETTERS[i]}
                  </Mono>
                  <Mono size={7} style={{ color: d.isToday ? GP.cyan : GP.inkMute, marginTop: 2 }}>
                    {Number(d.date.slice(8))}
                  </Mono>
                </View>
              ))}
            </GPRow>

            {week.habits.map((h) => (
              <GPBox key={h.habitId} style={styles.habitCard}>
                <GPRow style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => navigation.navigate('HabitDetail', { habitId: h.habitId })}
                  >
                    <Sans size={14}>{h.emoji} {h.title}</Sans>
                    <Mono size={7} dim style={{ marginTop: 3 }}>
                      {h.currentStreak}-DAY STREAK · {h.done}/{h.dueSoFar} THIS WEEK
                      {h.targetValue > 1 ? ` · ${h.targetValue}${h.unit ? ` ${h.unit}` : ''}/DAY` : ''}
                    </Mono>
                  </TouchableOpacity>
                  <Sans size={15} weight="700" color={h.percentage >= 80 ? GP.lime : GP.inkDim}>
                    {h.percentage}%
                  </Sans>
                </GPRow>

                <GPRow style={{ gap: 0 }}>
                  <View style={{ flex: 1 }} />
                  {h.cells.map((c) => (
                    <View key={c.date} style={styles.cellWrap}>
                      <Cell
                        cell={c}
                        busy={busyCell === `${h.habitId}|${c.date}`}
                        onPress={() => toggle(h, c)}
                      />
                    </View>
                  ))}
                </GPRow>
              </GPBox>
            ))}

            <GPRow style={styles.legend} gap={12}>
              <Mono size={7} style={{ color: GP.lime }}>✓ DONE</Mono>
              <Mono size={7} style={{ color: GP.amber }}>– SKIPPED</Mono>
              <Mono size={7} dim>○ NOT LOGGED</Mono>
              <Mono size={7} dim>· NOT DUE</Mono>
            </GPRow>
            <Mono size={7} dim style={{ textAlign: 'center', marginTop: 6 }}>
              TAP A DAY TO CYCLE · PAST DAYS CAN BE FILLED IN
            </Mono>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GP.bg },
  scroll: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 40 },
  header: { paddingBottom: 12 },
  weekNav: { marginBottom: 12, alignItems: 'center' },
  navBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  card: { backgroundColor: GP.bg2, padding: 16, marginBottom: 10 },
  summaryCard: { backgroundColor: GP.bg2, padding: 16, marginBottom: 14 },
  divider: { width: 1, backgroundColor: GP.line },
  habitCard: { backgroundColor: GP.bg2, padding: 12, marginBottom: 8 },
  dayHeader: { marginBottom: 6, paddingHorizontal: 12, gap: 0 },
  dayLabel: { width: 34, alignItems: 'center' },
  cellWrap: { width: 34, alignItems: 'center' },
  cell: {
    width: 28, height: 28, borderRadius: 4, borderWidth: 1,
    borderColor: GP.line, justifyContent: 'center', alignItems: 'center',
    backgroundColor: GP.bg,
  },
  cellOff: { borderColor: 'transparent', backgroundColor: 'transparent' },
  cellFuture: { opacity: 0.35 },
  cellDone: { borderColor: GP.lime, backgroundColor: 'rgba(163,255,110,0.12)' },
  cellSkipped: { borderColor: GP.amber, backgroundColor: 'rgba(255,193,77,0.12)' },
  cellFailed: { borderColor: GP.magenta, backgroundColor: 'rgba(255,62,165,0.12)' },
  legend: { marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' },
  newBtn: {
    marginTop: 12, height: 38, borderWidth: 1, borderColor: GP.cyan,
    borderRadius: 4, justifyContent: 'center', alignItems: 'center',
  },
  manageBtn: {
    paddingHorizontal: 12, height: 32, borderWidth: 1, borderColor: GP.line,
    borderRadius: 4, justifyContent: 'center', alignItems: 'center',
  },
});
