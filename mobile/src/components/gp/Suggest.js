import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPRow } from './primitives';

/** Tappable title completions shown under a text input as the user types. */
export function TitleSuggest({ items, onPick }) {
  if (!items.length) return null;
  return (
    <View style={{ marginTop: 8 }}>
      <Mono size={7} dim style={{ marginBottom: 6, letterSpacing: 1.5 }}>✦ TRY</Mono>
      <GPRow style={{ flexWrap: 'wrap' }} gap={6}>
        {items.map((t) => (
          <TouchableOpacity key={t} style={styles.chip} onPress={() => onPick(t)}>
            <Sans size={12} style={{ color: GP.inkDim }}>{t}</Sans>
          </TouchableOpacity>
        ))}
      </GPRow>
    </View>
  );
}

/**
 * A panel of suggested items with per-item and bulk add.
 *
 * `moreState` of 'unavailable' hides the AI button entirely — that is what the
 * server reports when it has no API key, and offering an action that cannot
 * work is worse than not offering it.
 */
export function SuggestionPanel({
  label,
  items,
  onAdd,
  onAddAll,
  addedTitles = [],
  onMore,
  moreState,
}) {
  const showMore = onMore && moreState !== 'unavailable';
  if (!items.length && !showMore) return null;

  return (
    <View style={styles.panel}>
      <GPRow style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Mono size={7} accent style={{ letterSpacing: 1.5 }}>✦ {label}</Mono>
        {items.length > 1 && (
          <TouchableOpacity onPress={onAddAll}>
            <Mono size={9} accent>+ ADD ALL</Mono>
          </TouchableOpacity>
        )}
      </GPRow>

      {items.map((item, i) => {
        const added = addedTitles.includes(item.title);
        return (
          <TouchableOpacity
            key={`${item.title}-${i}`}
            style={[styles.row, added && { borderColor: GP.cyan }]}
            onPress={() => onAdd(item)}
            activeOpacity={0.7}
          >
            <Mono size={11} style={{ color: added ? GP.lime : GP.cyan, minWidth: 14 }}>
              {added ? '✓' : '+'}
            </Mono>
            <View style={{ flex: 1 }}>
              <Sans size={13}>{item.title}</Sans>
              {!!item.description && (
                <Mono size={7} dim style={{ marginTop: 2 }}>{item.description}</Mono>
              )}
              {!!item.frequency && (
                <Mono size={7} dim style={{ marginTop: 2 }}>{item.frequency.toUpperCase()}</Mono>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {showMore && (
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity onPress={onMore} disabled={moreState === 'loading'}>
            <Mono size={9} accent style={{ opacity: moreState === 'loading' ? 0.6 : 1 }}>
              {moreState === 'loading' ? '◉ THINKING…' : '✦ MORE IDEAS'}
            </Mono>
          </TouchableOpacity>
          {moreState === 'failed' && (
            <Mono size={8} style={{ color: GP.magenta, marginTop: 6 }}>
              Could not reach the assistant
            </Mono>
          )}
          {moreState === 'rate-limited' && (
            <Mono size={8} style={{ color: GP.amber, marginTop: 6 }}>
              Too many requests — try later
            </Mono>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: GP.lineStrong,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  panel: {
    backgroundColor: GP.bg2,
    borderWidth: 1,
    borderColor: GP.line,
    borderRadius: 4,
    padding: 14,
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: GP.line,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
});
