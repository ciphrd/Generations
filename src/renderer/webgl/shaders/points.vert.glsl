#version 300 es

uniform vec4 u_view;

in vec4 a_position;
in vec4 a_properties;
in vec4 a_geometry;

out vec2 v_uv;
out float v_id;
out float v_scale;
out vec4 v_geometry;

#include <view.glsl>

void main() {
  // id is packed in integer part of geometry.x
  vec4 a_geo = a_geometry;
  a_geo.x = fract(a_geo.x);

  vec4 pos = a_position;
  pos.xy *= a_geo.w;
  pos.xy += a_geo.xy;
  pos.xy = pos.xy * 2.0 - 1.0;
  pos.xy = viewTx(pos.xy);

  gl_Position = pos;

  v_id = floor(a_geometry.x);
  v_scale = a_geo.z / a_geo.w;
  v_uv = a_position.xy * 0.5 + 0.5;
  v_geometry = a_geo;
}