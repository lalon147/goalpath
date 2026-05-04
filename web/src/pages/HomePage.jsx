import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GP } from '../theme/GP';
import { Mono, Sans } from '../components/primitives';

export default function HomePage() {
  const { isAuthenticated, initializing } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  if (initializing) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: GP.bg,
      }}>
        <Mono size={11} accent style={{ letterSpacing: 3 }}>◉ LOADING…</Mono>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div style={{ minHeight: '100vh', background: GP.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Grid background */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(77,227,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(77,227,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px',
        borderBottom: `1px solid ${GP.line}`,
        position: 'relative',
      }}>
        <div style={{ fontFamily: GP.mono, fontSize: 10, color: GP.cyan, letterSpacing: 3 }}>
          GOALPATH
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/signin')}
            style={{
              height: 34, padding: '0 18px',
              background: 'transparent',
              border: `1px solid ${GP.line}`,
              borderRadius: 3,
              fontFamily: GP.mono, fontSize: 9, color: GP.inkDim,
              letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = GP.cyan; e.currentTarget.style.color = GP.cyan; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = GP.line; e.currentTarget.style.color = GP.inkDim; }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            style={{
              height: 34, padding: '0 18px',
              background: GP.cyan,
              border: 'none',
              borderRadius: 3,
              fontFamily: GP.mono, fontSize: 9, color: GP.bg,
              letterSpacing: 1, cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase',
            }}
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '64px 24px',
        position: 'relative',
        textAlign: 'center',
      }}>
        <Mono size={8} accent style={{ letterSpacing: 4, display: 'block', marginBottom: 28 }}>
          ◉ MISSION CONTROL FOR YOUR GOALS
        </Mono>

        <div style={{
          fontFamily: GP.mono,
          fontSize: 'clamp(40px, 10vw, 80px)',
          fontWeight: 700,
          color: GP.ink,
          letterSpacing: -2,
          lineHeight: 1,
          marginBottom: 6,
        }}>
          GOAL<span style={{ color: GP.cyan }}>PATH</span>
        </div>

        <div style={{
          width: 60, height: 1,
          background: `linear-gradient(90deg, transparent, ${GP.cyan}, transparent)`,
          margin: '24px auto',
        }} />

        <Sans size={16} style={{
          color: GP.inkMute, maxWidth: 400, lineHeight: 1.7,
          display: 'block', marginBottom: 48,
        }}>
          Define your goals. Build daily habits. Track every step toward where you want to be.
        </Sans>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 64 }}>
          <button
            onClick={() => navigate('/signup')}
            style={{
              height: 52, padding: '0 36px',
              background: GP.cyan,
              border: 'none', borderRadius: 4,
              fontFamily: GP.mono, fontSize: 11, color: GP.bg,
              letterSpacing: 2, cursor: 'pointer', fontWeight: 700,
              textTransform: 'uppercase', minWidth: 180,
            }}
          >
            ◉ START FREE
          </button>
          <button
            onClick={() => navigate('/signin')}
            style={{
              height: 52, padding: '0 36px',
              background: 'transparent',
              border: `1px solid ${GP.line}`, borderRadius: 4,
              fontFamily: GP.mono, fontSize: 11, color: GP.inkDim,
              letterSpacing: 2, cursor: 'pointer',
              textTransform: 'uppercase', minWidth: 180,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = GP.lineStrong; e.currentTarget.style.color = GP.ink; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = GP.line; e.currentTarget.style.color = GP.inkDim; }}
          >
            ◆ SIGN IN
          </button>
        </div>

        {/* Feature grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          maxWidth: 680,
          width: '100%',
        }}>
          {[
            { icon: '◈', label: 'Goal Tracking', desc: 'Set milestones, track progress with visual rings' },
            { icon: '◆', label: 'Habit Streaks', desc: 'Build daily routines with streak accountability' },
            { icon: '◉', label: 'Live Analytics', desc: 'Coach view with momentum scores and insights' },
            { icon: '○', label: 'HUD Dashboard', desc: 'Orbital overview of all your active paths' },
          ].map((f) => (
            <div key={f.label} style={{
              border: `1px solid ${GP.line}`,
              borderRadius: 4,
              padding: '16px 14px',
              background: GP.bg2,
              textAlign: 'left',
            }}>
              <div style={{ fontFamily: GP.mono, fontSize: 14, color: GP.cyan, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontFamily: GP.mono, fontSize: 9, color: GP.inkDim, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>{f.label}</div>
              <div style={{ fontFamily: GP.sans, fontSize: 12, color: GP.inkMute, lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px', textAlign: 'center', borderTop: `1px solid ${GP.line}` }}>
        <Mono size={7} dim>◈ GOALPATH · STAY ON PATH</Mono>
      </div>
    </div>
  );
}
