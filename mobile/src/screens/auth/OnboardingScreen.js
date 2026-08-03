import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle, Line as SvgLine, Text as SvgText, G,
} from 'react-native-svg';
import { GP } from '../../theme/GP';
import { Mono, Sans, GPBox, GPRow, GPCol, ScreenHeader, Bracketed } from '../../components/gp/primitives';

const DOMAINS = [
  { label: 'HEALTH', x: 50, y: 22 },
  { label: 'CRAFT',  x: 20, y: 40 },
  { label: 'MIND',   x: 80, y: 40 },
  { label: 'WEALTH', x: 28, y: 68 },
  { label: 'RELATE', x: 72, y: 68 },
  { label: 'LEGACY', x: 50, y: 84 },
];

const DAYS   = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const SLOTS  = ['05', '07', '12', '18', '21'];
const DEFAULT_CELLS = new Set(['0-1', '1-1', '2-1', '3-1', '4-1', '5-3', '6-3']);

// ─── Step A: Constellation domain picker ────────────────────
function StepA({ selected, onSelect, onNext }) {
  const { width } = useWindowDimensions();
  const svgW = width - 28;
  const svgH = 260;

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Choose your axis" subtitle="STEP 01 / 04" />
      <View style={[styles.svgContainer, { margin: 14 }]}>
        <Svg width={svgW} height={svgH}>
          {/* Concentric rings */}
          <Circle cx={svgW / 2} cy={svgH * 0.56} r={svgH * 0.10} fill="none" stroke={GP.line} />
          <Circle cx={svgW / 2} cy={svgH * 0.56} r={svgH * 0.22} fill="none" stroke={GP.line} strokeDasharray="1 2" />
          <Circle cx={svgW / 2} cy={svgH * 0.56} r={svgH * 0.36} fill="none" stroke={GP.line} strokeDasharray="1 2" />
          <Circle cx={svgW / 2} cy={svgH * 0.56} r={4} fill={GP.cyan} />

          {/* Connecting lines */}
          {DOMAINS.map((n, i) => {
            const nx = (n.x / 100) * svgW;
            const ny = (n.y / 100) * svgH;
            const active = n.label === selected;
            return (
              <SvgLine key={i}
                x1={svgW / 2} y1={svgH * 0.56}
                x2={nx} y2={ny}
                stroke={active ? GP.cyan : GP.line}
                strokeWidth={active ? 0.6 : 0.3}
              />
            );
          })}

          {/* Nodes */}
          {DOMAINS.map((n, i) => {
            const nx = (n.x / 100) * svgW;
            const ny = (n.y / 100) * svgH;
            const active = n.label === selected;
            return (
              <G key={i}>
                <Circle cx={nx} cy={ny} r={active ? 9 : 6}
                  fill={active ? 'rgba(77,227,255,0.2)' : GP.bg}
                  stroke={active ? GP.cyan : GP.lineStrong}
                  strokeWidth={1}
                />
                <SvgText x={nx} y={ny + 18} textAnchor="middle"
                  fill={active ? GP.cyan : GP.inkDim}
                  fontSize={7} fontFamily={GP.mono} letterSpacing={0.8}>
                  {n.label}
                </SvgText>
              </G>
            );
          })}

          {/* HUD labels */}
          <SvgText x={8} y={14} fill={GP.inkMute} fontSize={7} fontFamily={GP.mono} letterSpacing={0.5}>◉ 06 DOMAINS</SvgText>
          {selected ? (
            <SvgText x={svgW - 8} y={svgH - 6} textAnchor="end" fill={GP.cyan} fontSize={7} fontFamily={GP.mono} letterSpacing={0.5}>
              {`LOCKED: ${selected}`}
            </SvgText>
          ) : null}
        </Svg>

        {/* Invisible touch targets over each node */}
        {DOMAINS.map((n, i) => {
          const nx = (n.x / 100) * svgW;
          const ny = (n.y / 100) * svgH;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.nodeTouch, { left: nx - 22, top: ny - 22 }]}
              onPress={() => onSelect(n.label)}
            />
          );
        })}
      </View>

      <View style={styles.footer}>
        <GPRow gap={8}>
          <GPBox dashed style={styles.backBtn}>
            <Mono size={8} dim>BACK</Mono>
          </GPBox>
          <TouchableOpacity
            style={[styles.proceedBtn, !selected && styles.proceedDisabled]}
            onPress={selected ? onNext : null}
          >
            <Mono size={8} accent>PROCEED ▸</Mono>
          </TouchableOpacity>
        </GPRow>
      </View>
    </View>
  );
}

