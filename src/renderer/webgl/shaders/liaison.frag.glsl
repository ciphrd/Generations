#version 300 es
precision highp float;

uniform vec4 u_view;
uniform sampler2D u_blurred_membrane;
uniform sampler2D u_color_field;

in vec2 v_uv;
in vec2 v_guv;
in float v_id;
in float v_length;
in vec3 v_color;

out vec4 outColor0;

#include <view.glsl>
#include <noise.glsl>
#include <color.glsl>
#include <cell.glsl>
#include <cell-shading.glsl>

void main() {
  vec2 uv = liaisonUV(v_uv, v_id, v_length);

  // to create a cellular-like pattern we use the depth based on the distance
  // field of the cell. this will create a voronoi-like pattern
  gl_FragDepth = length(uv - 0.5);
  outColor0 = cellColor(uv, texture(u_color_field, v_guv).gba, vec4(0), 0.0);
}