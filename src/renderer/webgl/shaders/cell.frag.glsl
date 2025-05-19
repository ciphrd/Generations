#version 300 es
precision highp float;

#include <noise.glsl>
#include <cell.glsl>

uniform sampler2D u_blurred_membrane;

in vec2 v_uv;
in vec2 v_guv;
in float v_id;
out vec4 outColor;

float N(in vec2 uv, float scale, float seed) {
  return snoise(vec3(uv * scale, v_id * seed));
}

// todos
// - add more holes to create variations
// - slightly deform UV space, N() function approach to be rethought
// - do similar shading on liaisons
// - reduce lines width compared to cells
// - write the nucleus
// - design the passes for processing the membrane

// todos
// - find a way for cells to be streched based on how streched (or compressed)
//   their edges are
// - cells should rotate in a more realistic way

void main() {
  vec2 uv = cellUV(v_uv, v_id);

  float L = length(uv - 0.5);
  float S = smoothstep(0.5, 0.48, L);

  vec3 C = vec3(0);

  // background noise, small but sutle variations creating base color
  float bgNoise = max(0., N(uv, 1.2 * 20.0, 1.3440)) 
                + max(0., N(uv, 1.2 * 24.0, 6.23))
                + max(0., N(uv, 1.2 * 18.0, 12.3440))
                + max(0., N(uv, 1.2 * 18.0, 98.3440))
                + max(0., N(uv, 1.2 * 18.0, 23.3440));
  C += vec3(0.3, 0.97, 0.3) * (0.05 + bgNoise * 0.1);

  // add small dotty-noise
  float dottyNoise = N(uv, 8.0, 0.0)
                   * N(uv, 10.0, 7.2983)
                   * N(uv, 9.0, 3.344);
  dottyNoise = abs(dottyNoise);
  C += vec3(0, 1, 0) * dottyNoise * 0.6;

  // layers if big blurry variations
  float bigBlurryNoise = max(0., N(uv, 1.2, 987.32323));
  C += vec3(0.3, 1, 0) * bigBlurryNoise * 0.2;

  // reddish blobby areas to create variation
  float reddishBlobNoise = max(0., N(uv, 0.4, 87.12029));
  C += vec3(0.3, 1, 0.8) * reddishBlobNoise * 0.2;

  // reddish compact red dots
  float redDotsNoise = N(uv, 12.3, 237.0238)
                     * pow(N(uv, 2.2, 109.323), 2.0)
                     * pow(N(uv, 1.3, 83.323), 1.0);
  C += vec3(0.3, 1, 0.8) * redDotsNoise * 0.6;

  // depth "vignette"
  float vignette = texture(u_blurred_membrane, v_guv).r;
  C += vec3(0.3, 1, 0.8) * vignette * 1.2;

  // some holes 
  float holesNoise = N(uv, 11.3, 87.3812)
                     * pow(N(uv, 2.2, 19.1223), 2.0)
                     * pow(N(uv, 1.3, 3.0392), 1.0);
  C -= vec3(1) * holesNoise * 1.0;
  C = clamp(vec3(0), vec3(1), C);

  float hole2N = N(uv, 2.3, 834.1332);
  C -= vec3(1) * hole2N * 0.1;
  C = clamp(vec3(0), vec3(1), C);

  outColor = vec4(C, 1) * S;

  // to create a cellular-like pattern we use the depth based on the distance
  // field of the cell. this will create a voronoi-like pattern
  gl_FragDepth = length(uv - 0.5);
}