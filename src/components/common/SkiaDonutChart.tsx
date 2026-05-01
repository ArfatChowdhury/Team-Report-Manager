import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  SweepGradient,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

interface SkiaDonutChartProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

const SkiaDonutChart: React.FC<SkiaDonutChartProps> = ({
  completed,
  total,
  size = 160,
  strokeWidth = 12,
}) => {
  const progress = useSharedValue(0);
  const center = size / 2;
  const radius = center - strokeWidth;

  const targetProgress = total > 0 ? completed / total : 0;
  const percentage = Math.round(targetProgress * 100);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress]);

  // Background ring path
  const bgPath = Skia.Path.Make();
  bgPath.addCircle(center, center, radius);

  // Animated foreground ring path
  const fgPath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    // Start from top (-90 degrees)
    path.addArc(
      { x: strokeWidth, y: strokeWidth, width: radius * 2, height: radius * 2 },
      -90,
      progress.value * 360
    );
    return path;
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ width: size, height: size, position: 'absolute' }}>
        {/* Background Track */}
        <Path
          path={bgPath}
          style="stroke"
          strokeWidth={strokeWidth}
          color="rgba(255, 255, 255, 0.05)"
        />

        {/* Outer Glow */}
        <Path
          path={fgPath}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
        >
          <SweepGradient
            c={vec(center, center)}
            colors={['#38BDF8', '#818CF8', '#C084FC', '#38BDF8']}
          />
          <BlurMask blur={10} style="normal" />
        </Path>

        {/* Foreground Track */}
        <Path
          path={fgPath}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
        >
          <SweepGradient
            c={vec(center, center)}
            colors={['#38BDF8', '#818CF8', '#C084FC', '#38BDF8']}
          />
        </Path>
      </Canvas>
      <View style={styles.textContainer}>
        <Text style={styles.percentageText}>{percentage}%</Text>
        <Text style={styles.subText}>Done</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: -4,
  },
});

export default SkiaDonutChart;