// ─── Step B: Coach Q&A goal definition ──────────────────────
function StepB({ domain, goalData, onChange, onNext, onBack }) {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.stepScroll}>
      <ScreenHeader title="Define the target" subtitle="STEP 02 / 04" />
      <View style={styles.stepContent}>
        <GPBox style={{ padding: 12, borderLeftWidth: 2, borderLeftColor: GP.cyan, borderRadius: 0 }}>
          <Mono size={8} accent>COACH · {domain}</Mono>
          <Sans size={13} weight="500" style={{ marginTop: 6 }}>Vague goals die.</Sans>
          <Sans size={13} style={{ color: GP.inkDim, marginTop: 2 }}>State it, measurable, with a deadline.</Sans>
        </GPBox>

        <View style={{ marginTop: 8 }}>
          <Mono size={8}>◆ VERB</Mono>
          <View style={[styles.inputBox, { marginTop: 4 }]}>
            <TextInput
              value={goalData.verb}
              onChangeText={(t) => onChange('verb', t)}
              placeholder="e.g. Run"
              placeholderTextColor={GP.inkMute}
              style={styles.inputText}
            />
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Mono size={8}>◆ OBJECTIVE</Mono>
          <View style={[styles.inputBox, { marginTop: 4 }]}>
            <TextInput
              value={goalData.target}
              onChangeText={(t) => onChange('target', t)}
              placeholder="e.g. a sub-4:00 marathon"
              placeholderTextColor={GP.inkMute}
              style={styles.inputText}
            />
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Mono size={8}>◆ BY DATE</Mono>
          <View style={[styles.inputBox, { marginTop: 4, borderStyle: 'dashed' }]}>
            <TextInput
              value={goalData.date}
              onChangeText={(t) => onChange('date', t)}
              placeholder="e.g. Oct 12, 2026"
              placeholderTextColor={GP.inkMute}
              style={[styles.inputText, { color: GP.inkDim }]}
            />
          </View>
        </View>

        <GPRow gap={6} style={{ marginTop: 20, paddingTop: 4 }}>
          <View style={{ width: 10, height: 10, borderTopWidth: 1, borderRightWidth: 1, borderColor: GP.cyan, transform: [{ rotate: '45deg' }] }} />
          <Mono size={7} dim>SPECIFICITY INDEX</Mono>
          <View style={{ flex: 1, height: 2, backgroundColor: GP.line, position: 'relative' }}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: '30%', backgroundColor: GP.cyan }} />
          </View>
          <Mono size={7} accent>0.70</Mono>
        </GPRow>
      </View>

      <View style={styles.footer}>
        <GPRow gap={8}>
          <TouchableOpacity style={styles.backBtnTouch} onPress={onBack}>
            <GPBox dashed style={styles.backBtn}>
              <Mono size={8} dim>◂ BACK</Mono>
            </GPBox>
          </TouchableOpacity>
          <TouchableOpacity style={styles.proceedBtn} onPress={onNext}>
            <Mono size={8} accent>COMMIT ▸</Mono>
          </TouchableOpacity>
        </GPRow>
      </View>
    </ScrollView>
  );
}

