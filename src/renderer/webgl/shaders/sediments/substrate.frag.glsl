#version 300 es
precision highp float;

#define RD_DIFF_RATE_B $RD_DIFF_RATE_B
#define CELLS_SEPARATION $CELLS_SEPARATION
#define RD_EGGS $RD_EGGS

uniform sampler2D u_substrate;
uniform sampler2D u_agents;
uniform sampler2D u_membrane_outer;
uniform sampler2D u_cells;
uniform sampler2D u_other_cells;
uniform vec2 u_texel;
uniform float u_time;

in vec2 v_uv;

out vec4 outColor0;

#include <noise.glsl>
#include <convolve.glsl>

const float laplacian_kernel[9] = float[](
  .05, .2 , .05,
  .2 , -1., .2 ,
  .05, .2 , .05
);

void main() {
  vec4 tex = texture(u_substrate, v_uv);
  float agent = texture(u_agents, v_uv).r;
  float mem_outer = texture(u_membrane_outer, v_uv).r;
  float cells = texture(u_cells, v_uv).a;
  float other_cells = texture(u_other_cells, v_uv).a;

  float substrate = tex.r;

  float n1 = snoise(vec3(v_uv * 4.0, u_time * 0.01));
  float n2 = fbm(
    vec3(v_uv * 50.0, u_time * 0.15),
    4, 
    0.5 + 3.0 * (0.5 * snoise(vec3(v_uv * 10.0, u_time * 0.1)) + 0.5)
  ) * 0.1;

  substrate = substrate * 0.995
            + agent * (0.4 + 0.6 * n1) * 0.05
            - mem_outer * 0.001
            - smoothstep(0.5, 0.7, cells) * 0.015
            - other_cells * 0.003
            + n2 * 0.001 * (1.0 - cells);

  // 
  // reaction-diffusion
  // 

  float n3 = snoise(vec3(v_uv * 4.0, 1223.22 + u_time * 0.02));

  float diffA = 1.0;
  float diffB = RD_DIFF_RATE_B;
  float f = mix(.03, .06, n3);
  float k = mix(.055, .07, n3);

  // "eggs" effect
  k -= smoothstep(.6, .1, .5+.5*snoise(vec3(v_uv * 4., u_time*.04))) * RD_EGGS;

  vec4 laplacian = convolve(u_substrate, v_uv, laplacian_kernel, u_texel);

  float A = tex.y;
  float B = tex.z;

  float Ap = A + (diffA * laplacian.x - A*B*B + f * (1.0 - A));
  float Bp = B + (diffB * laplacian.y + A*B*B - (k + f) * B);

  Bp += agent * 1.0;
  Bp += abs(substrate) * 0.5 * step(substrate, 0.0);
  Bp += smoothstep(0.0, 0.8, cells) * 0.1;
  Bp += other_cells * 0.02;
  Bp -= mem_outer * CELLS_SEPARATION;

  Ap = clamp(Ap, 0.0, 1.0);
  Bp = clamp(Bp, 0.0, 1.0);

  substrate += B * 0.01;

  outColor0 = vec4(substrate, Ap, Bp, 1);
}