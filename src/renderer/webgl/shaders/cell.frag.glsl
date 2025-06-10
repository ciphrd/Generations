#version 300 es
precision highp float;

uniform vec4 u_view;
uniform sampler2D u_color_field;
uniform float u_time;

in vec2 v_uv;
in vec2 v_guv;
in float v_id;
in vec3 v_color;
in vec4 v_signals;

out vec4 outColor;

#include <view.glsl>
#include <noise.glsl>
#include <color.glsl>
#include <cell.glsl>
#include <cell-shading.glsl>

void main() {
  vec2 uv = cellUV(v_uv, v_id);

  // to create a cellular-like pattern we use the depth based on the distance
  // field of the cell. this will create a voronoi-like pattern
  gl_FragDepth = length(uv - 0.5);
  outColor = cellColor(uv, texture(u_color_field, v_guv).gba, v_signals, u_time);
}