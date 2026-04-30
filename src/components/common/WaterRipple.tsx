import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { Canvas, Rect, RuntimeShader, Skia } from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');

// Premium "Glass Water Ripple" shader
const sourceCode = `
uniform float time;
uniform vec2 resolution;

float f(vec3 p) {
    p.z += time * 0.0005; // Slow, calm ripple
    return length(0.05 * cos(9.0 * p.y * p.x) + cos(p)) - 0.8;
}

vec4 main(vec2 fc) {
    vec2 uv = fc / resolution.xy;
    // Creates a depth distortion effect
    vec3 d = 0.5 - vec3(uv, 1.0);
    vec3 p = vec3(0.0);
    
    for (int i = 0; i < 32; i++) {
        p += f(p) * d;
    }
    
    // Smooth, deep indigo/blue colors
    vec3 col = vec3(0.12, 0.16, 0.35) + vec3(0.1, 0.2, 0.4) * p.z;
    return vec4(col, 1.0);
}
`;

const source = Skia.RuntimeEffect.Make(sourceCode);

const WaterRipple = () => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let startTime = Date.now();
    
    const animate = () => {
      setTime(Date.now() - startTime);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, []);
  
  if (!source) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        <Rect x={0} y={0} width={width} height={height}>
          <RuntimeShader source={source} uniforms={{ resolution: [width, height], time }} />
        </Rect>
      </Canvas>
      {/* Frosted overlay to ensure text remains perfectly readable */}
      <View style={styles.overlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  canvas: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Dark Slate overlay for contrast
  }
});

export default WaterRipple;
