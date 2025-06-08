#version 300 es
precision highp float;

#define MIN 0.0
#define MAX 0.05

uniform sampler2D u_blurred;

in vec2 v_uv;

out vec4 outColor0;

#include <noise.glsl>

void main() {
  float I = texture(u_blurred, v_uv).a;
  float N = MIN + MAX * (.5+.5 * snoise(vec3(v_uv * 10.0, 0.0)));
  I = smoothstep(N, N + 0.03, I);
  outColor0 = vec4(I);
}