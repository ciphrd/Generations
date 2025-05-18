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
  return 0.5
    + snoise(vec3(uv * 0.3, id)) * 0.5
    + snoise(vec3( uv * 3.2, id + 232.2323 )) * 0.2
    + snoise(vec3(uv * 0.7, id * 9.876))
      * snoise(vec3(uv * 5.7, id * 87.372))
      * 0.6;
}