#version 300 es
#define CELL_SCALE $CELL_SCALE
#define ZOOM 3.0

#include <math.glsl>

uniform vec4 u_points[$NUM_POINTS];
uniform vec4 u_points2[$NUM_POINTS];

in vec4 a_position;
in vec4 a_properties;

out vec2 v_uv;
out vec2 v_guv;
out float v_id;

void main() {
  vec4 geo = u_points[gl_InstanceID];
  vec4 geo2 = u_points2[gl_InstanceID];

  geo2.xy = normalize(geo2.xy);
  float angle = atan(geo2.y, geo2.x);

  vec2 pos = rotate(a_position.xy, angle);
  pos *= geo.z * CELL_SCALE;
  pos += geo.xy;
  pos = pos * 2.0 - 1.0;

  // temp zoom
  pos *= ZOOM;

  gl_Position = vec4(pos, 0, 1);
  v_uv = a_position.xy * 0.5 + 0.5;
  v_guv = pos.xy * 0.5 + 0.5;
  v_id = geo.w;

  // vec2 pos2 = a_position.xy;
  // pos2 *= geo.z * CELL_SCALE;
  // pos2 += geo.xy;
  // pos2 = pos2 * 2.0 - 1.0;
  // pos2 *= ZOOM;

  // v_guv = pos2.xy * 0.5 + 0.5;
}