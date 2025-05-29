// Returns a cell deformed UVs
vec2 cellUV(in vec2 uv, in float id) {
  vec2 cuv = uv;
  cuv.x += snoise(vec3(uv, id)) * 0.03;
  cuv.x += snoise(vec3(uv * 4.0, id * 23.494)) * 0.01;
  cuv.y += snoise(vec3(uv, id + 1.5)) * 0.03;
  cuv.y += snoise(vec3(uv * 4.0, (id + 1.5) * 73.102)) * 0.01;
  return cuv;
}

// Returns the liaison deformed UV 
vec2 liaisonUV(in vec2 uv, float id, float llength) {
  vec2 luv = uv;
  luv.x += snoise(vec3(uv, id)) * 0.03;
  luv.x += snoise(vec3(uv * 4.0, id * 23.494)) * 0.01;
  luv.y += snoise(vec3(uv, id + 1.5)) * 0.03;
  luv.y += snoise(vec3(uv * 4.0, (id + 1.5) * 73.102)) * 0.01;
  float xm = pow(1.0 - abs((uv.x - 0.5) * 2.0), 0.5);
  float expand = max(0.0, (llength - 1.0) * 1.1);
  luv.y -= 0.5;
  luv.y *= (1.0 + expand * xm);
  luv.y += 0.5;
  return luv;
}

float membraneNoise(in vec2 uv, float id) {
  return 0.6
    + snoise(vec3(uv * 0.3, id)) * 0.4
    + snoise(vec3( uv * 3.2, id * 232.2323 )) * 0.2
    + snoise(vec3(uv * 0.7, id * 9.876))
      * snoise(vec3(uv * 5.7, id * 87.372))
      * 0.6
    - min(1.0,
      max(0.0, (( snoise(vec3(uv * 0.1, id * 1198.1213 )) 
      //  * snoise(vec3(uv * 0.7, id * 119.269 ))
       * snoise(vec3(uv * 0.7, id * 54.269 )))
       - 0.0))
      * snoise(vec3(uv * 6.8, id * 71.47 ) )
      * 4.00);
}

vec2 nuccleusUV(in vec2 cuv, float id) {
  float scale = mix(0.8, 1.2, hash11(id));
  vec2 uv = (cuv - 0.5) * 14.0 * scale + 0.5;
  uv += (hash21(id * 3.023) - 0.5) * 1.5;
  uv.x += snoise(vec3(cuv * 4.0, id * 12.234)) * 0.2;
  uv.y += snoise(vec3(cuv * 4.0, id * 33.982)) * 0.2;
  uv.x += snoise(vec3(cuv * 12.0, id * 12.234)) * 0.1;
  uv.y += snoise(vec3(cuv * 12.0, id * 33.982)) * 0.1;
  return uv;
}