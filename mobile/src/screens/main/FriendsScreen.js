import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Share, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFriends, fetchRequests, searchUsers, sendFriendRequest,
  respondToRequest, removeFriend, setQuery, clearSearch, clearError,
} from '../../redux/slices/friendsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow } from '../../components/gp/primitives';

const TABS = ['FRIENDS', 'ADD', 'REQUESTS'];

function Avatar({ name }) {
  return (
    <View style={styles.avatar}>
      <Mono size={12} accent>{(name || '?').slice(0, 1).toUpperCase()}</Mono>
    </View>
  );
}

/** One person, with whatever action makes sense for the current relationship. */
function PersonRow({ person, action }) {
  return (
    <GPBox style={styles.personCard}>
      <GPRow style={{ alignItems: 'center' }}>
        <Avatar name={person.username} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Sans size={14}>@{person.username}</Sans>
          {person.displayName !== person.username && (
            <Mono size={8} dim style={{ marginTop: 2 }}>
              {person.displayName.toUpperCase()}
            </Mono>
          )}
        </View>
        {action}
      </GPRow>
    </GPBox>
  );
}

function ActionBtn({ label, onPress, tone = 'cyan', disabled }) {
  const color = tone === 'magenta' ? GP.magenta : tone === 'dim' ? GP.inkMute : GP.cyan;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.actionBtn, { borderColor: color }, disabled && { opacity: 0.4 }]}
    >
      <Mono size={8} style={{ color, letterSpacing: 1 }}>{label}</Mono>
    </TouchableOpacity>
  );
}

