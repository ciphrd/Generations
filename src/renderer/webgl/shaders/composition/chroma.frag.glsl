#version 300 es
precision mediump float;

/**
  Transverse Chromatic Aberration
	Based on https://github.com/FlexMonkey/Filterpedia/blob/7a0d4a7070894eb77b9d1831f689f9d8765c12ca/Filterpedia/customFilters/TransverseChromaticAberration.swift
	Simon Gladman | http://flexmonkey.blogspot.co.uk | September 2017
*/

#define SAMPLES 8
#define BLUR 0.2
#define FALLOF 5.8

uniform sampler2D u_tex;

in vec2 v_uv;

out vec4 outColor0;

void main() {
  vec2 dir = normalize(v_uv - 0.5); 
  vec2 vel = dir * BLUR * pow(length(v_uv - 0.5), FALLOF);
  float inverseSampleCount = 1.0 / float(SAMPLES);

  mat3x2 increments = mat3x2(
    vel * 4.0 * inverseSampleCount,
    vel * 2.0 * inverseSampleCount,
    vel * 1.0 * inverseSampleCount
  );

  vec3 acc = vec3(0);
  mat3x2 offsets = mat3x2(0); 

  for (int i = 0; i < SAMPLES; i++) {
    acc.r += texture(u_tex, v_uv + offsets[0]).r; 
    acc.g += texture(u_tex, v_uv + offsets[1]).g; 
    acc.b += texture(u_tex, v_uv + offsets[2]).b; 
    offsets -= increments;
  }

  vec3 col = acc / float(SAMPLES);
  col = clamp(col, vec3(0), vec3(1));

  outColor0 = vec4(col, 1.0);
}