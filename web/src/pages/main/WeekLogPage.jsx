import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { habitsAPI } from '../../services/api';
import { GP } from '../../theme/GP';
import { Mono, Sans, Box, Row } from '../../components/primitives';
import Layout from '../../components/Layout';

const DAY_LETTERS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

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
function Cell({ cell, onClick, busy }) {
  const base = {
    width: 34, height: 34, borderRadius: 4, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: GP.mono, fontSize: 13,
  };

  if (!cell.due) {
    return <div style={{ ...base, color: GP.inkMute, opacity: 0.4 }}>·</div>;
  }

  const done = cell.status === 'completed';
  const skipped = cell.status === 'skipped';
  const failed = cell.status === 'failed';

  const color = done ? GP.lime : skipped ? GP.amber : failed ? GP.magenta : GP.inkMute;
  const bg = done ? 'rgba(200,255,62,0.12)'
    : skipped ? 'rgba(255,181,71,0.12)'
      : failed ? 'rgba(255,62,165,0.12)' : GP.bg;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cell.isFuture || busy}
      title={cell.date}
      style={{
        ...base,
        background: bg,
        border: `1px solid ${done || skipped || failed ? color : GP.line}`,
        color,
        cursor: cell.isFuture ? 'default' : 'pointer',
        opacity: cell.isFuture ? 0.35 : 1,
      }}
    >
      {busy ? '·' : done ? '✓' : skipped ? '–' : failed ? '✕' : '○'}
    </button>
  );
}

