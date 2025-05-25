#version 300 es
precision highp float;

uniform sampler2D u_substrate;
uniform sampler2D u_agents;
uniform sampler2D u_cells;

in vec2 v_uv;

out vec4 outColor0;

void main() {
  float substrate = texture(u_substrate, v_uv).r;
  float agent = texture(u_agents, v_uv).r;
  float cells = texture(u_cells, v_uv).r;
  substrate = substrate * 0.98 + agent - smoothstep(0.0, 0.2, cells) * 1.0;
  substrate = max(substrate, 0.0);
  outColor0 = vec4(substrate);
}