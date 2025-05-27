#version 300 es
#define CELL_SCALE $CELL_SCALE
#define ZOOM 3.0

uniform vec4 u_view;

layout(location = 0) in vec4 a_position;
layout(location = 1) in mat2x3 a_geometry;
layout(location = 3) in vec3 a_color;

out vec2 v_uv;
out vec2 v_guv;
out vec3 v_color;
out float v_id;

#include <math.glsl>
#include <view.glsl>

struct Geo {
  float id;
  vec2 pos;
  vec2 dir;
  float rad;
};

void main() {
  Geo geo;
  geo.id = a_geometry[1].z;
  geo.pos = a_geometry[0].xy;
  geo.dir = a_geometry[1].xy;
  geo.rad = a_geometry[0].z;

  vec2 dir = normalize(geo.dir);
  float angle = atan(dir.y, dir.x);

  vec2 pos = rotate(a_position.xy, angle);
  pos *= geo.rad * CELL_SCALE;
  pos += geo.pos;
  pos = pos * 2.0 - 1.0;
  pos = viewTx(pos);

  gl_Position = vec4(pos, 0, 1);
  v_uv = a_position.xy * 0.5 + 0.5;
  v_guv = pos.xy * 0.5 + 0.5;
  v_id = geo.id;
  v_color = a_color;
}