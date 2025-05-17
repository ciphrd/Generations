#version 300 es
precision highp float;

#include <simplex.glsl>

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
  cellUV.x += snoise(vec3(v_uv, cell.id)) * 0.05;
  cellUV.y += snoise(vec3(v_uv, cell.id + 1.5)) * 0.05;

  float L = length(cellUV - 0.5);
  float S = smoothstep(0.44, 0.41, L);

  vec4 C = vec4(0);

  // outer shell color
  C += vec4(0.8, 1.0, 0.3, S * 0.45);
  
  // outer membrane
  float Lmem = L + snoise(vec3(v_uv * 4.0, cell.id * 20.0)) * 0.01;
  float membrane = smoothstep(0.42, 0.40, L) 
                 * smoothstep(0.33, 0.35, Lmem);
  C -= vec4(0.0, 0.8, 0.0, 0.02) * membrane;
  C += vec4(0.5, 0.0, 0.5, 0.02) * membrane;

  C += vec4(
    snoise(vec3(v_uv * 6.0, cell.id * 12.786)) * 0.4,
    0,
    0,
    0
  ) * S;

  // nucleus
  vec2 nucUV = cellUV;
  nucUV.x += snoise(vec3(v_uv * 4.0, cell.id * 40.345)) * 0.02;
  nucUV.y += snoise(vec3(v_uv * 4.0, cell.id * 20.645)) * 0.02;
  nucUV = (nucUV - 0.5) * (cell.radius / cell.initialRadius) + 0.5;
  float Lnuc = length(nucUV - 0.5);

  float nuc = smoothstep(0.16, 0.11, Lnuc);
  C += vec4(1.0, 1.0, 0.0, nuc * 0.5);

  float nucNoise = snoise(vec3(v_uv * 3.0, cell.id * 12.68)) * 0.12;
  C += nucNoise * nuc;

  // small halo arround nucleus
  float nucHalo = smoothstep(0.26, 0.06, Lnuc);
  C -= vec4(0, 0.8, 0, 0) * nucHalo;

  // small halo-like variations, ressembles veins
  float veins = pow(
    smoothstep(1.0, 0.02,
      abs(snoise(vec3(v_uv * 4.0, cell.id * 98.353)))
    ), 
    8.0
  );
  C -= vec4(0, 0.8, 0.8, 0) * veins * S * (1. - nuc) * (1. - 0.7 * membrane) * 0.2;

  // shadow due to shape depth
  float shadow = smoothstep(0.3, 0.44, Lnuc) * S;
  C += vec4(0.02) * shadow;

  // really subtle cell halo
  float halo = smoothstep(0.48, 0.43, L) * (1.0 - S);
  C += vec4(0.0, 1, 1, 1) * halo * 0.2;

  // add some dots
  int nb = int(pow(snoise(vec3(cell.id * 86.237, 0, 0)), 2.0) * 7.0);
  vec2 dxy;
  float Ld, Sd;
  for (int i = 0; i < nb; i++) {
    dxy.x = snoise(vec3(cell.id, float(i * 2), 0));
    dxy.y = snoise(vec3(cell.id, float(i * 2 + 10), 0));
    dxy = dxy * 0.25 + 0.5;
    Ld = length(v_uv - dxy)
       + snoise(vec3(v_uv * 8.0, cell.id + float(i))) * 0.015;
    Sd = smoothstep(0.05, 0.01, Ld);
    C += vec4(0.4) * Sd * (1.0 - nuc);
  }

  outColor = C * S;
}