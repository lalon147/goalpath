import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchGoal, deleteGoal, completeMilestone } from '../../store/slices/goalsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, Ring, Chip, ProgressBar } from '../../components/primitives';
import Layout from '../../components/Layout';

const STATUS_ICON = { pending: '○', active: '◉', completed: '✓' };
const PRIORITY_COLORS = { high: GP.magenta, medium: GP.amber, low: GP.lime };
const CATEGORY_COLORS = {
  learning: '#8B5CF6', health: '#EF4444', career: '#3B82F6',
  personal: '#EC4899', financial: '#F59E0B',
};

export default function GoalDetailPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedGoal: goal, loading } = useSelector((s) => s.goals);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { dispatch(fetchGoal(id)); }, [dispatch, id]);

  const handleCompleteMilestone = (milestoneId) => {
    dispatch(completeMilestone({ goalId: id, milestoneId }));
  };

  const handleDelete = async () => {
    await dispatch(deleteGoal(id));
    navigate('/goals');
  };

  if (loading && !goal) {
    return (
      <Layout>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Mono size={9} dim>◉ LOADING…</Mono>
        </div>
      </Layout>
    );
  }

  if (!goal) {
    return (
      <Layout>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Mono size={9} dim>◆ GOAL NOT FOUND</Mono>
        </div>
      </Layout>
    );
  }

  const progress = (goal.completionPercentage || 0) / 100;
  const daysLeft = goal.targetDate
    ? Math.max(0, Math.round((new Date(goal.targetDate) - Date.now()) / 86400000))
    : null;

  // Build a simple pace sparkline based on milestone completion
  const milestones = goal.milestones || [];
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;

  // Pace chart dimensions
  const chartW = 320;
  const chartH = 60;
  const pacePoints = totalMilestones > 0
    ? milestones.map((m, i) => {
        const x = (i / Math.max(totalMilestones - 1, 1)) * chartW;
        const y = chartH - (m.status === 'completed' ? ((i + 1) / totalMilestones) * chartH : (i / totalMilestones) * chartH);
        return `${x},${y}`;
      })
    : [`0,${chartH}`, `${chartW},${chartH}`];

  return (
    <Layout>
      <div className="gp-page">
        {/* Back nav */}
        <button
          onClick={() => navigate('/goals')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: GP.mono, fontSize: 8, color: GP.inkMute,
            letterSpacing: 1, padding: 0, marginBottom: 16,
          }}
        >
          ◀ GOALS
        </button>

        {/* Cockpit header */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
          <span style={{ fontSize: 40, lineHeight: 1 }}>{goal.emoji || '🎯'}</span>
          <div style={{ flex: 1 }}>
            <Mono size={7} accent style={{ display: 'block', marginBottom: 4, letterSpacing: 2 }}>
              ◆ GOAL · {goal.category?.toUpperCase() || 'GENERAL'}
            </Mono>
            <Sans size={22} weight={700} style={{ display: 'block', marginBottom: 8 }}>{goal.title}</Sans>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {goal.category && (
                <Chip color={CATEGORY_COLORS[goal.category] || GP.inkDim}>{goal.category}</Chip>
              )}
              {goal.priority && (
                <Chip color={PRIORITY_COLORS[goal.priority] || GP.inkDim}>{goal.priority}</Chip>
              )}
              <Chip color={goal.status === 'active' ? GP.cyan : GP.inkMute}>{goal.status}</Chip>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Ring size={100} progress={progress}>
              <Sans size={20} weight={700} style={{ display: 'block', lineHeight: 1 }}>
                {goal.completionPercentage || 0}
                <span style={{ fontSize: 10, opacity: 0.5 }}>%</span>
              </Sans>
            </Ring>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { l: 'MILESTONES', v: `${completedMilestones}/${totalMilestones}`, c: GP.cyan },
            { l: 'DAYS LEFT', v: daysLeft !== null ? `${daysLeft}D` : '—', c: daysLeft !== null && daysLeft < 7 ? GP.magenta : GP.lime },
            { l: 'PROGRESS', v: `${goal.completionPercentage || 0}%`, c: GP.amber },
          ].map((s) => (
            <div key={s.l} style={{
              border: `1px solid ${GP.line}`,
              borderRadius: 4,
              padding: '10px 14px',
              background: GP.bg2,
            }}>
              <Mono size={7} dim style={{ display: 'block', marginBottom: 4 }}>{s.l}</Mono>
              <Sans size={20} weight={700} color={s.c}>{s.v}</Sans>
            </div>
          ))}
        </div>

        {/* Description */}
        {goal.description && (
          <div style={{
            border: `1px solid ${GP.line}`,
            borderRadius: 4,
            padding: '12px 16px',
            background: GP.bg2,
            marginBottom: 16,
          }}>
            <Mono size={7} dim style={{ display: 'block', marginBottom: 6 }}>◆ DESCRIPTION</Mono>
            <Sans size={13} style={{ color: GP.inkDim, lineHeight: 1.6 }}>{goal.description}</Sans>
          </div>
        )}

        {/* Pace chart */}
        <div style={{
          border: `1px solid ${GP.line}`,
          borderRadius: 4,
          padding: '14px 16px',
          background: GP.bg2,
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <Mono size={7} dim>◆ PACE CHART</Mono>
            <Mono size={7} dim>{completedMilestones} DONE</Mono>
          </div>
          <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ display: 'block' }}>
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((t) => (
              <line key={t} x1={0} y1={t * chartH} x2={chartW} y2={t * chartH}
                stroke="rgba(120,180,255,0.08)" strokeWidth={1} strokeDasharray="2 4" />
            ))}
            {/* Pace line */}
            <polyline
              points={pacePoints.join(' ')}
              fill="none"
              stroke={GP.cyan}
              strokeWidth={1.5}
              opacity={0.8}
            />
            {/* Ideal line */}
            <line x1={0} y1={chartH} x2={chartW} y2={0}
              stroke="rgba(120,180,255,0.2)" strokeWidth={1} strokeDasharray="3 4" />
          </svg>
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Mono size={8} style={{ display: 'block', marginBottom: 10 }}>◆ MILESTONES</Mono>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {milestones.map((m) => (
                <div
                  key={m._id}
                  style={{
                    border: `1px solid ${m.status === 'completed' ? 'rgba(120,180,255,0.3)' : GP.line}`,
                    borderRadius: 4,
                    padding: '10px 14px',
                    background: GP.bg2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <button
                    onClick={() => m.status !== 'completed' && handleCompleteMilestone(m._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: m.status === 'completed' ? 'default' : 'pointer',
                      fontFamily: GP.mono,
                      fontSize: 14,
                      color: m.status === 'completed' ? GP.cyan : GP.inkMute,
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    {STATUS_ICON[m.status] || '○'}
                  </button>
                  <div style={{ flex: 1 }}>
                    <Sans size={13} weight={500} style={{
                      color: m.status === 'completed' ? GP.inkDim : GP.ink,
                      textDecoration: m.status === 'completed' ? 'line-through' : 'none',
                    }}>
                      {m.title}
                    </Sans>
                    {m.description && (
                      <Mono size={7} dim style={{ display: 'block', marginTop: 2 }}>{m.description}</Mono>
                    )}
                  </div>
                  {m.targetDate && (
                    <Mono size={7} dim>
                      {new Date(m.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Mono>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coach brief */}
        {goal.coachBrief && (
          <div style={{
            borderLeft: `2px solid ${GP.magenta}`,
            paddingLeft: 12,
            paddingTop: 10,
            paddingBottom: 10,
            background: GP.bg2,
            borderRadius: 2,
            marginBottom: 16,
          }}>
            <Mono size={7} style={{ color: GP.magenta, display: 'block', marginBottom: 6 }}>◆ COACH BRIEF</Mono>
            <Sans size={13} style={{ color: GP.inkDim, lineHeight: 1.6 }}>{goal.coachBrief}</Sans>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            onClick={() => navigate(`/goals/${id}/edit`)}
            style={{
              background: 'rgba(77,227,255,0.1)',
              border: `1px solid ${GP.cyan}`,
              borderRadius: 4,
              padding: '8px 20px',
              fontFamily: GP.mono,
              fontSize: 9,
              color: GP.cyan,
              letterSpacing: 2,
              cursor: 'pointer',
            }}
          >
            ◉ EDIT GOAL
          </button>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Mono size={8} style={{ color: GP.magenta }}>Confirm delete?</Mono>
              <button
                onClick={handleDelete}
                style={{
                  background: 'rgba(255,62,165,0.1)',
                  border: `1px solid ${GP.magenta}`,
                  borderRadius: 4,
                  padding: '8px 16px',
                  fontFamily: GP.mono,
                  fontSize: 9,
                  color: GP.magenta,
                  letterSpacing: 2,
                  cursor: 'pointer',
                }}
              >
                CONFIRM
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  background: 'none',
                  border: `1px solid ${GP.line}`,
                  borderRadius: 4,
                  padding: '8px 16px',
                  fontFamily: GP.mono,
                  fontSize: 9,
                  color: GP.inkMute,
                  letterSpacing: 2,
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                background: 'none',
                border: `1px solid ${GP.line}`,
                borderRadius: 4,
                padding: '8px 20px',
                fontFamily: GP.mono,
                fontSize: 9,
                color: GP.inkMute,
                letterSpacing: 2,
                cursor: 'pointer',
              }}
            >
              DELETE
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
