#version 300 es
precision highp float;

uniform sampler2D u_tex_old;
uniform sampler2D u_tex_new;

in vec2 v_uv;

out vec4 outColor0;

void main() {
  vec4 O = texture(u_tex_old, v_uv);
  vec4 N = texture(u_tex_new, v_uv);

  outColor0 = mix(O, N, 0.1);
}