#version 300 es
precision highp float;

uniform sampler2D u_texture;

in vec2 v_uv;
out vec4 outColor;

void main() {
  float edge = texture(u_texture, v_uv).r;
  vec3 C = vec3(0.3, 0.92, 0.3);
  outColor = vec4(C, 1) * clamp(0.0, 1.0, edge);
}