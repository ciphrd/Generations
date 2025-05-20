#version 300 es
precision highp float;

uniform sampler2D u_agents;

layout(location = 0) in vec2 a_uv;

out vec4 v_agent;

void main() {
  v_agent = texture(u_agents, a_uv);
  gl_Position = vec4(v_agent.xy * 2.0 - 1.0, 0, 1);
  gl_PointSize = 1.0;
}