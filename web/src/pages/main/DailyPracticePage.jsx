import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchDailyPractice } from '../../services/suggestions';
import { habitsAPI, milestonesAPI, goalsAPI } from '../../services/api';
import { GP } from '../../theme/GP';
import { Mono, Sans, Box, Row } from '../../components/primitives';
import Layout from '../../components/Layout';

/**
 * Turns a goal into something loggable every day.
 *
 * A goal like "run a marathon" has nothing to tick on a Tuesday. This proposes
 * one small daily action plus weekly targets that climb, so the goal becomes a
 * streak the weekly log can actually track.
 */
export default function DailyPracticePage() {
  const { id: goalId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Passed through on navigation to avoid a round trip, but fetched when the
  // page is opened directly from its URL.
  const [goal, setGoal] = useState(location.state?.goal || null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState('');
  const [unavailable, setUnavailable] = useState(false);

  const ensureGoal = async () => {
    if (goal) return goal;
    const { data } = await goalsAPI.getOne(goalId);
    setGoal(data.data);
    return data.data;
  };

  const generate = async () => {
    setLoading(true);
    setNote('');
    try {
      const g = await ensureGoal();
      const result = await fetchDailyPractice({
        title: g.title,
        category: g.category,
        description: g.description,
      });

      if (!result.ok) {
        if (result.reason === 'unavailable') {
          setUnavailable(true);
          setNote('This server has no AI key configured.');
        } else if (result.reason === 'rate-limited') {
          setNote('Too many requests just now — try again shortly.');
        } else {
          setNote('Could not reach the suggestion service.');
        }
        return;
      }
      setPlan(result);
    } catch (err) {
      setNote(err.response?.data?.error?.message || 'Could not load this goal');
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    setAdding(true);
    setNote('');
    try {
      const p = plan.practice;
      await habitsAPI.create({
        title: p.title,
        emoji: p.emoji,
        category: p.category,
        frequency: 'daily',
        targetValue: p.targetValue,
        unit: p.unit,
        goalId,
      });

      // Sequential rather than Promise.all: milestone order is assigned by the
      // server from creation order, and parallel writes would scramble it.
      for (const m of plan.weeklyMilestones) {
        await milestonesAPI.create(goalId, { title: m.title });
      }

      setNote('Added. The habit now shows up in your weekly log.');
      setPlan(null);
    } catch (err) {
      setNote(err.response?.data?.error?.message || 'Could not add that plan');
    } finally {
      setAdding(false);
    }
  };

  const primaryBtn = {
    width: '100%', height: 50, cursor: 'pointer', borderRadius: 4,
    background: 'rgba(77,227,255,0.12)', border: `1px solid ${GP.cyan}`,
    color: GP.cyan, fontFamily: GP.mono, fontSize: 12, letterSpacing: 2,
    marginTop: 16,
  };

  return (
    <Layout>
      <button
        type="button"
        onClick={() => navigate(`/goals/${goalId}`)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: GP.mono, fontSize: 10, color: GP.inkMute,
          letterSpacing: 1.5, marginBottom: 18,
        }}
      >
        ◂ BACK TO GOAL
      </button>

      <div style={{ marginBottom: 22 }}>
        <Mono size={10} style={{ color: GP.lime, display: 'block', letterSpacing: 2 }}>
          ◆ LOCKED IN · 1% BETTER
        </Mono>
        <Sans size={24} weight={700} style={{ display: 'block', marginTop: 4 }}>
          Make it a daily habit
        </Sans>
        <Sans size={14} style={{ color: GP.inkDim, display: 'block', marginTop: 8, lineHeight: 1.6 }}>
          {goal ? `“${goal.title}” is hard to act on today. ` : ''}
          This turns your goal into one small thing you can do every day, with a
          target that grows about 1% a day.
        </Sans>
      </div>

      {!!note && (
        <Box style={{ background: GP.bg2, borderColor: GP.amber, padding: 14, marginBottom: 14 }}>
          <Mono size={10} style={{ color: GP.amber }}>◉ {note}</Mono>
        </Box>
      )}

      {!plan && !unavailable && (
        <button type="button" onClick={generate} disabled={loading}
          style={{ ...primaryBtn, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'THINKING…' : '◉ BUILD MY DAILY PRACTICE'}
        </button>
      )}

      {plan && (
        <>
          <Box style={{ background: GP.bg2, borderColor: GP.cyan, padding: 18, marginBottom: 18 }}>
            <Mono size={9} dim style={{ display: 'block' }}>DO THIS EVERY DAY</Mono>
            <Sans size={19} weight={700} style={{ display: 'block', marginTop: 6 }}>
              {plan.practice.emoji} {plan.practice.title}
            </Sans>
            <Row gap={8} style={{ marginTop: 12, alignItems: 'baseline' }}>
              <Sans size={30} weight={700} color={GP.cyan}>{plan.practice.targetValue}</Sans>
              <Mono size={10} dim>{(plan.practice.unit || '').toUpperCase()} TO START</Mono>
            </Row>
            {!!plan.practice.why && (
              <Sans size={13} style={{ color: GP.inkDim, display: 'block', marginTop: 12, lineHeight: 1.6 }}>
                {plan.practice.why}
              </Sans>
            )}
          </Box>

          <Mono size={9} dim style={{ display: 'block', marginBottom: 10 }}>
            WEEKLY TARGETS · ADDED AS MILESTONES
          </Mono>

          {plan.weeklyMilestones.map((m) => (
            <Box key={m.week} style={{ background: GP.bg2, padding: 12, marginBottom: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={12} style={{ flex: 1, minWidth: 0 }}>
                  <Mono size={10} accent style={{ width: 28 }}>W{m.week}</Mono>
                  <Sans size={14}>{m.title}</Sans>
                </Row>
                <Mono size={10} dim>
                  {m.targetValue}{plan.practice.unit ? ` ${plan.practice.unit}` : ''}
                </Mono>
              </Row>
            </Box>
          ))}

          <button type="button" onClick={apply} disabled={adding}
            style={{ ...primaryBtn, opacity: adding ? 0.6 : 1 }}>
            {adding ? 'ADDING…' : '◉ ADD HABIT + MILESTONES'}
          </button>

          <button type="button" onClick={generate} disabled={loading}
            style={{
              width: '100%', height: 42, cursor: 'pointer', borderRadius: 4,
              background: 'none', border: `1px solid ${GP.line}`, color: GP.inkMute,
              fontFamily: GP.mono, fontSize: 11, letterSpacing: 1, marginTop: 10,
            }}>
            ↻ TRY A DIFFERENT PLAN
          </button>
        </>
      )}
    </Layout>
  );
}
