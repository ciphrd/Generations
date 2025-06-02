#version 300 es
precision highp float;

uniform sampler2D u_substrate;
uniform sampler2D u_agents;
uniform sampler2D u_cells;
uniform float u_time;

in vec2 v_uv;

out vec4 outColor0;

#include <noise.glsl>

void main() {
  float substrate = texture(u_substrate, v_uv).r;
  float agent = texture(u_agents, v_uv).r;
  float cells = texture(u_cells, v_uv).r;

  float n1 = snoise(vec3(v_uv * 4.0, u_time * 0.01));

  substrate = substrate * 0.97
            + agent * (0.4 + 0.6 * n1) * 2.5
            - smoothstep(0.0, 0.8, cells);

  substrate = max(-3.0, substrate);

  outColor0 = vec4(substrate);

}