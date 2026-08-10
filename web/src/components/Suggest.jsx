import React from 'react';
import { GP } from '../theme/GP';
import { Mono, Sans } from './primitives';

const chipStyle = {
  background: 'transparent',
  border: `1px dashed ${GP.lineStrong}`,
  borderRadius: 3,
  padding: '4px 10px',
  fontFamily: GP.sans,
  fontSize: 12,
  color: GP.inkDim,
  cursor: 'pointer',
  textAlign: 'left',
};

/** Tappable title completions shown under a text input as the user types. */
export function TitleSuggest({ items, onPick }) {
  if (!items.length) return null;
  return (
    <div style={{ marginTop: -10, marginBottom: 18 }}>
      <Mono size={10} dim style={{ display: 'block', marginBottom: 6, letterSpacing: 1 }}>
        ✦ TRY
      </Mono>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {items.map((t) => (
          <button key={t} type="button" onClick={() => onPick(t)} style={chipStyle}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * A panel of suggested items with per-item and bulk add.
 *
 * `onMore` is optional — when the server has no API key configured the caller
 * passes `moreState: 'unavailable'` and the button is hidden rather than
 * offering an action that cannot work.
 */
export function SuggestionPanel({
  label,
  items,
  onAdd,
  onAddAll,
  renderMeta,
  onMore,
  moreState,
  moreLabel = '✦ MORE IDEAS',
}) {
  const showMore = onMore && moreState !== 'unavailable';
  if (!items.length && !showMore) return null;

  return (
    <div
      style={{
        border: `1px solid ${GP.line}`,
        borderRadius: 4,
        background: GP.bg2,
        padding: '12px 14px',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <Mono size={10} accent style={{ letterSpacing: 1.5 }}>✦ {label}</Mono>
        {items.length > 1 && (
          <button
            type="button"
            onClick={onAddAll}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: GP.mono, fontSize: 11, color: GP.cyan, letterSpacing: 1,
            }}
          >
            + ADD ALL
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <button
            key={`${item.title}-${i}`}
            type="button"
            onClick={() => onAdd(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              textAlign: 'left',
              background: 'transparent',
              border: `1px solid ${GP.line}`,
              borderRadius: 3,
              padding: '8px 10px',
              cursor: 'pointer',
              font: 'inherit',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = GP.cyan; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = GP.line; }}
          >
            <Mono size={12} accent>+</Mono>
            <span style={{ flex: 1 }}>
              <Sans size={13}>{item.title}</Sans>
              {renderMeta && renderMeta(item)}
            </span>
          </button>
        ))}
      </div>

      {showMore && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={onMore}
            disabled={moreState === 'loading'}
            style={{
              background: 'none', border: 'none', padding: 0,
              cursor: moreState === 'loading' ? 'progress' : 'pointer',
              fontFamily: GP.mono, fontSize: 11, color: GP.cyan, letterSpacing: 1,
              opacity: moreState === 'loading' ? 0.6 : 1,
            }}
          >
            {moreState === 'loading' ? 'THINKING…' : moreLabel}
          </button>
          {moreState === 'failed' && (
            <Mono size={10} style={{ color: GP.magenta }}>Could not reach the assistant</Mono>
          )}
          {moreState === 'rate-limited' && (
            <Mono size={10} style={{ color: GP.amber }}>Too many requests — try later</Mono>
          )}
        </div>
      )}
    </div>
  );
}
