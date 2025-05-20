#version 300 es
precision lowp float;

uniform sampler2D u_texture;

in vec2 v_uv;

out vec4 outColor0;

void main() {
  outColor0 = texture(u_texture, v_uv) * 0.2;
}