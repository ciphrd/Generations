#version 300 es
precision highp float;

uniform sampler2D u_texture;

in vec2 v_uv;
out vec4 outColor;

void main() {
  vec3 light = vec3(0.89, 0.89, 0.86);
  vec4 T = texture(u_texture, v_uv);
  vec3 C = light - T.rgb * T.a;
  outColor = vec4(C, 1.0);
}