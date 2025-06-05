#version 300 es
precision mediump float;

uniform sampler2D u_sediments;
uniform sampler2D u_cells;
uniform sampler2D u_membrane;
uniform vec4 u_view;

in vec2 v_uv;

out vec4 outColor0;

#include <view.glsl>

float smin( float a, float b, float k ){
  k *= 1.0;
  float r = exp2(-a/k) + exp2(-b/k);
  return -k*log2(r);
}

void main() {
  vec2 uv = v_uv;
  vec2 guv = invViewTx(v_uv);

  vec4 cells = texture(u_cells, v_uv);
  float C = (cells.r + cells.g + cells.b) * 0.333;
  C = smoothstep(0.0, 0.01, C);
  C = max(texture(u_membrane, v_uv).r * 2.0, C);
  C = 1.0 - clamp(C, 0.0, 1.0);


  float sediments = texture(u_sediments, uv).r;
  sediments = pow(sediments, 0.1);
  float invSediments = 1.0 - sediments;
  invSediments = smin(invSediments, 0.85, 0.1);
  invSediments = clamp(invSediments, 0.0, 1.0);

  outColor0 = vec4(invSediments) * C;

}