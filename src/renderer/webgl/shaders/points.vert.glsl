#version 300 es

in vec4 a_position;
in vec4 a_properties;
in vec4 a_geometry;

out vec2 v_uv;
out vec4 v_properties;
out vec4 v_geometry;

void main() {
  vec4 pos = a_position;
  pos.xy *= a_geometry.z;
  pos.xy += a_geometry.xy;
  pos.xy = pos.xy * 2.0 - 1.0;

  // temp zoom
  pos.xy -= 0.5;
  pos.xy *= 3.0;
  pos.xy += 0.5;

  gl_Position = pos;
  v_uv = a_position.xy * 0.5 + 0.5;
  v_geometry = a_geometry;
  v_properties = a_properties;
}