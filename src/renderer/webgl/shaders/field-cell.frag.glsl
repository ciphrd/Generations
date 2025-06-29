#version 300 es
precision highp float;

#include <noise.glsl>
#include <cell.glsl>

in vec2 v_uv;
in float v_id;
in vec3 v_color;
in float v_signal;

layout (location = 0) out vec4 outColor0;
layout (location = 1) out vec4 outColor1;

void main() {
  float id = v_id;
  vec2 uv = cellUV(v_uv, id);

  float L = length(uv - 0.5);
  float S = smoothstep(0.42, 0.4199, L);
  float S2 = 1.0 - min(1.0, L * 2.0);

  outColor0 = vec4(v_color * S, S2);
  gl_FragDepth = L;
}