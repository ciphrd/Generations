#version 300 es
precision highp float;

uniform sampler2D u_texture;

in vec2 v_uv;
out vec4 outColor;

void main() {
  outColor = vec4(texture(u_texture, v_uv).rgb, 1);

  // float a = texture(u_texture, v_uv).a;
  // outColor = vec4(a);
}