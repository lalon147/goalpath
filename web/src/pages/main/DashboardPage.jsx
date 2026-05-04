import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboard } from '../../store/slices/analyticsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, Ring, Chip, ProgressBar } from '../../components/primitives';
import Layout from '../../components/Layout';

const PALETTE = [GP.cyan, GP.magenta, GP.lime, GP.amber, GP.cyan, GP.lime];
const ANGLES = [-90, -30, 30, 90, 150, 210];

const PLACEHOLDER_GOALS = [
  { label: 'MARATHON', p: 0.62, color: GP.cyan, angle: -90 },
  { label: 'DEEP WORK', p: 0.45, color: GP.magenta, angle: -30 },
  { label: 'SAVINGS', p: 0.78, color: GP.lime, angle: 30 },
  { label: 'SPANISH', p: 0.33, color: GP.amber, angle: 90 },
  { label: 'READING', p: 0.50, color: GP.cyan, angle: 150 },
  { label: 'SLEEP', p: 0.88, color: GP.lime, angle: 210 },
];

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dashboard } = useSelector((s) => s.analytics);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  const goals = dashboard?.goals?.slice(0, 6) || [];
  const weekly = dashboard?.weeklyStats;
  const summary = dashboard?.summary;
  const todayProgress = weekly?.habitCompletionRate ?? 0.62;
  const streakDays = weekly?.longestStreak ?? 0;
  const completedToday = weekly
    ? `${Math.round(todayProgress * (weekly.totalToday || 8))} OF ${weekly.totalToday || 8}`
    : '0 OF 0';

  const dayOfYear = Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000);

  const orbitalGoals = goals.length > 0
    ? goals.map((g, i) => ({
        label: g.title.slice(0, 9).toUpperCase(),
        p: (g.completionPercentage || 0) / 100,
        color: PALETTE[i % PALETTE.length],
        angle: ANGLES[i % ANGLES.length],
      }))
    : PLACEHOLDER_GOALS;

  // Orbital HUD SVG dimensions
  const orbW = 480;
  const orbH = 300;
  const cx = orbW / 2;
  const cy = orbH / 2;
  const outerR = orbH * 0.44;
  const innerR = orbH * 0.27;

  return (
    <Layout>
      <div className="gp-page">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <Mono size={8} accent style={{ letterSpacing: 2, display: 'block', marginBottom: 4 }}>
              ◆ DAY {dayOfYear} / 365
            </Mono>
            <Sans size={20} weight={600}>
              {user?.firstName ? `Good morning, ${user.firstName}.` : 'Command center.'}
            </Sans>
          </div>
          <Chip>5G · SYNC</Chip>
        </div>

        {/* Vitals row */}
        {summary && (
          <div className="gp-stats-grid">
            {[
              { l: 'MOMENTUM', v: `${Math.round(todayProgress * 100)}%`, c: GP.cyan },
              { l: 'STREAK', v: `${streakDays}D`, c: GP.lime },
              { l: 'GOALS', v: String(summary.activeGoals || 0), c: GP.amber },
            ].map((m) => (
              <div key={m.l} style={{
                border: `1px solid ${GP.line}`,
                borderRadius: 4,
                padding: '10px 14px',
                background: GP.bg2,
              }}>
                <Mono size={7} dim style={{ display: 'block', marginBottom: 4 }}>{m.l}</Mono>
                <Sans size={22} weight={700} color={m.c}>{m.v}</Sans>
              </div>
            ))}
          </div>
        )}

        {/* Orbital HUD */}
        <div style={{
          border: `1px solid ${GP.line}`,
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          marginBottom: 16,
          background: GP.bg2,
        }}>
          <svg width="100%" viewBox={`0 0 ${orbW} ${orbH}`} style={{ display: 'block' }}>
            {/* Background grid */}
            {Array.from({ length: 12 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={(orbH / 12) * i} x2={orbW} y2={(orbH / 12) * i}
                stroke="rgba(120,180,255,0.04)" strokeWidth={1} />
            ))}
            {Array.from({ length: 20 }, (_, i) => (
              <line key={`v${i}`} x1={(orbW / 20) * i} y1={0} x2={(orbW / 20) * i} y2={orbH}
                stroke="rgba(120,180,255,0.04)" strokeWidth={1} />
            ))}

            {/* Orbit rings */}
            <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={GP.line} strokeDasharray="0.5 1.5" />
            <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={GP.line} strokeDasharray="0.5 1.5" />

            {/* Goal nodes */}
            {orbitalGoals.map((g, i) => {
              const rad = g.angle * Math.PI / 180;
              const nx = cx + Math.cos(rad) * outerR;
              const ny = cy + Math.sin(rad) * outerR;
              return (
                <g key={i}>
                  <circle cx={nx} cy={ny} r={5} fill="transparent" stroke={g.color} strokeWidth={1} />
                  <text x={nx} y={ny + 13} textAnchor="middle"
                    fill={g.color} fontSize={6} fontFamily="'JetBrains Mono', monospace" letterSpacing={0.5}>
                    {g.label}
                  </text>
                  <text x={nx} y={ny + 21} textAnchor="middle"
                    fill={GP.inkMute} fontSize={5.5} fontFamily="'JetBrains Mono', monospace">
                    {Math.round(g.p * 100)}%
                  </text>
                </g>
              );
            })}

            {/* HUD overlays */}
            <text x={10} y={16} fill={GP.inkMute} fontSize={7} fontFamily="'JetBrains Mono', monospace" letterSpacing={0.5}>
              {`◉ ${orbitalGoals.length} ACTIVE`}
            </text>
            <text x={10} y={orbH - 10} fill={GP.inkMute} fontSize={7} fontFamily="'JetBrains Mono', monospace">
              {`STREAK ${streakDays}D`}
            </text>
          </svg>

          {/* Center ring overlay */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}>
            <Ring size={110} progress={todayProgress}>
              <Mono size={7} accent style={{ display: 'block' }}>TODAY</Mono>
              <Sans size={22} weight={700} style={{ display: 'block', lineHeight: 1.1 }}>
                {Math.round(todayProgress * 100)}
                <span style={{ fontSize: 11, opacity: 0.6 }}>%</span>
              </Sans>
              <Mono size={7} dim style={{ display: 'block', marginTop: 2 }}>{completedToday}</Mono>
            </Ring>
          </div>
        </div>

        {/* Next action */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            borderLeft: `2px solid ${GP.cyan}`,
            paddingLeft: 12,
            paddingTop: 10,
            paddingBottom: 10,
            background: GP.bg2,
            borderRadius: 2,
          }}>
            <Mono size={7} accent style={{ display: 'block', marginBottom: 4 }}>NEXT · TODAY</Mono>
            <Sans size={13} weight={500}>
              {dashboard?.recentActivity?.[0]?.milestoneTitle || goals[0]?.title || '— no active items —'}
            </Sans>
          </div>
        </div>

        {/* Quick Actions — always visible */}
        <div className="gp-actions">
          <button
            onClick={() => navigate('/goals/new')}
            style={{
              height: 40,
              background: 'rgba(77,227,255,0.08)',
              border: `1px solid ${GP.line}`,
              borderRadius: 4,
              fontFamily: GP.mono, fontSize: 9, color: GP.cyan,
              letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = GP.cyan}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = GP.line}
          >
            + NEW GOAL
          </button>
          <button
            onClick={() => navigate('/habits/new')}
            style={{
              height: 40,
              background: 'rgba(163,230,53,0.06)',
              border: `1px solid ${GP.line}`,
              borderRadius: 4,
              fontFamily: GP.mono, fontSize: 9, color: GP.lime,
              letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = GP.lime}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = GP.line}
          >
            + NEW HABIT
          </button>
        </div>

        {/* Active goals list */}
        {goals.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Mono size={8}>◆ ACTIVE GOALS</Mono>
              <button
                onClick={() => navigate('/goals/new')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: GP.mono, fontSize: 8, color: GP.cyan, letterSpacing: 1,
                }}
              >
                + NEW
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {goals.map((g) => (
                <div
                  key={g.id || g._id}
                  onClick={() => navigate(`/goals/${g.id || g._id}`)}
                  style={{
                    border: `1px solid ${GP.line}`,
                    borderRadius: 4,
                    padding: '8px 12px',
                    background: GP.bg2,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Sans size={12} weight={500}>{g.title}</Sans>
                    {g.targetDate && (
                      <Mono size={7} dim>
                        {Math.max(0, Math.round((new Date(g.targetDate) - Date.now()) / 86400000))}D
                      </Mono>
                    )}
                  </div>
                  <ProgressBar value={g.completionPercentage || 0} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {goals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Mono size={8} dim style={{ display: 'block', marginBottom: 12 }}>◆ NO ACTIVE GOALS</Mono>
            <button
              onClick={() => navigate('/goals/new')}
              style={{
                background: 'rgba(77,227,255,0.1)',
                border: `1px solid ${GP.cyan}`,
                borderRadius: 4,
                padding: '10px 20px',
                fontFamily: GP.mono,
                fontSize: 10,
                color: GP.cyan,
                letterSpacing: 2,
                cursor: 'pointer',
              }}
            >
              + DEFINE FIRST GOAL
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
