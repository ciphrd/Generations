#version 300 es
precision highp float; 

uniform sampler2D u_texture;

in vec2 v_uv;

out vec4 outColor;

void main() {
  float T = texture(u_texture, v_uv).r;
  T = smoothstep(0.0, 1.0, pow(T, 0.9));
  outColor = vec4(T);
}