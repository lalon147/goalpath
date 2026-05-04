import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { FontSize, FontWeight } from '../constants/typography';
import { BorderRadius, Spacing } from '../constants/spacing';

export default function ProgressBar({ percentage = 0, color, showLabel = true, height = 8, style }) {
  const fillColor = color || Colors.accent;
  const clampedPct = Math.min(100, Math.max(0, percentage));

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${clampedPct}%`, backgroundColor: fillColor, height }]} />
      </View>
      {showLabel && (
        <Text style={styles.label}>{clampedPct}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  track: {
    flex: 1,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BorderRadius.full,
  },
  label: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    minWidth: 32,
    textAlign: 'right',
  },
});
