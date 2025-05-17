#version 300 es
precision highp float;

#define WIDTH $WIDTH

uniform sampler2D u_texture;
uniform vec2 u_texel_size;
uniform vec2 u_dir;

in vec2 v_uv;
out vec4 outColor;

const int HALF = WIDTH / 2 + 1;

vec4 T(int x) {
  return texture(u_texture, v_uv + u_dir * float(x));
}

void main() {
  float K[HALF] = float[]($KERNEL);
  vec4 acc = T(0) * K[0];

  for (int i = 1; i < HALF; i++) {
    acc += (T(i) + T(-i)) * K[i];
  }

  outColor = acc;
}