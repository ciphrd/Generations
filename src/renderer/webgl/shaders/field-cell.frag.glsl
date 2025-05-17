#version 300 es
precision highp float;

#include <simplex.glsl>
#include <cell.glsl>

in vec2 v_uv;
in float v_id;
out vec4 outColor;

void main() {
  vec2 uv = cellUV(v_uv, v_id);

  float L = length(uv - 0.5);
  float S = smoothstep(0.49, 0.45, L);
  float S2 = 1.0 - min(1.0, L * 2.0);
  outColor = vec4(S2);
}