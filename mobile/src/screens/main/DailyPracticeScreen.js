import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchDailyPractice } from '../../services/suggestions';
import { habitsAPI, milestonesAPI } from '../../services/api';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow } from '../../components/gp/primitives';

/**
 * Turns a goal into something loggable every day.
 *
 * A goal like "run a marathon" has nothing to tick on a Tuesday. This proposes
 * one small daily action plus weekly targets that climb, so the goal becomes a
 * streak the LOG tab can actually track.
 */
export default function DailyPracticeScreen({ route, navigation }) {
  const { goalId, title, category, description } = route.params;

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState('');
  const [unavailable, setUnavailable] = useState(false);

  const generate = async () => {
    setLoading(true);
    setStatus('');
    const result = await fetchDailyPractice({ title, category, description });
    setLoading(false);

    if (!result.ok) {
      if (result.reason === 'unavailable') {
        setUnavailable(true);
        setStatus('This server has no AI key configured.');
      } else if (result.reason === 'rate-limited') {
        setStatus('Too many requests just now — try again shortly.');
      } else {
        setStatus('Could not reach the suggestion service.');
      }
      return;
    }
    setPlan(result);
  };

  const apply = async () => {
    setAdding(true);
    setStatus('');
    try {
      const p = plan.practice;
      await habitsAPI.create({
        title: p.title,
        emoji: p.emoji,
        category: p.category,
        frequency: 'daily',
        targetValue: p.targetValue,
        unit: p.unit,
        goalId,
      });

      // Sequential rather than Promise.all: milestone order is assigned by the
      // server from creation order, and parallel writes would scramble it.
      for (const m of plan.weeklyMilestones) {
        await milestonesAPI.create(goalId, { title: m.title });
      }

      setStatus('Added. The habit now shows up in your weekly log.');
      setPlan(null);
    } catch (err) {
      setStatus(err.response?.data?.error?.message || 'Could not add that plan');
    } finally {
      setAdding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Mono size={9} dim>◂ BACK</Mono>
        </TouchableOpacity>

        <View style={styles.header}>
          <Mono size={8} accent>◆ GOALPATH · 1% BETTER</Mono>
          <Sans size={20} weight="700" style={{ marginTop: 2 }}>Make it a daily habit</Sans>
          <Sans size={13} color={GP.inkDim} style={{ marginTop: 8, lineHeight: 20 }}>
            “{title}” is hard to act on today. This turns it into one small thing
            you can do every day, with a target that grows about 1% a day.
          </Sans>
        </View>

        {!!status && (
          <GPBox style={[styles.card, { borderColor: GP.amber }]}>
            <Mono size={9} style={{ color: GP.amber, lineHeight: 14 }}>◉ {status}</Mono>
          </GPBox>
        )}

        {!plan && !unavailable && (
          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            onPress={generate}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={GP.cyan} />
              : <Mono size={11} accent style={{ letterSpacing: 2 }}>◉ BUILD MY DAILY PRACTICE</Mono>}
          </TouchableOpacity>
        )}

        {plan && (
          <>
            <GPBox style={styles.practiceCard}>
              <Mono size={7} dim>DO THIS EVERY DAY</Mono>
              <Sans size={18} weight="700" style={{ marginTop: 6 }}>
                {plan.practice.emoji} {plan.practice.title}
              </Sans>
              <GPRow style={{ marginTop: 10, alignItems: 'baseline' }} gap={6}>
                <Sans size={28} weight="700" color={GP.cyan}>{plan.practice.targetValue}</Sans>
                <Mono size={9} dim>{(plan.practice.unit || '').toUpperCase()} TO START</Mono>
              </GPRow>
              {!!plan.practice.why && (
                <Sans size={12} color={GP.inkDim} style={{ marginTop: 10, lineHeight: 18 }}>
                  {plan.practice.why}
                </Sans>
              )}
            </GPBox>

            <Mono size={7} dim style={{ marginBottom: 8, marginTop: 6 }}>
              WEEKLY TARGETS · ADDED AS MILESTONES
            </Mono>

            {plan.weeklyMilestones.map((m) => (
              <GPBox key={m.week} style={styles.weekRow}>
                <GPRow style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <GPRow gap={10} style={{ flex: 1 }}>
                    <Mono size={9} accent style={{ width: 26 }}>W{m.week}</Mono>
                    <Sans size={13} style={{ flex: 1 }}>{m.title}</Sans>
                  </GPRow>
                  <Mono size={9} dim>
                    {m.targetValue}{plan.practice.unit ? ` ${plan.practice.unit}` : ''}
                  </Mono>
                </GPRow>
              </GPBox>
            ))}

            <TouchableOpacity
              style={[styles.primaryBtn, adding && { opacity: 0.6 }]}
              onPress={apply}
              disabled={adding}
            >
              <Mono size={11} accent style={{ letterSpacing: 2 }}>
                {adding ? 'ADDING…' : '◉ ADD HABIT + MILESTONES'}
              </Mono>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={generate} disabled={loading}>
              <Mono size={10} dim>↻ TRY A DIFFERENT PLAN</Mono>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GP.bg },
  scroll: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 40 },
  header: { paddingBottom: 16 },
  card: { backgroundColor: GP.bg2, padding: 14, marginBottom: 12 },
  practiceCard: { backgroundColor: GP.bg2, borderColor: GP.cyan, padding: 16, marginBottom: 16 },
  weekRow: { backgroundColor: GP.bg2, padding: 10, marginBottom: 6 },
  primaryBtn: {
    height: 50, backgroundColor: 'rgba(77,227,255,0.12)', borderWidth: 1,
    borderColor: GP.cyan, borderRadius: 4, justifyContent: 'center',
    alignItems: 'center', marginTop: 14,
  },
  secondaryBtn: {
    height: 42, borderWidth: 1, borderColor: GP.line, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
});
