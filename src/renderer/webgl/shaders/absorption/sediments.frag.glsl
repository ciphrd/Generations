#version 300 es
precision mediump float;

uniform vec4 u_view;
uniform sampler2D u_sediments;

in vec2 v_uv;

out vec4 outColor0;

#include <view.glsl>

void main() {
  vec2 uv = invViewTx(v_uv);
  float sediments = texture(u_sediments, uv).r;
  sediments = clamp(sediments, 0.0, 1.0);
  sediments = pow(sediments, 0.8);
  vec3 C = vec3(1);
  outColor0 = vec4(C, 1) * sediments;
}