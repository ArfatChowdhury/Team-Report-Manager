import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Svg, { Rect, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const GlassBackground = () => {
  // Animation values for three floating blobs
  const blob1X = useSharedValue(width * 0.2);
  const blob1Y = useSharedValue(height * 0.2);
  const blob2X = useSharedValue(width * 0.8);
  const blob2Y = useSharedValue(height * 0.8);
  const blob3X = useSharedValue(width * 0.5);
  const blob3Y = useSharedValue(height * 0.5);

  useEffect(() => {
    // Blob 1 movement
    blob1X.value = withRepeat(
      withSequence(
        withTiming(width * 0.7, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
        withTiming(width * 0.2, { duration: 10000, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.5, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
        withTiming(height * 0.2, { duration: 12000, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );

    // Blob 2 movement
    blob2X.value = withRepeat(
      withSequence(
        withTiming(width * 0.3, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
        withTiming(width * 0.8, { duration: 15000, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.4, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
        withTiming(height * 0.8, { duration: 11000, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, []);

  const animatedProps1 = useAnimatedProps(() => ({
    cx: blob1X.value,
    cy: blob1Y.value,
  }));

  const animatedProps2 = useAnimatedProps(() => ({
    cx: blob2X.value,
    cy: blob2Y.value,
  }));

  return (
    <View style={styles.container}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="grad1" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="grad2" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#4c1d95" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="grad3" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#0f172a" stopOpacity="1" />
            <Stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </RadialGradient>
        </Defs>

        {/* Base dark background */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad3)" />

        {/* Floating blobs */}
        <AnimatedCircle r={width * 0.8} fill="url(#grad1)" animatedProps={animatedProps1} />
        <AnimatedCircle r={width * 0.7} fill="url(#grad2)" animatedProps={animatedProps2} />
      </Svg>
      
      {/* Frosted Glass Overlay */}
      <View style={styles.overlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
  },
});

export default GlassBackground;
