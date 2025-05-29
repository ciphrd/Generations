vec3 rgb2hsv( vec3 c ){
  vec4 K = vec4(0, -1.0/3.0, 2.0/3.0, -1);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb( in vec3 c ){
  vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
	return c.z * mix( vec3(1.0), rgb, c.y);
}

vec3 colvar( in vec3 c, in vec3 hsvVar ){
  vec3 hsv = rgb2hsv(c);
  hsv += hsvVar;
  return hsv2rgb(hsv); 
}