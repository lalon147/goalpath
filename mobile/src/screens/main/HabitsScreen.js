import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHabits, logHabit } from '../../redux/slices/habitsSlice';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow, Chip } from '../../components/gp/primitives';

const FILTERS = ['Today', 'Active', 'All'];

export default function HabitsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { list: habits, loading } = useSelector((s) => s.habits);
  const [filter, setFilter] = useState('Active');
  const [logging, setLogging] = useState(null);

  useEffect(() => {
    dispatch(fetchHabits(filter === 'All' ? {} : { status: 'active' }));
  }, [filter]);

  const handleLog = async (habitId) => {
    setLogging(habitId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await dispatch(logHabit({ id: habitId, logDate: today.toISOString(), status: 'completed' }));
    setLogging(null);
  };

  const renderHabit = ({ item }) => (
    <GPBox style={styles.habitCard}>
      <GPRow style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <Mono size={7} style={{ color: GP.cyan }}>◆ {(item.frequency || 'daily').toUpperCase()}</Mono>
        {item.currentStreak > 0 && (
          <Chip color={GP.amber}>{item.currentStreak}D STREAK</Chip>
        )}
      </GPRow>

      <Sans size={14} weight="600" style={{ marginBottom: 10 }}>{item.title}</Sans>

      <GPRow gap={8}>
        <TouchableOpacity
          style={[styles.logBtn, logging === item._id && { opacity: 0.5 }]}
          onPress={() => handleLog(item._id)}
          disabled={logging === item._id}
        >
          {logging === item._id
            ? <ActivityIndicator size="small" color={GP.bg} />
            : <Mono size={9} style={{ color: GP.bg, letterSpacing: 1 }}>◉ LOG TODAY</Mono>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => navigation.navigate('HabitDetail', { habitId: item._id })}
        >
          <Mono size={9} style={{ color: GP.cyan, letterSpacing: 1 }}>DETAILS ▸</Mono>
        </TouchableOpacity>
      </GPRow>
    </GPBox>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GPRow style={styles.header}>
        <View>
          <Mono size={8} accent>◆ GOALPATH · LOG</Mono>
          <Sans size={20} weight="700" style={{ marginTop: 2 }}>Habits</Sans>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateHabit')}
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

      {loading && habits.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={GP.cyan} />
        </View>
      ) : habits.length === 0 ? (
        <View style={styles.center}>
          <Mono size={9} accent style={{ marginBottom: 8 }}>◉ NO HABITS FOUND</Mono>
          <Sans size={13} style={{ color: GP.inkDim }}>Tap + NEW to add your first habit</Sans>
        </View>
      ) : (
        <FlatList
          data={habits}
          renderItem={renderHabit}
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
  habitCard: {
    backgroundColor: GP.bg2,
    padding: 12,
    marginBottom: 8,
  },
  logBtn: {
    flex: 1,
    height: 36,
    backgroundColor: GP.cyan,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBtn: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(77,227,255,0.08)',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
