#version 300 es
precision highp float;

#include <noise.glsl>
#include <cell.glsl>

in vec2 v_uv;
in float v_id;

layout (location = 0) out vec4 outColor0;

void main() {
  float id = v_id;
  vec2 uv = cellUV(v_uv, id);

  float L = length(uv - 0.5);
  float S = smoothstep(0.42, 0.4199, L);
  L += snoise(vec3(uv * 10.2, 2982.23)) * 0.02 * S;
  float S2 = 1.0 - min(1.0, L * 2.0);

  vec3 C = hash31(float(id));
  float lC = C.r + C.g + C.g;
  if (lC < 0.6) {
    C = (C + 0.1) / max(lC, 0.1);
  }

  outColor0 = vec4(C * S, S2);
  gl_FragDepth = L;
}