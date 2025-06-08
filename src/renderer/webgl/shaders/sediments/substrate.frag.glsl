#version 300 es
precision highp float;

uniform sampler2D u_substrate;
uniform sampler2D u_agents;
uniform sampler2D u_cells;
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
  float cells = texture(u_cells, v_uv).r;

  float substrate = tex.r;

  float n1 = snoise(vec3(v_uv * 4.0, u_time * 0.01));
  float n2 = fbm(
    vec3(v_uv * 50.0, u_time * 0.15),
    4, 
    0.5 + 3.0 * (0.5 * snoise(vec3(v_uv * 10.0, u_time * 0.1)) + 0.5)
  ) * 0.1;

  substrate = substrate * 0.99
            + agent * (0.4 + 0.6 * n1) * 0.4
            - smoothstep(0.0, 0.8, cells) * 0.004
            + n2 * 0.01;


  // 
  // reaction-diffusion
  // 

  float n3 = snoise(vec3(v_uv * 4.0, 1223.22 + u_time * 0.2));

  float diffA = 1.0;
  float diffB = 1.0;
  float f = mix(.03, .06, n3);
  float k = mix(.055, .06, n3);

  vec4 laplacian = convolve(u_substrate, v_uv, laplacian_kernel, u_texel);

  float A = tex.y;
  float B = tex.z;

  float Ap = A + (diffA * laplacian.x - A*B*B + f * (1.0 - A));
  float Bp = B + (diffB * laplacian.y + A*B*B - (k + f) * B);

  Bp += substrate * 0.01;
  Bp -= smoothstep(0.0, 0.8, cells) * 0.6;

  Ap = clamp(Ap, 0.0, 1.0);
  Bp = clamp(Bp, 0.0, 1.0);

  outColor0 = vec4(substrate, Ap, Bp, 1);

}