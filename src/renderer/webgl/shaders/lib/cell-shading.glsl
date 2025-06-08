float N(in vec2 uv, float scale, float seed) {
  return snoise(vec3(uv * scale, v_id * seed));
}

vec4 cellColor(in vec2 uv, in vec3 baseColor, in vec4 signals, in float time) {
  float L = length(uv - 0.5);
  float S = smoothstep(0.45, 0.42, L);

  vec3 base = colvar(
    vec3(1) - baseColor,
    vec3( (N(uv, 1.8, 238.2332) - 0.5) * 0.06, 0, 0 )
  );
  vec3 base2 = colvar(base, vec3(0.1, 0, 0.2));
  vec3 base3 = colvar(base, vec3(-0.1, 0, 0.2));
  vec3 darker = colvar(base, vec3(0, -0.2, 1.0));
  vec3 darker2 = colvar(base, vec3(0, -0.6, 1.0));

  vec3 C = vec3(0);

  // background noise, small but sutle variations creating base color
  float bgNoise = max(0., N(uv, 1.2 * 20.0, 1.3440)) 
                + max(0., N(uv, 1.2 * 24.0, 6.23))
                + max(0., N(uv, 1.2 * 18.0, 12.3440))
                + max(0., N(uv, 1.2 * 18.0, 98.3440))
                + max(0., N(uv, 1.2 * 18.0, 23.3440));
  C += base * (0.05 + bgNoise * 0.1);

  // add small dotty-noise
  float dottyNoise = N(uv, 8.0, 0.0)
                   * N(uv, 10.0, 7.2983)
                   * N(uv, 9.0, 3.344);
  dottyNoise = abs(dottyNoise);
  C += darker * dottyNoise * 0.6;

  // layers of big blurry variations
  float bigBlurryNoise = max(0., N(uv, 1.2, 987.32323));
  C += base2 * bigBlurryNoise * 0.2;

  // reddish blobby areas to create variation
  float reddishBlobNoise = max(0., N(uv, 0.4, 87.12029));
  C += base3 * reddishBlobNoise * 0.2;

  // reddish compact red dots
  float redDotsNoise = N(uv, 12.3, 237.0238)
                     * pow(N(uv, 2.2, 109.323), 2.0)
                     * pow(N(uv, 1.3, 83.323), 1.0);
  C += vec3(1) * redDotsNoise * 0.6;

  // add signals
  vec3 sigNoise = vec3(
    snoise(vec3(uv * 12.0, v_id * 629.109 + time * 0.0)),
    snoise(vec3(uv * 12.0, v_id * 62.083 + time * 0.0)),
    snoise(vec3(uv * 12.0, v_id * 1023.1 + time * 0.0))
  );
  for (int i = 0; i < 3; i++) {
    C[i] += signals[i] 
          * clamp(sigNoise[i], 0.0, 1.0) 
          * max(0.0, 1.0 - L * 3.0)
          * 1.0;
  }

  // depth "vignette"
  float vignette = texture(u_blurred_membrane, v_guv).r;
  C += darker * S * max(0.0, pow(vignette, 0.4)) * 0.5;

  // some holes 
  float holesNoise = N(uv, 11.3, 87.3812)
                     * pow(N(uv, 2.2, 19.1223), 2.0)
                     * pow(N(uv, 1.3, 3.0392), 1.0);
  C -= vec3(1) * holesNoise * 1.0;
  C = clamp(vec3(0), vec3(1), C);

  float hole2N = N(uv, 2.3, 834.1332);
  C -= vec3(1) * hole2N * 0.1;
  C = clamp(vec3(0), vec3(1), C);

  return vec4(C, 1) * S;
}
