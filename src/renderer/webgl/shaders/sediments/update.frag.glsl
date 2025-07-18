#version 300 es
precision highp float;

#define RND_MOVE_STRENGTH $RND_MOVE_STRENGTH
#define MOVE_SPEED $MOVE_SPEED

uniform sampler2D u_agents;
uniform sampler2D u_substrate;
uniform sampler2D u_distance_field;
uniform float u_time;
uniform vec2 u_texel;

in vec2 v_uv;

out vec4 outColor0;

#include <noise.glsl>

float substrate(in vec2 P) {
  return texture(u_substrate, P).r;
}

vec2 substrateGrad(in vec2 P, float d) {
  float R = substrate(P + vec2(u_texel.x, 0.0) * d);
  float L = substrate(P - vec2(u_texel.x, 0.0) * d);
  float T = substrate(P + vec2(0.0, u_texel.y) * d);
  float B = substrate(P - vec2(0.0, u_texel.y) * d);
  return vec2((R - L) * 0.5, (T - B) * 0.5);
}

vec2 dfGrad(in vec2 P, float d) {
  float R = texture(u_distance_field, P + vec2(u_texel.x, 0.0) * d).a;
  float L = texture(u_distance_field, P - vec2(u_texel.x, 0.0) * d).a;
  float T = texture(u_distance_field, P + vec2(0.0, u_texel.y) * d).a;
  float B = texture(u_distance_field, P - vec2(0.0, u_texel.y) * d).a;
  return vec2((R - L) * 0.5, (T - B) * 0.5);
}

void main() {
  vec4 agent = texture(u_agents, v_uv);
  vec2 pos = agent.xy;

  float under = substrate(agent.xy);

  // compute the substrate gradient
  vec2 dir = substrateGrad(pos, 2.0);
  dir += (hash22(v_uv * 110.23 + vec2(u_time)) - 0.5) * RND_MOVE_STRENGTH;

  float n1 = snoise(vec3(agent.xy * 4.0, u_time * 0.1));

  if (under > 0.5 - 0.8 * n1) {
    dir *= -1.0;
  }

  agent.xy += dir * MOVE_SPEED;

  dir = dfGrad(agent.xy, 1.0);
  agent.xy -= dir * 0.1 * texture(u_distance_field, pos).a;

  agent.xy = clamp(agent.xy, vec2(0), vec2(1));
  agent.a = 1.0;
  
  outColor0 = agent;
}