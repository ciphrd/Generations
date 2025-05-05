#version 300 es

in vec4 a_position;
in vec3 a_geometry;

out vec2 v_uv;

void main() {
  vec4 pos = a_position;
  pos.xy *= a_geometry.z;
  pos.xy += a_geometry.xy;
  pos.xy = pos.xy * 2.0 - 1.0;
  gl_Position = pos;
  v_uv = a_position.xy * 0.5 + 0.5;
}