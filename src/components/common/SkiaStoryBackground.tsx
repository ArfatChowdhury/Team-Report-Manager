import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  vec,
  LinearGradient,
  BlurMask,
  Group,
  SweepGradient,
  Rect,
  mix
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Number of nodes to animate
const NODE_COUNT = 6;

const generateRandomPosition = () => ({
  x: Math.random() * width,
  y: Math.random() * height,
});

export const SkiaStoryBackground = () => {
  // Shared value to drive the continuous animation loop (0 -> 1)
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: 20000, // 20 seconds for a full cycle
        easing: Easing.linear,
      }),
      -1,
      true // Reverse the animation to make it seamless
    );
  }, []);

  // Define static random points for nodes to move between
  const nodesConfigs = useMemo(() => {
    return Array.from({ length: NODE_COUNT }).map(() => ({
      start: generateRandomPosition(),
      end: generateRandomPosition(),
      radius: Math.random() * 40 + 20,
    }));
  }, []);

  // Compute animated positions for each node
  const animatedNodes = nodesConfigs.map((config) => {
    return {
      x: useDerivedValue(() => mix(progress.value, config.start.x, config.end.x)),
      y: useDerivedValue(() => mix(progress.value, config.start.y, config.end.y)),
      radius: config.radius,
    };
  });

  // Derived path for the connections (lines) between nodes
  const connectionsPath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        // Only connect if they are close enough (virtual distance), 
        // but here we just connect a few specific ones for simplicity and abstract look.
        if ((i + j) % 2 === 0) {
           path.moveTo(animatedNodes[i].x.value, animatedNodes[i].y.value);
           path.lineTo(animatedNodes[j].x.value, animatedNodes[j].y.value);
        }
      }
    }
    return path;
  });

  return (
    <Canvas style={styles.canvas}>
      {/* Deep dark background */}
      <Rect x={0} y={0} width={width} height={height} color="#050914" />
      
      {/* Background Ambient Glow */}
      <Rect x={0} y={0} width={width} height={height}>
         <SweepGradient
            c={vec(width / 2, height / 2)}
            colors={['#050914', '#0f172a', '#1e1b4b', '#050914']}
         />
      </Rect>

      <Group>
        {/* Draw Connections */}
        <Path
          path={connectionsPath}
          style="stroke"
          strokeWidth={1}
          color="rgba(16, 185, 129, 0.1)" // Dimmer connections
        >
          <BlurMask blur={4} style="solid" />
        </Path>

        {/* Draw Nodes (Orbs) */}
        {animatedNodes.map((node, index) => {
          const isPrimary = index % 2 === 0;
          return (
            <Circle
              key={index}
              cx={node.x}
              cy={node.y}
              r={node.radius}
              color={isPrimary ? "rgba(16, 185, 129, 0.2)" : "rgba(56, 189, 248, 0.15)"} // Dimmer orbs
            >
              <BlurMask blur={20} style="normal" />
            </Circle>
          );
        })}
      </Group>

      {/* Another layer of large ambient floating blobs for depth */}
      <Circle
        cx={useDerivedValue(() => mix(progress.value, -100, width * 0.8))}
        cy={height * 0.2}
        r={200}
        color="rgba(79, 70, 229, 0.05)" // Very subtle
      >
        <BlurMask blur={40} style="normal" />
      </Circle>
      
      <Circle
        cx={width * 0.8}
        cy={useDerivedValue(() => mix(progress.value, height + 100, height * 0.3))}
        r={250}
        color="rgba(16, 185, 129, 0.03)" // Very subtle
      >
        <BlurMask blur={40} style="normal" />
      </Circle>
    </Canvas>
  );
};

// We need to import Skia manually for the Make path inside useDerivedValue
import { Skia } from '@shopify/react-native-skia';

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default SkiaStoryBackground;
