vec4 convolve(
  in sampler2D tex,
  in vec2 p,
  in float[9] kernel,
  in vec2 tex_size
) {
  vec4 samples[9];
  int i = 0;
  vec2 offset;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      offset.x = float(x) * tex_size.x;
      offset.y = float(y) * tex_size.y;
      samples[i++] = texture(tex, p + offset);
    }
  }

  vec4 O = vec4(0);
  for (int i = 0; i < 9; i++) {
    O += samples[i] * kernel[i];
  }
  return O;
}