// ─── Step C: Habit lattice / cadence builder ─────────────────
function StepC({ activeCells, onToggle, intensity, onIntensity, onNext, onBack }) {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.stepScroll}>
      <ScreenHeader title="Lock the cadence" subtitle="STEP 03 / 04" />
      <View style={styles.stepContent}>
        <GPRow style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <Mono size={8}>◆ WEEK LATTICE</Mono>
          <Mono size={8} accent>{activeCells.size} / 35 NODES</Mono>
        </GPRow>

        <Bracketed style={{ padding: 10, borderWidth: 1, borderColor: GP.line, borderRadius: 2 }}>
          {/* Day headers */}
          <GPRow style={{ paddingLeft: 28 }}>
            {DAYS.map((d, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Mono size={8} dim>{d}</Mono>
              </View>
            ))}
          </GPRow>
          {/* Time rows */}
          {SLOTS.map((s, si) => (
            <GPRow key={si} style={{ marginTop: 5 }}>
              <View style={{ width: 28 }}>
                <Mono size={7} dim>{s}</Mono>
              </View>
              {DAYS.map((_, di) => {
                const on = activeCells.has(`${di}-${si}`);
                return (
                  <TouchableOpacity
                    key={di}
                    style={[styles.latticeCell, {
                      borderColor: on ? GP.cyan : GP.line,
                      backgroundColor: on ? 'rgba(77,227,255,0.15)' : 'transparent',
                    }]}
                    onPress={() => onToggle(di, si)}
                  />
                );
              })}
            </GPRow>
          ))}
        </Bracketed>

        <View style={{ marginTop: 14 }}>
          <Mono size={8}>◆ INTENSITY</Mono>
          <GPRow gap={4} style={{ marginTop: 6 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} style={{ flex: 1 }} onPress={() => onIntensity(i)}>
                <GPBox style={{
                  padding: 6, alignItems: 'center',
                  borderColor: i === intensity ? GP.cyan : GP.line,
                  backgroundColor: i === intensity ? 'rgba(77,227,255,0.15)' : 'transparent',
                }}>
                  <Mono size={8} accent={i === intensity}>{i}</Mono>
                </GPBox>
              </TouchableOpacity>
            ))}
          </GPRow>
        </View>

        <View style={{ marginTop: 12 }}>
          <Mono size={8}>◆ RECOVERY DAYS</Mono>
          <GPRow gap={4} style={{ marginTop: 6 }}>
            {DAYS.map((d, i) => {
              const isRest = i === 5 || i === 6;
              return (
                <GPBox key={i} style={{
                  flex: 1, padding: 6, alignItems: 'center',
                  borderColor: isRest ? GP.lime : GP.line,
                  backgroundColor: isRest ? 'rgba(200,255,62,0.12)' : 'transparent',
                }}>
                  <Mono size={8} style={{ color: isRest ? GP.lime : GP.inkMute }}>{d}</Mono>
                </GPBox>
              );
            })}
          </GPRow>
        </View>
      </View>

      <View style={styles.footer}>
        <GPRow gap={8}>
          <TouchableOpacity style={styles.backBtnTouch} onPress={onBack}>
            <GPBox dashed style={styles.backBtn}>
              <Mono size={8} dim>◂ BACK</Mono>
            </GPBox>
          </TouchableOpacity>
          <TouchableOpacity style={styles.proceedBtn} onPress={onNext}>
            <Mono size={8} accent>LOCK CADENCE ▸</Mono>
          </TouchableOpacity>
        </GPRow>
      </View>
    </ScrollView>
  );
}

