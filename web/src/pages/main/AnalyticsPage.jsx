import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GP } from '../../theme/GP';
import { Mono, Sans, ProgressBar } from '../../components/primitives';
import Layout from '../../components/Layout';
import { fetchDashboard } from '../../store/slices/analyticsSlice';

const BAR_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AnalyticsPage() {
  const dispatch = useDispatch();
  const { dashboard, loading } = useSelector((s) => s.analytics);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  const summary = dashboard?.summary;
  const weekly = dashboard?.weeklyStats;
  const goals = dashboard?.goals || [];

  // Weekly completion bars — use API data or generate placeholder
  const weeklyBars = weekly?.dailyCompletions
    || BAR_DAYS.map((d, i) => ({ day: d, value: Math.random() * 0.8 + 0.1 }));

  const maxBarVal = Math.max(...weeklyBars.map((b) => b.value || b), 1);

  const habitList = dashboard?.habits || [];

  return (
    <Layout>
      <div className="gp-page">
        <div style={{ marginBottom: 20 }}>
          <Mono size={8} accent style={{ display: 'block', marginBottom: 6, letterSpacing: 2 }}>◆ PATH / ANALYTICS</Mono>
          <Sans size={20} weight={700}>Analytics</Sans>
        </div>

        {/* Summary stats */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { l: 'ACTIVE GOALS', v: String(summary.activeGoals || 0), c: GP.cyan },
              { l: 'COMPLETED GOALS', v: String(summary.completedGoals || 0), c: GP.lime },
              { l: 'ACTIVE HABITS', v: String(summary.activeHabits || 0), c: GP.amber },
              { l: 'HABIT STREAK', v: `${weekly?.longestStreak || 0}D`, c: GP.magenta },
            ].map((s) => (
              <div key={s.l} style={{
                border: `1px solid ${GP.line}`,
                borderRadius: 4,
                padding: '12px 16px',
                background: GP.bg2,
              }}>
                <Mono size={7} dim style={{ display: 'block', marginBottom: 6 }}>{s.l}</Mono>
                <Sans size={28} weight={700} color={s.c}>{s.v}</Sans>
              </div>
            ))}
          </div>
        )}

        {/* Weekly bar chart */}
        <div style={{
          border: `1px solid ${GP.line}`,
          borderRadius: 4,
          padding: '16px',
          background: GP.bg2,
          marginBottom: 16,
        }}>
          <Mono size={8} style={{ display: 'block', marginBottom: 14 }}>◆ WEEKLY COMPLETION</Mono>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {(weekly?.dailyCompletions || weeklyBars).map((item, i) => {
              const val = typeof item === 'object' ? (item.rate || item.value || 0) : item;
              const pct = val / maxBarVal;
              const day = typeof item === 'object' ? (item.day || BAR_DAYS[i]) : BAR_DAYS[i];
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%',
                    height: Math.max(4, pct * 64),
                    background: `rgba(77,227,255,${0.3 + pct * 0.6})`,
                    borderRadius: 2,
                    transition: 'height 0.3s',
                  }} />
                  <Mono size={6} dim>{day.slice(0, 2).toUpperCase()}</Mono>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goals progress list */}
        {goals.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Mono size={8} style={{ display: 'block', marginBottom: 12 }}>◆ GOALS PROGRESS</Mono>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {goals.map((g) => (
                <div key={g._id || g.id} style={{
                  border: `1px solid ${GP.line}`,
                  borderRadius: 4,
                  padding: '10px 14px',
                  background: GP.bg2,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Sans size={13} weight={500}>{g.title}</Sans>
                    <Mono size={7} style={{ color: GP.cyan }}>{g.completionPercentage || 0}%</Mono>
                  </div>
                  <ProgressBar value={g.completionPercentage || 0} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <Mono size={7} dim>{g.completedMilestones}/{g.totalMilestones} milestones</Mono>
                    {g.targetDate && (
                      <Mono size={7} dim>
                        {Math.max(0, Math.round((new Date(g.targetDate) - Date.now()) / 86400000))}D LEFT
                      </Mono>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habit stats */}
        {habitList.length > 0 && (
          <div>
            <Mono size={8} style={{ display: 'block', marginBottom: 12 }}>◆ HABIT PERFORMANCE</Mono>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {habitList.map((h) => (
                <div key={h._id || h.id} style={{
                  border: `1px solid ${GP.line}`,
                  borderRadius: 4,
                  padding: '10px 14px',
                  background: GP.bg2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{h.emoji || '⚡'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Sans size={12} weight={500}>{h.name || h.title}</Sans>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <Mono size={7} style={{ color: GP.lime }}>🔥 {h.currentStreak || 0}D</Mono>
                        <Mono size={7} style={{ color: GP.cyan }}>{Math.round((h.completionRate || 0) * 100)}%</Mono>
                      </div>
                    </div>
                    <ProgressBar value={Math.round((h.completionRate || 0) * 100)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Mono size={9} dim>◉ LOADING…</Mono>
          </div>
        )}

        {!loading && !summary && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Mono size={8} dim>◆ NO DATA AVAILABLE</Mono>
          </div>
        )}
      </div>
    </Layout>
  );
}
