import React, { useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle, Line as SvgLine, Text as SvgText, G,
} from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard } from '../../redux/slices/analyticsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow, Ring, Chip } from '../../components/gp/primitives';

const PALETTE = [GP.cyan, GP.magenta, GP.lime, GP.amber, GP.cyan, GP.lime];
const ANGLES  = [-90, -30, 30, 90, 150, 210];

export default function DashboardScreen() {
  const dispatch = useDispatch();
  const { dashboard } = useSelector((s) => s.analytics);
  const { user } = useSelector((s) => s.auth);
  const { width } = useWindowDimensions();

  useEffect(() => { dispatch(fetchDashboard()); }, []);

  const goals = dashboard?.goals?.slice(0, 6) || [];
  const weekly = dashboard?.weeklyStats;
  const todayProgress = weekly?.habitCompletionRate ?? 0.62;
  const completedToday = weekly
    ? `${weekly.completedToday ?? Math.round(todayProgress * 8)} OF ${weekly.totalToday ?? 8}`
    : '5 OF 8';
  const streakDays = weekly?.longestStreak ?? 23;
  const summary = dashboard?.summary;

  const orbitalGoals = goals.length > 0
    ? goals.map((g, i) => ({
        label: g.title.slice(0, 9).toUpperCase(),
        p: (g.completionPercentage || 0) / 100,
        color: PALETTE[i % PALETTE.length],
        angle: ANGLES[i % ANGLES.length],
      }))
    : [
        { label: 'MARATHON', p: 0.62, color: GP.cyan,    angle: -90 },
        { label: 'DEEP WORK', p: 0.45, color: GP.magenta, angle: -30 },
        { label: 'SAVINGS',  p: 0.78, color: GP.lime,    angle: 30 },
        { label: 'SPANISH',  p: 0.33, color: GP.amber,   angle: 90 },
        { label: 'READING',  p: 0.50, color: GP.cyan,    angle: 150 },
        { label: 'SLEEP',    p: 0.88, color: GP.lime,    angle: 210 },
      ];

  const orbW = width - 28;
  const orbH = 270;
  const cx = orbW / 2;
  const cy = orbH / 2;
  const innerR = orbH * 0.27;
  const outerR = orbH * 0.44;
  const ringSize = 108;

  const dayOfYear = Math.ceil(
    (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000
  );

  const nextGoal = goals[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Mono size={8} accent>◆ DAY {dayOfYear} / 365</Mono>
            <Sans size={15} weight="600" style={{ marginTop: 2 }}>
              {user?.firstName ? `Good morning, ${user.firstName}.` : 'Command center.'}
            </Sans>
          </View>
          <Chip>5G · SYNC</Chip>
        </View>

        {/* ── Vitals row ── */}
        {summary && (
          <View style={styles.vitalsRow}>
            {[
              { l: 'MOMENTUM', v: `${Math.round(todayProgress * 100)}%`, c: GP.cyan },
              { l: 'STREAK',   v: `${streakDays}D`,                      c: GP.lime },
              { l: 'GOALS',    v: String(summary.activeGoals || 0),       c: GP.amber },
            ].map((m, i) => (
              <GPBox key={i} style={styles.vitalCell}>
                <Mono size={7} dim>{m.l}</Mono>
                <Sans size={16} weight="700" color={m.c} style={{ lineHeight: 20, marginTop: 2 }}>{m.v}</Sans>
              </GPBox>
            ))}
          </View>
        )}

        {/* ── Orbital HUD ── */}
        <View style={[styles.orbitalWrap, { width: orbW, height: orbH }]}>
          {/* SVG: orbit rings + nodes */}
          <Svg width={orbW} height={orbH} style={StyleSheet.absoluteFill}>
            {/* Background grid */}
            {[...Array(12)].map((_, i) => (
              <SvgLine key={`h${i}`} x1={0} y1={(orbH / 12) * i} x2={orbW} y2={(orbH / 12) * i}
                stroke="rgba(120,180,255,0.04)" strokeWidth={1} />
            ))}
            {[...Array(16)].map((_, i) => (
              <SvgLine key={`v${i}`} x1={(orbW / 16) * i} y1={0} x2={(orbW / 16) * i} y2={orbH}
                stroke="rgba(120,180,255,0.04)" strokeWidth={1} />
            ))}

            {/* Orbit rings */}
            <Circle cx={cx} cy={cy} r={outerR} fill="none" stroke={GP.line} strokeDasharray="0.5 1.5" />
            <Circle cx={cx} cy={cy} r={innerR} fill="none" stroke={GP.line} strokeDasharray="0.5 1.5" />

            {/* Goal nodes */}
            {orbitalGoals.map((g, i) => {
              const rad = g.angle * Math.PI / 180;
              const nx = cx + Math.cos(rad) * outerR;
              const ny = cy + Math.sin(rad) * outerR;
              return (
                <G key={i}>
                  <Circle cx={nx} cy={ny} r={4} fill="transparent" stroke={g.color} strokeWidth={1} />
                  <SvgText x={nx} y={ny + 11} textAnchor="middle"
                    fill={g.color} fontSize={5.5} fontFamily={GP.mono} letterSpacing={0.5}>
                    {g.label}
                  </SvgText>
                  <SvgText x={nx} y={ny + 18} textAnchor="middle"
                    fill={GP.inkMute} fontSize={5} fontFamily={GP.mono}>
                    {Math.round(g.p * 100)}%
                  </SvgText>
                </G>
              );
            })}

            {/* HUD overlay text */}
            <SvgText x={8} y={14}
              fill={GP.inkMute} fontSize={7} fontFamily={GP.mono} letterSpacing={0.5}>
              {`◉ ${orbitalGoals.length} ACTIVE`}
            </SvgText>
            <SvgText x={8} y={orbH - 8}
              fill={GP.inkMute} fontSize={7} fontFamily={GP.mono}>
              {`STREAK ${streakDays}D`}
            </SvgText>
            <SvgText x={orbW - 8} y={orbH - 8} textAnchor="end"
              fill={GP.cyan} fontSize={7} fontFamily={GP.mono}>
              + NEW
            </SvgText>
          </Svg>

          {/* Center ring — overlaid */}
          <View style={styles.ringOverlay} pointerEvents="none">
            <Ring size={ringSize} progress={todayProgress}>
              <Mono size={7} accent>TODAY</Mono>
              <Sans size={20} weight="700" style={{ lineHeight: 24, marginTop: 2 }}>
                {Math.round(todayProgress * 100)}
                <Sans size={10} style={{ opacity: 0.6 }}>%</Sans>
              </Sans>
              <Mono size={7} dim style={{ marginTop: 2 }}>{completedToday}</Mono>
            </Ring>
          </View>
        </View>

        {/* ── Next action ── */}
        <View style={styles.nextWrap}>
          <View style={styles.nextBorder}>
            <Mono size={7} accent>NEXT · TODAY</Mono>
            <Sans size={12} weight="500" style={{ marginTop: 4 }}>
              {nextGoal?.title || '14 km zone-2 run'}
            </Sans>
          </View>
        </View>

        {/* ── Active goals list ── */}
        {goals.length > 0 && (
          <View style={styles.goalListWrap}>
            <GPRow style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Mono size={8}>◆ ACTIVE GOALS</Mono>
              <Mono size={8} accent>+ NEW</Mono>
            </GPRow>
            {goals.map((g, i) => (
              <GPBox key={g.id || i} style={{ padding: 8, marginBottom: 4 }}>
                <GPRow style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                  <Sans size={11} weight="500">{g.title}</Sans>
                  {g.targetDate && (
                    <Mono size={7} dim>
                      {Math.max(0, Math.round(
                        (new Date(g.targetDate) - Date.now()) / 86400000
                      ))}D
                    </Mono>
                  )}
                </GPRow>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${g.completionPercentage || 0}%` }]} />
                </View>
              </GPBox>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GP.bg,
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vitalsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 6,
    marginBottom: 6,
  },
  vitalCell: {
    flex: 1,
    padding: 8,
  },
  orbitalWrap: {
    marginHorizontal: 14,
    borderWidth: 1,
    borderColor: GP.line,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ringOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextWrap: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  nextBorder: {
    borderLeftWidth: 2,
    borderLeftColor: GP.cyan,
    paddingLeft: 10,
    paddingVertical: 8,
    backgroundColor: GP.bg2,
    borderRadius: 2,
  },
  goalListWrap: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  progressTrack: {
    height: 2,
    backgroundColor: GP.line,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GP.cyan,
  },
});
