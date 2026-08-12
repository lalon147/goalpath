import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { goalMembersAPI, goalsAPI, friendsAPI } from '../../services/api';
import { GP } from '../../theme/GP';
import { Mono, Sans, Box, Row } from '../../components/primitives';
import Layout from '../../components/Layout';

const MODES = [
  {
    key: 'separate',
    label: 'SEPARATE PROGRESS',
    blurb: 'Same goal, everyone tracks their own. Good for a challenge or a race.',
  },
  {
    key: 'shared',
    label: 'SHARED PROGRESS',
    blurb: 'One tick list for the group. Anyone completing a step completes it for everyone.',
  },
];

const errText = (err, fallback) => err.response?.data?.error?.message || fallback;

function Bar({ percentage }) {
  return (
    <div style={{ height: 6, background: GP.bg, borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        height: 6, width: `${Math.max(percentage, 2)}%`,
        background: GP.cyan, borderRadius: 3,
      }} />
    </div>
  );
}

export default function GoalMembersPage() {
  const { id: goalId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [friends, setFriends] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [mode, setMode] = useState('separate');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      // The goal itself is what says whether you own it and which mode it is in;
      // the leaderboard only reports progress.
      const [b, g, f] = await Promise.all([
        goalMembersAPI.leaderboard(goalId),
        goalsAPI.getOne(goalId),
        friendsAPI.list(),
      ]);
      setBoard(b.data.data);
      setIsOwner(!!g.data.data.isOwner);
      setMode(g.data.data.progressMode || 'separate');
      setFriends(f.data.data);
    } catch (err) {
      setNote(errText(err, 'Could not load this goal'));
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => { load(); }, [load]);

  const invite = async (friend) => {
    setBusy(friend.id);
    setNote('');
    try {
      await goalMembersAPI.invite(goalId, { userId: friend.id });
      setNote(`Invited @${friend.username}.`);
      await load();
    } catch (err) {
      setNote(errText(err, 'Could not invite'));
    } finally {
      setBusy(null);
    }
  };

  const changeMode = async (next) => {
    if (next === mode) return;
    const previous = mode;
    setMode(next);
    setNote('');
    try {
      await goalsAPI.update(goalId, { progressMode: next });
      await load();
    } catch (err) {
      // Put the toggle back rather than leave it showing a mode the server
      // never accepted.
      setMode(previous);
      setNote(errText(err, 'Could not change mode'));
    }
  };

  const removeMember = async (m) => {
    setNote('');
    try {
      await goalMembersAPI.remove(goalId, m.userId);
      await load();
    } catch (err) {
      setNote(errText(err, 'Could not remove'));
    }
  };

  if (loading) {
    return <Layout><Mono size={10} dim>LOADING…</Mono></Layout>;
  }

  const memberIds = new Set((board?.members || []).map((m) => String(m.userId)));
  const invitable = friends.filter((f) => !memberIds.has(String(f.id)));

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

      <div style={{ marginBottom: 20 }}>
        <Mono size={10} accent style={{ display: 'block', letterSpacing: 2 }}>
          ◆ LOCKED IN · SHARED GOAL
        </Mono>
        <Sans size={24} weight={700} style={{ display: 'block', marginTop: 4 }}>
          {board?.title}
        </Sans>
      </div>

      {!!note && (
        <Box style={{ background: GP.bg2, borderColor: GP.amber, padding: 12, marginBottom: 14 }}>
          <Mono size={10} style={{ color: GP.amber }}>◉ {note}</Mono>
        </Box>
      )}

      {isOwner && (
        <Box style={{ background: GP.bg2, padding: 16, marginBottom: 16 }}>
          <Mono size={9} dim style={{ display: 'block', marginBottom: 12 }}>
            HOW PROGRESS IS COUNTED
          </Mono>
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => changeMode(m.key)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                padding: 12, marginBottom: 8, borderRadius: 4,
                background: mode === m.key ? 'rgba(77,227,255,0.06)' : 'none',
                border: `1px solid ${mode === m.key ? GP.cyan : GP.line}`,
              }}
            >
              <Mono size={10} style={{ color: mode === m.key ? GP.cyan : GP.inkDim, display: 'block' }}>
                {mode === m.key ? '◉' : '○'} {m.label}
              </Mono>
              <Sans size={13} style={{ color: GP.inkDim, display: 'block', marginTop: 5, lineHeight: 1.5 }}>
                {m.blurb}
              </Sans>
            </button>
          ))}
        </Box>
      )}

      <Mono size={9} dim style={{ display: 'block', marginBottom: 10 }}>
        LEADERBOARD{board?.pending ? ` · ${board.pending} INVITE(S) PENDING` : ''}
      </Mono>

      {(board?.members || []).map((m, i) => (
        <Box key={m.userId} style={{ background: GP.bg2, padding: 14, marginBottom: 10 }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <Row gap={10} style={{ flex: 1, minWidth: 0 }}>
              <Mono size={13} accent style={{ width: 22 }}>{i + 1}</Mono>
              <div style={{ minWidth: 0 }}>
                <Sans size={15} style={{ display: 'block' }}>
                  @{m.username}{m.isYou ? ' (you)' : ''}
                </Sans>
                <Mono size={9} dim style={{ display: 'block', marginTop: 2 }}>
                  {m.isOwner ? 'OWNER' : 'MEMBER'} · {m.completed}/{m.total} DONE
                </Mono>
              </div>
            </Row>
            <Row gap={10}>
              <Sans size={18} weight={700} color={GP.cyan}>{m.percentage}%</Sans>
              {isOwner && !m.isOwner && (
                <button
                  type="button"
                  onClick={() => removeMember(m)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: GP.magenta, fontFamily: GP.mono, fontSize: 12,
                  }}
                >
                  ✕
                </button>
              )}
            </Row>
          </Row>
          <Bar percentage={m.percentage} />
        </Box>
      ))}

      {mode === 'shared' && (
        <Mono size={9} dim style={{ display: 'block', marginBottom: 14 }}>
          SHARED MODE · EVERYONE SHOWS THE SAME PERCENTAGE BY DESIGN
        </Mono>
      )}

      {isOwner && (
        <>
          <Mono size={9} dim style={{ display: 'block', margin: '22px 0 10px' }}>
            INVITE A FRIEND
          </Mono>

          {friends.length === 0 && (
            <Box style={{ background: GP.bg2, padding: 16 }}>
              <Mono size={10} dim>YOU HAVE NO FRIENDS YET · ADD SOME FROM THE FRIENDS PAGE</Mono>
            </Box>
          )}

          {friends.length > 0 && invitable.length === 0 && (
            <Box style={{ background: GP.bg2, padding: 16 }}>
              <Mono size={10} dim>ALL YOUR FRIENDS ARE ALREADY ON THIS GOAL</Mono>
            </Box>
          )}

          {invitable.map((f) => (
            <Box key={f.id} style={{ background: GP.bg2, padding: 12, marginBottom: 8 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Sans size={15}>@{f.username}</Sans>
                <button
                  type="button"
                  onClick={() => invite(f)}
                  disabled={busy === f.id}
                  style={{
                    padding: '7px 12px', background: 'none', cursor: 'pointer',
                    border: `1px solid ${GP.cyan}`, borderRadius: 4, color: GP.cyan,
                    fontFamily: GP.mono, fontSize: 10, letterSpacing: 1,
                    opacity: busy === f.id ? 0.4 : 1,
                  }}
                >
                  {busy === f.id ? '…' : '+ INVITE'}
                </button>
              </Row>
            </Box>
          ))}
        </>
      )}
    </Layout>
  );
}
