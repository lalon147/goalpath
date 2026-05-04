import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard } from '../../redux/slices/analyticsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow, GPCol, Ring } from '../../components/gp/primitives';

export default function AnalyticsScreen() {
  const dispatch = useDispatch();
  const { dashboard, loading } = useSelector((s) => s.analytics);

  useEffect(() => { dispatch(fetchDashboard()); }, []);

  if (loading && !dashboard) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={GP.cyan} size="large" />
      </View>
    );
  }

  const summary = dashboard?.summary;
  const weekly = dashboard?.weeklyStats;
  const completionRate = Math.round((weekly?.habitCompletionRate || 0) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Mono size={8} accent>◆ GOALPATH · INTEL</Mono>
          <Sans size={20} weight="700" style={{ marginTop: 2 }}>Analytics</Sans>
        </View>

        {summary && (
          <GPBox style={styles.card}>
            <Mono size={8} accent style={{ marginBottom: 14 }}>◆ OVERVIEW</Mono>
            <View style={styles.grid}>
              {[
                { label: 'TOTAL GOALS',   value: summary.totalGoals,          color: GP.cyan },
                { label: 'ACTIVE GOALS',  value: summary.activeGoals,         color: GP.cyan },
                { label: 'COMPLETED',     value: summary.completedGoals,      color: GP.lime },
                { label: 'MILESTONES',    value: summary.completedMilestones, color: GP.lime },
                { label: 'TOTAL HABITS',  value: summary.totalHabits,         color: GP.amber },
                { label: 'ACTIVE HABITS', value: summary.activeHabits,        color: GP.amber },
              ].map((item) => (
                <GPCol key={item.label} style={styles.gridItem}>
                  <Sans size={26} weight="700" color={item.color}>{item.value ?? 0}</Sans>
                  <Mono size={7} dim style={{ marginTop: 2, textAlign: 'center' }}>{item.label}</Mono>
                </GPCol>
              ))}
            </View>
          </GPBox>
        )}

        {weekly && (
          <GPBox style={styles.card}>
            <Mono size={8} accent style={{ marginBottom: 14 }}>◆ THIS WEEK</Mono>

            <GPRow style={{ justifyContent: 'center', marginBottom: 16 }}>
              <Ring size={100} progress={weekly.habitCompletionRate || 0} color={GP.cyan}>
                <Mono size={7} accent>HABITS</Mono>
                <Sans size={18} weight="700" style={{ lineHeight: 22 }}>{completionRate}%</Sans>
              </Ring>
            </GPRow>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
            </View>

            <GPRow style={[styles.weeklyRow, { marginTop: 14 }]}>
              <Mono size={9} dim>MILESTONES ACHIEVED</Mono>
              <Mono size={9} style={{ color: GP.lime }}>{weekly.milestonesAchieved ?? 0}</Mono>
            </GPRow>
            <View style={styles.rowDivider} />
            <GPRow style={styles.weeklyRow}>
              <Mono size={9} dim>ACTIVE STREAKS (7+ DAYS)</Mono>
              <Mono size={9} style={{ color: GP.amber }}>{weekly.streaksActive ?? 0}</Mono>
            </GPRow>
          </GPBox>
        )}

        {dashboard?.goals?.length > 0 && (
          <GPBox style={styles.card}>
            <Mono size={8} accent style={{ marginBottom: 14 }}>◆ GOALS PROGRESS</Mono>
            {dashboard.goals.map((goal) => (
              <View key={goal.id} style={styles.goalItem}>
                <GPRow style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                  <Sans size={12} weight="500" numberOfLines={1} style={{ flex: 1 }}>
                    {goal.title}
                  </Sans>
                  <Mono size={8} style={{ color: GP.cyan, marginLeft: 8 }}>
                    {goal.completionPercentage || 0}%
                  </Mono>
                </GPRow>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${goal.completionPercentage || 0}%` }]} />
                </View>
              </View>
            ))}
          </GPBox>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GP.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: GP.bg },
  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  scroll: { paddingHorizontal: 14, paddingBottom: 30 },
  card: {
    backgroundColor: GP.bg2,
    padding: 14,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 10,
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
  weeklyRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowDivider: {
    height: 1,
    backgroundColor: GP.line,
  },
  goalItem: {
    marginBottom: 12,
  },
});
