#version 300 es
precision highp float;

uniform sampler2D u_memb;
uniform sampler2D u_cell_noise;

in vec2 v_uv;

out vec4 outColor0;

void main() {
  float v = texture(u_memb, v_uv).r;
  v *= 0.0 + pow(texture(u_cell_noise, v_uv).r, 1.5) * 1.0;
  v = clamp(v, 0.0, 1.0);
  outColor0 = vec4(v);
}