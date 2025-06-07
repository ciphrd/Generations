#version 300 es
precision highp float;

in vec2 v_uv;
in float v_length;
in vec3 v_color;

out vec4 outColor;

void main() {
  vec2 uv5 = abs(v_uv - 0.5);
  float lx = (0.5 - uv5.x) * v_length * 0.2;
  outColor = vec4(1.0) * lx * 0.2;
}