#version 300 es
precision highp float; 

uniform sampler2D u_memb_edge;
uniform sampler2D u_cell_noise;

in vec2 v_uv;

out vec4 outColor;

// Takes the membrane edge detection and compute a grayscale value from it.
// Note: as cells are renderer with random colors, some edges may be dimmed.
// While we can work around this issue by normalizing, it's actually looking
// fairly nice so I chose to keep it as a feature.
void main() {
  vec3 T = texture(u_memb_edge, v_uv).rgb;
  float I = clamp(max(T.r, max(T.g, T.b)), 0.0, 1.0);
  // I = smoothstep(0.5, 0.55, I);
  outColor = vec4(I * (0.3 + texture(u_cell_noise, v_uv).r * 0.7));

  outColor = vec4(vec3(I * texture(u_cell_noise, v_uv).r), 1);

  outColor = vec4(texture(u_cell_noise, v_uv).r);
  outColor = vec4(I);
}