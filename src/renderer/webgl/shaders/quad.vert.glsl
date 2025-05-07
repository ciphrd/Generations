#version 300 es

uniform vec2 u_points[$NUM_POINTS];

in vec4 a_position;

out vec2 v_uv;

void main() {
  vec4 pos = a_position;
  pos.xy *= 0.005;
  pos.xy += u_points[gl_InstanceID];
  pos.xy = pos.xy * 2.0 - 1.0;

  // temp zoom
  pos.xy -= 0.5;
  pos.xy *= 3.0;
  pos.xy += 0.5;

  gl_Position = pos;
  v_uv = a_position.xy * 0.5 + 0.5;
}