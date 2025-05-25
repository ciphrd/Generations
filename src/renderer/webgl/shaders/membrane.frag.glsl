#version 300 es
precision highp float;

uniform sampler2D u_texture;

in vec2 v_uv;
out vec4 outColor;

void main() {
  vec2 uv = v_uv;
  float edge = texture(u_texture, uv).r;
  vec3 C = vec3(0.3, 0.92, 0.6);
  outColor = vec4(C, 1) * edge;
}