export default function FriendsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const {
    friends, incoming, outgoing, results, query, loading, searching, error,
  } = useSelector((s) => s.friends);

  const [tab, setTab] = useState('FRIENDS');
  const [text, setText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    dispatch(fetchFriends());
    dispatch(fetchRequests());
  }, [dispatch]);

  // Debounced so typing a username is one request at the end, not one per key.
  useEffect(() => {
    clearTimeout(timer.current);
    const q = text.trim().replace(/^@+/, '');
    dispatch(setQuery(q));
    if (q.length < 2) return;
    timer.current = setTimeout(() => dispatch(searchUsers(q)), 350);
    return () => clearTimeout(timer.current);
  }, [text, dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([dispatch(fetchFriends()), dispatch(fetchRequests())]);
    setRefreshing(false);
  }, [dispatch]);

  const shareUsername = () => {
    Share.share({
      message: `Add me on LOCKED IN — my username is @${user?.username}`,
    }).catch(() => {});
  };

  const copyUsername = async () => {
    await Clipboard.setStringAsync(`@${user?.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmRemove = (person) => {
    Alert.alert(
      `Remove @${person.username}?`,
      'You will both stop seeing each other in your friends list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => dispatch(removeFriend(person.friendshipId)),
        },
      ]
    );
  };

  const searchAction = (r) => {
    if (r.relationship === 'friends') return <Mono size={8} dim>FRIENDS</Mono>;
    if (r.relationship === 'requested') return <Mono size={8} dim>REQUESTED</Mono>;
    if (r.relationship === 'awaiting-you') {
      return (
        <ActionBtn
          label="ACCEPT"
          onPress={() => dispatch(respondToRequest({ friendshipId: r.friendshipId, accept: true }))}
        />
      );
    }
    return <ActionBtn label="+ ADD" onPress={() => dispatch(sendFriendRequest({ userId: r.id }))} />;
  };

  const pendingCount = incoming.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GP.cyan} />}
      >

        <View style={styles.header}>
          <Mono size={8} accent>◆ LOCKED IN · SOCIAL</Mono>
          <Sans size={20} weight="700" style={{ marginTop: 2 }}>Friends</Sans>
        </View>

        <GPBox style={styles.meCard}>
          <Mono size={7} dim>YOUR USERNAME</Mono>
          <Sans size={22} weight="700" style={{ marginTop: 4, color: GP.cyan }}>
            @{user?.username}
          </Sans>
          <Mono size={8} dim style={{ marginTop: 6, lineHeight: 13 }}>
            SHARE THIS SO PEOPLE CAN FIND YOU
          </Mono>
          <GPRow style={{ gap: 8, marginTop: 12 }}>
            <TouchableOpacity style={styles.meBtn} onPress={shareUsername}>
              <Mono size={9} accent style={{ letterSpacing: 1 }}>◉ SHARE</Mono>
            </TouchableOpacity>
            <TouchableOpacity style={styles.meBtn} onPress={copyUsername}>
              <Mono size={9} accent style={{ letterSpacing: 1 }}>
                {copied ? '✓ COPIED' : '◉ COPY'}
              </Mono>
            </TouchableOpacity>
          </GPRow>
        </GPBox>

        <GPRow style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabOn]}
            >
              <Mono size={8} style={{ color: tab === t ? GP.cyan : GP.inkMute, letterSpacing: 1 }}>
                {t}{t === 'REQUESTS' && pendingCount > 0 ? ` (${pendingCount})` : ''}
              </Mono>
            </TouchableOpacity>
          ))}
        </GPRow>

        {!!error && (
          <TouchableOpacity onPress={() => dispatch(clearError())}>
            <GPBox style={[styles.card, { borderColor: GP.magenta }]}>
              <Mono size={9} style={{ color: GP.magenta }}>◉ {error}</Mono>
            </GPBox>
          </TouchableOpacity>
        )}

        {tab === 'FRIENDS' && (
          <>
            {loading && friends.length === 0 && (
              <ActivityIndicator color={GP.cyan} style={{ marginTop: 24 }} />
            )}
            {!loading && friends.length === 0 && (
              <GPBox style={styles.card}>
                <Mono size={9} dim style={{ lineHeight: 15 }}>
                  NO FRIENDS YET · USE THE ADD TAB TO SEARCH BY USERNAME
                </Mono>
              </GPBox>
            )}
            {friends.map((f) => (
              <PersonRow
                key={f.friendshipId}
                person={f}
                action={<ActionBtn label="REMOVE" tone="magenta" onPress={() => confirmRemove(f)} />}
              />
            ))}
          </>
        )}

        {tab === 'ADD' && (
          <>
            <View style={styles.searchBox}>
              <Mono size={11} dim>@</Mono>
              <TextInput
                style={styles.searchInput}
                value={text}
                onChangeText={setText}
                placeholder="search by username"
                placeholderTextColor={GP.inkMute}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searching && <ActivityIndicator size="small" color={GP.inkMute} />}
              {!!text && !searching && (
                <TouchableOpacity onPress={() => { setText(''); dispatch(clearSearch()); }}>
                  <Mono size={10} dim>✕</Mono>
                </TouchableOpacity>
              )}
            </View>

            {text.trim().length > 0 && text.trim().length < 2 && (
              <Mono size={8} dim style={{ marginBottom: 10 }}>KEEP TYPING — AT LEAST 2 CHARACTERS</Mono>
            )}

            {query.length >= 2 && !searching && results.length === 0 && (
              <GPBox style={styles.card}>
                <Mono size={9} dim>NO ONE FOUND FOR “{query.toUpperCase()}”</Mono>
              </GPBox>
            )}

            {results.map((r) => (
              <PersonRow key={r.id} person={r} action={searchAction(r)} />
            ))}
          </>
        )}

        {tab === 'REQUESTS' && (
          <>
            <Mono size={7} dim style={{ marginBottom: 8 }}>INCOMING</Mono>
            {incoming.length === 0 && (
              <GPBox style={styles.card}>
                <Mono size={9} dim>NOBODY IS WAITING ON YOU</Mono>
              </GPBox>
            )}
            {incoming.map((r) => (
              <PersonRow
                key={r.friendshipId}
                person={r}
                action={
                  <GPRow style={{ gap: 6 }}>
                    <ActionBtn
                      label="ACCEPT"
                      onPress={() => dispatch(respondToRequest({ friendshipId: r.friendshipId, accept: true }))}
                    />
                    <ActionBtn
                      label="DECLINE"
                      tone="dim"
                      onPress={() => dispatch(respondToRequest({ friendshipId: r.friendshipId, accept: false }))}
                    />
                  </GPRow>
                }
              />
            ))}

            <Mono size={7} dim style={{ marginTop: 18, marginBottom: 8 }}>SENT BY YOU</Mono>
            {outgoing.length === 0 && (
              <GPBox style={styles.card}>
                <Mono size={9} dim>NO PENDING REQUESTS</Mono>
              </GPBox>
            )}
            {outgoing.map((r) => (
              <PersonRow
                key={r.friendshipId}
                person={r}
                action={
                  <ActionBtn
                    label="CANCEL"
                    tone="dim"
                    onPress={() => dispatch(removeFriend(r.friendshipId))}
                  />
                }
              />
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
  meCard: { backgroundColor: GP.bg2, padding: 16, marginBottom: 14 },
  meBtn: {
    flex: 1, height: 38, borderWidth: 1, borderColor: GP.cyan, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(77,227,255,0.08)',
  },
  tabs: { gap: 6, marginBottom: 12 },
  tab: {
    flex: 1, height: 34, borderWidth: 1, borderColor: GP.line, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  tabOn: { borderColor: GP.cyan, backgroundColor: 'rgba(77,227,255,0.08)' },
  card: { backgroundColor: GP.bg2, padding: 16, marginBottom: 10 },
  personCard: { backgroundColor: GP.bg2, padding: 12, marginBottom: 8 },
  avatar: {
    width: 34, height: 34, borderRadius: 4, borderWidth: 1, borderColor: GP.line,
    justifyContent: 'center', alignItems: 'center', backgroundColor: GP.bg,
  },
  actionBtn: {
    paddingHorizontal: 10, height: 30, borderWidth: 1, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 46,
    backgroundColor: GP.bg2, borderWidth: 1, borderColor: GP.line,
    borderRadius: 4, paddingHorizontal: 12, marginBottom: 12,
  },
  searchInput: { flex: 1, fontFamily: GP.sans, fontSize: 15, color: GP.ink },
});
