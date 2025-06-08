#version 300 es
precision highp float; 

uniform sampler2D u_texture;
uniform vec2 u_texel_size;

in vec2 v_uv;
out vec4 outColor;

const float kernel[9] = float[](
  -1.0, -1.0, -1.0,
  -1.0,  9.0, -1.0,
  -1.0, -1.0, -1.0
  // 0.0, -1.0, -0.0,
  // -1.0,  5.0, -1.0,
  // -0.0, -1.0, -0.0
);

#include <convolve.glsl>

void main() {
  vec4 C = convolve(u_texture, v_uv, kernel, u_texel_size);
  outColor = vec4(C.rgb, 1);
}