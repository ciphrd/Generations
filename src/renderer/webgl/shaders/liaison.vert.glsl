#version 300 es
#define CELL_SCALE $CELL_SCALE

uniform vec4 u_view;

layout(location = 0) in vec4 a_position;
layout(location = 1) in mat2x4 a_geometries;
layout(location = 3) in vec3 a_color;

out vec2 v_uv;
out vec2 v_guv;
out vec2 v_ids;
out float v_length;
out vec3 v_color;

#include <view.glsl>

void main() {
  // get left/right endpoints positions of segment
  vec4 L = a_geometries[0];
  vec4 R = a_geometries[1];
  vec2 LR = R.xy - L.xy;
  vec2 mid = (L.xy + R.xy) * .5;
  float LRlen = length(LR);

  float width = mix( L.z, R.z, (a_position.x + 1.0) * 0.5 ) * CELL_SCALE;

  float A = -atan(LR.y, LR.x);

  vec2 pos = a_position.xy;
  // scale
  pos.x *= LRlen / 2.0;
  pos.y *= width;
  // rotate
  vec2 P = pos;
  pos.x = P.x *  cos(A) + P.y * sin(A);
  pos.y = P.x * -sin(A) + P.y * cos(A);
  // translate
  pos.xy += mid;
  pos.xy = pos.xy * 2.0 - 1.0;
  pos = viewTx(pos);

  gl_Position = vec4(pos, 0.0, 1.0);
  v_uv = a_position.xy * 0.5 + 0.5;
  v_guv = pos.xy * 0.5 + 0.5;
  v_ids = vec2(L.w, R.w);
  v_length = LRlen / 2.0 / width;
  v_color = a_color;
}