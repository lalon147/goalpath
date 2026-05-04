import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGoals } from '../../redux/slices/goalsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow, Chip } from '../../components/gp/primitives';

const FILTERS = ['All', 'Active', 'Completed', 'Paused'];

const PRIORITY_COLORS = { high: GP.magenta, medium: GP.amber, low: GP.lime };
const CATEGORY_COLORS = {
  learning: GP.cyan, health: GP.lime, career: GP.amber,
  personal: GP.magenta, financial: GP.lime,
};

export default function GoalsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { list: goals, loading } = useSelector((s) => s.goals);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    dispatch(fetchGoals(filter !== 'All' ? { status: filter.toLowerCase() } : {}));
  }, [filter]);

  const renderGoal = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('GoalDetail', { goalId: item._id })}
      activeOpacity={0.75}
    >
      <GPBox style={styles.goalCard}>
        <GPRow style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <GPRow gap={8} style={{ flex: 1 }}>
            <Mono size={7} style={{ color: CATEGORY_COLORS[item.category] || GP.cyan }}>
              ◆ {(item.category || 'personal').toUpperCase()}
            </Mono>
            <Mono size={7} style={{ color: PRIORITY_COLORS[item.priority] || GP.amber }}>
              {(item.priority || 'medium').toUpperCase()}
            </Mono>
          </GPRow>
          {item.targetDate && (
            <Mono size={7} dim>
              {Math.max(0, Math.round((new Date(item.targetDate) - Date.now()) / 86400000))}D
            </Mono>
          )}
        </GPRow>
        <Sans size={14} weight="600" style={{ marginBottom: 8 }} numberOfLines={1}>
          {item.title}
        </Sans>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${item.completionPercentage || 0}%` }]} />
        </View>
        <GPRow style={{ justifyContent: 'space-between', marginTop: 6 }}>
          <Mono size={7} dim>
            {item.completedMilestones || 0}/{item.totalMilestones || 0} MILESTONES
          </Mono>
          <Mono size={7} style={{ color: GP.cyan }}>
            {item.completionPercentage || 0}%
          </Mono>
        </GPRow>
      </GPBox>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GPRow style={styles.header}>
        <View>
          <Mono size={8} accent>◆ GOALPATH · PATH</Mono>
          <Sans size={20} weight="700" style={{ marginTop: 2 }}>Goals</Sans>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateGoal')}
        >
          <Mono size={9} style={{ color: GP.cyan, letterSpacing: 1 }}>+ NEW</Mono>
        </TouchableOpacity>
      </GPRow>

      <GPRow style={styles.filters} gap={6}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Mono size={8} style={{ color: filter === f ? GP.bg : GP.inkDim }}>
              {f.toUpperCase()}
            </Mono>
          </TouchableOpacity>
        ))}
      </GPRow>

      {loading && goals.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={GP.cyan} />
        </View>
      ) : goals.length === 0 ? (
        <View style={styles.center}>
          <Mono size={9} accent style={{ marginBottom: 8 }}>◉ NO GOALS FOUND</Mono>
          <Sans size={13} style={{ color: GP.inkDim }}>Tap + NEW to create your first goal</Sans>
        </View>
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoal}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GP.bg },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(77,227,255,0.08)',
  },
  filters: {
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: GP.line,
    backgroundColor: 'transparent',
  },
  filterActive: {
    backgroundColor: GP.cyan,
    borderColor: GP.cyan,
  },
  list: { paddingHorizontal: 14, paddingBottom: 30 },
  goalCard: {
    backgroundColor: GP.bg2,
    padding: 12,
    marginBottom: 8,
  },
  progressTrack: {
    height: 2,
    backgroundColor: GP.line,
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GP.cyan,
    borderRadius: 1,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
