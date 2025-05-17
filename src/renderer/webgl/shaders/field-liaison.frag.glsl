#version 300 es
precision highp float;

#include <simplex.glsl>
#include <liaison.glsl>

in vec2 v_uv;
in float v_length;
out vec4 outColor;

void main() {
  vec2 uv = liaisonUV(v_uv, v_length);
  float S = max(0.0, 1.0 - length(uv - 0.5) * 2.0);
  outColor = vec4(S);
} 