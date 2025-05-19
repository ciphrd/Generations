#version 300 es
precision highp float; 

uniform sampler2D u_texture;
uniform vec2 u_texel_size;

in vec2 v_uv;
out vec4 outColor;

void main() {
  float kernel[9] = float[](
    -1.0, -1.0, -1.0,
    -1.0,  9.0, -1.0,
    -1.0, -1.0, -1.0
    // 0.0, -1.0, -0.0,
    // -1.0,  5.0, -1.0,
    // -0.0, -1.0, -0.0
  );

  float samples[9];
  int i = 0;
  vec2 offset;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      offset.x = float(x) * u_texel_size.x;
      offset.y = float(y) * u_texel_size.y;
      samples[i++] = texture(u_texture, v_uv + offset).r;
    }
  }

  vec3 C = vec3(0);
  for (int i = 0; i < 9; i++) {
    C += samples[i] * kernel[i];
  }
  outColor = vec4(C, 1);
}