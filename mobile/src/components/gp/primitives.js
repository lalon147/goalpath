import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line as SvgLine } from 'react-native-svg';
import { GP } from '../../theme/GP';

export const Mono = ({ children, size = 9, dim, accent, style, ...rest }) => (
  <Text
    style={[
      {
        fontFamily: GP.mono,
        fontSize: size,
        letterSpacing: 1,
        color: accent ? GP.cyan : dim ? GP.inkMute : GP.inkDim,
        textTransform: 'uppercase',
      },
      style,
    ]}
    {...rest}
  >
    {children}
  </Text>
);

export const Sans = ({ children, size = 14, weight = '500', color, style, ...rest }) => (
  <Text
    style={[{ fontFamily: GP.sans, fontSize: size, fontWeight: weight, color: color || GP.ink, letterSpacing: -0.2 }, style]}
    {...rest}
  >
    {children}
  </Text>
);

export const GPBox = ({ children, dashed, accent, style, ...rest }) => (
  <View
    style={[
      styles.box,
      {
        borderStyle: dashed ? 'dashed' : 'solid',
        borderColor: accent ? GP.cyan : GP.line,
      },
      style,
    ]}
    {...rest}
  >
    {children}
  </View>
);

export const GPRow = ({ children, gap = 8, align = 'center', style, ...rest }) => (
  <View style={[{ flexDirection: 'row', alignItems: align, gap }, style]} {...rest}>
    {children}
  </View>
);

export const GPCol = ({ children, gap = 8, style, ...rest }) => (
  <View style={[{ flexDirection: 'column', gap }, style]} {...rest}>
    {children}
  </View>
);

export function Ring({ size = 120, strokeWidth = 2, progress = 0.62, color, children }) {
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
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke={GP.line} strokeWidth={strokeWidth} />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={c}
          strokeWidth={strokeWidth + 0.5}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
        {ticks.map((t, i) => (
          <SvgLine
            key={i}
            x1={t.x1} y1={t.y1}
            x2={t.x2} y2={t.y2}
            stroke={t.major ? GP.lineStrong : GP.line}
            strokeWidth={1}
          />
        ))}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        {children}
      </View>
    </View>
  );
}

export const Chip = ({ children, color, style }) => {
  const c = color || GP.cyan;
  return (
    <View style={[styles.chip, { borderColor: c }, style]}>
      <Text style={{ fontFamily: GP.mono, fontSize: 8, letterSpacing: 1, color: c, textTransform: 'uppercase' }}>
        {children}
      </Text>
    </View>
  );
};

export function ScreenHeader({ title, subtitle, right }) {
  return (
    <View style={styles.screenHeader}>
      <View>
        <Mono size={8} accent>◆ {subtitle}</Mono>
        <Sans size={17} weight="600" style={{ marginTop: 2 }}>{title}</Sans>
      </View>
      {right}
    </View>
  );
}

export function Bracketed({ children, style }) {
  const B = ({ s }) => (
    <View style={[styles.cornerBracket, s]}>
      <View style={[styles.cornerH, s.top !== undefined ? { top: 0 } : { bottom: 0 }]} />
      <View style={[styles.cornerV, s.left !== undefined ? { left: 0 } : { right: 0 }]} />
    </View>
  );
  return (
    <View style={[{ position: 'relative' }, style]}>
      <B s={{ top: 0, left: 0 }} />
      <B s={{ top: 0, right: 0 }} />
      <B s={{ bottom: 0, left: 0 }} />
      <B s={{ bottom: 0, right: 0 }} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  screenHeader: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  cornerBracket: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  cornerH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: GP.lineStrong,
  },
  cornerV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: GP.lineStrong,
  },
});
