#version 300 es
precision mediump float;

uniform sampler2D u_sediments;
uniform sampler2D u_rd;
uniform sampler2D u_cells;
uniform sampler2D u_membrane;
uniform vec4 u_view;
uniform vec2 u_hues;

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
  float C = (cells.r + cells.g + cells.b) * 0.333;
  C = smoothstep(0.0, 0.01, C);
  C = max(texture(u_membrane, v_uv).r * 2.0, C);
  C = 1.0 - clamp(C, 0.0, 1.0);

  float sediments = texture(u_sediments, uv).r;
  sediments = pow(sediments, 0.15);
  float invSediments = 1.0 - sediments;
  // invSediments = smin(invSediments, 0.85, 0.1);
  invSediments = clamp(invSediments, 0.0, 1.0);

  float n1 = .5+.5*snoise(vec3(guv * 10.0, 0.0));

  float rd = texture(u_rd, guv).b;

  float I = invSediments;
  I = pow(I, 3.0 /*- n1*1.6*/) * 3.0;


  vec3 col = vec3(1.0) - hsv2rgb(vec3(
    u_hues.x,
    1.0,
    1.0 - I * 0.2
  ));
  outColor0 = vec4(col * I, 1) * C;

  rd = pow(rd, 0.5) * 1.0;
  // todo: add time to noises
  float n2 = fbm(vec3(guv * 20.0, 0.0), 4, 0.5);
  col = vec3(1.0) - hsv2rgb(vec3(
    u_hues.y + n2 * 0.02,
    1.0,
    1.0
  ));

  outColor0.rgb += col * rd * (0.1 + 0.9 * pow(I, 0.5));
  // outColor0.rgb += col;

  outColor0.rgb = pow(outColor0.rgb, vec3(0.9)) * 1.2;
}