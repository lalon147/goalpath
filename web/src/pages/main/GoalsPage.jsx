import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchGoals, deleteGoal } from '../../store/slices/goalsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, ProgressBar, Chip } from '../../components/primitives';
import Layout from '../../components/Layout';

const FILTERS = ['All', 'Active', 'Completed', 'Paused'];

const CATEGORY_COLORS = {
  learning: '#8B5CF6', health: '#EF4444', career: '#3B82F6',
  personal: '#EC4899', financial: '#F59E0B',
};
const PRIORITY_COLORS = { high: GP.magenta, medium: GP.amber, low: GP.lime };

export default function GoalsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: goals, loading } = useSelector((s) => s.goals);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    dispatch(fetchGoals(filter !== 'All' ? { status: filter.toLowerCase() } : {}));
  }, [dispatch, filter]);

  return (
    <Layout>
      <div className="gp-page">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <Mono size={8} accent style={{ display: 'block', marginBottom: 6, letterSpacing: 2 }}>◆ PATH / GOALS</Mono>
            <Sans size={20} weight={700}>Goals</Sans>
          </div>
          <button
            onClick={() => navigate('/goals/new')}
            style={{
              background: 'rgba(77,227,255,0.1)',
              border: `1px solid ${GP.cyan}`,
              borderRadius: 4,
              padding: '8px 16px',
              fontFamily: GP.mono,
              fontSize: 9,
              color: GP.cyan,
              letterSpacing: 2,
              cursor: 'pointer',
            }}
          >
            + NEW GOAL
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'rgba(77,227,255,0.15)' : 'transparent',
                border: `1px solid ${filter === f ? GP.cyan : GP.line}`,
                borderRadius: 3,
                padding: '4px 12px',
                fontFamily: GP.mono,
                fontSize: 8,
                color: filter === f ? GP.cyan : GP.inkMute,
                letterSpacing: 1,
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && goals.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Mono size={9} dim>◉ LOADING…</Mono>
          </div>
        )}

        {/* Empty */}
        {!loading && goals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Mono size={8} dim style={{ display: 'block', marginBottom: 16 }}>◆ NO GOALS FOUND</Mono>
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

        {/* Goals list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {goals.map((goal) => (
            <div
              key={goal._id}
              onClick={() => navigate(`/goals/${goal._id}`)}
              style={{
                border: `1px solid ${GP.line}`,
                borderRadius: 4,
                padding: '14px 16px',
                background: GP.bg2,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = GP.lineStrong}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = GP.line}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{goal.emoji || '🎯'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Sans size={14} weight={600}>{goal.title}</Sans>
                    <Mono size={7} dim>
                      {goal.targetDate
                        ? `${Math.max(0, Math.round((new Date(goal.targetDate) - Date.now()) / 86400000))}D`
                        : '—'}
                    </Mono>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {goal.category && (
                      <Chip color={CATEGORY_COLORS[goal.category] || GP.inkDim}>
                        {goal.category}
                      </Chip>
                    )}
                    {goal.priority && (
                      <Chip color={PRIORITY_COLORS[goal.priority] || GP.inkDim}>
                        {goal.priority}
                      </Chip>
                    )}
                    <Chip color={goal.status === 'active' ? GP.cyan : GP.inkMute}>
                      {goal.status}
                    </Chip>
                  </div>
                </div>
              </div>
              <ProgressBar value={goal.completionPercentage || 0} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <Mono size={7} dim>
                  {goal.completedMilestones}/{goal.totalMilestones} milestones
                </Mono>
                <Mono size={7} style={{ color: GP.cyan }}>
                  {goal.completionPercentage || 0}%
                </Mono>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
