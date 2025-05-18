#version 300 es
precision highp float; 

uniform sampler2D u_texture;
uniform vec2 u_texel_size;

in vec2 v_uv;
out vec4 outColor;

void main() {
  // Sobel kernels
  float kernelX[9] = float[](
    -1.0, 0.0, 1.0,
    -2.0, 0.0, 2.0,
    -1.0, 0.0, 1.0
  );

  float kernelY[9] = float[](
    -1.0, -2.0, -1.0,
    0.0,  0.0,  0.0,
    1.0,  2.0,  1.0
  );

  // Get surrounding pixels
  vec3 samples[9];
  int i = 0;
  vec2 offset;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      offset.x = float(x) * u_texel_size.x;
      offset.y = float(y) * u_texel_size.y;
      samples[i++] = texture(u_texture, v_uv + offset).rgb;
    }
  }

  // Convert to grayscale and apply Sobel filter
  vec3 gx = vec3(0);
  vec3 gy = vec3(0);
  for (int j = 0; j < 9; j++) {
    gx += samples[j] * kernelX[j];
    gy += samples[j] * kernelY[j];
  }

  vec3 edge = sqrt(gx * gx + gy * gy);
  outColor = vec4(edge, 1);
}