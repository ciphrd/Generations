#version 300 es
precision mediump float;

uniform sampler2D u_sediments;

in vec2 v_uv;

out vec4 outColor0;

void main() {
  vec2 uv = v_uv;
  float sediments = texture(u_sediments, uv).r;

  sediments = sqrt(sediments);
  sediments = clamp(sediments, 0.0, 0.9);

  outColor0 = vec4(sediments) * 0.4;
}