// ─── Step D: Commitment contract ─────────────────────────────
function StepD({ domain, goalData, intensity, onSign }) {
  const [signed, setSigned] = useState(false);

  const handleSign = () => {
    setSigned(true);
    setTimeout(onSign, 600);
  };

  const sessions = intensity >= 4 ? 5 : intensity >= 3 ? 4 : 3;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.stepScroll}>
      <ScreenHeader title="The contract" subtitle="STEP 04 / 04 · FINAL" />
      <View style={styles.stepContent}>
        <Mono size={8} accent>◆ TERMS</Mono>

        <GPBox style={{ padding: 10, backgroundColor: GP.bg2, marginTop: 8 }}>
          <GPCol gap={8}>
            <View>
              <Mono size={7} dim>01 — OBJECTIVE</Mono>
              <Sans size={12} weight="500" style={{ marginTop: 2 }}>
                {goalData.verb} {goalData.target}{goalData.date ? ` by ${goalData.date}.` : '.'}
              </Sans>
            </View>
            <View style={{ height: 1, backgroundColor: GP.line }} />
            <View>
              <Mono size={7} dim>02 — CADENCE</Mono>
              <Sans size={12} weight="500" style={{ marginTop: 2 }}>
                {sessions} sessions / wk · Intensity {intensity}.
              </Sans>
            </View>
            <View style={{ height: 1, backgroundColor: GP.line }} />
            <View>
              <Mono size={7} dim>03 — DOMAIN</Mono>
              <Sans size={12} weight="500" style={{ marginTop: 2 }}>{domain}</Sans>
            </View>
            <View style={{ height: 1, backgroundColor: GP.line }} />
            <View>
              <Mono size={7} dim>04 — STAKES</Mono>
              <Sans size={12} weight="500" style={{ marginTop: 2 }}>Miss 3 = system pause + review.</Sans>
            </View>
          </GPCol>
        </GPBox>

        <GPBox style={{ padding: 10, borderLeftWidth: 2, borderLeftColor: GP.magenta, borderRadius: 0, marginTop: 10 }}>
          <Mono size={8} style={{ color: GP.magenta }}>◆ COACH ACKNOWLEDGES</Mono>
          <Sans size={11} style={{ color: GP.inkDim, marginTop: 4 }}>
            You will want to negotiate. The contract does not negotiate.
          </Sans>
        </GPBox>

        <View style={{ marginTop: 14 }}>
          <Mono size={8}>◆ SIGN</Mono>
          <TouchableOpacity onPress={handleSign}>
            <GPBox dashed style={{ marginTop: 6, padding: 18, alignItems: 'center' }}>
              <Text style={{ fontFamily: GP.mono, fontSize: 20, color: signed ? GP.lime : GP.cyan }}>
                {signed ? '✓ SIGNED' : '— tap to sign —'}
              </Text>
            </GPBox>
          </TouchableOpacity>
        </View>

        <GPRow gap={6} style={{ marginTop: 14 }}>
          <View style={{ width: 10, height: 10, borderTopWidth: 1, borderRightWidth: 1, borderColor: GP.magenta, transform: [{ rotate: '45deg' }] }} />
          <Mono size={7} dim>BIOMETRIC CONFIRMATION REQUIRED</Mono>
        </GPRow>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.signBtn, signed && { backgroundColor: 'rgba(200,255,62,0.12)', borderColor: GP.lime }]}
          onPress={handleSign}
        >
          <Mono size={9} style={{ color: signed ? GP.lime : GP.magenta }}>
            {signed ? '◉ BEGINNING…' : '◉ SIGN & BEGIN'}
          </Mono>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Main Onboarding ─────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [domain, setDomain] = useState('HEALTH');
  const [goalData, setGoalData] = useState({ verb: '', target: '', date: '' });
  const [activeCells, setActiveCells] = useState(DEFAULT_CELLS);
  const [intensity, setIntensity] = useState(3);

  const handleGoalChange = (field, value) => {
    setGoalData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCell = (di, si) => {
    const key = `${di}-${si}`;
    setActiveCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const screens = [
    <StepA
      key="a"
      selected={domain}
      onSelect={setDomain}
      onNext={() => setStep(1)}
    />,
    <StepB
      key="b"
      domain={domain}
      goalData={goalData}
      onChange={handleGoalChange}
      onNext={() => setStep(2)}
      onBack={() => setStep(0)}
    />,
    <StepC
      key="c"
      activeCells={activeCells}
      onToggle={toggleCell}
      intensity={intensity}
      onIntensity={setIntensity}
      onNext={() => setStep(3)}
      onBack={() => setStep(1)}
    />,
    <StepD
      key="d"
      domain={domain}
      goalData={goalData}
      intensity={intensity}
      onSign={() => navigation.replace('SignIn')}
    />,
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressBar}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i <= step && { backgroundColor: GP.cyan },
            ]}
          />
        ))}
      </View>

      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('SignIn')}>
        <Mono size={8} dim>SKIP</Mono>
      </TouchableOpacity>

      {screens[step]}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GP.bg,
  },
  flex: { flex: 1 },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  progressSegment: {
    flex: 1,
    height: 2,
    backgroundColor: GP.line,
    borderRadius: 1,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    padding: 14,
  },
  stepScroll: {
    flexGrow: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  svgContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: GP.line,
    borderRadius: 4,
    position: 'relative',
  },
  nodeTouch: {
    position: 'absolute',
    width: 44,
    height: 44,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: GP.line,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backBtnTouch: {
    flex: 1,
  },
  proceedBtn: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(77,227,255,0.1)',
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 4,
  },
  proceedDisabled: {
    opacity: 0.4,
  },
  signBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255,62,165,0.12)',
    borderWidth: 1,
    borderColor: GP.magenta,
    borderRadius: 4,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: GP.cyan,
    borderRadius: 4,
    padding: 10,
  },
  inputText: {
    color: GP.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  latticeCell: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 2,
    marginHorizontal: 1,
  },
});