export default function WeekLogPage() {
  const navigate = useNavigate();
  const [week, setWeek] = useState(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => { load(offset); }, [load, offset]);

  // Cycles empty → done → skipped → empty. One click logs the common case; the
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
      await habitsAPI.setDay(habit.habitId, { date: cell.date, status: nextStatus(cell.status) });
      await load(offset);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save that');
    } finally {
      setBusyCell(null);
    }
  };

  if (loading) return <Layout><Mono size={11} dim>◉ LOADING…</Mono></Layout>;

  const summary = week?.summary;

  return (
    <Layout>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <Mono size={10} accent style={{ display: 'block', letterSpacing: 2 }}>◆ GOALPATH · LOG</Mono>
          <Sans size={24} weight={700} style={{ display: 'block', marginTop: 4 }}>This week</Sans>
        </div>
        <button
          type="button"
          onClick={() => navigate('/habits/manage')}
          style={{
            padding: '9px 14px', background: 'none', cursor: 'pointer',
            border: `1px solid ${GP.line}`, borderRadius: 4, color: GP.cyan,
            fontFamily: GP.mono, fontSize: 11, letterSpacing: 1,
          }}
        >
          HABITS ▸
        </button>
      </Row>

      <Row style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setOffset((o) => o + 1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 6,
            color: GP.inkMute, fontFamily: GP.mono, fontSize: 11, letterSpacing: 1,
          }}
        >
          ◂ PREV
        </button>
        <Mono size={11} accent>{week ? prettyRange(week.weekStart, week.weekEnd) : ''}</Mono>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          disabled={offset === 0}
          style={{
            background: 'none', border: 'none', padding: 6,
            cursor: offset === 0 ? 'default' : 'pointer',
            opacity: offset === 0 ? 0.3 : 1,
            color: GP.inkMute, fontFamily: GP.mono, fontSize: 11, letterSpacing: 1,
          }}
        >
          NEXT ▸
        </button>
      </Row>

      {!!error && (
        <Box style={{ background: GP.bg2, borderColor: GP.magenta, padding: 12, marginBottom: 14 }}>
          <Mono size={10} style={{ color: GP.magenta }}>◉ {error}</Mono>
        </Box>
      )}

      {summary && (
        <Box style={{ background: GP.bg2, padding: 18, marginBottom: 18 }}>
          <Row style={{ justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <Sans size={26} weight={700} color={GP.cyan}>{summary.percentage}%</Sans>
              <Mono size={9} dim style={{ display: 'block', marginTop: 2 }}>CONSISTENCY</Mono>
            </div>
            <div style={{ width: 1, alignSelf: 'stretch', background: GP.line }} />
            <div style={{ textAlign: 'center' }}>
              <Sans size={26} weight={700} color={GP.lime}>
                {summary.totalDone}/{summary.totalDue}
              </Sans>
              <Mono size={9} dim style={{ display: 'block', marginTop: 2 }}>CHECK-INS</Mono>
            </div>
            <div style={{ width: 1, alignSelf: 'stretch', background: GP.line }} />
            <div style={{ textAlign: 'center' }}>
              <Sans size={26} weight={700} color={GP.amber}>{summary.perfectDays}</Sans>
              <Mono size={9} dim style={{ display: 'block', marginTop: 2 }}>PERFECT DAYS</Mono>
            </div>
          </Row>
          <Mono size={9} dim style={{ display: 'block', marginTop: 14 }}>
            MEASURED AGAINST DAYS ALREADY REACHED — NOT THE WHOLE WEEK
          </Mono>
        </Box>
      )}

      {week?.habits?.length === 0 && (
        <Box style={{ background: GP.bg2, padding: 20 }}>
          <Mono size={10} dim style={{ display: 'block', marginBottom: 14 }}>
            NO ACTIVE HABITS · CREATE ONE TO START LOGGING
          </Mono>
          <button
            type="button"
            onClick={() => navigate('/habits/new')}
            style={{
              padding: '10px 18px', cursor: 'pointer', borderRadius: 4,
              background: 'rgba(77,227,255,0.1)', border: `1px solid ${GP.cyan}`,
              color: GP.cyan, fontFamily: GP.mono, fontSize: 11, letterSpacing: 1.5,
            }}
          >
            + NEW HABIT
          </button>
        </Box>
      )}

      {week?.habits?.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 560 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `minmax(180px, 1fr) repeat(7, 42px) 56px`,
              gap: 4, alignItems: 'center', padding: '0 12px 8px',
            }}>
              <div />
              {week.days.map((d, i) => (
                <div key={d.date} style={{ textAlign: 'center' }}>
                  <Mono size={9} style={{ color: d.isToday ? GP.cyan : GP.inkMute, display: 'block' }}>
                    {DAY_LETTERS[i]}
                  </Mono>
                  <Mono size={9} style={{ color: d.isToday ? GP.cyan : GP.inkMute }}>
                    {Number(d.date.slice(8))}
                  </Mono>
                </div>
              ))}
              <div />
            </div>

            {week.habits.map((h) => (
              <Box key={h.habitId} style={{ background: GP.bg2, padding: 12, marginBottom: 8 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `minmax(180px, 1fr) repeat(7, 42px) 56px`,
                  gap: 4, alignItems: 'center',
                }}>
                  <button
                    type="button"
                    onClick={() => navigate('/habits/manage')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, textAlign: 'left', minWidth: 0,
                    }}
                  >
                    <Sans size={15} style={{ display: 'block' }}>{h.emoji} {h.title}</Sans>
                    <Mono size={9} dim style={{ display: 'block', marginTop: 3 }}>
                      {h.currentStreak}-DAY STREAK · {h.done}/{h.dueSoFar} THIS WEEK
                      {h.targetValue > 1 ? ` · ${h.targetValue}${h.unit ? ` ${h.unit}` : ''}/DAY` : ''}
                    </Mono>
                  </button>

                  {h.cells.map((c) => (
                    <div key={c.date} style={{ display: 'flex', justifyContent: 'center' }}>
                      <Cell
                        cell={c}
                        busy={busyCell === `${h.habitId}|${c.date}`}
                        onClick={() => toggle(h, c)}
                      />
                    </div>
                  ))}

                  <Sans size={16} weight={700} color={h.percentage >= 80 ? GP.lime : GP.inkDim}
                    style={{ textAlign: 'right' }}>
                    {h.percentage}%
                  </Sans>
                </div>
              </Box>
            ))}
          </div>
        </div>
      )}

      {week?.habits?.length > 0 && (
        <Row gap={16} style={{ justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
          <Mono size={9} style={{ color: GP.lime }}>✓ DONE</Mono>
          <Mono size={9} style={{ color: GP.amber }}>– SKIPPED</Mono>
          <Mono size={9} dim>○ NOT LOGGED</Mono>
          <Mono size={9} dim>· NOT DUE</Mono>
          <Mono size={9} dim>CLICK A DAY TO CYCLE · PAST DAYS CAN BE FILLED IN</Mono>
        </Row>
      )}
    </Layout>
  );
}
