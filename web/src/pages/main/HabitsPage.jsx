import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchHabits, logHabit } from '../../store/slices/habitsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, Chip, ProgressBar } from '../../components/primitives';
import Layout from '../../components/Layout';

const FREQ_COLORS = { daily: GP.cyan, weekly: GP.amber, monthly: GP.lime };
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function HabitsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: habits, loading } = useSelector((s) => s.habits);

  useEffect(() => { dispatch(fetchHabits()); }, [dispatch]);

  const handleLog = (habitId) => {
    dispatch(logHabit({ id: habitId, date: todayKey(), value: 1, notes: '' }));
  };

  const isLoggedToday = (habit) => {
    const today = todayKey();
    return habit.logs?.some((l) => l.date?.slice(0, 10) === today);
  };

  return (
    <Layout>
      <div className="gp-page">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <Mono size={8} accent style={{ display: 'block', marginBottom: 6, letterSpacing: 2 }}>◆ PATH / HABITS</Mono>
            <Sans size={20} weight={700}>Habits</Sans>
          </div>
          <button
            onClick={() => navigate('/habits/new')}
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
            + NEW HABIT
          </button>
        </div>

        {/* Today's date context */}
        <div style={{
          borderLeft: `2px solid ${GP.cyan}`,
          paddingLeft: 12,
          paddingTop: 8,
          paddingBottom: 8,
          background: GP.bg2,
          borderRadius: 2,
          marginBottom: 16,
        }}>
          <Mono size={7} accent style={{ display: 'block' }}>
            ◉ TODAY — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
          </Mono>
        </div>

        {/* Loading */}
        {loading && habits.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Mono size={9} dim>◉ LOADING…</Mono>
          </div>
        )}

        {/* Empty */}
        {!loading && habits.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Mono size={8} dim style={{ display: 'block', marginBottom: 16 }}>◆ NO HABITS TRACKED</Mono>
            <button
              onClick={() => navigate('/habits/new')}
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
              + ADD FIRST HABIT
            </button>
          </div>
        )}

        {/* Habits grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {habits.map((habit) => {
            const logged = isLoggedToday(habit);
            const streak = habit.currentStreak || 0;
            const completion = habit.completionRate || 0;

            return (
              <div
                key={habit._id}
                style={{
                  border: `1px solid ${logged ? 'rgba(77,227,255,0.3)' : GP.line}`,
                  borderRadius: 4,
                  padding: '14px 16px',
                  background: GP.bg2,
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <span style={{ fontSize: 24, lineHeight: 1, paddingTop: 2 }}>{habit.emoji || '⚡'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Sans size={14} weight={600}>{habit.name || habit.title}</Sans>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Mono size={7} style={{ color: GP.lime }}>🔥 {streak}D</Mono>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      <Chip color={FREQ_COLORS[habit.frequency] || GP.inkMute}>{habit.frequency || 'daily'}</Chip>
                      {habit.category && <Chip color={GP.inkDim}>{habit.category}</Chip>}
                      {logged && <Chip color={GP.cyan}>✓ DONE TODAY</Chip>}
                    </div>

                    {/* Week view */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                      {DAYS.map((d, i) => {
                        const day = new Date();
                        day.setDate(day.getDate() - (6 - i));
                        const dayKey = day.toISOString().slice(0, 10);
                        const done = habit.logs?.some((l) => l.date?.slice(0, 10) === dayKey);
                        const isToday = i === 6;
                        return (
                          <div key={d} style={{ textAlign: 'center' }}>
                            <div style={{
                              width: 26,
                              height: 26,
                              borderRadius: 3,
                              background: done ? (isToday ? GP.cyan : 'rgba(77,227,255,0.35)') : 'rgba(120,180,255,0.06)',
                              border: `1px solid ${isToday ? GP.cyan : GP.line}`,
                              marginBottom: 3,
                            }} />
                            <Mono size={6} dim>{d}</Mono>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, marginRight: 12 }}>
                        <ProgressBar value={completion} color={logged ? GP.cyan : undefined} />
                      </div>
                      <button
                        onClick={() => !logged && handleLog(habit._id)}
                        disabled={logged}
                        style={{
                          background: logged ? 'rgba(77,227,255,0.08)' : 'rgba(77,227,255,0.15)',
                          border: `1px solid ${logged ? 'rgba(77,227,255,0.3)' : GP.cyan}`,
                          borderRadius: 3,
                          padding: '5px 14px',
                          fontFamily: GP.mono,
                          fontSize: 8,
                          color: logged ? GP.inkMute : GP.cyan,
                          letterSpacing: 1,
                          cursor: logged ? 'default' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {logged ? '✓ LOGGED' : '◉ LOG TODAY'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
