// The camera effects. Pass 1 renders the café into a low-resolution target (the PS2 slider sets how low).
// Pass 2 (only with motion blur) blends it with the previous frame, the way PS2 games faked motion blur.
// Pass 3 adds bloom, lens flares from the lamps, chromatic aberration, grain, vignette and the PS2 dither.
export const FX_DEFAULTS = { ps2: 60, bloom: 50, flare: 35, grain: 25, vignette: 55, blur: 0, chroma: 15, psx: 0 };
export type Fx = typeof FX_DEFAULTS;
export const NLIGHTS = 6;

export const POST_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }";
export const BLEND_FS =
  "uniform sampler2D cur, prev; uniform float amt; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(texture2D(cur, vUv).rgb, texture2D(prev, vUv).rgb, amt), 1.); }";

export const POST_FS = `
uniform sampler2D t; uniform vec2 res; uniform float time, aspect, ps2, bloom, flare, grain, vig, chroma, drunk, flash;
uniform vec3 lights[${NLIGHTS}];
varying vec2 vUv;
float b2(vec2 a){ a = floor(a); return fract(a.x * .5 + a.y * a.y * .75); }
float bayer(vec2 a){ return b2(.5 * a) * .25 + b2(a); }
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec3 tex(vec2 uv){ return texture2D(t, clamp(uv, .001, .999)).rgb; }
void main(){
  vec2 uv = vUv, d = uv - .5;
  if (drunk > 0.) uv += drunk * .006 * vec2(sin(uv.y * 9. + time * 1.3), cos(uv.x * 7. + time * 1.1));   // the room swims
  vec3 c = tex(uv);
  if (drunk > 0.) { vec2 o = drunk * vec2(.014 * sin(time * .7), .006 * cos(time * .9)); c = mix(c, (tex(uv + o) + tex(uv - o) + tex(uv + 2. * o)) / 3., min(.8, drunk)); }   // double vision
  if (chroma > 0.) { vec2 o = d * chroma * .02; c = vec3(tex(uv + o).r, c.g, tex(uv - o).b); }
  if (bloom > 0.) {
    vec3 g = vec3(0.); vec2 px = vec2(.0085 / aspect, .0085);
    for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) g += max(tex(uv + vec2(float(i), float(j)) * px) - .68, 0.);
    c += g * .085 * bloom;
  }
  if (flare > 0.) for (int i = 0; i < ${NLIGHTS}; i++) {
    vec3 L = lights[i];
    if (L.z <= 0.) continue;
    float k = L.z * flare * smoothstep(.5, .88, dot(tex(L.xy), vec3(.3, .59, .11)));   // a lamp hidden behind something is dark here: no flare
    if (k <= 0.) continue;
    vec2 q = uv - L.xy; q.x *= aspect;
    float r = length(q);
    c += vec3(1., .82, .55) * k * .016 / (r * r * 40. + .016);                          // halo
    c += vec3(1., .72, .42) * k * .3 * exp(-abs(q.y) * 240.) * exp(-abs(q.x) * 2.4);    // anamorphic streak
    vec2 ax = vec2(.5) - L.xy;
    for (int j = 0; j < 4; j++) {                                                       // ghosts on the line through the centre
      float f = float(j), sz = .02 + .024 * fract(f * .618 + .3);
      vec2 gq = uv - (L.xy + ax * (.7 + f * .5)); gq.x *= aspect;
      c += vec3(.55 + .35 * sin(f * 2.1), .5 + .3 * sin(f * 1.3 + 1.), .45 + .35 * cos(f)) * k * .07 * smoothstep(sz, sz * .55, length(gq));
    }
  }
  c = pow(max(c, 0.), vec3(.94, .98, 1.08)) * vec3(1.04, 1., .93);                     // warm, smoky grade
  c += flash * vec3(.75, .85, 1.);                                                       // lightning
  if (vig > 0.) c *= mix(1., smoothstep(.95, .28, length(d * vec2(aspect * .75, 1.))), vig * .9);
  if (grain > 0.) c += (hash(floor(uv * res) + fract(time * 7.13) * 91.7) - .5) * grain * .16;
  if (ps2 > 0.) {
    float lv = mix(64., 12., ps2);
    vec3 q = floor(c * lv + .5 + (bayer(gl_FragCoord.xy) - .5) * min(1., ps2 * 1.5)) / lv;   // fewer colours with an ordered dither
    c = mix(c, q, min(1., ps2 * 2.));
    c *= 1. - .12 * ps2 + .12 * ps2 * mod(floor(gl_FragCoord.y), 2.);                     // scanlines
  }
  gl_FragColor = vec4(c, 1.);
}`;
