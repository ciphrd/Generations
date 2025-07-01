#version 300 es
precision highp float;

#define SOBEL_STRENGTH $SOBEL_STRENGTH

uniform sampler2D u_absorption;
uniform sampler2D u_emboss;
uniform vec3 u_backlight_color;

in vec2 v_uv;
out vec4 outColor;

void main() {
  vec2 uv = (v_uv - 0.5) * 0.99 + 0.5; // gets rid of border artifacts
  float emboss = texture(u_emboss, uv).r * SOBEL_STRENGTH;
  vec4 T = texture(u_absorption, uv);
  vec3 C = u_backlight_color - T.rgb * clamp(T.a, 0.0, 1.0);
  outColor = vec4(C + vec3(emboss), 1.0);
}