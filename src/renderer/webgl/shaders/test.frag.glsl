#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

void main() {
  float L = length(v_uv - 0.5);
  float S = smoothstep(0.49, 0.45, L);
  outColor = vec4(S, 0., 0., S);
}