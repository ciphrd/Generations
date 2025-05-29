#version 300 es
precision highp float;

uniform sampler2D u_membrane;
uniform sampler2D u_color_field;

in vec2 v_uv;
out vec4 outColor;

#include <color.glsl>

void main() {
  vec2 uv = v_uv;
  float edge = texture(u_membrane, uv).r;
  vec3 C = vec3(1) - texture(u_color_field, uv).gba;
  C = colvar(C, vec3(0,-0.4,0.5));
  outColor = vec4(C, 1) * edge;
}