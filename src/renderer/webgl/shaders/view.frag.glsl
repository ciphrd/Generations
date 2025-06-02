#version 300 es
precision highp float;

uniform sampler2D u_tex;
uniform vec4 u_view;

in vec2 v_uv;

out vec4 outColor0;

#include <view.glsl>

void main() {
  vec2 uv = invViewTx(v_uv);
  outColor0 = texture(u_tex, uv);
}