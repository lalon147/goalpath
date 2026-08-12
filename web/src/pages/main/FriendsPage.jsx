import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { friendsAPI } from '../../services/api';
import { GP } from '../../theme/GP';
import { Mono, Sans, Box, Row } from '../../components/primitives';
import Layout from '../../components/Layout';

const TABS = ['FRIENDS', 'ADD', 'REQUESTS'];

const errText = (err, fallback) =>
  err.response?.data?.error?.message || fallback;

function Avatar({ name }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 4, border: `1px solid ${GP.line}`,
      background: GP.bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      <Mono size={13} accent>{(name || '?').slice(0, 1).toUpperCase()}</Mono>
    </div>
  );
}

function ActionBtn({ label, onClick, tone = 'cyan', disabled }) {
  const color = tone === 'magenta' ? GP.magenta : tone === 'dim' ? GP.inkMute : GP.cyan;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 12px', background: 'none', border: `1px solid ${color}`,
        borderRadius: 4, color, fontFamily: GP.mono, fontSize: 10,
        letterSpacing: 1, cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1, whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function PersonRow({ person, children }) {
  return (
    <Box style={{ background: GP.bg2, padding: 12, marginBottom: 8 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={12} style={{ flex: 1, minWidth: 0 }}>
          <Avatar name={person.username} />
          <div style={{ minWidth: 0 }}>
            <Sans size={15} style={{ display: 'block' }}>@{person.username}</Sans>
            {person.displayName !== person.username && (
              <Mono size={9} dim style={{ display: 'block', marginTop: 2 }}>
                {person.displayName}
              </Mono>
            )}
          </div>
        </Row>
        <Row gap={6}>{children}</Row>
      </Row>
    </Box>
  );
}

export default function FriendsPage() {
  const { user } = useSelector((s) => s.auth);

  const [tab, setTab] = useState('FRIENDS');
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [results, setResults] = useState([]);
  const [text, setText] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);

  const timer = useRef(null);
  const latest = useRef('');

  const load = useCallback(async () => {
    try {
      const [f, r] = await Promise.all([friendsAPI.list(), friendsAPI.requests()]);
      setFriends(f.data.data);
      setIncoming(r.data.data.incoming);
      setOutgoing(r.data.data.outgoing);
    } catch (err) {
      setNote(errText(err, 'Could not load your friends'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced so typing a username is one request at the end, not one per key.
  useEffect(() => {
    clearTimeout(timer.current);
    const q = text.trim().replace(/^@+/, '');
    latest.current = q;

    if (q.length < 2) { setResults([]); return; }

    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        const { data } = await friendsAPI.search(q);
        // A late answer about an older query must not overwrite the current one.
        if (latest.current !== q) return;
        setResults(data.data);
      } catch (err) {
        setNote(errText(err, 'Search failed'));
      } finally {
        if (latest.current === q) setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer.current);
  }, [text]);

  const add = async (person) => {
    setNote('');
    try {
      const { data } = await friendsAPI.sendRequest({ userId: person.id });
      // Flip the label straight away; re-fetching just to change one word makes
      // the button feel broken.
      setResults((rs) => rs.map((r) => (
        r.id === person.id
          ? { ...r, relationship: data.data.status === 'accepted' ? 'friends' : 'requested' }
          : r
      )));
      load();
    } catch (err) {
      setNote(errText(err, 'Could not send that request'));
    }
  };

  const answer = async (friendshipId, accept) => {
    setNote('');
    try {
      await (accept ? friendsAPI.accept(friendshipId) : friendsAPI.decline(friendshipId));
      load();
    } catch (err) {
      setNote(errText(err, 'Could not answer that request'));
    }
  };

  const remove = async (friendshipId) => {
    setNote('');
    try {
      await friendsAPI.remove(friendshipId);
      load();
    } catch (err) {
      setNote(errText(err, 'Could not remove'));
    }
  };

  const copyUsername = async () => {
    try {
      await navigator.clipboard.writeText(`@${user?.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is unavailable on insecure origins; the handle is on screen.
    }
  };

  const searchAction = (r) => {
    if (r.relationship === 'friends') return <Mono size={10} dim>FRIENDS</Mono>;
    if (r.relationship === 'requested') return <Mono size={10} dim>REQUESTED</Mono>;
    if (r.relationship === 'awaiting-you') {
      return <ActionBtn label="ACCEPT" onClick={() => answer(r.friendshipId, true)} />;
    }
    return <ActionBtn label="+ ADD" onClick={() => add(r)} />;
  };

  return (
    <Layout>
      <div style={{ marginBottom: 20 }}>
        <Mono size={10} accent style={{ display: 'block', letterSpacing: 2 }}>◆ LOCKED IN · SOCIAL</Mono>
        <Sans size={24} weight={700} style={{ display: 'block', marginTop: 4 }}>Friends</Sans>
      </div>

      <Box style={{ background: GP.bg2, padding: 18, marginBottom: 18 }}>
        <Mono size={9} dim style={{ display: 'block' }}>YOUR USERNAME</Mono>
        <Sans size={24} weight={700} style={{ display: 'block', marginTop: 4, color: GP.cyan }}>
          @{user?.username}
        </Sans>
        <Mono size={9} dim style={{ display: 'block', marginTop: 6 }}>
          SHARE THIS SO PEOPLE CAN FIND YOU
        </Mono>
        <button
          type="button"
          onClick={copyUsername}
          style={{
            marginTop: 12, padding: '9px 16px', background: 'rgba(77,227,255,0.08)',
            border: `1px solid ${GP.cyan}`, borderRadius: 4, color: GP.cyan,
            fontFamily: GP.mono, fontSize: 11, letterSpacing: 1.5, cursor: 'pointer',
          }}
        >
          {copied ? '✓ COPIED' : '◉ COPY USERNAME'}
        </button>
      </Box>

      <Row gap={8} style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1, height: 36, cursor: 'pointer', borderRadius: 4,
              background: tab === t ? 'rgba(77,227,255,0.08)' : 'none',
              border: `1px solid ${tab === t ? GP.cyan : GP.line}`,
              color: tab === t ? GP.cyan : GP.inkMute,
              fontFamily: GP.mono, fontSize: 10, letterSpacing: 1,
            }}
          >
            {t}{t === 'REQUESTS' && incoming.length > 0 ? ` (${incoming.length})` : ''}
          </button>
        ))}
      </Row>

      {!!note && (
        <Box style={{ background: GP.bg2, borderColor: GP.magenta, padding: 12, marginBottom: 12 }}>
          <Mono size={10} style={{ color: GP.magenta }}>◉ {note}</Mono>
        </Box>
      )}

      {tab === 'FRIENDS' && (
        <>
          {loading && <Mono size={10} dim>LOADING…</Mono>}
          {!loading && friends.length === 0 && (
            <Box style={{ background: GP.bg2, padding: 16 }}>
              <Mono size={10} dim>NO FRIENDS YET · USE THE ADD TAB TO SEARCH BY USERNAME</Mono>
            </Box>
          )}
          {friends.map((f) => (
            <PersonRow key={f.friendshipId} person={f}>
              <ActionBtn label="REMOVE" tone="magenta" onClick={() => remove(f.friendshipId)} />
            </PersonRow>
          ))}
        </>
      )}

      {tab === 'ADD' && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 46,
            background: GP.bg2, border: `1px solid ${GP.line}`, borderRadius: 4,
            padding: '0 14px', marginBottom: 14,
          }}>
            <Mono size={12} dim>@</Mono>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="search by username"
              autoComplete="off"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: GP.ink, fontFamily: GP.sans, fontSize: 15,
              }}
            />
            {searching && <Mono size={9} dim>…</Mono>}
          </div>

          {text.trim().length > 0 && text.trim().length < 2 && (
            <Mono size={9} dim style={{ display: 'block', marginBottom: 10 }}>
              KEEP TYPING — AT LEAST 2 CHARACTERS
            </Mono>
          )}

          {text.trim().length >= 2 && !searching && results.length === 0 && (
            <Box style={{ background: GP.bg2, padding: 16 }}>
              <Mono size={10} dim>NO ONE FOUND FOR “{text.trim()}”</Mono>
            </Box>
          )}

          {results.map((r) => (
            <PersonRow key={r.id} person={r}>{searchAction(r)}</PersonRow>
          ))}
        </>
      )}

      {tab === 'REQUESTS' && (
        <>
          <Mono size={9} dim style={{ display: 'block', marginBottom: 8 }}>INCOMING</Mono>
          {incoming.length === 0 && (
            <Box style={{ background: GP.bg2, padding: 16, marginBottom: 8 }}>
              <Mono size={10} dim>NOBODY IS WAITING ON YOU</Mono>
            </Box>
          )}
          {incoming.map((r) => (
            <PersonRow key={r.friendshipId} person={r}>
              <ActionBtn label="ACCEPT" onClick={() => answer(r.friendshipId, true)} />
              <ActionBtn label="DECLINE" tone="dim" onClick={() => answer(r.friendshipId, false)} />
            </PersonRow>
          ))}

          <Mono size={9} dim style={{ display: 'block', margin: '20px 0 8px' }}>SENT BY YOU</Mono>
          {outgoing.length === 0 && (
            <Box style={{ background: GP.bg2, padding: 16 }}>
              <Mono size={10} dim>NO PENDING REQUESTS</Mono>
            </Box>
          )}
          {outgoing.map((r) => (
            <PersonRow key={r.friendshipId} person={r}>
              <ActionBtn label="CANCEL" tone="dim" onClick={() => remove(r.friendshipId)} />
            </PersonRow>
          ))}
        </>
      )}
    </Layout>
  );
}
