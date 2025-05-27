#version 300 es
precision highp float;

uniform vec4 u_view;
uniform sampler2D u_blurred_membrane;
uniform sampler2D u_color_field;

in vec2 v_uv;
in vec2 v_guv;
in vec2 v_ids;
in float v_length;
in vec3 v_color;

out vec4 outColor0;

#include <noise.glsl>
#include <cell.glsl>
#include <view.glsl>

float N(in vec2 uv, float scale, float seed) {
  return snoise(vec3(uv * scale, (v_ids.x + 20.0 * v_ids.y) * 0.1 * seed));
}

void main() {
  vec3 C = vec3(0);

  float id = v_ids.x + 20.0 * v_ids.y;
  vec2 uv = liaisonUV(v_uv, id, v_length);

  float L = length(uv - 0.5);
  float S = smoothstep(0.45, 0.42, L);

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

  // depth "vignette"
  float vignette = texture(u_blurred_membrane, v_guv).r;
  C += vec3(0.3, 1, 0.8) * S * outerShell(vignette);

  // reddish compact red dots
  float redDotsNoise = N(uv, 12.3, 237.0238)
                     * pow(N(uv, 2.2, 109.323), 2.0)
                     * pow(N(uv, 1.3, 83.323), 1.0);
  C += vec3(0.3, 1, 0.8) * redDotsNoise * 0.6;

  // some holes 
  float holesNoise = N(uv, 11.3, 87.3812)
                     * pow(N(uv, 2.2, 19.1223), 2.0)
                     * pow(N(uv, 1.3, 3.0392), 1.0);
  C -= vec3(1) * holesNoise * 1.0;
  C = clamp(vec3(0), vec3(1), C);

  float hole2N = N(uv, 2.3, 834.1332);
  C -= vec3(1) * hole2N * 0.1;
  C = clamp(vec3(0), vec3(1), C);

  // smooth transition to connect the cells
  float k = (1.0 - abs(v_uv.x - 0.5) * 2.0) * v_length;
  float junctions = pow(length(vec2( k, (v_uv.y - 0.5) * 2.0 )), 2.0);
  if (junctions < 1.0) {
    junctions *= pow(k, 0.5);
  }
  junctions = clamp(junctions, 0.0, 1.0);

  // 
  // the nuccleus
  // 
  // vec2 nuv = nuccleusUV(uv, id);
  // float nL = length(nuv - 0.5);
  // float nuccleus = smoothstep(1.0, 0.5, nL);

  // // base nuccleus background, simple fbm
  // float nucBgNoise = snoise(vec3(nuv * 1.7, id * 832.902));
  // C += mix(
  //   vec3(0.4, 0.92, 0.55),
  //   vec3(0.7, 0.97, 0.8),
  //   nucBgNoise
  // ) * nuccleus * 0.5;

  // // nuccleus shell
  // float nucShell = smoothstep(0.5, 0.8, nL);
  // C += vec3(0.75, 0.97, 0.82) * nucShell * nuccleus * 0.6;

  // // nuccleus halo
  // float nucHalo = smoothstep(2.0, 0.0, nL);
  // C += vec3(0.68, 0.88, 0.75) * pow(nucHalo, 1.0) * 0.5;

  // alpha
  float lum = clamp(0.0, 1.0, C.r + C.g + C.b + 1.0);
  outColor0 = vec4(C, 1) * S;

  outColor0 = vec4(vec3(1) - v_color, 1) * S;
  outColor0 = vec4(vec3(1) - texture(u_color_field, v_guv).gba, 1) * S;

  // to create a cellular-like pattern we use the depth based on the distance
  // field of the cell. this will create a voronoi-like pattern
  gl_FragDepth = length(uv - 0.5);
}