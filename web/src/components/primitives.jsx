import React from 'react';
import { GP } from '../theme/GP';

export const Box = ({ children, style, dashed, accent, solid, ...rest }) => (
  <div style={{
    border: `1px ${dashed ? 'dashed' : 'solid'} ${accent ? GP.cyan : GP.line}`,
    background: solid ? GP.bg2 : 'transparent',
    borderRadius: 4,
    padding: 8,
    color: GP.ink,
    fontSize: 11,
    ...style,
  }} {...rest}>{children}</div>
);

export const Row = ({ children, style, gap = 8, align = 'center', ...rest }) => (
  <div style={{ display: 'flex', alignItems: align, gap, ...style }} {...rest}>{children}</div>
);

export const Col = ({ children, style, gap = 8, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }} {...rest}>{children}</div>
);

export const Mono = ({ children, size = 9, style, dim, accent, ...rest }) => (
  <span style={{
    fontFamily: GP.mono,
    fontSize: size,
    letterSpacing: 1,
    color: accent ? GP.cyan : dim ? GP.inkMute : GP.inkDim,
    textTransform: 'uppercase',
    ...style,
  }} {...rest}>{children}</span>
);

export const Sans = ({ children, size = 14, weight = 500, color, style, ...rest }) => (
  <span style={{
    fontFamily: GP.sans,
    fontSize: size,
    fontWeight: weight,
    color: color || GP.ink,
    letterSpacing: -0.2,
    ...style,
  }} {...rest}>{children}</span>
);

export const Chip = ({ children, color, style }) => {
  const c = color || GP.cyan;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 6px',
      border: `1px solid ${c}`,
      color: c,
      fontFamily: GP.mono,
      fontSize: 8,
      letterSpacing: 1,
      textTransform: 'uppercase',
      borderRadius: 2,
      ...style,
    }}>{children}</span>
  );
};

export function Ring({ size = 120, strokeWidth = 2, progress = 0, color, children }) {
  const c = color || GP.cyan;
  const r = size / 2 - strokeWidth - 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const inner = r + 4;
    const outer = r + (i % 5 === 0 ? 9 : 6);
    return {
      x1: cx + Math.cos(a) * inner,
      y1: cy + Math.sin(a) * inner,
      x2: cx + Math.cos(a) * outer,
      y2: cy + Math.sin(a) * outer,
      major: i % 5 === 0,
    };
  });

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={GP.line} strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={c}
          strokeWidth={strokeWidth + 0.5}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, progress)))}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {ticks.map((t, i) => (
          <line key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.major ? GP.lineStrong : GP.line}
            strokeWidth={1}
          />
        ))}
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
      }}>
        {children}
      </div>
    </div>
  );
}

export function ScreenHeader({ title, subtitle, right }) {
  return (
    <div style={{
      padding: '10px 0 8px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 16,
    }}>
      <div>
        <Mono size={8} accent>◆ {subtitle}</Mono>
        <div style={{ marginTop: 4 }}>
          <Sans size={20} weight={700}>{title}</Sans>
        </div>
      </div>
      {right}
    </div>
  );
}

export const Divider = ({ style }) => (
  <div style={{ height: 1, background: GP.line, margin: '4px 0', ...style }} />
);

export function GPInput({ label, value, onChange, placeholder, type = 'text', error, style }) {
  return (
    <div style={{ marginBottom: 18, ...style }}>
      {label && (
        <div style={{ fontFamily: GP.mono, fontSize: 8, letterSpacing: 1.5, color: GP.inkMute, marginBottom: 6, textTransform: 'uppercase' }}>
          ◆ {label}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 44,
          background: GP.bg2,
          border: `1px solid ${error ? GP.magenta : GP.line}`,
          borderRadius: 4,
          color: GP.ink,
          fontFamily: GP.sans,
          fontSize: 14,
          padding: '0 12px',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { if (!error) e.target.style.borderColor = GP.cyan; }}
        onBlur={(e) => { e.target.style.borderColor = error ? GP.magenta : GP.line; }}
      />
      {error && (
        <div style={{ fontFamily: GP.mono, fontSize: 9, color: GP.magenta, marginTop: 4, letterSpacing: 0.5 }}>
          {error}
        </div>
      )}
    </div>
  );
}

export function GPButton({ children, onClick, variant = 'primary', disabled, loading, style }) {
  const variants = {
    primary: { background: 'rgba(77,227,255,0.12)', border: `1px solid ${GP.cyan}`, color: GP.cyan },
    danger:  { background: 'rgba(255,62,165,0.12)',  border: `1px solid ${GP.magenta}`, color: GP.magenta },
    ghost:   { background: 'transparent', border: `1px solid ${GP.line}`, color: GP.inkDim },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...v,
        height: 44,
        borderRadius: 4,
        fontFamily: GP.mono,
        fontSize: 10,
        letterSpacing: 2,
        textTransform: 'uppercase',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        padding: '0 20px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'opacity 0.15s',
        ...style,
      }}
    >
      {loading ? '…' : children}
    </button>
  );
}

export function ProgressBar({ value = 0, color, style }) {
  return (
    <div style={{ height: 2, background: GP.line, borderRadius: 1, overflow: 'hidden', ...style }}>
      <div style={{
        height: '100%',
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: color || GP.cyan,
        borderRadius: 1,
        transition: 'width 0.3s',
      }} />
    </div>
  );
}
