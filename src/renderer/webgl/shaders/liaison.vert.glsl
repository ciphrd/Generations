#version 300 es

uniform vec2 u_points[$NUM_POINTS];

layout(location = 0) in vec4 a_position;
layout(location = 1) in uvec2 a_endpoints;

out vec2 v_uv;

void main() {

  // get left/right endpoints positions of segment
  vec2 L = u_points[a_endpoints.x];
  vec2 R = u_points[a_endpoints.y];
  vec2 LR = R - L;
  vec2 mid = (L + R) * .5;

  float A = -atan(LR.y, LR.x);

  vec2 pos = a_position.xy;

  // scale
  pos.x *= length(LR) / 2.0;
  pos.y *= 0.01;
  // rotate
  vec2 P = pos;
  pos.x = P.x *  cos(A) + P.y * sin(A);
  pos.y = P.x * -sin(A) + P.y * cos(A);
  // translate
  pos.xy += mid;
  pos.xy = pos.xy * 2.0 - 1.0;

  gl_Position = vec4(pos, 0.0, 1.0);
  v_uv = a_position.xy * 0.5 + 0.5;
}