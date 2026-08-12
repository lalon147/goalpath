import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { acknowledgeRecoveryCode } from '../../store/slices/authSlice';
import { GP } from '../../theme/GP';
import { GPButton, Mono, Sans } from '../../components/primitives';

/**
 * Shown once, immediately after signup, and gated behind an explicit
 * confirmation.
 *
 * The account has no email attached, so this code is the only way back in if
 * the password is forgotten. The server keeps a hash of it and nothing else —
 * it genuinely cannot be re-sent, which is why leaving is a deliberate act.
 */
export default function RecoveryCodePage() {
  const dispatch = useDispatch();
  const { recoveryCode, user } = useSelector((s) => s.auth);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
    } catch {
      // Clipboard access is refused on insecure origins and in some browsers;
      // the code is on screen either way, so this is not worth an error state.
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: GP.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <Mono size={11} style={{ color: GP.amber, letterSpacing: 3, display: 'block', marginBottom: 12 }}>
            ◆ GOALPATH · SAVE THIS
          </Mono>
          <Sans size={28} weight={700} style={{ display: 'block', marginBottom: 8 }}>
            Your recovery code
          </Sans>
          <Sans size={14} style={{ color: GP.inkDim, display: 'block', lineHeight: 1.6 }}>
            You signed up with no email, so this code is the only way to get back
            in if you forget your password.
          </Sans>
        </div>

        <div style={{
          background: GP.bg2,
          border: `1px solid ${GP.amber}`,
          borderRadius: 4,
          padding: '28px 16px',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          <span style={{
            fontFamily: GP.mono,
            fontSize: 22,
            letterSpacing: 3,
            color: GP.amber,
            wordBreak: 'break-all',
          }}>
            {recoveryCode}
          </span>
        </div>

        <button
          type="button"
          onClick={copy}
          style={{
            width: '100%', height: 44, background: 'none', cursor: 'pointer',
            border: `1px solid ${GP.line}`, borderRadius: 4, color: GP.ink,
            fontFamily: GP.mono, fontSize: 11, letterSpacing: 1.5, marginBottom: 22,
          }}
        >
          {copied ? '✓ COPIED' : '◉ COPY CODE'}
        </button>

        <div style={{
          background: 'rgba(255,62,165,0.08)',
          border: `1px solid ${GP.magenta}`,
          borderRadius: 4,
          padding: 14,
          marginBottom: 22,
        }}>
          <Mono size={10} style={{ color: GP.magenta, display: 'block', marginBottom: 8 }}>
            ◉ THIS IS SHOWN ONLY ONCE
          </Mono>
          <Sans size={13} style={{ color: GP.inkDim, lineHeight: 1.6 }}>
            We store a scrambled copy we cannot read, so we can never show it to
            you again or send it to you. Without it, a forgotten password means
            the account and everything in it is gone for good.
          </Sans>
        </div>

        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 20, cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: GP.cyan, cursor: 'pointer' }}
          />
          <Sans size={13} style={{ color: GP.ink }}>
            I have saved my recovery code somewhere safe
          </Sans>
        </label>

        <GPButton
          onClick={() => dispatch(acknowledgeRecoveryCode())}
          disabled={!confirmed}
          style={{ width: '100%', opacity: confirmed ? 1 : 0.4 }}
        >
          ◉ CONTINUE
        </GPButton>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Mono size={10} style={{ color: GP.inkMute }}>
            SIGNED IN AS @{user?.username}
          </Mono>
        </div>
      </div>
    </div>
  );
}
