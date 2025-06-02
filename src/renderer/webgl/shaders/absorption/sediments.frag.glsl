#version 300 es
precision mediump float;

uniform sampler2D u_sediments;

in vec2 v_uv;

out vec4 outColor0;

#include <color.glsl>

void main() {
  vec2 uv = v_uv;
  float sediments = texture(u_sediments, uv).r;
  sediments = clamp(sediments, 0.0, 0.5);
  sediments = pow(sediments, 0.7);
  sediments = min(1.0, sediments * 1.7);

  vec3 hsv = vec3( 0.2, (1.0 - pow(sediments, 8.0) * 0.7) * 0.5, pow(sediments, 2.0) );

  vec3 C = hsv2rgb(hsv);

  outColor0 = vec4(C, 1) * pow(sediments, 0.5) * 0.7;
}