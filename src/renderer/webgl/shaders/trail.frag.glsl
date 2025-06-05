#version 300 es
precision highp float;

uniform sampler2D u_frame_prev;
uniform sampler2D u_frame_new;
uniform float u_strength;

in vec2 v_uv;

out vec4 outColor0;

void main() {
  vec4 O = texture(u_frame_prev, v_uv);
  vec4 N = texture(u_frame_new, v_uv);

  outColor0 = mix(O, N, u_strength);
}