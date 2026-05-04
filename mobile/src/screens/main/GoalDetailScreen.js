import React, { useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Line as SvgLine, Polyline, Circle as SvgCircle,
  Text as SvgText,
} from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGoal, deleteGoal, completeMilestone } from '../../redux/slices/goalsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow, GPCol, Ring } from '../../components/gp/primitives';

const MOCK_PACE_POINTS = [42, 40, 38, 39, 35, 33, 30, 28, 25, 24, 22, 20];

export default function GoalDetailScreen({ route, navigation }) {
  const { goalId } = route.params;
  const dispatch = useDispatch();
  const { selectedGoal: goal, loading } = useSelector((s) => s.goals);
  const { width } = useWindowDimensions();

  useEffect(() => { dispatch(fetchGoal(goalId)); }, [goalId]);

  const handleDelete = () => {
    Alert.alert('Delete Goal', 'This will also delete all milestones. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await dispatch(deleteGoal(goalId));
          navigation.goBack();
        },
      },
    ]);
  };

  const handleCompleteMilestone = (milestoneId) => {
    dispatch(completeMilestone({ goalId, milestoneId }));
  };

  if (loading || !goal) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={GP.cyan} size="large" />
      </View>
    );
  }

  const progress = (goal.completionPercentage || 0) / 100;
  const daysLeft = goal.targetDate
    ? Math.max(0, Math.round((new Date(goal.targetDate) - Date.now()) / 86400000))
    : null;

  const chartW = width - 28 - 16; // box padding
  const chartH = 52;

  // Build chart points from mock data (12 pts spanning chartW × chartH)
  const chartPoints = MOCK_PACE_POINTS.map((y, i) => {
    const px = (i / (MOCK_PACE_POINTS.length - 1)) * chartW;
    const py = (y / 50) * chartH;
    return `${px},${py}`;
  }).join(' ');

  const paceCircles = MOCK_PACE_POINTS.map((y, i) => ({
    cx: (i / (MOCK_PACE_POINTS.length - 1)) * chartW,
    cy: (y / 50) * chartH,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <GPRow style={{ justifyContent: 'space-between' }}>
          <Mono size={8} accent>◉ GOAL:{String(goalId).slice(-2)} / {goal.title?.slice(0, 10).toUpperCase()}</Mono>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Mono size={8} dim>◂ CLOSE</Mono>
          </TouchableOpacity>
        </GPRow>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero ring + stats ── */}
        <GPRow gap={12} style={styles.heroRow}>
          <Ring size={90} progress={progress}>
            <Sans size={18} weight="700">{Math.round(progress * 100)}%</Sans>
            {daysLeft !== null && (
              <Mono size={6} dim style={{ marginTop: 1 }}>{daysLeft}D LEFT</Mono>
            )}
          </Ring>

          <GPCol style={{ flex: 1 }} gap={6}>
            <View>
              <Mono size={7} dim>TARGET</Mono>
              <Sans size={12} weight="600">
                {goal.title}
                {goal.targetDate ? ` · ${new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: "'yy" })}` : ''}
              </Sans>
            </View>
            <View>
              <Mono size={7} dim>MILESTONES</Mono>
              <Sans size={12} weight="600">
                {goal.completedMilestones || 0} / {goal.totalMilestones || 0}
              </Sans>
            </View>
            <View>
              <Mono size={7} dim>STATUS</Mono>
              <Sans size={12} weight="600" color={
                goal.status === 'completed' ? GP.lime
                  : goal.status === 'at_risk' ? GP.magenta
                  : GP.cyan
              }>
                {(goal.status || 'ACTIVE').toUpperCase()}
              </Sans>
            </View>
          </GPCol>
        </GPRow>

        {/* ── Pace chart ── */}
        <GPBox style={styles.chartBox}>
          <GPRow style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <Mono size={7}>◆ PACE · 12 WK</Mono>
            <Mono size={7} accent>▼ TRENDING −0:14/WK</Mono>
          </GPRow>
          <Svg width={chartW} height={chartH + 4}>
            {[0, 13, 26, 39, 52].map((y) => (
              <SvgLine key={y} x1={0} y1={y} x2={chartW} y2={y}
                stroke={GP.line} strokeWidth={0.3} />
            ))}
            {/* Target line */}
            <SvgLine x1={0} y1={chartH * 0.36} x2={chartW} y2={chartH * 0.36}
              stroke={GP.magenta} strokeWidth={0.4} strokeDasharray="2 2" />
            <SvgText x={chartW - 2} y={chartH * 0.36 - 2}
              fontSize={5} fill={GP.magenta} textAnchor="end" fontFamily={GP.mono}>
              TARGET
            </SvgText>
            {/* Data line */}
            <Polyline
              fill="none" stroke={GP.cyan} strokeWidth={1}
              points={chartPoints}
            />
            {paceCircles.map((pt, i) => (
              <SvgCircle key={i} cx={pt.cx} cy={pt.cy} r={1.2} fill={GP.cyan} />
            ))}
          </Svg>
        </GPBox>

        {/* ── Description ── */}
        {goal.description ? (
          <GPBox style={{ padding: 10, marginBottom: 4 }}>
            <Mono size={7} dim>◆ NOTES</Mono>
            <Sans size={11} style={{ color: GP.inkDim, marginTop: 4 }}>{goal.description}</Sans>
          </GPBox>
        ) : null}

        {/* ── Milestones ── */}
        {goal.milestones?.length > 0 && (
          <View>
            <GPRow style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <Mono size={8}>◆ MILESTONES · WK {Math.ceil(daysSinceStart(goal.createdAt) / 7)}</Mono>
              <Mono size={8} dim>
                {goal.completedMilestones || 0} / {goal.totalMilestones || 0}
              </Mono>
            </GPRow>
            <GPCol gap={4}>
              {goal.milestones.map((m) => {
                const done = m.status === 'completed';
                const active = m.status === 'in_progress';
                return (
                  <TouchableOpacity
                    key={m._id}
                    onPress={() => !done && handleCompleteMilestone(m._id)}
                  >
                    <GPRow gap={8} style={[
                      styles.milestoneRow,
                      active && { borderColor: GP.cyan, backgroundColor: 'rgba(77,227,255,0.08)' },
                    ]}>
                      <Mono size={9}
                        style={{ color: done ? GP.lime : active ? GP.cyan : GP.inkDim }}>
                        {done ? '✓' : active ? '◉' : '○'}
                      </Mono>
                      <Sans size={11} style={{
                        flex: 1,
                        opacity: done ? 0.5 : 1,
                        textDecorationLine: done ? 'line-through' : 'none',
                      }}>
                        {m.title}
                      </Sans>
                      {m.targetDate && (
                        <Mono size={7} dim>
                          {new Date(m.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Mono>
                      )}
                    </GPRow>
                  </TouchableOpacity>
                );
              })}
            </GPCol>
          </View>
        )}

        {/* ── Linked habits ── */}
        {goal.habits?.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Mono size={8} style={{ marginBottom: 6 }}>◆ LINKED HABITS</Mono>
            <GPCol gap={4}>
              {goal.habits.map((h) => (
                <GPBox key={h._id} style={{ padding: 8 }}>
                  <GPRow style={{ justifyContent: 'space-between' }}>
                    <Sans size={11} weight="500">{h.title}</Sans>
                    <Mono size={7} style={{ color: GP.lime }}>🔥 {h.currentStreak}D</Mono>
                  </GPRow>
                  <Mono size={7} dim style={{ marginTop: 2 }}>{h.frequency}</Mono>
                </GPBox>
              ))}
            </GPCol>
          </View>
        )}

        {/* ── Coach brief ── */}
        <View style={styles.coachBrief}>
          <Mono size={7} style={{ color: GP.magenta }}>◆ COACH · BRIEF</Mono>
          <Sans size={11} style={{ color: GP.inkDim, marginTop: 4 }}>
            {progress < 0.3
              ? 'Early stage. Momentum builds with consistency. Execute the cadence.'
              : progress < 0.7
              ? 'Mid-path. Keep the pressure. No negotiating on the weekly sessions.'
              : 'Final stretch. The target is within reach. Close out the milestones.'}
          </Sans>
        </View>

        {/* ── Actions ── */}
        <GPRow gap={8} style={{ marginTop: 16 }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('CreateGoal', { goal })}
          >
            <GPBox style={{ padding: 10, alignItems: 'center' }}>
              <Mono size={8} dim>EDIT</Mono>
            </GPBox>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={handleDelete}>
            <GPBox style={{ padding: 10, alignItems: 'center', borderColor: GP.magenta, backgroundColor: 'rgba(255,62,165,0.08)' }}>
              <Mono size={8} style={{ color: GP.magenta }}>DELETE</Mono>
            </GPBox>
          </TouchableOpacity>
        </GPRow>

      </ScrollView>
    </SafeAreaView>
  );
}

function daysSinceStart(createdAt) {
  if (!createdAt) return 0;
  return Math.round((Date.now() - new Date(createdAt).getTime()) / 86400000);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GP.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GP.bg,
  },
  topBar: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: GP.line,
    backgroundColor: GP.bg2,
  },
  scroll: {
    padding: 14,
    paddingBottom: 32,
    gap: 12,
  },
  heroRow: {
    alignItems: 'flex-start',
  },
  chartBox: {
    padding: 10,
  },
  milestoneRow: {
    padding: 8,
    borderWidth: 1,
    borderColor: GP.line,
    borderRadius: 3,
  },
  coachBrief: {
    borderLeftWidth: 2,
    borderLeftColor: GP.magenta,
    paddingLeft: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
});
