import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { FontSize, FontWeight } from '../constants/typography';
import { BorderRadius, Spacing } from '../constants/spacing';

export default function Badge({ label, color, backgroundColor, style }) {
  return (
    <View style={[styles.badge, { backgroundColor: backgroundColor || Colors.primaryLight }, style]}>
      <Text style={[styles.text, { color: color || Colors.primary }]}>{label}</Text>
    </View>
  );
}

export function CategoryBadge({ category }) {
  const color = Colors.category[category] || Colors.primary;
  return <Badge label={category} color={color} backgroundColor={`${color}20`} />;
}

export function PriorityBadge({ priority }) {
  const color = Colors.priority[priority] || Colors.gray;
  return <Badge label={priority} color={color} backgroundColor={`${color}20`} />;
}

export function StatusBadge({ status }) {
  const map = {
    active: { color: Colors.accent, bg: Colors.accentLight },
    completed: { color: Colors.primary, bg: Colors.primaryLight },
    paused: { color: Colors.gray, bg: Colors.surface },
    abandoned: { color: Colors.danger, bg: Colors.dangerLight },
  };
  const { color, bg } = map[status] || { color: Colors.gray, bg: Colors.surface };
  return <Badge label={status} color={color} backgroundColor={bg} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    textTransform: 'capitalize',
  },
});
