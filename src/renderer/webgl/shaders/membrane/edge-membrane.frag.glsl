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
  float I = max(T.r, max(T.g, T.b));
  I = step(0.1, I);
  outColor = vec4(I * pow(texture(u_cell_noise, v_uv).r, 1.3) * 1.2);
}