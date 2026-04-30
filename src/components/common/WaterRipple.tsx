import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { Canvas, Rect, RuntimeShader, Skia, useTouchHandler } from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, useFrameCallback } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const sourceCode = `
uniform float time;
uniform vec2  resolution;
uniform vec2  u_pointer;
uniform float u_pointer_time;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  return noise(p) * 0.55 + noise(p * 2.1 + 7.3) * 0.30 + noise(p * 4.3 + 3.7) * 0.15;
}

float ripple(vec2 p, vec2 origin, float t, float speed, float freq, float decay) {
  float d = distance(p, origin);
  return sin(d * freq - t * speed) * exp(-d * decay);
}

vec4 main(vec2 fc) {
  vec2 uv = fc / resolution.xy;
  float aspect = resolution.x / resolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  
  float t = time * 0.001; 

  // Ambient ripples
  float w = ripple(p, vec2(-0.28,  0.12), t,       2.0, 22.0, 3.2)
          + ripple(p, vec2( 0.31, -0.22), t + 1.6, 1.7, 19.0, 2.6)
          + ripple(p, vec2( 0.05,  0.34), t + 3.1, 2.3, 24.0, 3.8)
          + ripple(p, vec2(-0.38, -0.27), t + 0.7, 1.5, 17.0, 2.9);
          
  // Interactive Tap Ripple
  float tapAge = (time - u_pointer_time) * 0.001;
  if (tapAge > 0.0 && tapAge < 3.0) {
     w += ripple(p, u_pointer, tapAge, 4.0, 40.0, 4.0) * 0.5;
  }

  w *= 0.18;

  vec2 drift = vec2(
    fbm(p * 2.0 + t * 0.15) - 0.5,
    fbm(p * 2.0 + t * 0.15 + 5.2) - 0.5
  ) * 0.06;

  vec2 refractUV = uv + vec2(w * 0.025) + drift;

  float baseR = 0.04 + 0.04 * sin(refractUV.x * 3.0 + t * 0.7);
  float baseG = 0.11 + 0.06 * sin(refractUV.y * 2.4 + t * 0.9);
  float baseB = 0.22 + 0.12 * cos(refractUV.x * 2.1 - refractUV.y * 1.6 + t * 0.6);

  float caustic  = pow(max(0.0, sin(w * 12.0 + t * 2.0) * 0.5 + 0.5), 5.0)
                 * smoothstep(-0.08, 0.08, w) * 0.55;
  float specular = pow(max(0.0, w), 2.0) * 1.8;

  float dist     = length(p);
  float vignette = smoothstep(0.85, 0.2, dist);
  float bloom    = exp(-dist * dist * 3.5) * 0.06;

  float ca  = abs(w) * 0.07;
  float red = baseR + specular * 0.15 + caustic * 0.6 + ca;
  float grn = baseG + specular * 0.25 + caustic * 0.8;
  float blu = baseB + specular * 0.55 + caustic * 1.0 - ca * 0.5;

  vec3 col = vec3(red, grn, blu);
  col *= vignette * 0.7 + 0.3;
  col += bloom;

  float foam = step(0.96, fract(w * 4.0 + t))
             * 0.12 * smoothstep(0.0, 0.04, abs(w));
  col += foam;

  return vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const source = Skia.RuntimeEffect.Make(sourceCode);
if (!source) {
  throw new Error('[WaterRipple] SkSL shader failed to compile.');
}

const RESOLUTION: [number, number] = [width, height];

const WaterRipple = React.memo(() => {
  const time = useSharedValue(0);
  const pointerPos = useSharedValue({ x: 10, y: 10 }); 
  const pointerTime = useSharedValue(-10000);

  useFrameCallback((frameInfo) => {
    time.value = frameInfo.timestamp;
  });

  const onTouch = useTouchHandler({
    onStart: ({ x, y }) => {
      const aspect = width / height;
      pointerPos.value = { 
        x: (x / width - 0.5) * aspect, 
        y: (y / height - 0.5) 
      };
      pointerTime.value = time.value;
    },
  });

  const uniforms = useDerivedValue(() => ({
    resolution: RESOLUTION,
    time: time.value,
    u_pointer: [pointerPos.value.x, pointerPos.value.y],
    u_pointer_time: pointerTime.value,
  }));

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas} onTouch={onTouch}>
        <Rect x={0} y={0} width={width} height={height}>
          <RuntimeShader source={source} uniforms={uniforms} />
        </Rect>
      </Canvas>
      <View style={styles.overlay} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  canvas: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 16, 36, 0.3)', 
  },
});

export default WaterRipple;
