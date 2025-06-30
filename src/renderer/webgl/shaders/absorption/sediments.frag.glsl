#version 300 es
precision mediump float;

#define CELL_COLOR_SPREAD $CELL_COLOR_SPREAD

uniform sampler2D u_sediments;
uniform sampler2D u_rd;
uniform sampler2D u_cells;
uniform sampler2D u_cell_colors;
uniform vec4 u_view;
uniform vec2 u_hues;
uniform float u_sharpness;
uniform vec2 u_thickness;

in vec2 v_uv;

out vec4 outColor0;

#include <view.glsl>
#include <color.glsl>
#include <noise.glsl>

float smin( float a, float b, float k ){
  k *= 1.0;
  float r = exp2(-a/k) + exp2(-b/k);
  return -k*log2(r);
}

// todo: cleanup

void main() {
  vec2 uv = v_uv;
  vec2 guv = invViewTx(v_uv);

  vec4 cells = texture(u_cells, v_uv);
  float C = clamp(smoothstep(.0,.01,(cells.r+cells.g+cells.b) * 0.333), 0., 1.);
  float C2 = smoothstep(0.1, 0.4, cells.a);
  float C3 = smoothstep(0.01, 0.3, cells.a);

  float invSediments = clamp(1. - pow(texture(u_sediments, uv).r, 0.15), 0., 1.);

  float rd = texture(u_rd, guv).b;

  float I = pow(invSediments, 2.5) * u_thickness.x;

  vec3 col = vec3(1.0) - hsv2rgb(vec3(
    u_hues.x,
    1.0,
    1.0 - I * u_sharpness
  ));
  outColor0 = vec4(col * I, 1);

  vec3 cell_color = texture(u_cell_colors, v_uv).rgb;
  C = smoothstep(CELL_COLOR_SPREAD, 1.5, cells.a);

  rd = pow(rd, 0.5) * 1.0;
  rd = clamp(rd, 0.0, 1.0);
  col = hsv2rgb(vec3(u_hues.y, 1, 1));

  vec3 rdCol = mix(col, vec3(1) - col, C3);

  // rd-substrate coloring
  col = vec3(1) - rdCol;
  vec3 nColA = mix(
    outColor0.rgb,
    col,
    rd * (1.0 - C) * u_thickness.y
  );

  // cell coloring
  vec3 nColB = outColor0.rgb;
  col = vec3(1) - mix(rdCol, cell_color, min(1.0, C * rd * 4.0));
  nColB += col * rd * (0.1 + 0.9 * pow(I, 0.5));

  // mixing based
  outColor0.rgb = mix(nColA, nColB, C2);

  // final color correction
  outColor0.rgb = pow(outColor0.rgb, vec3(0.9)) * 1.25;
}