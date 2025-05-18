#version 300 es
precision highp float;

#include <noise.glsl>

in vec2 v_uv;
in vec4 v_properties;
in vec4 v_geometry;

out vec4 outColor;

struct Cell {
  float id;
  vec2 pos;
  float radius;
  float initialRadius;
} cell;

void main() {
  cell.id = v_properties.x;
  cell.pos = v_geometry.xy;
  cell.radius = v_geometry.z;
  cell.initialRadius = v_geometry.w;

  vec2 cellUV = v_uv;
  cellUV.x += snoise(vec3(v_uv, cell.id * 23.45)) * 0.12;
  cellUV.y += snoise(vec3(v_uv, cell.id * 86.322)) * 0.12;

  float L = length(cellUV - 0.5);
  float S = smoothstep(0.49, 0.45, L);

  S -= smoothstep(0.4, 0.01, L) * 0.8;

  outColor = vec4(1., 1., 0.2, 0.8) * S;
}