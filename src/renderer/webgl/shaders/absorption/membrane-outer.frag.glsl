#version 300 es
precision highp float;

uniform sampler2D u_membrane_outer;
uniform sampler2D u_cells;
uniform vec4 u_view;

in vec2 v_uv;

out vec4 outColor0;

#include <view.glsl>

void main() {
  vec2 uv = invViewTx(v_uv);

  vec4 cells = texture(u_cells, v_uv);
  float C = smoothstep(0.0, 0.01, (cells.r + cells.g + cells.b) * 0.333);

  float I = max(0.0, texture(u_membrane_outer, uv).r - C);

  outColor0 = vec4(I * 0.1);
}