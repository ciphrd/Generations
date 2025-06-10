#version 300 es
precision highp float;

#include <noise.glsl>

in vec2 v_uv;
in float v_id;
in float v_scale;
in vec4 v_geometry;

out vec4 outColor;

struct Cell {
  float id;
  vec2 pos;
  float radius;
  float initialRadius;
} cell;

void main() {
  cell.id = v_id;
  cell.pos = v_geometry.xy;
  cell.radius = v_geometry.z;
  cell.initialRadius = v_geometry.w;

  vec2 cellUV = v_uv;
  cellUV.x += snoise(vec3(v_uv, cell.id)) * 0.05;
  cellUV.y += snoise(vec3(v_uv, cell.id + 1.5)) * 0.05;

  float L = length(cellUV - 0.5);
  float S = smoothstep(0.44, 0.41, L);

  vec4 C = vec4(0);

  float n1 = snoise(vec3(v_uv * 12.0, cell.id * 12.786)) * 0.5 + 0.5;
  float n2 = fbm(vec3(v_uv * 6.0, cell.id * 12.786), 3, 2.0) * 0.5 + 0.5;

  float alive = 1.0 - v_scale;
  // I *= smoothstep((0.9 - alive) * 0.5, (1.0 - alive) * 0.5, L);
  float eaten = smoothstep((0.8 - alive) * 0.5, (1.0 - alive) * 0.5, L);
  float I = pow(max(0.0, 0.5 - L), 0.3)
          * smoothstep(eaten - 0.1, eaten, n1)
          * (0.3 + n2 * 0.2);

  outColor = vec4(vec3(0.3), 1.0) * I;
}