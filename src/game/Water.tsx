import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { skyLive } from './SkyDome'
import { useGfx } from './gfx'

// 섬을 둘러싼 바다. 섬에 가까울수록 맑은 옥색, 멀수록 짙은 파랑.
// 섬 가장자리에는 파도 거품이 밀려왔다 가고, 높음 단계에서는 물결 위로 반짝이가 지나간다.
// 먼 바다는 안개색으로 풀려서 수평선이 하늘과 자연스럽게 이어진다.

const vert = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`

const frag = /* glsl */ `
uniform float uTime; uniform float uHalf; uniform float uMode; uniform float uSparkle;
uniform vec3 uFog; uniform float uLight; uniform float uRound;
varying vec3 vWorld;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

// 섬 가장자리까지의 바깥쪽 거리 (사각 섬 / 원형 섬)
float edgeDist(vec2 p) {
  if (uMode > 0.5) return length(p) - uHalf;
  vec2 q = abs(p) - vec2(uHalf - uRound);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRound;
}

void main() {
  vec2 p = vWorld.xz;
  float d = max(edgeDist(p), 0.0);

  // 잔잔한 물결 무늬 (두 겹을 겹쳐 규칙이 안 보이게)
  float n = vnoise(p * 0.55 + vec2(uTime * 0.08, uTime * 0.05)) * 0.6 + vnoise(p * 1.4 - vec2(uTime * 0.12, -uTime * 0.07)) * 0.4;

  vec3 shallow = vec3(0.45, 0.82, 0.80);
  vec3 mid = vec3(0.26, 0.66, 0.78);
  vec3 deep = vec3(0.15, 0.47, 0.70);
  vec3 col = mix(shallow, mid, smoothstep(0.2, 3.0, d));
  col = mix(col, deep, smoothstep(3.0, 16.0, d));
  col += (n - 0.5) * 0.10;

  // 파도 거품: 가장자리에서 바깥으로 밀려 나가며 흐려지는 띠 두 줄
  float t = uTime * 0.55;
  float w1 = fract(t);
  float w2 = fract(t + 0.5);
  float wob = (vnoise(p * 1.1 + uTime * 0.2) - 0.5) * 0.35;
  float f1 = smoothstep(0.16, 0.0, abs(d - (0.08 + w1 * 1.5) - wob)) * (1.0 - w1);
  float f2 = smoothstep(0.16, 0.0, abs(d - (0.08 + w2 * 1.5) - wob)) * (1.0 - w2);
  float shore = smoothstep(0.35, 0.0, d); // 모래 바로 옆의 얕은 흰 기운
  col = mix(col, vec3(1.0), clamp(f1 * 0.85 + f2 * 0.85 + shore * 0.35, 0.0, 0.95));

  // 반짝이: 움직이는 점들이 깜박인다
  if (uSparkle > 0.5) {
    vec2 g = p * 1.6 + vec2(uTime * 0.18, uTime * 0.11);
    vec2 id = floor(g);
    vec2 fr = fract(g) - 0.5;
    float h = hash(id);
    float tw = 0.5 + 0.5 * sin(uTime * (1.5 + h * 2.5) + h * 40.0);
    float spark = step(0.86, h) * smoothstep(0.22, 0.0, length(fr)) * tw;
    col += vec3(1.0, 0.98, 0.9) * spark * 0.55 * uLight * (1.0 - smoothstep(14.0, 34.0, d));
  }

  col *= mix(0.45, 1.0, uLight);

  // 멀리는 안개색으로
  float dist = length(cameraPosition - vWorld);
  col = mix(col, uFog, smoothstep(35.0, 130.0, dist));
  gl_FragColor = vec4(col, 1.0);
}`

export function Water({ half, round = false, rounded = 0.4 }: { half: number; round?: boolean; rounded?: number }) {
  const sparkle = useGfx((s) => s.level === 'high')
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHalf: { value: half },
      uMode: { value: round ? 1 : 0 },
      uRound: { value: rounded },
      uSparkle: { value: 0 },
      uFog: { value: new THREE.Color('#cdeaf3') },
      uLight: { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  uniforms.uHalf.value = half
  uniforms.uMode.value = round ? 1 : 0
  uniforms.uRound.value = rounded
  uniforms.uSparkle.value = sparkle ? 1 : 0
  useFrame((s) => {
    uniforms.uTime.value = s.clock.elapsedTime
    uniforms.uFog.value.copy(skyLive.fog)
    uniforms.uLight.value = skyLive.light
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} userData={{ noShadow: true }}>
      <planeGeometry args={[600, 600]} />
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} />
    </mesh>
  )
}
