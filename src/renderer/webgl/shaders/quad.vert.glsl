#version 300 es
#define CELL_SCALE $CELL_SCALE
#define ZOOM 3.0

uniform vec4 u_points[$NUM_POINTS];

in vec4 a_position;
in vec4 a_properties;

out vec2 v_uv;
out vec2 v_guv;
out float v_id;

void main() {
  vec4 geo = u_points[gl_InstanceID];

  vec4 pos = a_position;
  pos.xy *= geo.z * CELL_SCALE;
  pos.xy += geo.xy;
  pos.xy = pos.xy * 2.0 - 1.0;

  // temp zoom
  pos.xy *= ZOOM;

  gl_Position = pos;
  v_uv = a_position.xy * 0.5 + 0.5;
  v_id = geo.w;
  v_guv = pos.xy * 0.5 + 0.5;
}