import React, { useEffect, useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFriends } from '../../redux/slices/friendsSlice';
import { goalMembersAPI, goalsAPI } from '../../services/api';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow } from '../../components/gp/primitives';

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

function Bar({ percentage }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.max(percentage, 2)}%` }]} />
    </View>
  );
}

export default function GoalMembersScreen({ route, navigation }) {
  const { goalId } = route.params;
  const dispatch = useDispatch();
  const { friends } = useSelector((s) => s.friends);

  const [board, setBoard] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [mode, setMode] = useState('separate');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(null);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    try {
      // The goal itself is what says whether you own it and which mode it is in;
      // the leaderboard only reports progress.
      const [boardRes, goalRes] = await Promise.all([
        goalMembersAPI.leaderboard(goalId),
        goalsAPI.getOne(goalId),
      ]);
      setBoard(boardRes.data.data);
      setIsOwner(!!goalRes.data.data.isOwner);
      setMode(goalRes.data.data.progressMode || 'separate');
    } catch (err) {
      setStatus(err.response?.data?.error?.message || 'Could not load this goal');
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    load();
    dispatch(fetchFriends());
  }, [load, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const invite = async (friend) => {
    setBusy(friend.id);
    setStatus('');
    try {
      await goalMembersAPI.invite(goalId, { userId: friend.id });
      setStatus(`Invited @${friend.username}.`);
      await load();
    } catch (err) {
      setStatus(err.response?.data?.error?.message || 'Could not invite');
    } finally {
      setBusy(null);
    }
  };

  const changeMode = async (next) => {
    if (next === mode) return;
    setStatus('');
    const previous = mode;
    setMode(next);
    try {
      await goalsAPI.update(goalId, { progressMode: next });
      await load();
    } catch (err) {
      // Put the toggle back rather than leave it showing a mode the server
      // never accepted.
      setMode(previous);
      setStatus(err.response?.data?.error?.message || 'Could not change mode');
    }
  };

  const removeMember = (m) => {
    Alert.alert(
      `Remove @${m.username}?`,
      'Their progress on this goal is deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await goalMembersAPI.remove(goalId, m.userId);
              await load();
            } catch (err) {
              setStatus(err.response?.data?.error?.message || 'Could not remove');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={GP.cyan} />
      </SafeAreaView>
    );
  }

  const memberIds = new Set((board?.members || []).map((m) => String(m.userId)));
  const invitable = friends.filter((f) => !memberIds.has(String(f.id)));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GP.cyan} />}
      >

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Mono size={9} dim>◂ BACK</Mono>
        </TouchableOpacity>

        <View style={styles.header}>
          <Mono size={8} accent>◆ LOCKED IN · SHARED GOAL</Mono>
          <Sans size={20} weight="700" style={{ marginTop: 2 }}>{board?.title}</Sans>
        </View>

        {!!status && (
          <GPBox style={[styles.card, { borderColor: GP.amber }]}>
            <Mono size={9} style={{ color: GP.amber }}>◉ {status}</Mono>
          </GPBox>
        )}

        {isOwner && (
          <GPBox style={styles.card}>
            <Mono size={7} dim style={{ marginBottom: 10 }}>HOW PROGRESS IS COUNTED</Mono>
            {MODES.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => changeMode(m.key)}
                style={[styles.modeRow, mode === m.key && styles.modeOn]}
              >
                <View style={[styles.radio, mode === m.key && styles.radioOn]} />
                <View style={{ flex: 1 }}>
                  <Mono size={9} style={{ color: mode === m.key ? GP.cyan : GP.inkDim }}>
                    {m.label}
                  </Mono>
                  <Sans size={12} color={GP.inkDim} style={{ marginTop: 4, lineHeight: 18 }}>
                    {m.blurb}
                  </Sans>
                </View>
              </TouchableOpacity>
            ))}
          </GPBox>
        )}

        <Mono size={7} dim style={{ marginBottom: 8 }}>
          LEADERBOARD{board?.pending ? ` · ${board.pending} INVITE(S) PENDING` : ''}
        </Mono>

        {(board?.members || []).map((m, i) => (
          <GPBox key={m.userId} style={styles.card}>
            <GPRow style={{ alignItems: 'center', marginBottom: 10 }}>
              <Mono size={12} accent style={{ width: 24 }}>{i + 1}</Mono>
              <View style={{ flex: 1 }}>
                <Sans size={14}>
                  @{m.username}{m.isYou ? ' (you)' : ''}
                </Sans>
                <Mono size={7} dim style={{ marginTop: 2 }}>
                  {m.isOwner ? 'OWNER' : 'MEMBER'} · {m.completed}/{m.total} DONE
                </Mono>
              </View>
              <Sans size={18} weight="700" color={GP.cyan}>{m.percentage}%</Sans>
              {isOwner && !m.isOwner && (
                <TouchableOpacity onPress={() => removeMember(m)} style={{ paddingLeft: 10 }}>
                  <Mono size={9} style={{ color: GP.magenta }}>✕</Mono>
                </TouchableOpacity>
              )}
            </GPRow>
            <Bar percentage={m.percentage} />
          </GPBox>
        ))}

        {mode === 'shared' && (
          <Mono size={8} dim style={{ marginTop: 4, marginBottom: 12, lineHeight: 13 }}>
            SHARED MODE · EVERYONE SHOWS THE SAME PERCENTAGE BY DESIGN
          </Mono>
        )}

        {isOwner && (
          <>
            <Mono size={7} dim style={{ marginTop: 18, marginBottom: 8 }}>INVITE A FRIEND</Mono>

            {friends.length === 0 && (
              <GPBox style={styles.card}>
                <Mono size={9} dim style={{ lineHeight: 15 }}>
                  YOU HAVE NO FRIENDS YET · ADD SOME FROM PROFILE ▸ FRIENDS
                </Mono>
              </GPBox>
            )}

            {friends.length > 0 && invitable.length === 0 && (
              <GPBox style={styles.card}>
                <Mono size={9} dim>ALL YOUR FRIENDS ARE ALREADY ON THIS GOAL</Mono>
              </GPBox>
            )}

            {invitable.map((f) => (
              <GPBox key={f.id} style={styles.personCard}>
                <GPRow style={{ alignItems: 'center' }}>
                  <View style={styles.avatar}>
                    <Mono size={12} accent>{f.username.slice(0, 1).toUpperCase()}</Mono>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Sans size={14}>@{f.username}</Sans>
                  </View>
                  <TouchableOpacity
                    onPress={() => invite(f)}
                    disabled={busy === f.id}
                    style={[styles.inviteBtn, busy === f.id && { opacity: 0.4 }]}
                  >
                    <Mono size={8} accent>{busy === f.id ? '…' : '+ INVITE'}</Mono>
                  </TouchableOpacity>
                </GPRow>
              </GPBox>
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GP.bg },
  scroll: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 40 },
  header: { paddingBottom: 12 },
  card: { backgroundColor: GP.bg2, padding: 14, marginBottom: 10 },
  personCard: { backgroundColor: GP.bg2, padding: 12, marginBottom: 8 },
  modeRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 10, borderWidth: 1, borderColor: GP.line, borderRadius: 4, marginBottom: 8,
  },
  modeOn: { borderColor: GP.cyan, backgroundColor: 'rgba(77,227,255,0.06)' },
  radio: {
    width: 14, height: 14, borderRadius: 7, borderWidth: 1,
    borderColor: GP.line, marginTop: 2,
  },
  radioOn: { borderColor: GP.cyan, backgroundColor: GP.cyan },
  barTrack: { height: 6, backgroundColor: GP.bg, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: GP.cyan, borderRadius: 3 },
  avatar: {
    width: 34, height: 34, borderRadius: 4, borderWidth: 1, borderColor: GP.line,
    justifyContent: 'center', alignItems: 'center', backgroundColor: GP.bg,
  },
  inviteBtn: {
    paddingHorizontal: 10, height: 30, borderWidth: 1, borderColor: GP.cyan,
    borderRadius: 4, justifyContent: 'center', alignItems: 'center',
  },
});
