#version 300 es
precision highp float;

uniform sampler2D u_absorption;
uniform sampler2D u_emboss;
uniform vec3 u_backlight_color;

in vec2 v_uv;
out vec4 outColor;

float czm_luminance(vec3 rgb){
  // Algorithm from Chapter 10 of Graphics Shaders.
  const vec3 W = vec3(0.2125, 0.7154, 0.0721);
  return dot(rgb, W);
}

void main() {
  float emboss = texture(u_emboss, v_uv).r * 1.0;

  // brightfield
  vec4 T = texture(u_absorption, v_uv);
  vec3 C = u_backlight_color - T.rgb * clamp(T.a, 0.0, 1.0);
  outColor = vec4(C + vec3(emboss), 1.0);

  // fluorescence imitating brightfield
  // vec4 T = texture(u_absorption, v_uv);
  // float lum = czm_luminance(T.rgb * T.a) * 10.0;
  // vec3 C = mix(u_backlight_color, (vec3(1) - T.rgb), clamp(lum, 0.0, 1.0));
  // outColor = vec4(C + vec3(emboss), 1.0);

  // lens
  float lens = smoothstep(0.48, 0.487, length(v_uv - 0.5));
  outColor.rgb *= 1.0 - lens;
}