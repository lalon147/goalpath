import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchGoals, deleteGoal } from '../../store/slices/goalsSlice';
import { goalMembersAPI } from '../../services/api';
import { GP } from '../../theme/GP';
import { Mono, Sans, ProgressBar, Chip, Box, Row } from '../../components/primitives';
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

  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    dispatch(fetchGoals(filter !== 'All' ? { status: filter.toLowerCase() } : {}));
  }, [dispatch, filter]);

  // Invitations are deliberately not part of the goals list — an unanswered
  // invite is not yet yours — so they are fetched and shown separately.
  const loadInvitations = async () => {
    try {
      const { data } = await goalMembersAPI.invitations();
      setInvitations(data.data);
    } catch {
      // A failure here should not take down the goals list beneath it.
    }
  };

  useEffect(() => { loadInvitations(); }, []);

  const answerInvite = async (goalId, accept) => {
    try {
      await goalMembersAPI.respond(goalId, accept);
      await loadInvitations();
      // Accepting adds it to your goals, so the list behind this is now stale.
      if (accept) dispatch(fetchGoals(filter !== 'All' ? { status: filter.toLowerCase() } : {}));
    } catch {
      // Left visible so the user can retry; the invite stays in the list.
    }
  };

  const invitationsBlock = invitations.length > 0 && (
    <div style={{ marginBottom: 20 }}>
      <Mono size={9} dim style={{ display: 'block', marginBottom: 10 }}>
        GOAL INVITATIONS ({invitations.length})
      </Mono>
      {invitations.map((inv) => (
        <Box key={inv.goalId} style={{ background: GP.bg2, borderColor: GP.cyan, padding: 16, marginBottom: 8 }}>
          <Mono size={9} accent style={{ display: 'block' }}>
            @{inv.owner.username} INVITED YOU · {inv.progressMode === 'shared' ? 'SHARED' : 'SEPARATE'} PROGRESS
          </Mono>
          <Sans size={17} weight={700} style={{ display: 'block', marginTop: 6 }}>
            {inv.emoji} {inv.title}
          </Sans>
          {!!inv.description && (
            <Sans size={13} style={{ color: GP.inkDim, display: 'block', marginTop: 4, lineHeight: 1.5 }}>
              {inv.description}
            </Sans>
          )}
          <Row gap={8} style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => answerInvite(inv.goalId, true)}
              style={{
                padding: '9px 18px', cursor: 'pointer', borderRadius: 4,
                background: 'rgba(77,227,255,0.08)', border: `1px solid ${GP.cyan}`,
                color: GP.cyan, fontFamily: GP.mono, fontSize: 11, letterSpacing: 1,
              }}
            >
              ◉ JOIN
            </button>
            <button
              type="button"
              onClick={() => answerInvite(inv.goalId, false)}
              style={{
                padding: '9px 18px', cursor: 'pointer', borderRadius: 4,
                background: 'none', border: `1px solid ${GP.line}`,
                color: GP.inkMute, fontFamily: GP.mono, fontSize: 11, letterSpacing: 1,
              }}
            >
              DECLINE
            </button>
          </Row>
        </Box>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="gp-page">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <Mono size={10} accent style={{ display: 'block', marginBottom: 6, letterSpacing: 2 }}>◆ PATH / GOALS</Mono>
            <Sans size={22} weight={700}>Goals</Sans>
          </div>
          <button
            onClick={() => navigate('/goals/new')}
            style={{
              background: 'rgba(77,227,255,0.1)',
              border: `1px solid ${GP.cyan}`,
              borderRadius: 4,
              padding: '8px 16px',
              fontFamily: GP.mono,
              fontSize: 11,
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
                fontSize: 11,
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

        {/* Pending goal invitations — rendered above the list, and outside the
            empty state, so an invite is still answerable with no goals yet. */}
        {invitationsBlock}

        {/* Loading */}
        {loading && goals.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Mono size={11} dim>◉ LOADING…</Mono>
          </div>
        )}

        {/* Empty */}
        {!loading && goals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Mono size={10} dim style={{ display: 'block', marginBottom: 16 }}>◆ NO GOALS FOUND</Mono>
            <button
              onClick={() => navigate('/goals/new')}
              style={{
                background: 'rgba(77,227,255,0.1)',
                border: `1px solid ${GP.cyan}`,
                borderRadius: 4,
                padding: '10px 20px',
                fontFamily: GP.mono,
                fontSize: 12,
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
                    <Mono size={10} dim>
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
                <Mono size={10} dim>
                  {goal.completedMilestones}/{goal.totalMilestones} milestones
                </Mono>
                <Mono size={10} style={{ color: GP.cyan }}>
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
