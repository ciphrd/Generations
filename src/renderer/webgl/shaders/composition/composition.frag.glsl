#version 300 es
precision highp float;

uniform sampler2D u_absorption;
uniform sampler2D u_emboss;

in vec2 v_uv;
out vec4 outColor;

float czm_luminance(vec3 rgb){
  // Algorithm from Chapter 10 of Graphics Shaders.
  const vec3 W = vec3(0.2125, 0.7154, 0.0721);
  return dot(rgb, W);
}

void main() {
  float emboss = texture(u_emboss, v_uv).r;

  vec3 light = vec3(0.89, 0.7, 0.7);
  vec4 T = texture(u_absorption, v_uv);
  vec3 C = light - T.rgb * clamp(T.a, 0.0, 1.0);

  outColor = vec4(C + vec3(emboss), 1.0);

  // vec3 light = vec3(74.0/255.0, 91.0/255.0, 253.0/255.0);
  // vec4 T = texture(u_absorption, v_uv);
  // float lum = czm_luminance(T.rgb * T.a) * 10.0;
  // vec3 C = mix(light, (vec3(1) - T.rgb), clamp(lum, 0.0, 1.0));
  // outColor = vec4(C, 1.0);
}